import { SETTINGS_IDS } from "./constants.ts"

app.registerExtension({
  name: "ComfyUI My Custom Node",
  settings: [
    {
      id: SETTINGS_IDS.DEBUG_LOGGING satisfies string as any,
      name: "Enable Debug Logging",
      type: "boolean",
      tooltip: "Show detailed debug logs in browser console during operation",
      defaultValue: false,
    },
  ],
})
