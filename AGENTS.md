# AGENTS.md

Single publishable ComfyUI custom node pack.

- Frontend runtime code lives in `frontend/`
- Backend node code lives in `backend/`
- Root `__init__.py` is the thin ComfyUI entry shim
- Use repo commands first: `bun run typecheck`, `bun run ci:test`, `bun run lint`, and `bun run fmt:check`
- Use `uv` for Python dependency sync and Python execution outside repo scripts
- Use `bun run ci:test` as the canonical combined frontend/backend test command. `bun run test` and `bun run test:unit` remain aliases for humans.
- Do not create task-specific cache or temp directories. `ci:test` owns `.ci-cache/` for reusable caches and `.ci-test-tmp/` for an automatically cleaned per-run pytest directory.
- `ci:test` suppresses successful test logs and forwards full child output only when a stage fails.
- For focused backend debugging, `bun run test:backend` is allowed, but full validation should use `bun run ci:test` so the repository-local cache and temp paths are applied.

For testing details, see `docs/TESTING.md`.
For ComfyUI API changes, verify current official docs before changing architecture or advanced frontend hooks.
