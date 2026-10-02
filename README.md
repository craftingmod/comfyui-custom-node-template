# ComfyUI Custom Node Template

A template for one publishable ComfyUI custom node pack. It combines:

- ComfyUI V3 Python nodes in `backend/`
- a TypeScript + React frontend bundled with Bun from `frontend/` to `dist/`
- Ruff, Oxlint, Oxfmt, Pytest, and Bun Test validation
- Registry ZIP and release automation in `scripts/`

## Requirements

- Python 3.12
- [uv](https://docs.astral.sh/uv/)
- Bun 1.4+

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

## Local ComfyUI development

Copy `.env.example` to `.env.local` and set `COMFYUI_PATH` to the absolute path of
an existing ComfyUI installation. Then configure Pylance without duplicating the
machine-specific path:

```shell
bun run setup:local
```

This writes the ignored `.vscode/settings.json` with `python.analysis.extraPaths`.
Existing unrelated VS Code settings are preserved. You can override the configured
path for one invocation with `--comfyui-path <path>`.

For development, build the frontend and create a directory junction from ComfyUI's
`custom_nodes/<project.name>` to this repository:

```shell
bun run deploy:dev
```

The command is idempotent when the link already points to this repository. It refuses
to delete or replace an existing directory or a link to another location. Python
changes require a ComfyUI restart; run `bun run dev` to rebuild frontend changes while
developing.

To test the packaged layout instead, build the Registry package and replace the
matching directory below ComfyUI's `custom_nodes` directory with:

```shell
bun run deploy:local
```

The destination directory name is `[project].name` from `pyproject.toml`. The deploy
command validates the ComfyUI layout and swaps in a fully built staging directory so
a failed build cannot leave a partially copied node package.

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

## React UI

`frontend/src/react-sidebar.tsx` is a small interactive sidebar example registered
in `frontend/src/index.ts`. Replace it with your own components, or remove its
registration when your extension does not need a sidebar.

Write components in `.tsx` files. React and ReactDOM are bundled into `dist/index.js`;
ComfyUI provides only the external `app` and `api` modules. The production build
uses React's production runtime, while `bun run dev` uses its development runtime
and linked source maps. Reload the ComfyUI browser page after a rebuild.

Each React root owns its container and is unmounted when the sidebar is destroyed
or rendered into a replacement container. Keep workflow values and serialization
in the node/controller; use component state for local UI interactions.

Use CSS Modules alongside components:

```tsx
import styles from "./react-sidebar.module.css"

;<section className={styles.panel}>...</section>
```

`bun run build:css-type` generates class declarations under the ignored
`frontend/.generated/` directory. `typecheck`, `build`, and `dev` generate them
before checking TypeScript. After adding or renaming classes during a watch session,
run `build:css-type` again. Check declarations without writing files with
`bun run build:css-type --check`.

Bun bundles imported styles into `dist/index.css`. `frontend/src/stylesheet.ts`
loads it relative to the extension bundle URL. Use `bun run lint:css` for CSS
checks; the normal lint commands include Stylelint. Keep global CSS for shared
tokens and native DOM areas, and component styles in `.module.css` files.

The sidebar demonstrates both styling paths:

- `frontend/src/styles/globals.css` defines the root `--space-*` scale and scoped
  styles for a native DOM note, plus theme/runtime values under
  `[data-template-theme]`, inherited by both React and native DOM. Reuse spacing
  tokens for all padding, margin, and gap; add a shared token here when an existing
  value does not fit.
- `frontend/src/styles/controls.module.css` defines `controlBase`, shared by the
  counter and reset buttons through cross-file `composes` in
  `react-sidebar.module.css`. Composed classes can contain multiple class tokens;
  pass them directly to React's `className`.

The sidebar shell contains a dedicated React host and a separate imperative note.
React owns only its host; sidebar cleanup removes the shell, including the native
note, without touching unrelated ComfyUI container children. Global selectors
target the note's data attribute rather than resetting ComfyUI-wide elements.

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
checks that template placeholders have been replaced and project identifiers agree,
rebuilds the frontend, and publishes with `REGISTRY_ACCESS_TOKEN`. You can run the
publish-specific metadata check locally before tagging:

```shell
bun run release:check
```

Tags on the source template repository run CI, including the Registry ZIP build, but
skip the Registry publish job. Repositories created from this template retain the
tag-triggered publish behavior.

## License

MIT
