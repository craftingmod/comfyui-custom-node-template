---
name: comfyui-template-maintenance
description: Develop, validate, build, initialize, and maintain this ComfyUI custom node template with its package.json and repository scripts. Use when running the frontend development workflow, formatting or linting, type-checking, testing, building Registry archives, setting project metadata, bumping releases, or synchronizing vendored comfyui-node-* skills.
---

# ComfyUI Template Maintenance

Run repository scripts from the repository root with Bun. Inspect the working tree before invoking scripts that modify files.

Treat `package.json` as the source of truth for available commands. Install JavaScript dependencies with `bun install --frozen-lockfile` and Python dependencies with `uv sync --locked --group dev`.

## Develop and build the frontend

- Run `bun run dev` to type-check once and rebuild the frontend when source files change.
- Run `bun run build` to type-check and create the production frontend bundle in `dist/`.
- Run `bun run typecheck` to check TypeScript without building.

Do not edit generated files in `dist/`; edit `frontend/` and rebuild.

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

Run `bun run init:template` and enter a lowercase project/package name, GitHub username, and GitHub repository name, in that order.

For non-interactive PowerShell use, pass exactly three newline-separated values:

```powershell
@("my-custom-node", "octocat", "comfyui-my-custom-node") | bun run init:template
```

Expect updates to `pyproject.toml` (`project.name`, repository URL, Comfy publisher ID, and icon URL), the `package.json` package name, and `PROJECT_ID` in `frontend/src/constants.ts`. Run `uv lock` and `bun install` afterward. Do not use `repo.json`; the initializer intentionally ignores it.

## Bump the patch version

Inspect `git status --short`, then run `bun scripts/bump-version.ts`.

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

The default source is the `comfyui-custom-node-skills` submodule. Initialize it when missing:

```shell
git submodule update --init --recursive
```

Use `bun scripts/sync-comfyui-skills.ts --source <skills-directory>` for another source. Require valid `comfyui-node-*` directories containing `SKILL.md`. Expect synchronization to replace only matching `comfyui-node-*` destinations; it does not manage this skill.
