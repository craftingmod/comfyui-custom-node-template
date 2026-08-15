---
name: comfyui-template-maintenance
description: Develop, validate, build, initialize, locally deploy, and maintain this ComfyUI custom node template with its package.json and repository scripts. Use when configuring a local ComfyUI path, linking or copying the node into custom_nodes, running the frontend development workflow, formatting or linting, type-checking, testing, building Registry archives, setting project metadata, bumping releases, or synchronizing vendored comfyui-node-* skills.
---

# ComfyUI Template Maintenance

Run repository scripts from the repository root with Bun. Inspect the working tree before invoking scripts that modify files.

Treat `package.json` as the source of truth for available commands. Install JavaScript dependencies with `bun install --frozen-lockfile` and Python dependencies with `uv sync --locked --group dev`.

Keep this skill synchronized with the repository command surface. Whenever adding, removing, renaming, or materially changing a script under `scripts/` or a command in `package.json`, update this `SKILL.md` in the same change with the command's purpose, expected behavior, and any safety or validation requirements. Do not hand off the change while the repository scripts and this skill disagree.

## Develop and build the frontend

- Run `bun run dev` to type-check once and rebuild the frontend when source files change.
- Run `bun run build` to type-check and create the production frontend bundle in `dist/`.
- Run `bun run typecheck` to check TypeScript without building.

Do not edit generated files in `dist/`; edit `frontend/` and rebuild.

## Configure and deploy to local ComfyUI

Use `.env.local` as the machine-specific source of truth for an existing ComfyUI installation:

```dotenv
COMFYUI_PATH=C:/absolute/path/to/ComfyUI
```

Copy `.env.example` when starting and do not commit `.env.local` or the generated `.vscode/settings.json`.

Run `bun run setup:local` to validate that `COMFYUI_PATH` contains `comfy_api/` and `custom_nodes/`, then write the path to `python.analysis.extraPaths`. Preserve unrelated VS Code settings. Pass `--comfyui-path <path>` after `--` for a one-command override.

Choose the local deployment command by intent:

- Run `bun run deploy:dev` during development. It builds `dist/` and creates `custom_nodes/<project.name>` as a Windows junction (or directory symlink on other platforms) to the repository. Treat an existing link to the same repository as success. Never delete or replace an existing ordinary directory or a link to another target; stop and report it.
- Run `bun run deploy:local` to exercise the packaged layout. It builds the Registry ZIP, extracts it to a staging directory, and swaps that complete directory into `custom_nodes/<project.name>`. Reject symlink targets and paths outside the immediate `custom_nodes` child.

After `deploy:dev`, use `bun run dev` to rebuild frontend changes. Expect Python backend changes to require a ComfyUI restart.

## Maintain the V3 backend

- Define nodes as `io.ComfyNode` subclasses with `define_schema()` and classmethod `execute()`.
- Return values with `io.NodeOutput` and register node classes from the async `TemplateExtension.get_node_list()` method.
- Keep the root `comfy_entrypoint()` and `WEB_DIRECTORY = "./dist"` exports; do not restore legacy `NODE_CLASS_MAPPINGS` or `NODE_DISPLAY_NAME_MAPPINGS`.
- Keep backend `PROJECT_ID` and `PROJECT_NAME` synchronized with `frontend/src/constants.ts` and Registry metadata by using `bun run init:template`.

## Format and lint

- Run `bun run fmt:check` to check Oxfmt-supported files and Ruff-formatted Python without modifying them.
- Run `bun run fmt` to format both groups in place.
- Run `bun run lint` to run Oxlint and Ruff checks.
- Run `bun run lint:fix` to apply safe fixes from both linters.

Inspect the diff after either fixing command. Expect `lint-staged` to run Oxfmt for staged supported files and Ruff fix plus format for staged Python files.

## Test

