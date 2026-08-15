import fs from "node:fs/promises"
import Path from "node:path"
import { createInterface } from "node:readline/promises"

const projectDir = Path.resolve(import.meta.dir, "../")

function requireMatch(value: string, pattern: RegExp, message: string): string {
  const trimmed = value.trim()

  if (!pattern.test(trimmed)) {
    throw new Error(message)
  }

  return trimmed
}

export function validateProjectName(value: string): string {
  return requireMatch(
    value,
    /^[a-z0-9](?:[a-z0-9._-]*[a-z0-9])?$/,
    "Project name must be a lowercase package name using letters, numbers, '.', '_' or '-'.",
  )
}

export function validateGitHubUsername(value: string): string {
  const username = requireMatch(
    value,
    /^(?!.*--)[A-Za-z0-9](?:[A-Za-z0-9-]{0,37}[A-Za-z0-9])?$/,
    "GitHub username must contain only letters, numbers or single hyphens, and cannot start or end with a hyphen.",
  )

  if (username.length > 39) {
    throw new Error("GitHub username must be at most 39 characters long.")
  }

  return username
}

export function validateGitHubRepo(value: string): string {
  const repo = requireMatch(
    value,
    /^[A-Za-z0-9._-]+$/,
    "GitHub repository name must contain only letters, numbers, '.', '_' or '-'.",
  )

  if (repo.length > 100 || repo === "." || repo === "..") {
    throw new Error("GitHub repository name must be valid and at most 100 characters long.")
  }

  return repo
}

function replaceRequired(
  source: string,
  pattern: RegExp,
  replacement: string,
  label: string,
): string {
  if (!pattern.test(source)) {
    throw new Error(`Could not find ${label}`)
  }

  return source.replace(pattern, replacement)
}

export async function initializeTemplate(
  projectName: string,
  githubUsername: string,
  githubRepo: string,
): Promise<void> {
  const pyprojectPath = Path.join(projectDir, "pyproject.toml")
  const packagePath = Path.join(projectDir, "package.json")
  const constantsPath = Path.join(projectDir, "frontend", "src", "constants.ts")
  const [originalPyproject, originalPackage, originalConstants] = await Promise.all([
    fs.readFile(pyprojectPath, "utf8"),
    fs.readFile(packagePath, "utf8"),
    fs.readFile(constantsPath, "utf8"),
  ])

  const projectSectionPattern = /(^\[project\]\s*$)([\s\S]*?)(?=^\[|(?![\s\S]))/m
  const projectSection = originalPyproject.match(projectSectionPattern)
  if (!projectSection) {
    throw new Error("Could not find [project] in pyproject.toml")
  }

  const updatedProjectSection = replaceRequired(
    projectSection[0],
    /^(name\s*=\s*)["'][^"']+["']\s*$/m,
    `$1"${projectName}"`,
    "project.name in pyproject.toml",
  )

  let updatedPyproject = originalPyproject.replace(
    projectSectionPattern,
    () => updatedProjectSection,
  )
  updatedPyproject = replaceRequired(
    updatedPyproject,
    /^(Repository\s*=\s*)["'][^"']+["']\s*$/m,
    `$1"https://github.com/${githubUsername}/${githubRepo}"`,
    "project.urls.Repository in pyproject.toml",
  )
  updatedPyproject = replaceRequired(
    updatedPyproject,
    /^(PublisherId\s*=\s*)["'][^"']+["']\s*$/m,
    `$1"${githubUsername}"`,
    "tool.comfy.PublisherId in pyproject.toml",
  )
  updatedPyproject = replaceRequired(
    updatedPyproject,
    /^(Icon\s*=\s*)["'][^"']+["']\s*$/m,
    `$1"https://cdn.jsdelivr.net/gh/${githubUsername}/${githubRepo}/assets/icon.svg"`,
    "tool.comfy.Icon in pyproject.toml",
  )

  const packageJson = JSON.parse(originalPackage) as Record<string, unknown>
  packageJson.name = projectName
  const updatedPackage = `${JSON.stringify(packageJson, null, 2)}\n`
  const updatedConstants = replaceRequired(
    originalConstants,
    /^(export const PROJECT_ID\s*=\s*)["'][^"']+["']\s*$/m,
    `$1"${projectName}"`,
    "PROJECT_ID in frontend/src/constants.ts",
  )

  await Promise.all([
    fs.writeFile(pyprojectPath, updatedPyproject),
    fs.writeFile(packagePath, updatedPackage),
    fs.writeFile(constantsPath, updatedConstants),
  ])
}

async function main(): Promise<void> {
  let answers: [string, string, string]

  if (process.stdin.isTTY) {
    const input = createInterface({ input: process.stdin, output: process.stdout })

    try {
      answers = [
        await input.question("Project name: "),
        await input.question("GitHub username: "),
        await input.question("GitHub repository name: "),
      ]
    } finally {
      input.close()
    }
  } else {
    const lines = (await Bun.stdin.text()).split(/\r?\n/)
    if (lines.length < 3) {
      throw new Error(
        "Expected three stdin lines: project name, GitHub username and GitHub repository name.",
      )
    }
    answers = [lines[0]!, lines[1]!, lines[2]!]
  }

  const projectName = validateProjectName(answers[0])
  const githubUsername = validateGitHubUsername(answers[1])
  const githubRepo = validateGitHubRepo(answers[2])

  await initializeTemplate(projectName, githubUsername, githubRepo)
  console.log(`Initialized ${projectName} for https://github.com/${githubUsername}/${githubRepo}.`)
  console.log("Run `uv lock` and `bun install` to refresh the lockfiles.")
}

if (import.meta.main) {
  await main()
}
