# AGENTS.md

Single publishable ComfyUI custom node pack.

- Frontend runtime code lives in `frontend/`
- Backend node code lives in `backend/`
- Root `__init__.py` is the thin ComfyUI entry shim
- Use repo commands first: `bun run typecheck`, `bun run test`, `bun run test:unit`
- Use `uv` for Python dependency sync and Python execution outside repo scripts

For testing details, see `docs/TESTING.md`.
For ComfyUI API changes, verify current official docs before changing architecture or advanced frontend hooks.