- Run `bun run test:frontend` for Bun frontend tests.
- Run `bun run test:backend` for Python tests under `tests/python` and `tests/backend`.
- Run `bun run test:unit` for both frontend and backend suites.
- Run `bun run test` as the current alias of `test:unit`.
- Run `bun run test:watch` while iterating on frontend tests.
- Run `bun run test:coverage` for frontend coverage with the thresholds in `bunfig.toml`.

Before handing off a normal code change, prefer this validation sequence:

```shell
bun run fmt:check
bun run lint
bun run typecheck
bun run test:unit
```

Also run `bun run build` after frontend or build-configuration changes.

## Initialize template metadata

Run `bun run init:template` and enter a Registry/package Project ID, user-facing Project Name, GitHub username, GitHub repository name, and Comfy Registry Publisher ID, in that order. Keep the Project ID stable after publishing because it namespaces the example V3 node and frontend settings.

For non-interactive PowerShell use, pass exactly five newline-separated values:

```powershell
@("my-custom-node", "My Custom Node", "octocat", "comfyui-my-custom-node", "octocat") | bun run init:template
```

Expect updates to `pyproject.toml` (`project.name`, repository URL, Registry publisher ID, display name, and icon URL), the `package.json` package name, `PROJECT_ID` and `PROJECT_NAME` in `frontend/src/constants.ts`, and the matching V3 example-node constants. Project ID is the machine identifier; Project Name is display text; Registry Publisher ID is independent of the GitHub username. Run `uv lock` and `bun install` afterward. Do not use `repo.json`; the initializer intentionally ignores it.

## Validate release metadata

Run `bun run release:check` before creating or pushing a release tag. The uninitialized template is expected to fail this check; initialize it with `bun run init:template` before publishing an actual custom node.

Expect the check to reject template placeholder values, empty release metadata, disagreement between `package.json` and `pyproject.toml` project names, mismatched frontend or backend project IDs and display names, and a `pyproject.toml` Repository URL that does not match `GITHUB_REPOSITORY` when that environment variable is available. Fix every reported field rather than bypassing the check.

The tag-triggered Registry workflow must run `bun run release:check` after installing Bun dependencies and before building or invoking the Registry publish action. Keep release-validation tests covering initialized metadata, template placeholders, and identity mismatches whenever this validation changes.

## Bump the patch version

Inspect `git status --short`, then run `bun run version:bump`.

Expect the script to increment the patch component of `[project].version` and run `uv sync`. If the working tree was completely clean before execution, expect it to stage `pyproject.toml` and `uv.lock`, commit with `bump: version to <new_version>.`, and create the lightweight tag `v<new_version>`. Push only when the user requests remote publication:

```shell
git push origin HEAD
git push origin v<new_version>
```

If the working tree was dirty before execution, expect file updates only; review and commit them manually. If the target tag already exists while starting clean, expect the script to stop before changing files.

## Build the Registry-style ZIP

Run `bun run build:custom-node` to build the frontend and create `build/<project.name>-<project.version>.zip`.

Expect the archive to contain Git-tracked files, minus paths matched by `.comfyignore`, plus every file or directory listed in `[tool.comfy].includes`. Keep `dist` in `tool.comfy.includes` because it is generated and gitignored. Inspect the ZIP before publishing; the script requires root `__init__.py` and `pyproject.toml` and refuses unsafe paths or symbolic links.

## Synchronize ComfyUI skills

Run `bun run skills:check`; exit code `1` means synchronization is needed. Run `bun run skills:sync` to synchronize.

By default, shallow-clone the latest default branch of `jtydhr88/comfyui-custom-node-skills` into a validated temporary directory and use `plugins/comfyui-custom-nodes/skills` as the source. Always remove the temporary clone after checking or synchronizing. Use `bun scripts/sync-comfyui-skills.ts --source <skills-directory>` for an offline or local source instead.

Require valid `comfyui-node-*` directories containing `SKILL.md`. Stage and fingerprint copies before replacing matching destinations. Do not manage `comfyui-template-maintenance` or unrelated skills.
