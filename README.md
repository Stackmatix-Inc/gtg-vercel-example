# Google tag gateway on Vercel

Example Next.js site that serves Google tags from a first-party path
(`/metrics/`) with the **manual** Google tag gateway setup. It does not use
Cloudflare. A Next.js Route Handler on Vercel does the proxy work.

Use this when a site runs on Vercel and its DNS records are not proxied by
Cloudflare, so the one-click Cloudflare setup in Google Tag Manager is not
available.

## How it works

```
browser -> https://your-site.com/metrics/*
        -> app/metrics/[[...path]]/route.ts   (Vercel Function)
             Host: <tag-id>.fps.goog          (lowercase tag ID)
             X-Forwarded-CountryRegion: US-CA
             X-Forwarded-Country: US
             X-Forwarded-Region: CA
             X-Forwarded-Geolocation: latlong=37.77,-122.42;city=San Francisco
             X-Forwarded-For: <client IP>
             cookies + query string forwarded as-is
        -> https://<tag-id>.fps.goog/metrics/*  (Google)
```

| File | Purpose |
| --- | --- |
| `lib/gtg.ts` | Proxy logic: upstream URL, header mapping, response pass-through |
| `app/metrics/[[...path]]/route.ts` | Route Handler for every method on `/metrics/*` |
| `lib/snippets.ts`, `app/google-tag.tsx` | GTM or gtag.js snippet that loads from `/metrics/` |
| `next.config.ts` | `skipTrailingSlashRedirect` so `/metrics/` is not redirected |
| `tests/gtg.test.ts` | Unit tests for the proxy |
| `scripts/health.sh` | Calls Google's two health endpoints on a deployed URL |

Notes:

- Vercel already knows the visitor location (`x-vercel-ip-*` headers).
  `@vercel/functions` `geolocation()` reads them; the proxy maps them to the
  headers Google expects.
- Do not send `X-Gtg-Tag-Id` when the tag ID is in the host. Google answers
  `Tag ID is in both Header and Host subdomain`.
- `fetch()` decompresses the body, so the proxy drops `content-encoding` and
  `content-length`. Vercel's CDN compresses the response again.
- A Route Handler is used, not `next.config` rewrites: rewrites cannot add the
  geo headers.
- The GTM `<noscript>` iframe stays on `www.googletagmanager.com`. The gateway
  does not serve it.

## Setup

1. Set the tag ID:

   ```bash
   cp .env.example .env.local   # then edit GTG_TAG_ID
   vercel env add GTG_TAG_ID production --scope stackmatix
   ```

2. Deploy: `just deploy`.
3. Check: `just health https://your-site.com`. Both lines must say `ok`.
4. In Google Tag Manager or Google tag settings, open **Google tag gateway**,
   choose the manual setup and enter the path `/metrics`. The status shows
   **Active** after Google sees traffic.
5. Verify in Tag Assistant: hits go to `/metrics/...` on your domain.

To use a different path, change `GTG_PATH` in `lib/gtg.ts` and rename the
`app/metrics` folder to match.

## Develop

```bash
pnpm install
just hooks   # install pre-commit hooks (needs `pre-commit` on PATH)
just dev     # http://localhost:3000
just check   # lint + typecheck + tests
```

Every commit runs `.pre-commit-config.yaml`: file hygiene, private-key and
gitleaks secret scan, then `pnpm lint`, `pnpm typecheck` and `pnpm test`. A
failing check blocks the commit.

The geolocation health check fails on `localhost`, because only Vercel adds the
geo headers. Routing (`/metrics/healthy`) works locally.

## References

- [Google: set up Google tag gateway (manual)](https://developers.google.com/tag-platform/tag-manager/gateway/setup-guide?setup=manual)
- [Vercel: request headers](https://vercel.com/docs/headers/request-headers)
- [lcrespilho/gtg-nextjs-vercel](https://github.com/lcrespilho/gtg-nextjs-vercel) (GTG + server-side GTM)
