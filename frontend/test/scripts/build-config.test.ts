import { describe, expect, it } from "bun:test"
import path from "node:path"

import { FRONTEND_ENTRY, FRONTEND_ROOT, OUTPUT_DIRECTORY, buildConfig } from "../../build.ts"

describe("Bun build config", () => {
  it("builds the frontend entry into the repository dist directory", () => {
    expect(FRONTEND_ROOT).toBe(path.resolve(process.cwd(), "frontend"))
    expect(FRONTEND_ENTRY).toBe(path.resolve(process.cwd(), "frontend/src/index.ts"))
    expect(OUTPUT_DIRECTORY).toBe(path.resolve(process.cwd(), "dist"))
    expect(buildConfig.entrypoints).toEqual([FRONTEND_ENTRY])
    expect(buildConfig.outdir).toBe(OUTPUT_DIRECTORY)
  })

  it("emits a browser ESM bundle with stable ComfyUI entry naming", () => {
    expect(buildConfig.target).toBe("browser")
    expect(buildConfig.format).toBe("esm")
    expect(buildConfig.naming).toEqual({
      entry: "[name].[ext]",
      chunk: "[name]-[hash].[ext]",
      asset: "[name].[ext]",
    })
  })

  it("keeps ComfyUI runtime modules external", () => {
    expect(buildConfig.external).toEqual(["*/scripts/app.js", "*/scripts/api.js"])
  })

  it("bundles the selected template mode for browsers without a Node.js environment dependency", async () => {
    const reactExampleInstalled = await Bun.file(
      path.resolve(process.cwd(), "frontend/src/pages/react-sidebar.tsx"),
    ).exists()
    const result = await Bun.build({ ...buildConfig, outdir: undefined })
    expect(result.success).toBeTrue()
    expect(result.logs).toHaveLength(0)
    const bundle = await result.outputs[0]!.text()
    expect(bundle).not.toContain("process.env.NODE_ENV")
    expect(bundle).not.toMatch(/(?:from|import)\s*["']react(?:-dom)?(?:\/[^"']*)?["']/)
    expect(bundle.includes("Minified React error #")).toBe(reactExampleInstalled)
    expect(
      bundle.includes("The current testing environment is not configured to support act"),
    ).toBeFalse()
    expect(bundle.includes("Count:")).toBe(reactExampleInstalled)

    const stylesheet = result.outputs.find((output) => output.path.endsWith("index.css"))
    expect(stylesheet).toBeDefined()
    const css = await stylesheet!.text()
    if (reactExampleInstalled) {
      const classes = css.match(/\.(?:panel|heading|counterButton)_[\w-]+/g) ?? []
      expect(new Set(classes).size).toBe(3)
      for (const className of classes) {
        expect(bundle.includes(className.slice(1))).toBeTrue()
      }
      const sharedControlClass = css.match(/\.(controlBase_[\w-]+)/)?.[1]
      expect(sharedControlClass).toBeDefined()
      expect(bundle.includes(sharedControlClass!)).toBeTrue()
    } else {
      expect(css).not.toMatch(/\.(?:panel|heading|counterButton|controlBase)_[\w-]+/)
    }
    expect(css.includes("--space-md:16px")).toBeTrue()
    expect(css.includes("[data-template-theme] [data-template-native-note]")).toBeTrue()
  })
})
