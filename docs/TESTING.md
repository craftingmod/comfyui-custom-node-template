# Testing

## Commands

```bash
pnpm test
pnpm test:unit
pnpm test:frontend
pnpm test:backend
```

## Coverage

- `pnpm test` runs frontend unit tests, backend Python tests, and repo-local ComfyUI E2E.
- `pnpm test:unit` runs the fast frontend and backend test lanes only.
- Frontend unit tests and coverage run with Bun Test; coverage requires at least 70% line coverage.

## Frontend build

```bash
pnpm build
pnpm dev
```

- `pnpm build` type-checks and bundles `frontend/src/index.ts` into `dist/index.js` with Bun.
- `pnpm dev` performs the same type check, then rebuilds the Bun bundle when frontend files change.
