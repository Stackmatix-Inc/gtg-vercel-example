# Local dev server (needs GTG_TAG_ID in .env.local)
dev:
    pnpm dev

# Install git hooks (lint, typecheck, tests, secret scan on every commit)
hooks:
    scripts/install-hooks.sh

# Lint, typecheck and unit tests
check:
    pnpm lint
    pnpm typecheck
    pnpm test

# Production build
build:
    pnpm build

# Call the gateway health checks on a deployed URL
health url:
    scripts/health.sh {{url}}

# Deploy to production on the Stackmatix Vercel team
deploy:
    vercel deploy --prod --scope stackmatix
