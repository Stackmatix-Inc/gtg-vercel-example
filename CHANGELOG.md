# Changelog

## [Unreleased]

### Added

- Pre-commit hooks: lint, typecheck, tests, file hygiene and secret scan (`just hooks`).
- Next.js app scaffold (create-next-app, pnpm, vitest).
- Route Handler that proxies `/metrics/*` to `<tag-id>.fps.goog` with Vercel geolocation and client IP headers (manual Google tag gateway setup).
- Unit tests for the gateway proxy.
- GTM and gtag.js snippets that load from the first-party path.
- Demo page with live gateway health checks.
- `justfile`, `scripts/health.sh`, `.env.example` and README setup guide.
