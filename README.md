# ComfyUI Custom Node Template

<!-- Remove this description when use -->

A template for one publishable ComfyUI custom node pack. It combines:

- ComfyUI V3 Python nodes in `backend/`
- a TypeScript frontend bundled with Bun from `frontend/` to `dist/`
- Ruff, Oxlint, Oxfmt, Pytest, and Bun Test validation
- Registry ZIP and release automation in `scripts/`

## Development

Check [DEV.md](./DEV.md).

`bun run init:template` can add the optional React sidebar example. React is not
installed in the default template; pass `bun run init:template --react` to select
React without the interactive React question.

## License

[MIT](./LICENSE)
