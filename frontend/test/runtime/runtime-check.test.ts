import { expect, it } from "bun:test"

it("Is runtime bun", () => {
  expect(process.versions.bun).toBeDefined()
})
