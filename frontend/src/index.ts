import { app } from "../../scripts/app.js"
import { PROJECT_ID, PROJECT_NAME, SETTINGS_IDS } from "./constants.ts"
import { createReactSidebar } from "./react-sidebar.tsx"
import { installStylesheet } from "./stylesheet.ts"

import "./styles/globals.css"

app.registerExtension({
  name: `${PROJECT_ID}.extension`,
  setup() {
    installStylesheet()
    app.extensionManager.registerSidebarTab(createReactSidebar())
  },
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
