import { expect, it } from "bun:test"
import fs from "node:fs/promises"
import { tmpdir } from "node:os"
import Path from "node:path"

import {
  initializeTemplate,
  parseReactArgument,
  parseReactSelection,
  validateProjectName,
} from "@scripts/init-template.ts"

const templateFiles = [
  "pyproject.toml",
  "package.json",
  "backend/nodes/example_normalize_text.py",
  "frontend/src/constants.ts",
  "frontend/src/index.ts",
  "README.md",
  "frontend/src/tsconfig.json",
  "frontend/test/tsconfig.json",
]
const optionalReactFiles = [
  "frontend/src/pages/react-sidebar.tsx",
  "frontend/src/pages/react-sidebar.module.css",
  "frontend/src/styles/controls.module.css",
  "frontend/test/pages/react-sidebar.test.tsx",
]

it("accepts Unicode display names and rejects embedded control characters", () => {
  expect(validateProjectName("  한글 👨‍👩‍👧‍👦  ")).toBe("한글 👨‍👩‍👧‍👦")
  expect(() => validateProjectName("name\u0000node")).toThrow("without control characters")
  expect(() => validateProjectName("name\u007fnode")).toThrow("without control characters")
  for (const name of ["Image: Tools", "Image/Tools", "Image\\Tools", 'Image "Tools"']) {
    expect(() => validateProjectName(name)).toThrow("invalid filename characters")
  }
})

it("parses React opt-in and defaults missing input to No", () => {
  expect(parseReactArgument([])).toBeUndefined()
  expect(parseReactArgument(["--react"])).toBeTrue()
  expect(() => parseReactArgument(["--unknown"])).toThrow("Unknown init:template option")
  expect(parseReactSelection(undefined)).toBeFalse()
  expect(parseReactSelection("  ")).toBeFalse()
  expect(parseReactSelection("n")).toBeFalse()
  expect(parseReactSelection("Yes")).toBeTrue()
  expect(() => parseReactSelection("maybe")).toThrow("React selection must be Y or N")
})

it("initializes current project files while preserving dynamic version and alias configuration", async () => {
  const repository = Path.resolve(import.meta.dir, "../../..")
  const projectRoot = await fs.mkdtemp(Path.join(tmpdir(), "comfyui-test-"))
  try {
    for (const file of templateFiles) {
      const destination = Path.join(projectRoot, file)
      await fs.mkdir(Path.dirname(destination), { recursive: true })
      await fs.copyFile(Path.join(repository, file), destination)
    }
    for (const file of optionalReactFiles) {
      const source = Path.join(repository, file)
      if (!(await Bun.file(source).exists())) continue
      const destination = Path.join(projectRoot, file)
      await fs.mkdir(Path.dirname(destination), { recursive: true })
      await fs.copyFile(source, destination)
    }
    const originalPackage = await Bun.file(Path.join(projectRoot, "package.json")).json()
    const originalIndex = await Bun.file(Path.join(projectRoot, "frontend/src/index.ts")).text()
    const originalReactExampleExists = await Bun.file(
      Path.join(projectRoot, optionalReactFiles[0]!),
    ).exists()
    const originalConfig = Bun.TOML.parse(
      await Bun.file(Path.join(projectRoot, "pyproject.toml")).text(),
    ) as {
      project: { urls: Record<string, unknown> }
      tool: { comfy: Record<string, unknown> }
    }
    const invalidNameError = await initializeTemplate(
      "image-tools",
      "Image: Tools",
      "octocat",
      "image-tools",
      "octocat",
      projectRoot,
    ).then(
      () => undefined,
      (error: unknown) => error,
    )
    expect(invalidNameError).toMatchObject({
      message: "tool.comfy.DisplayName contains invalid filename characters",
    })
    expect(await Bun.file(Path.join(projectRoot, "pyproject.toml")).text()).toBe(
      await Bun.file(Path.join(repository, "pyproject.toml")).text(),
    )

    const projectName = "이미지 도구 $&"
    await initializeTemplate(
      " image-tools ",
      projectName,
      "octocat",
      "image-tools",
      "octocat",
      projectRoot,
    )
    const config = Bun.TOML.parse(await Bun.file(Path.join(projectRoot, "pyproject.toml")).text())
    expect(config).toEqual({
      ...originalConfig,
      project: {
        ...originalConfig.project,
        name: "image-tools",
        urls: {
          ...originalConfig.project.urls,
          Repository: "https://github.com/octocat/image-tools",
        },
      },
      tool: {
        ...originalConfig.tool,
        comfy: {
          ...originalConfig.tool.comfy,
          DisplayName: projectName,
          PublisherId: "octocat",
          Icon: "https://cdn.jsdelivr.net/gh/octocat/image-tools/assets/icon.svg",
        },
      },
    })
    expect(config).not.toHaveProperty("project.version")
    expect((await Bun.file(Path.join(projectRoot, "package.json")).json()).name).toBe("image-tools")
    const packageJson = await Bun.file(Path.join(projectRoot, "package.json")).json()
    expect(packageJson.dependencies).toEqual(originalPackage.dependencies)
    expect(packageJson.devDependencies).toEqual(originalPackage.devDependencies)
    expect(
      await Bun.file(Path.join(projectRoot, "frontend/src/pages/react-sidebar.tsx")).exists(),
    ).toBe(originalReactExampleExists)
    expect(await Bun.file(Path.join(projectRoot, "frontend/src/index.ts")).text()).toBe(
      originalIndex,
    )
    for (const file of ["frontend/src/constants.ts"]) {
      const source = await Bun.file(Path.join(projectRoot, file)).text()
      expect(source).toContain('PROJECT_ID = "image-tools"')
      expect(source).toContain(`PROJECT_NAME = "${projectName}"`)
      expect(source).toContain(`PROJECT_NAME = "${projectName}"\n\nexport const SETTINGS_PREFIX`)
    }
    expect(
      await Bun.file(Path.join(projectRoot, "backend/nodes/example_normalize_text.py")).text(),
    ).toContain(`PROJECT_NAME = "${projectName}"\n\n\nclass ExampleNormalizeTextNode`)
    expect(await Bun.file(Path.join(projectRoot, "README.md")).text()).toBe(
      (await Bun.file(Path.join(repository, "README.md")).text()).replace(
        /^# .+$/m,
        () => `# ${projectName}`,
      ),
    )
    for (const file of ["frontend/src/tsconfig.json", "frontend/test/tsconfig.json"]) {
      expect(await Bun.file(Path.join(projectRoot, file)).text()).toBe(
        await Bun.file(Path.join(repository, file)).text(),
      )
    }
  } finally {
    await fs.rm(projectRoot, { recursive: true, force: true })
  }
})

