import { PROJECT_ID, PROJECT_NAME, SETTINGS_IDS } from "./constants.ts"

app.registerExtension({
  name: `${PROJECT_ID}.extension`,
  settings: [
    {
      id: SETTINGS_IDS.DEBUG_LOGGING satisfies string as any,
      name: `${PROJECT_NAME}: Enable Debug Logging`,
      type: "boolean",
      tooltip: "Show detailed debug logs in browser console during operation",
      defaultValue: false,
    },
  ],
})
