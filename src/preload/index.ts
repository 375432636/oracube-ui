import { contextBridge, ipcRenderer } from 'electron'

const api = {
  onModeChange: (callback: (mode: string) => void): void => {
    ipcRenderer.on('mode-change', (_event, mode: string) => callback(mode))
  },
  onAnimationTrigger: (callback: (emotion: string) => void): void => {
    ipcRenderer.on('animation-trigger', (_event, emotion: string) => callback(emotion))
  },
  onCaptureTrigger: (callback: () => void): void => {
    ipcRenderer.on('capture-trigger', () => callback())
  },
  onCaptureDone: (callback: (data: { path: string; previousMode: string }) => void): void => {
    ipcRenderer.on('capture-done', (_event, data: { path: string; previousMode: string }) =>
      callback(data)
    )
  },
  savePhoto: (dataUrl: string): Promise<string> => {
    return ipcRenderer.invoke('save-photo', dataUrl)
  },
  quit: (): void => {
    ipcRenderer.send('app-quit')
  }
}

contextBridge.exposeInMainWorld('oracubeUI', api)
