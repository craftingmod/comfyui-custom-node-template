# Optional React initialization

## Scope

Make the default template React-free. During `bun run init:template`, offer React
with a default of No. Keep existing project metadata initialization and the Bun
build pipeline. Do not add a runtime toggle or change ComfyUI APIs.

## Owners and sequence

1. Primary agent: record this plan and coordinate Luna Max agents.
2. Luna Max implementation: inspect all initialization, React, build, lint,
   TypeScript, and test consumers; move optional example sources outside default
   compilation/test discovery; add opt-in file/dependency/config installation.
   Preserve the five-line stdin interface, defaulting omitted React selection to
   No, and provide an explicit noninteractive opt-in. Refresh the default lockfile
   and update user-facing setup documentation. Keep generated React roots in
   `frontend/src/pages/` and preserve theme and unmount contracts.
3. Luna Max independent review: check default/opt-in output, repeat initialization
   behavior, user-file preservation, input handling, and build/test coverage.
4. Luna Max validation: run `bun run validate:agent` and default frontend build;
   initialize an isolated React project copy, install dependencies, then run its
   `validate:agent` and frontend build. Fix introduced failures and report any
   environmental blockers separately.

## Stop rules

Preserve unrelated changes. Do not overwrite user-authored optional files on repeat
initialization. Do not commit, deploy, or queue ComfyUI workflows. Ask only if a
new requirement or destructive action is needed. Keep implementation proportional:
reuse the initializer and existing examples rather than create a generator system.

## Verification and completion

- [x] Default manifest, entry, typecheck, tests, and bundle do not require React.
- [x] Interactive default No and explicit/noninteractive Yes are covered.
- [x] React selection installs the example, tests, dependencies, and JSX config.
- [x] Existing metadata behavior and omitted sixth stdin line remain compatible.
- [x] Independent review completed with no actionable findings.
- [ ] Default `validate:agent` and build pass.
- [x] Isolated React `validate:agent` and build pass.
- [x] Docs describe both modes; live ComfyUI verification reported separately.

Validation evidence: the default isolated copy completed `bun install --frozen-lockfile`,
the actual CLI with the sixth stdin line omitted, `uv lock`, frontend typecheck, and
frontend build. Its manifest and entry contain no React dependency or import, and
its output bundle contains no React runtime marker or `.template` files. Default
generated `package.json`, entry, and tsconfig passed formatter checks (3 files).
The latest React opt-in copy completed `bun run validate:agent` (all typechecks,
linters and formatters, 2 frontend tests, and 5 backend tests), the preloaded script
suite (24 tests, 134 assertions), and `bun run build`. The three generated config
files plus four React TSX/CSS/test files passed formatting (7 files); the final
bundle contains the React runtime and emits no `.template` files.

In the main checkout, `bun run build` passed, the preloaded script suite passed
24 tests (129 assertions), and the changed initializer, test, package, entry, and
tsconfig files passed formatting. `bun run test:agent` also passed its frontend
agent subset and all 5 backend tests. `bun run validate:agent` remains unchecked
because the unrelated `frontend/test/runtime/runtime-check.test.ts` does not pass
`oxfmt --check`; its typecheck and lint stages passed before that failure. That
runtime test was formatted only in the disposable validation copy to run the full
React suite; the main file was left unchanged. Local UV cache and temporary paths
were used for Windows test processes. Live ComfyUI behavior remains unverified.
