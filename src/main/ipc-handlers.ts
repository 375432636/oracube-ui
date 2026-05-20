import { ipcMain, BrowserWindow } from 'electron'
import { writeFile, mkdir } from 'fs/promises'
import { join } from 'path'
import { homedir } from 'os'
import { existsSync } from 'fs'

const PHOTO_DIR = join(homedir(), '.oracube-ui', 'photos')

async function ensurePhotoDir(): Promise<void> {
  if (!existsSync(PHOTO_DIR)) {
    await mkdir(PHOTO_DIR, { recursive: true })
  }
}

function timestamp(): string {
  const now = new Date()
  const y = now.getFullYear()
  const m = String(now.getMonth() + 1).padStart(2, '0')
  const d = String(now.getDate()).padStart(2, '0')
  const h = String(now.getHours()).padStart(2, '0')
  const min = String(now.getMinutes()).padStart(2, '0')
  const s = String(now.getSeconds()).padStart(2, '0')
  return `${y}${m}${d}_${h}${min}${s}`
}

export function setupIpcHandlers(): void {
  ipcMain.handle('save-photo', async (_event, dataUrl: string): Promise<string> => {
    await ensurePhotoDir()
    const filename = `capture_${timestamp()}.jpg`
    const filePath = join(PHOTO_DIR, filename)

    const base64Data = dataUrl.replace(/^data:image\/\w+;base64,/, '')
    const buffer = Buffer.from(base64Data, 'base64')
    await writeFile(filePath, buffer)

    return filePath
  })

  ipcMain.on('app-quit', () => {
    BrowserWindow.getAllWindows().forEach((win) => win.close())
  })
}

export { PHOTO_DIR }
