import { afterEach, describe, expect, it, vi } from "vitest";
import {
  clientResponse,
  geoHeaders,
  proxyToGateway,
  readTagId,
  upstreamHeaders,
  upstreamUrl,
} from "@/lib/gtg";
import { GET } from "@/app/metrics/[[...path]]/route";

const VERCEL_GEO = {
  "x-vercel-ip-country": "US",
  "x-vercel-ip-country-region": "CA",
  "x-vercel-ip-city": "San%20Francisco",
  "x-vercel-ip-latitude": "37.77",
  "x-vercel-ip-longitude": "-122.42",
  "x-real-ip": "203.0.113.7",
};

function visitorRequest(path: string, init: RequestInit = {}): Request {
  return new Request(`https://example.com${path}`, {
    ...init,
    headers: { host: "example.com", cookie: "_ga=GA1.1.1", ...VERCEL_GEO, ...init.headers },
  });
}

afterEach(() => {
  vi.unstubAllGlobals();
  vi.unstubAllEnvs();
});

describe("readTagId", () => {
  it("accepts GA4, GTM and Ads tag IDs", () => {
    for (const id of ["G-ABC123", "GTM-WRKNVS", "AW-123456", "GT-XYZ"]) {
      expect(readTagId({ GTG_TAG_ID: id })).toBe(id);
    }
  });

  it("rejects missing or malformed IDs", () => {
    expect(readTagId({})).toBeNull();
    expect(readTagId({ GTG_TAG_ID: "evil.com/x" })).toBeNull();
  });
});

describe("upstreamUrl", () => {
  it("keeps path and query, swaps host to the lowercase fps.goog origin", () => {
    const url = upstreamUrl("http://localhost:3000/metrics/?id=GTM-AB12&l=dl", "GTM-AB12");
    expect(url.toString()).toBe("https://gtm-ab12.fps.goog/metrics/?id=GTM-AB12&l=dl");
  });
});

describe("geoHeaders", () => {
  it("maps Vercel geo headers to Google's format", () => {
    expect(geoHeaders(visitorRequest("/metrics/"))).toEqual({
      "X-Forwarded-CountryRegion": "US-CA",
      "X-Forwarded-Country": "US",
      "X-Forwarded-Region": "CA",
      "X-Forwarded-Geolocation": "latlong=37.77,-122.42;city=San Francisco",
    });
  });

  it("keeps non-Latin-1 city names encoded so Headers accepts them", () => {
    const req = visitorRequest("/metrics/", { headers: { "x-vercel-ip-city": "%E6%9D%B1%E4%BA%AC" } });
    const headers = upstreamHeaders(req);
    expect(headers.get("X-Forwarded-Geolocation")).toContain("city=%E6%9D%B1%E4%BA%AC");
  });

  it("sends nothing when Vercel has no geo data", () => {
    expect(geoHeaders(new Request("https://example.com/metrics/"))).toEqual({});
  });
});

describe("upstreamHeaders", () => {
  it("forwards cookies, drops host and Vercel headers, adds client IP, never X-Gtg-Tag-Id", () => {
    const headers = upstreamHeaders(visitorRequest("/metrics/"));
    expect(headers.get("cookie")).toBe("_ga=GA1.1.1");
    expect(headers.get("host")).toBeNull();
    expect(headers.get("x-vercel-ip-city")).toBeNull();
    expect(headers.get("X-Gtg-Tag-Id")).toBeNull();
    expect(headers.get("X-Forwarded-For")).toBe("203.0.113.7");
  });
});

describe("clientResponse", () => {
  it("drops encoding headers but keeps status, cookies and body", async () => {
    const upstream = new Response("ok", {
      status: 200,
      headers: { "content-encoding": "br", "content-length": "99", "set-cookie": "FPID=1" },
    });
    const res = clientResponse(upstream);
    expect(res.headers.get("content-encoding")).toBeNull();
    expect(res.headers.get("content-length")).toBeNull();
    expect(res.headers.get("set-cookie")).toBe("FPID=1");
    expect(await res.text()).toBe("ok");
  });
});

describe("proxyToGateway", () => {
  it("forwards POST bodies and does not follow redirects", async () => {
    const fetchMock = vi.fn().mockResolvedValue(new Response(null, { status: 204 }));
    vi.stubGlobal("fetch", fetchMock);
    const req = visitorRequest("/metrics/g/collect?v=2", { method: "POST", body: "en=page_view" });

    const res = await proxyToGateway(req, "G-ABC");

    const [url, init] = fetchMock.mock.calls[0];
    expect(String(url)).toBe("https://g-abc.fps.goog/metrics/g/collect?v=2");
    expect(new TextDecoder().decode(init.body)).toBe("en=page_view");
    expect(init.redirect).toBe("manual");
    expect(res.status).toBe(204);
  });
});

describe("route handler", () => {
  it("returns 500 without a valid GTG_TAG_ID", async () => {
    vi.stubEnv("GTG_TAG_ID", "");
    expect((await GET(visitorRequest("/metrics/healthy"))).status).toBe(500);
  });

  it("returns 502 when Google is unreachable", async () => {
    vi.stubEnv("GTG_TAG_ID", "G-ABC");
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new Error("down")));
    vi.spyOn(console, "error").mockImplementation(() => {});
    expect((await GET(visitorRequest("/metrics/healthy"))).status).toBe(502);
  });
});
