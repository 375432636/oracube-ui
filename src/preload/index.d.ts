export interface OracubeUIApi {
  onModeChange: (callback: (mode: string) => void) => void
  onAnimationTrigger: (callback: (emotion: string) => void) => void
  onCaptureTrigger: (callback: () => void) => void
  onCaptureDone: (callback: (data: { path: string; previousMode: string }) => void) => void
  savePhoto: (dataUrl: string) => Promise<string>
  quit: () => void
}

declare global {
  interface Window {
    oracubeUI: OracubeUIApi
  }
}
