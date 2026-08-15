import { afterEach, describe, expect, it, mock, spyOn } from "bun:test"

import {
  LOGGING_PREFIX,
  PROJECT_ID,
  PROJECT_NAME,
  SETTINGS_IDS,
  SETTINGS_PREFIX,
} from "../src/constants.ts"
import { debugLog, isDebugEnabled } from "../src/debug.ts"

afterEach(() => {
  mock.restore()
})

describe("template identity constants", () => {
  it("keeps machine identifiers separate from the display name", () => {
    expect(PROJECT_ID).toBe("comfyui-custom-node-template")
    expect(PROJECT_NAME).toBe("My Custom Node")
    expect(SETTINGS_PREFIX).toBe(PROJECT_ID)
    expect(LOGGING_PREFIX).toBe(`[${PROJECT_ID}]`)
    expect(SETTINGS_IDS.DEBUG_LOGGING).toBe(`${PROJECT_ID}.Debug Logging`)
  })
})

describe("debug logging", () => {
  it("treats absent and failing setting readers as disabled", () => {
    expect(isDebugEnabled(undefined)).toBeFalse()
    expect(
      isDebugEnabled(() => {
        throw new Error("settings unavailable")
      }),
    ).toBeFalse()
  })

  it("logs with the project prefix only when enabled", () => {
    const consoleLog = spyOn(console, "log").mockImplementation(() => undefined)

    debugLog(() => false, "hidden")
    debugLog(() => true, "visible", { value: 1 })

    expect(consoleLog).toHaveBeenCalledTimes(1)
    expect(consoleLog).toHaveBeenCalledWith(`${LOGGING_PREFIX} visible`, { value: 1 })
  })
})
