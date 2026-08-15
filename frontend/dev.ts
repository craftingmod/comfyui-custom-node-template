import { rm } from "node:fs/promises"

import { COMFY_APP_IMPORT, FRONTEND_ENTRY, OUTPUT_DIRECTORY, buildConfig } from "./build.ts"

await rm(OUTPUT_DIRECTORY, { recursive: true, force: true })

const naming = buildConfig.naming
if (!naming || typeof naming === "string") {
  throw new Error("Expected explicit Bun output naming configuration")
}

const child = Bun.spawn(
  [
    "bun",
    "build",
    FRONTEND_ENTRY,
    "--outdir",
    OUTPUT_DIRECTORY,
    "--target",
    buildConfig.target ?? "browser",
    "--format",
    buildConfig.format ?? "esm",
    ...(buildConfig.external ?? []).flatMap((module) => ["--external", module]),
    "--entry-naming",
    naming.entry,
    "--chunk-naming",
    naming.chunk,
    "--asset-naming",
    naming.asset,
    "--banner",
    COMFY_APP_IMPORT,
    "--watch",
  ],
  {
    stdin: "inherit",
    stdout: "inherit",
    stderr: "inherit",
  },
)

globalThis.process.exitCode = await child.exited
