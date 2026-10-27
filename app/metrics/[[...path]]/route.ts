import { proxyToGateway, readTagId } from "@/lib/gtg";

// Every hit carries per-visitor geo and cookies, so never cache or prerender.
export const dynamic = "force-dynamic";

async function handle(request: Request): Promise<Response> {
  const tagId = readTagId();
  if (!tagId) {
    return new Response("GTG_TAG_ID is missing or invalid", { status: 500 });
  }
  try {
    return await proxyToGateway(request, tagId);
  } catch (error) {
    console.error("Google tag gateway proxy failed", error);
    return new Response("Bad gateway", { status: 502 });
  }
}

export const GET = handle;
export const HEAD = handle;
export const POST = handle;
export const OPTIONS = handle;
