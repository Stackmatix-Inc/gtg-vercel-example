import { geolocation, ipAddress } from "@vercel/functions";

/** First-party measurement path. Must match the path set in Google tag gateway. */
export const GTG_PATH = "/metrics";

const TAG_ID_PATTERN = /^(G|GT|GTM|AW|DC)-[A-Z0-9]+$/i;

/** Request headers that must not reach Google (hop-by-hop or Vercel-internal). */
const DROPPED_REQUEST_HEADERS = ["host", "connection", "content-length", "forwarded"];
const DROPPED_REQUEST_PREFIXES = ["x-vercel-", "x-forwarded-", "x-real-ip"];

/** Read and validate the tag ID (G-..., GTM-..., AW-...) from the environment. */
export function readTagId(env: Record<string, string | undefined> = process.env): string | null {
  const tagId = env.GTG_TAG_ID?.trim();
  return tagId && TAG_ID_PATTERN.test(tagId) ? tagId : null;
}

/** Upstream URL: same path and query, host swapped to `<tag-id>.fps.goog`. */
export function upstreamUrl(requestUrl: string, tagId: string): URL {
  const url = new URL(requestUrl);
  url.protocol = "https:";
  url.hostname = `${tagId.toLowerCase()}.fps.goog`;
  url.port = "";
  return url;
}

/** Header values must be Latin-1; keep non-Latin-1 city names URL-encoded. */
function headerSafe(value: string): string {
  return /^[\x20-\xff]*$/.test(value) ? value : encodeURIComponent(value);
}

/** Map Vercel geo data to the headers Google tag gateway expects. */
export function geoHeaders(request: Request): Record<string, string> {
  const { country, countryRegion, city, latitude, longitude } = geolocation(request);
  const headers: Record<string, string> = {};
  if (country && countryRegion) {
    headers["X-Forwarded-CountryRegion"] = `${country}-${countryRegion}`;
  }
  if (country) headers["X-Forwarded-Country"] = country;
  if (countryRegion) headers["X-Forwarded-Region"] = countryRegion;
  if (latitude && longitude) {
    const cityPart = city ? `;city=${headerSafe(city)}` : "";
    headers["X-Forwarded-Geolocation"] = `latlong=${latitude},${longitude}${cityPart}`;
  }
  return headers;
}

function isDroppedHeader(name: string): boolean {
  const lower = name.toLowerCase();
  return (
    DROPPED_REQUEST_HEADERS.includes(lower) ||
    DROPPED_REQUEST_PREFIXES.some((prefix) => lower.startsWith(prefix))
  );
}

/**
 * Client headers (cookies included) plus client IP and geo headers.
 * No X-Gtg-Tag-Id: the tag is in the host, and Google rejects both at once.
 */
export function upstreamHeaders(request: Request): Headers {
  const headers = new Headers();
  request.headers.forEach((value, name) => {
    if (!isDroppedHeader(name)) headers.set(name, value);
  });
  const ip = ipAddress(request);
  if (ip) headers.set("X-Forwarded-For", ip);
  for (const [name, value] of Object.entries(geoHeaders(request))) headers.set(name, value);
  return headers;
}

/**
 * Pass the upstream response through. fetch() already decompressed the body,
 * so drop encoding/length headers; Vercel's CDN compresses it again.
 */
export function clientResponse(upstream: Response): Response {
  const headers = new Headers(upstream.headers);
  headers.delete("content-encoding");
  headers.delete("content-length");
  return new Response(upstream.body, {
    status: upstream.status,
    statusText: upstream.statusText,
    headers,
  });
}

/** Forward one request to Google tag gateway and return Google's response. */
export async function proxyToGateway(request: Request, tagId: string): Promise<Response> {
  const hasBody = !["GET", "HEAD"].includes(request.method);
  const upstream = await fetch(upstreamUrl(request.url, tagId), {
    method: request.method,
    headers: upstreamHeaders(request),
    body: hasBody ? await request.arrayBuffer() : undefined,
    redirect: "manual",
    cache: "no-store",
  });
  return clientResponse(upstream);
}
