import { expect, it } from "bun:test"

import { validateProjectName } from "../../scripts/init-template.ts"

it("accepts Unicode display names and rejects embedded control characters", () => {
  expect(validateProjectName("  한글 👨‍👩‍👧‍👦  ")).toBe("한글 👨‍👩‍👧‍👦")
  expect(() => validateProjectName("name\u0000node")).toThrow("without control characters")
  expect(() => validateProjectName("name\u007fnode")).toThrow("without control characters")
})
