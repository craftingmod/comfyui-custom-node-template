import { describe, expect, it } from "bun:test"

import { validateReleaseMetadata } from "../../scripts/validate-release.ts"

const initializedMetadata = {
  packageName: "image-tools",
  projectName: "image-tools",
  repository: "https://github.com/octocat/comfyui-image-tools",
  publisherId: "octocat",
  displayName: "Image Tools",
  icon: "https://cdn.jsdelivr.net/gh/octocat/comfyui-image-tools/assets/icon.svg",
  frontendProjectId: "image-tools",
  frontendProjectName: "Image Tools",
  backendProjectId: "image-tools",
  backendProjectName: "Image Tools",
  githubRepository: "octocat/comfyui-image-tools",
}

describe("release metadata validation", () => {
  it("accepts synchronized initialized project metadata", () => {
    expect(validateReleaseMetadata(initializedMetadata)).toEqual([])
  })

  it("rejects template placeholders before publishing", () => {
    const errors = validateReleaseMetadata({
      ...initializedMetadata,
      packageName: "comfyui-custom-node-template",
      projectName: "comfyui-custom-node-template",
      repository: "https://github.com/your-name/your-repo",
      publisherId: "your-username",
      displayName: "My Custom Node",
      icon: "https://cdn.jsdelivr.net/gh/your-name/your-repo/assets/icon.svg",
      frontendProjectId: "comfyui-custom-node-template",
      frontendProjectName: "My Custom Node",
      backendProjectId: "comfyui-custom-node-template",
      backendProjectName: "My Custom Node",
    })

    expect(errors.length).toBeGreaterThanOrEqual(10)
    expect(errors.some((error) => error.includes("template value"))).toBeTrue()
  })

  it("rejects mismatched package, source, display, and repository identities", () => {
    const errors = validateReleaseMetadata({
      ...initializedMetadata,
      packageName: "different-package",
      frontendProjectId: "different-frontend",
      backendProjectId: "different-backend",
      frontendProjectName: "Different Frontend",
      backendProjectName: "Different Backend",
      githubRepository: "octocat/different-repository",
    })

    expect(errors).toHaveLength(6)
    expect(errors.join("\n")).toContain("must match")
    expect(errors.join("\n")).toContain("for this GitHub repository")
  })
})
