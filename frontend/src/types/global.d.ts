import { ComfyApp, ComfyApi } from "@comfyorg/comfyui-frontend-types"

// Mock type
declare global {
  const app: ComfyApp
  const api: ComfyApi

  interface Window {
    app: ComfyApp
    api: ComfyApi
  }
}

declare module "*/scripts/api.js" {
  export const api: ComfyApp
  export type ComfyApi = ComfyApp
}

declare module "*/scripts/app.js" {
  export const app: ComfyApi
  export type ComfyApp = ComfyApp
}