it("adds React files, dependencies, and JSX settings without replacing them on rerun", async () => {
  const repository = Path.resolve(import.meta.dir, "../../..")
  const projectRoot = await fs.mkdtemp(Path.join(tmpdir(), "comfyui-react-test-"))
  try {
    for (const file of templateFiles) {
      const destination = Path.join(projectRoot, file)
      await fs.mkdir(Path.dirname(destination), { recursive: true })
      await fs.copyFile(Path.join(repository, file), destination)
    }
    for (const file of optionalReactFiles) {
      const source = Path.join(repository, file)
      if (!(await Bun.file(source).exists())) continue
      const destination = Path.join(projectRoot, file)
      await fs.mkdir(Path.dirname(destination), { recursive: true })
      await fs.copyFile(source, destination)
    }

    await initializeTemplate(
      "image-tools",
      "Image Tools",
      "octocat",
      "image-tools",
      "octocat",
      projectRoot,
      true,
    )

    const packagePath = Path.join(projectRoot, "package.json")
    const packageJson = await Bun.file(packagePath).json()
    expect(packageJson.dependencies.react).toBe("^19.3.0")
    expect(packageJson.dependencies["react-dom"]).toBe("^19.3.0")
    expect(packageJson.devDependencies["@types/react"]).toBe("^19.3.0")
    const packageKeys = Object.keys(packageJson)
    expect(packageKeys.indexOf("dependencies")).toBeLessThan(packageKeys.indexOf("devDependencies"))
    expect(packageKeys.indexOf("packageManager")).toBeGreaterThan(
      packageKeys.indexOf("devDependencies"),
    )
    expect(Object.keys(packageJson.devDependencies)).toEqual(
      Object.keys(packageJson.devDependencies).toSorted(),
    )
    const tsconfigPath = Path.join(projectRoot, "frontend/src/tsconfig.json")
    expect((await Bun.file(tsconfigPath).json()).compilerOptions.jsx).toBe("react-jsx")
    expect(await Bun.file(tsconfigPath).text()).toContain(
      '"module": "ESNext",\n    "jsx": "react-jsx",\n    "types":',
    )
    expect(await Bun.file(tsconfigPath).text()).toContain(
      '"lib": ["DOM", "DOM.Iterable", "ES2025"]',
    )
    const index = await Bun.file(Path.join(projectRoot, "frontend/src/index.ts")).text()
    expect(index).toContain('import { createReactSidebar } from "@pages/react-sidebar.tsx"')
    expect(index).toContain(
      'import { createReactSidebar } from "@pages/react-sidebar.tsx"\n\nimport { app }',
    )
    expect(index).toContain("app.extensionManager.registerSidebarTab(createReactSidebar())")
    const examplePath = Path.join(projectRoot, "frontend/src/pages/react-sidebar.tsx")
    const exampleTestPath = Path.join(projectRoot, "frontend/test/pages/react-sidebar.test.tsx")
    expect(await Bun.file(examplePath).exists()).toBeTrue()
    expect(await Bun.file(exampleTestPath).exists()).toBeTrue()

    await Bun.write(examplePath, "// user-owned React example\n")
    packageJson.dependencies.react = "^20.0.0"
    await Bun.write(packagePath, `${JSON.stringify(packageJson, null, 2)}\n`)
    const tsconfig = await Bun.file(tsconfigPath).json()
    tsconfig.compilerOptions.jsx = "preserve"
    await Bun.write(tsconfigPath, `${JSON.stringify(tsconfig, null, 2)}\n`)
    await initializeTemplate(
      "image-tools",
      "Image Tools",
      "octocat",
      "image-tools",
      "octocat",
      projectRoot,
      true,
    )

    expect(await Bun.file(examplePath).text()).toBe("// user-owned React example\n")
    expect((await Bun.file(packagePath).json()).dependencies.react).toBe("^20.0.0")
    expect((await Bun.file(tsconfigPath).json()).compilerOptions.jsx).toBe("preserve")
  } finally {
    await fs.rm(projectRoot, { recursive: true, force: true })
  }
})
