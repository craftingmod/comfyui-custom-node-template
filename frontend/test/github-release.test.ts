import { describe, expect, it } from "bun:test"

import { githubReleaseInfo } from "../../scripts/prepare-github-release.ts"

const pyproject = `
[project]
name = "image-tools"
version = "1.2.3"
`

describe("GitHub Release preparation", () => {
  it("derives the current Registry ZIP path from project metadata", () => {
    expect(githubReleaseInfo(pyproject, "v1.2.3")).toEqual({
      archivePath: "build/image-tools-1.2.3.zip",
      projectName: "image-tools",
      version: "1.2.3",
    })
  })

  it("rejects a tag that does not match the project version", () => {
    expect(() => githubReleaseInfo(pyproject, "v1.2.4")).toThrow(
      "Tag v1.2.4 does not match project version v1.2.3.",
    )
  })

  it("requires the project name and version", () => {
    expect(() => githubReleaseInfo("[project]", "v1.2.3")).toThrow(
      "Expected project.name to be a non-empty string",
    )
  })
})
