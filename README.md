# ComfyUI Custom Node Template

A template for one publishable ComfyUI custom node pack. It combines:

- ComfyUI V3 Python nodes in `backend/`
- a TypeScript frontend bundled with Bun from `frontend/` to `dist/`
- Ruff, Oxlint, Oxfmt, Pytest, and Bun Test validation
- Registry ZIP and release automation in `scripts/`

## Requirements

- Python 3.12
- [uv](https://docs.astral.sh/uv/)
- Bun 1.3.14

Install the locked dependencies:

```shell
bun install --frozen-lockfile
uv sync --locked --group dev
```

## Initialize a new project

Run `bun run init:template` and provide these values in order:

1. Project ID — Registry/package identifier such as `image-tools`
2. Project Name — user-facing name such as `Image Tools`
3. GitHub username
4. GitHub repository name
5. Comfy Registry Publisher ID

Project ID is written to `pyproject.toml` project metadata, `package.json`, frontend
setting IDs, and the example V3 node namespace. Project Name is written to Registry,
frontend, and node display labels. The Publisher ID is independent of the GitHub
username.

For non-interactive PowerShell:

```powershell
@("image-tools", "Image Tools", "octocat", "comfyui-image-tools", "octocat") |
  bun run init:template
```

Refresh lockfiles after initialization:

```shell
uv lock
bun install
```

Also update the description, LICENSE copyright holder, and icon for the new project.

## Development

```shell
bun run dev
bun run fmt:check
bun run lint
bun run typecheck
bun run test
bun run build
```

The root `__init__.py` exposes `comfy_entrypoint()` for the V3 backend and
`WEB_DIRECTORY = "./dist"` for the frontend extension. Add V3 nodes to the
`TemplateExtension.get_node_list()` result in `backend/__init__.py`.

See [docs/TESTING.md](docs/TESTING.md) for the complete validation commands.

## Package and publish

Create the same minimal archive layout expected by Comfy Registry:

```shell
bun run build:custom-node
```

The ZIP is written to `build/<project-id>-<version>.zip`. `.comfyignore` is an
allowlist for the publishable files and `[tool.comfy].includes` ensures generated
`dist/` files are included.

To increment the patch version, sync `uv.lock`, and—only from a clean working tree—
create a commit and `v<version>` tag:

```shell
bun run version:bump
```

Push the commit and tag when ready. The tag workflow validates the repository,
rebuilds the frontend, and publishes with `REGISTRY_ACCESS_TOKEN`.

## License

MIT
