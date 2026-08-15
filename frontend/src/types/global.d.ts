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
