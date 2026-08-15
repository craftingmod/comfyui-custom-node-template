# Testing

## Validation sequence

Run the same checks as CI from the repository root:

```shell
bun run fmt:check
bun run lint
bun run typecheck
bun run test:unit
bun run build
```

`bun run test` is an alias for `test:unit`.

## Test lanes

```shell
bun run test:frontend
bun run test:backend
bun run test:unit
bun run test:watch
bun run test:coverage
```

- Frontend tests use Bun Test and cover the build configuration, identity constants,
  and debug helpers.
- Backend tests use Pytest. The root `conftest.py` provides a minimal `comfy_api`
  test double only when ComfyUI is not installed, so the V3 schema and extension
  entrypoint can be tested in the isolated development environment.
- Frontend coverage requires at least 70% line coverage according to `bunfig.toml`.

## Frontend build

```shell
bun run build
bun run dev
```

- `build` type-checks the repository and bundles `frontend/src/index.ts` into
  `dist/index.js`.
- `dev` type-checks once and then rebuilds the bundle when frontend source changes.

`dist/` is generated. Edit `frontend/` and rebuild instead of editing the bundle.

## Registry archive smoke check

```shell
bun run build:custom-node
```

The command builds the frontend first, then writes a deterministic ZIP under
`build/`. Inspect it when `.comfyignore`, package metadata, or publishable files
change.
