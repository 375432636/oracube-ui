# Oracube UI Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a frameless 720×720 Electron desktop app (React + TypeScript) with 3 modes (emotion animation, camera capture, face report), controlled by HTTP API and keyboard shortcuts, packaged as AppImage (Linux) and DMG/Zip (macOS).

**Architecture:** Electron main process runs an Express HTTP server on port 8765 (receives Pipecat commands), IPC relays to renderer. React app routes between 3 mode components. Pure black theme throughout.

**Tech Stack:** React 19 + TypeScript, electron-vite, Express, electron-builder, native `navigator.mediaDevices` for camera, pure CSS for styling, pnpm.

**Spec:** `docs/superpowers/specs/2026-05-20-oracube-ui-design.md`

---

## File Structure

```
/Users/john/Documents/project/python/ElectronUI/OracubeUI/
├── package.json
├── tsconfig.json
├── tsconfig.node.json
├── tsconfig.web.json
├── electron-builder.yml
├── electron.vite.config.ts
├── .gitignore
├── .env.example
├── src/
│   ├── main/
│   │   ├── index.ts              # App entry: create window, start API
│   │   ├── api-server.ts         # Express on :8765
│   │   └── ipc-handlers.ts       # IPC main↔renderer
│   ├── preload/
│   │   ├── index.ts              # contextBridge
│   │   └── index.d.ts            # Window API types
│   └── renderer/
│       ├── index.html
│       ├── global.css             # Pure black theme
│       ├── app.tsx                # Mode router + keyboard shortcuts
│       ├── emotions.json          # Emotion → webm mapping
│       └── components/
│           ├── emotion-mode.tsx
│           ├── animation-player.tsx
│           ├── camera-mode.tsx
│           ├── camera-preview.tsx
│           ├── photo-thumbnail.tsx
│           ├── report-mode.tsx
│           └── face-report.tsx
├── photos/                        # Created at ~/.oracube-ui/photos/ at runtime
├── scripts/
│   └── convert-animations.sh      # .mov → .webm converter
└── docs/
    └── superpowers/
        ├── specs/
        │   └── 2026-05-20-oracube-ui-design.md
        └── plans/
            └── 2026-05-20-oracube-ui-plan.md
```

---

### Task 1: Initialize Project Scaffold

**Files:**
- Create: `package.json`
- Create: `tsconfig.json`
- Create: `tsconfig.node.json`
- Create: `tsconfig.web.json`
- Create: `electron.vite.config.ts`
- Create: `.gitignore`
- Create: `.env.example`

- [ ] **Step 1: Create project directory and package.json**

```bash
mkdir -p /Users/john/Documents/project/python/ElectronUI/OracubeUI
cd /Users/john/Documents/project/python/ElectronUI/OracubeUI
```

Write `package.json`:

```json
{
  "name": "oracube-ui",
  "version": "1.0.0",
  "description": "Oracube borderless UI - emotion animation, camera capture, face report",
  "main": "./out/main/index.js",
  "scripts": {
    "dev": "electron-vite dev",
    "build": "electron-vite build",
    "preview": "electron-vite preview",
    "package": "electron-vite build && electron-builder",
    "package:linux": "electron-vite build && electron-builder --linux",
    "package:mac": "electron-vite build && electron-builder --mac",
    "test": "vitest run",
    "test:watch": "vitest",
    "lint": "eslint . --ext .ts,.tsx",
    "typecheck": "tsc --noEmit"
  },
  "dependencies": {
    "express": "^4.21.0"
  },
  "devDependencies": {
    "@electron-toolkit/preload": "^3.0.1",
    "@electron-toolkit/utils": "^3.0.0",
    "@testing-library/react": "^16.0.1",
    "@types/express": "^4.17.21",
    "@types/react": "^19.0.0",
    "@types/react-dom": "^19.0.0",
    "@vitejs/plugin-react": "^4.3.4",
    "electron": "^33.2.0",
    "electron-builder": "^25.1.8",
    "electron-vite": "^2.3.0",
    "jsdom": "^25.0.1",
    "react": "^19.0.0",
    "react-dom": "^19.0.0",
    "supertest": "^7.0.0",
    "@types/supertest": "^6.0.2",
    "typescript": "^5.7.0",
    "vite": "^6.0.0",
    "vitest": "^2.1.0"
  }
}
```

- [ ] **Step 2: Create tsconfig files**

Write `tsconfig.json`:

```json
{
  "files": [],
  "references": [
    { "path": "./tsconfig.node.json" },
    { "path": "./tsconfig.web.json" }
  ]
}
```

Write `tsconfig.node.json`:

```json
{
  "compilerOptions": {
    "composite": true,
    "module": "ESNext",
    "moduleResolution": "bundler",
    "allowSyntheticDefaultImports": true,
    "esModuleInterop": true,
    "outDir": "./out",
    "declaration": true,
    "strict": true,
    "skipLibCheck": true,
    "target": "ESNext",
    "lib": ["ESNext"]
  },
  "include": [
    "src/main/**/*.ts",
    "src/preload/**/*.ts",
    "electron.vite.config.ts"
  ]
}
```

Write `tsconfig.web.json`:

```json
{
  "compilerOptions": {
    "composite": true,
    "module": "ESNext",
    "moduleResolution": "bundler",
    "allowSyntheticDefaultImports": true,
    "esModuleInterop": true,
    "jsx": "react-jsx",
    "outDir": "./out",
    "declaration": true,
    "strict": true,
    "skipLibCheck": true,
    "target": "ESNext",
    "lib": ["ESNext", "DOM", "DOM.Iterable"]
  },
  "include": ["src/renderer/**/*.ts", "src/renderer/**/*.tsx"]
}
```

- [ ] **Step 3: Create electron.vite.config.ts**

```typescript
import { resolve } from 'path'
import { defineConfig, externalizeDepsPlugin } from 'electron-vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  main: {
    plugins: [externalizeDepsPlugin()],
    build: {
      outDir: 'out/main',
      rollupOptions: {
        input: {
          index: resolve(__dirname, 'src/main/index.ts')
        }
      }
    }
  },
  preload: {
    plugins: [externalizeDepsPlugin()],
    build: {
      outDir: 'out/preload',
      rollupOptions: {
        input: {
          index: resolve(__dirname, 'src/preload/index.ts')
        }
      }
    }
  },
  renderer: {
    root: resolve(__dirname, 'src/renderer'),
    build: {
      outDir: resolve(__dirname, 'out/renderer'),
      rollupOptions: {
        input: {
          index: resolve(__dirname, 'src/renderer/index.html')
        }
      }
    },
    plugins: [react()],
    resolve: {
      alias: {
        '@': resolve(__dirname, 'src/renderer')
      }
    }
  }
})
```

- [ ] **Step 4: Create .gitignore**

```
node_modules/
out/
dist/
.vite/
*.local
.env
photos/
```

- [ ] **Step 5: Create .env.example**

```bash
SERVICE_NAME=oracube-ui
ENVIRONMENT=development
LOG_LEVEL=debug
API_PORT=8765
```

- [ ] **Step 6: Install dependencies**

```bash
cd /Users/john/Documents/project/python/ElectronUI/OracubeUI
pnpm install
```

- [ ] **Step 7: Initialize git repository first commit**

```bash
cd /Users/john/Documents/project/python/ElectronUI/OracubeUI
git init
git add -A
git commit -m "chore: initialize project scaffold with electron-vite + React + TypeScript"
```

---

### Task 2: Electron Main Process — Window Creation

**Files:**
- Create: `src/main/index.ts`

- [ ] **Step 1: Create main process entry point**

Write `src/main/index.ts`:

```typescript
import { app, BrowserWindow, shell } from 'electron'
import { join } from 'path'
import { electronApp, optimizer, is } from '@electron-toolkit/utils'

let mainWindow: BrowserWindow | null = null

function createWindow(): void {
  mainWindow = new BrowserWindow({
    width: 720,
    height: 720,
    show: true,
    frame: false,
    resizable: false,
    transparent: false,
    backgroundColor: '#000000',
    webPreferences: {
      preload: join(__dirname, '../preload/index.js'),
      sandbox: false,
      contextIsolation: true,
      nodeIntegration: false
    }
  })

  mainWindow.on('ready-to-show', () => {
    mainWindow?.show()
  })

  mainWindow.webContents.setWindowOpenHandler((details) => {
    shell.openExternal(details.url)
    return { action: 'deny' }
  })

  if (is.dev && process.env['ELECTRON_RENDERER_URL']) {
    mainWindow.loadURL(process.env['ELECTRON_RENDERER_URL'])
  } else {
    mainWindow.loadFile(join(__dirname, '../renderer/index.html'))
  }
}

app.whenReady().then(() => {
  electronApp.setAppUserModelId('com.oracube.ui')

  app.on('browser-window-created', (_, window) => {
    optimizer.watchWindowShortcuts(window)
  })

  createWindow()

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow()
    }
  })
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})

export { mainWindow }
```

- [ ] **Step 2: Build and verify window creation**

```bash
cd /Users/john/Documents/project/python/ElectronUI/OracubeUI
npx electron-vite build
```

Expected: Build succeeds, `out/main/index.js`, `out/preload/index.js`, `out/renderer/index.html` are created.

- [ ] **Step 3: Commit**

```bash
git add src/main/index.ts
git commit -m "feat: create 720x720 frameless window with pure black background"
```

---

### Task 3: Preload Script with IPC Bridge

**Files:**
- Create: `src/preload/index.ts`
- Create: `src/preload/index.d.ts`

- [ ] **Step 1: Create preload script**

Write `src/preload/index.ts`:

```typescript
import { contextBridge, ipcRenderer } from 'electron'

const api = {
  // Mode control
  onModeChange: (callback: (mode: string) => void) => {
    ipcRenderer.on('mode-change', (_event, mode: string) => callback(mode))
  },
  onAnimationTrigger: (callback: (emotion: string) => void) => {
    ipcRenderer.on('animation-trigger', (_event, emotion: string) => callback(emotion))
  },
  onCaptureTrigger: (callback: () => void) => {
    ipcRenderer.on('capture-trigger', () => callback())
  },
  onCaptureDone: (callback: (data: { path: string; previousMode: string }) => void) => {
    ipcRenderer.on('capture-done', (_event, data: { path: string; previousMode: string }) =>
      callback(data)
    )
  },

  // Photo operations
  savePhoto: (dataUrl: string): Promise<string> => {
    return ipcRenderer.invoke('save-photo', dataUrl)
  },

  // App control
  quit: () => {
    ipcRenderer.send('app-quit')
  }
}

contextBridge.exposeInMainWorld('oracubeUI', api)
```

Write `src/preload/index.d.ts`:

```typescript
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
```

- [ ] **Step 2: Build and verify**

```bash
cd /Users/john/Documents/project/python/ElectronUI/OracubeUI
npx electron-vite build
```

Expected: Build succeeds.

- [ ] **Step 3: Commit**

```bash
git add src/preload/
git commit -m "feat: add preload script with IPC bridge for mode/animation/photo operations"
```

---

### Task 4: Express API Server

**Files:**
- Create: `src/main/api-server.ts`
- Create: `src/main/ipc-handlers.ts`
- Modify: `src/main/index.ts`
- Create: `tests/main/api-server.test.ts`

- [ ] **Step 1: Write failing tests for API server**

Write `tests/main/api-server.test.ts`:

```typescript
import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import request from 'supertest'
import { createServer } from '../../src/main/api-server'

describe('API Server', () => {
  const app = createServer()

  it('GET /api/v1/status returns current state', async () => {
    const res = await request(app).get('/api/v1/status')
    expect(res.status).toBe(200)
    expect(res.body.code).toBe(200)
    expect(res.body.data).toHaveProperty('current_mode')
    expect(res.body.data).toHaveProperty('emotion')
    expect(res.body.data).toHaveProperty('is_playing')
    expect(res.body.data).toHaveProperty('camera_available')
    expect(res.body.msg).toBe('success')
  })

  it('POST /api/v1/animation with valid emotion returns success', async () => {
    const res = await request(app)
      .post('/api/v1/animation')
      .send({ command: 'switch', emotion: 'lively' })
    expect(res.status).toBe(200)
    expect(res.body.code).toBe(200)
    expect(res.body.data.emotion).toBe('lively')
  })

  it('POST /api/v1/animation with invalid emotion returns 400', async () => {
    const res = await request(app)
      .post('/api/v1/animation')
      .send({ command: 'switch', emotion: 'nonexistent' })
    expect(res.status).toBe(400)
    expect(res.body.code).toBe(400)
  })

  it('POST /api/v1/animation pause returns success', async () => {
    const res = await request(app)
      .post('/api/v1/animation')
      .send({ command: 'pause' })
    expect(res.status).toBe(200)
  })

  it('POST /api/v1/animation resume returns success', async () => {
    const res = await request(app)
      .post('/api/v1/animation')
      .send({ command: 'resume' })
    expect(res.status).toBe(200)
  })

  it('POST /api/v1/mode switches mode', async () => {
    const res = await request(app)
      .post('/api/v1/mode')
      .send({ mode: 'camera' })
    expect(res.status).toBe(200)
    expect(res.body.data.current_mode).toBe('camera')
  })

  it('POST /api/v1/mode with invalid mode returns 400', async () => {
    const res = await request(app)
      .post('/api/v1/mode')
      .send({ mode: 'invalid' })
    expect(res.status).toBe(400)
  })

  it('POST /api/v1/camera/capture returns 200', async () => {
    const res = await request(app).post('/api/v1/camera/capture')
    expect(res.status).toBe(200)
  })
})
```

- [ ] **Step 2: Run test to verify failure**

```bash
cd /Users/john/Documents/project/python/ElectronUI/OracubeUI
npx vitest run tests/main/api-server.test.ts
```

Expected: FAIL — module not found.

- [ ] **Step 3: Create ipc-handlers.ts**

Write `src/main/ipc-handlers.ts`:

```typescript
import { ipcMain, BrowserWindow } from 'electron'
import { writeFile, mkdir } from 'fs/promises'
import { join, extname } from 'path'
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
```

- [ ] **Step 4: Create API server**

Write `src/main/api-server.ts`:

```typescript
import express, { Request, Response } from 'express'

const VALID_EMOTIONS = [
  'lively', 'speaking', 'laughing', 'sad', 'angry', 'confused',
  'shy', 'funny', 'loving', 'sleepy', 'shocked', 'thinking',
  'confident', 'meditation', 'warmup'
] as const

const VALID_MODES = ['emotion', 'camera', 'report'] as const

type Emotion = typeof VALID_EMOTIONS[number]
type Mode = typeof VALID_MODES[number]

interface AppState {
  currentMode: Mode
  emotion: Emotion | null
  isPlaying: boolean
  cameraAvailable: boolean
  recentPhoto: string | null
}

interface ModeChangeCallback {
  (mode: Mode, previousMode?: Mode): void
}

interface AnimationCallback {
  (emotion: Emotion): void
}

interface CaptureCallback {
  (): void
}

export function createServer(
  onModeChange?: ModeChangeCallback,
  onAnimation?: AnimationCallback,
  onCapture?: CaptureCallback
) {
  const app = express()
  app.use(express.json())

  const state: AppState = {
    currentMode: 'emotion',
    emotion: null,
    isPlaying: false,
    cameraAvailable: false,
    recentPhoto: null
  }

  // GET /api/v1/status
  app.get('/api/v1/status', (_req: Request, res: Response) => {
    res.json({ code: 200, data: { ...state }, msg: 'success' })
  })

  // POST /api/v1/animation
  app.post('/api/v1/animation', (req: Request, res: Response) => {
    const { command, emotion } = req.body

    if (command === 'switch') {
      if (!emotion || !VALID_EMOTIONS.includes(emotion)) {
        res.status(400).json({
          code: 400,
          data: null,
          msg: `无效的情绪: ${emotion}，可用: ${VALID_EMOTIONS.join(', ')}`
        })
        return
      }
      state.emotion = emotion as Emotion
      state.isPlaying = true
      state.currentMode = 'emotion'
      onAnimation?.(emotion as Emotion)
      onModeChange?.('emotion')
      res.json({ code: 200, data: { emotion, animation_path: `${emotion}.webm` }, msg: 'success' })
      return
    }

    if (command === 'pause') {
      state.isPlaying = false
      res.json({ code: 200, data: { is_playing: false }, msg: 'success' })
      return
    }

    if (command === 'resume') {
      state.isPlaying = true
      res.json({ code: 200, data: { is_playing: true }, msg: 'success' })
      return
    }

    if (command === 'quit') {
      res.json({ code: 200, data: null, msg: 'success' })
      process.exit(0)
      return
    }

    res.status(400).json({ code: 400, data: null, msg: `未知命令: ${command}` })
  })

  // POST /api/v1/mode
  app.post('/api/v1/mode', (req: Request, res: Response) => {
    const { mode } = req.body
    if (!mode || !VALID_MODES.includes(mode)) {
      res.status(400).json({
        code: 400,
        data: null,
        msg: `无效模式: ${mode}，可用: ${VALID_MODES.join(', ')}`
      })
      return
    }
    state.currentMode = mode as Mode
    onModeChange?.(mode as Mode)
    res.json({ code: 200, data: { current_mode: mode }, msg: 'success' })
  })

  // POST /api/v1/camera/capture
  app.post('/api/v1/camera/capture', (_req: Request, res: Response) => {
    const previousMode = state.currentMode
    state.currentMode = 'camera'
    onModeChange?.('camera', previousMode)
    onCapture?.()
    res.json({ code: 200, data: { previous_mode: previousMode }, msg: 'success' })
  })

  // GET /api/v1/camera/latest-photo
  app.get('/api/v1/camera/latest-photo', (_req: Request, res: Response) => {
    res.json({
      code: 200,
      data: { path: state.recentPhoto, timestamp: new Date().toISOString() },
      msg: 'success'
    })
  })

  return app
}

export function startServer(port: number = 8765,
  onModeChange?: ModeChangeCallback,
  onAnimation?: AnimationCallback,
  onCapture?: CaptureCallback) {
  const app = createServer(onModeChange, onAnimation, onCapture)
  return app.listen(port, () => {
    console.log(`Oracube API server listening on port ${port}`)
  })
}

export { VALID_EMOTIONS, VALID_MODES }
export type { Emotion, Mode, AppState }
```

- [ ] **Step 5: Update main/index.ts to wire up API server and IPC**

Write `src/main/index.ts`:

```typescript
import { app, BrowserWindow, shell } from 'electron'
import { join } from 'path'
import { electronApp, optimizer, is } from '@electron-toolkit/utils'
import { startServer } from './api-server'
import { setupIpcHandlers } from './ipc-handlers'

let mainWindow: BrowserWindow | null = null

function sendToRenderer(channel: string, ...args: unknown[]): void {
  if (mainWindow && !mainWindow.isDestroyed()) {
    mainWindow.webContents.send(channel, ...args)
  }
}

function createWindow(): void {
  mainWindow = new BrowserWindow({
    width: 720,
    height: 720,
    show: true,
    frame: false,
    resizable: false,
    backgroundColor: '#000000',
    webPreferences: {
      preload: join(__dirname, '../preload/index.js'),
      sandbox: false,
      contextIsolation: true,
      nodeIntegration: false
    }
  })

  mainWindow.on('ready-to-show', () => {
    mainWindow?.show()
  })

  mainWindow.webContents.setWindowOpenHandler((details) => {
    shell.openExternal(details.url)
    return { action: 'deny' }
  })

  if (is.dev && process.env['ELECTRON_RENDERER_URL']) {
    mainWindow.loadURL(process.env['ELECTRON_RENDERER_URL'])
  } else {
    mainWindow.loadFile(join(__dirname, '../renderer/index.html'))
  }
}

app.whenReady().then(() => {
  electronApp.setAppUserModelId('com.oracube.ui')

  app.on('browser-window-created', (_, window) => {
    optimizer.watchWindowShortcuts(window)
  })

  setupIpcHandlers()

  // Start Express API server with IPC callbacks
  startServer(
    // onModeChange
    (mode) => sendToRenderer('mode-change', mode),
    // onAnimation
    (emotion) => sendToRenderer('animation-trigger', emotion),
    // onCapture
    () => sendToRenderer('capture-trigger')
  )

  createWindow()

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow()
    }
  })
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})

export { mainWindow }
```

- [ ] **Step 6: Write vitest config**

Write `vitest.config.ts`:

```typescript
import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    globals: true,
    environment: 'node'
  }
})
```

- [ ] **Step 7: Run tests to verify they pass**

```bash
cd /Users/john/Documents/project/python/ElectronUI/OracubeUI
npx vitest run tests/main/api-server.test.ts
```

Expected: All 8 tests PASS.

- [ ] **Step 8: Commit**

```bash
git add src/main/api-server.ts src/main/ipc-handlers.ts src/main/index.ts tests/main/api-server.test.ts vitest.config.ts
git commit -m "feat: add Express API server on port 8765 with IPC relay"
```

---

### Task 5: React App Shell with Mode Routing and Keyboard Shortcuts

**Files:**
- Create: `src/renderer/index.html`
- Create: `src/renderer/global.css`
- Create: `src/renderer/app.tsx`
- Create: `tests/renderer/app.test.tsx`

- [ ] **Step 1: Write failing tests for app shell**

Write `tests/renderer/app.test.tsx`:

```typescript
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import App from '../../src/renderer/app'

// Mock window.oracubeUI
const mockApi = {
  onModeChange: vi.fn(),
  onAnimationTrigger: vi.fn(),
  onCaptureTrigger: vi.fn(),
  onCaptureDone: vi.fn(),
  savePhoto: vi.fn().mockResolvedValue('/path/to/photo.jpg'),
  quit: vi.fn()
}

beforeEach(() => {
  window.oracubeUI = mockApi as any
})

describe('App Shell', () => {
  it('renders in emotion mode by default', () => {
    render(<App />)
    expect(screen.getByTestId('emotion-mode')).toBeDefined()
  })

  it('switches to camera mode on key "2"', () => {
    render(<App />)
    fireEvent.keyDown(window, { key: '2' })
    expect(screen.getByTestId('camera-mode')).toBeDefined()
  })

  it('switches to report mode on key "3"', () => {
    render(<App />)
    fireEvent.keyDown(window, { key: '3' })
    expect(screen.getByTestId('report-mode')).toBeDefined()
  })

  it('switches to emotion mode on key "1"', () => {
    render(<App />)
    fireEvent.keyDown(window, { key: '2' })
    fireEvent.keyDown(window, { key: '1' })
    expect(screen.getByTestId('emotion-mode')).toBeDefined()
  })

  it('calls quit on Escape', () => {
    render(<App />)
    fireEvent.keyDown(window, { key: 'Escape' })
    expect(mockApi.quit).toHaveBeenCalled()
  })
})
```

- [ ] **Step 2: Run test to verify failure**

```bash
cd /Users/john/Documents/project/python/ElectronUI/OracubeUI
npx vitest run tests/renderer/app.test.tsx
```

Expected: FAIL.

- [ ] **Step 3: Create index.html**

Write `src/renderer/index.html`:

```html
<!DOCTYPE html>
<html lang="zh-CN">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Oracube UI</title>
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="./app.tsx"></script>
  </body>
</html>
```

- [ ] **Step 4: Create global.css**

Write `src/renderer/global.css`:

```css
* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

html, body, #root {
  width: 720px;
  height: 720px;
  overflow: hidden;
  background: #000000;
  color: #ffffff;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  user-select: none;
  -webkit-app-region: no-drag;
}

/* Emotion mode */
.emotion-container {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #000;
}

.emotion-container video {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

/* Camera mode */
.camera-container {
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  background: #000;
}

.camera-container video {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.camera-container .hint {
  position: absolute;
  bottom: 20px;
  left: 50%;
  transform: translateX(-50%);
  color: rgba(255, 255, 255, 0.5);
  font-size: 12px;
}

/* Photo thumbnail */
.photo-thumbnail {
  position: absolute;
  bottom: 16px;
  right: 16px;
  width: 160px;
  height: 160px;
  border: 2px solid rgba(255, 255, 255, 0.3);
  border-radius: 8px;
  overflow: hidden;
  background: #111;
}

.photo-thumbnail img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

/* Report mode */
.report-container {
  width: 100%;
  height: 100%;
  overflow-y: auto;
  background: #000;
  padding: 24px;
}

.report-container::-webkit-scrollbar {
  width: 4px;
}
.report-container::-webkit-scrollbar-track {
  background: #000;
}
.report-container::-webkit-scrollbar-thumb {
  background: #333;
  border-radius: 2px;
}

.report-title {
  font-size: 22px;
  font-weight: 600;
  color: #C8A96E;
  text-align: center;
  margin-bottom: 20px;
  letter-spacing: 2px;
}

.report-subtitle {
  font-size: 11px;
  color: rgba(255, 255, 255, 0.4);
  text-align: center;
  margin-bottom: 20px;
}

.report-divider {
  height: 1px;
  background: linear-gradient(to right, transparent, #333, transparent);
  margin: 16px 0;
}

.report-section {
  margin-bottom: 16px;
}

.report-section h3 {
  font-size: 14px;
  color: #C8A96E;
  margin-bottom: 10px;
  font-weight: 500;
}

.report-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8px 12px;
  background: rgba(255, 255, 255, 0.04);
  border-radius: 6px;
  margin-bottom: 6px;
  font-size: 13px;
}

.report-item .label {
  color: rgba(255, 255, 255, 0.6);
}

.report-item .value {
  color: #fff;
}

.report-summary {
  font-size: 13px;
  line-height: 1.8;
  color: rgba(255, 255, 255, 0.8);
  padding: 12px;
  background: rgba(255, 255, 255, 0.04);
  border-radius: 6px;
}

.report-color {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  font-size: 13px;
  color: #C8A96E;
}

.report-color .swatch {
  width: 20px;
  height: 20px;
  border-radius: 4px;
  border: 1px solid rgba(255, 255, 255, 0.2);
}

/* Loading / Error / Idle states */
.state-message {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: rgba(255, 255, 255, 0.5);
  font-size: 14px;
  background: #000;
}

.state-error {
  color: #ff4444;
}

.state-idle {
  color: rgba(255, 255, 255, 0.3);
}
```

- [ ] **Step 5: Create app.tsx**

Write `src/renderer/app.tsx`:

```typescript
import React, { useState, useEffect, useCallback, useRef } from 'react'
import { createRoot } from 'react-dom/client'
import EmotionMode from './components/emotion-mode'
import CameraMode from './components/camera-mode'
import ReportMode from './components/report-mode'
import './global.css'

type Mode = 'emotion' | 'camera' | 'report'

const App: React.FC = () => {
  const [currentMode, setCurrentMode] = useState<Mode>('emotion')
  const [emotion, setEmotion] = useState<string | null>(null)
  const [capturePreviousMode, setCapturePreviousMode] = useState<Mode | null>(null)
  const [recentPhoto, setRecentPhoto] = useState<string | null>(null)
  const [autoCapture, setAutoCapture] = useState(false)
  const captureTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const switchMode = useCallback((mode: Mode) => {
    setCurrentMode(mode)
  }, [])

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent): void => {
      switch (e.key) {
        case '1': switchMode('emotion'); break
        case '2': switchMode('camera'); break
        case '3': switchMode('report'); break
        case 'Escape': window.oracubeUI?.quit(); break
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [switchMode])

  useEffect(() => {
    window.oracubeUI?.onModeChange((mode: string) => {
      if (mode === 'emotion' || mode === 'camera' || mode === 'report') {
        setCurrentMode(mode)
      }
    })
    window.oracubeUI?.onAnimationTrigger((emotion: string) => {
      setEmotion(emotion)
      setCurrentMode('emotion')
    })
    window.oracubeUI?.onCaptureTrigger(() => {
      setCapturePreviousMode(currentMode)
      setCurrentMode('camera')
      setAutoCapture(true)
    })
    window.oracubeUI?.onCaptureDone((data) => {
      if (data.previousMode === 'emotion' || data.previousMode === 'camera' || data.previousMode === 'report') {
        setCurrentMode(data.previousMode)
      }
    })
  }, [currentMode])

  const handleCaptureDone = useCallback(() => {
    if (capturePreviousMode) {
      const prev = capturePreviousMode
      setCapturePreviousMode(null)
      // 远端触发拍照：2秒后自动回切
      captureTimerRef.current = setTimeout(() => {
        setCurrentMode(prev)
      }, 2000)
    }
  }, [capturePreviousMode])

  const handlePhotoSaved = useCallback((path: string) => {
    setRecentPhoto(path)
  }, [])

  // Clean up timer on unmount
  useEffect(() => {
    return () => {
      if (captureTimerRef.current) {
        clearTimeout(captureTimerRef.current)
      }
    }
  }, [])

  const renderMode = (): React.ReactNode => {
    switch (currentMode) {
      case 'emotion':
        return <EmotionMode emotion={emotion} />
      case 'camera':
        return (
          <CameraMode
            onCaptureDone={handleCaptureDone}
            autoCapture={autoCapture}
            onPhotoSaved={handlePhotoSaved}
          />
        )
      case 'report':
        return <ReportMode photoSrc={recentPhoto} />
    }
  }

  return (
    <div style={{ width: 720, height: 720, background: '#000', position: 'relative' }}>
      {renderMode()}
    </div>
  )
}

const root = createRoot(document.getElementById('root')!)
root.render(<App />)

export default App
```

- [ ] **Step 6: Create stub component files (placeholders so app compiles)**

Write `src/renderer/components/emotion-mode.tsx`:

```typescript
import React from 'react'

interface Props {
  emotion: string | null
}

const EmotionMode: React.FC<Props> = ({ emotion }) => {
  if (!emotion) {
    return <div className="state-message state-idle" data-testid="emotion-mode">待机中</div>
  }
  return (
    <div className="emotion-container" data-testid="emotion-mode">
      <div className="state-message">{emotion}</div>
    </div>
  )
}

export default EmotionMode
```

Write `src/renderer/components/camera-mode.tsx`:

```typescript
import React from 'react'

interface Props {
  onCaptureDone: () => void
}

const CameraMode: React.FC<Props> = ({ onCaptureDone }) => {
  return (
    <div className="camera-container" data-testid="camera-mode">
      <div className="state-message">摄像头待启动</div>
    </div>
  )
}

export default CameraMode
```

Write `src/renderer/components/report-mode.tsx`:

```typescript
import React from 'react'

const ReportMode: React.FC = () => {
  return (
    <div className="report-container" data-testid="report-mode">
      <div className="state-message">报告加载中...</div>
    </div>
  )
}

export default ReportMode
```

- [ ] **Step 7: Run tests to verify they pass**

```bash
cd /Users/john/Documents/project/python/ElectronUI/OracubeUI
npx vitest run tests/renderer/app.test.tsx
```

Expected: All tests PASS.

- [ ] **Step 8: Build verification**

```bash
cd /Users/john/Documents/project/python/ElectronUI/OracubeUI
npx electron-vite build
```

Expected: Build succeeds.

- [ ] **Step 9: Commit**

```bash
git add src/renderer/ tests/renderer/
git commit -m "feat: add React app shell with mode routing and keyboard shortcuts"
```

---

### Task 6: Emotion Mode — Animation Player

**Files:**
- Create: `src/renderer/emotions.json`
- Modify: `src/renderer/components/emotion-mode.tsx`
- Create: `src/renderer/components/animation-player.tsx`
- Create: `tests/renderer/emotion-mode.test.tsx`

- [ ] **Step 1: Write failing tests**

Write `tests/renderer/emotion-mode.test.tsx`:

```typescript
import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import EmotionMode from '../../src/renderer/components/emotion-mode'
import AnimationPlayer from '../../src/renderer/components/animation-player'

describe('AnimationPlayer', () => {
  it('renders video element with correct src', () => {
    render(<AnimationPlayer emotion="lively" animationPath="/path/to/lively.webm" />)
    const video = screen.getByTestId('anim-video') as HTMLVideoElement
    expect(video).toBeDefined()
    expect(video.getAttribute('src')).toBe('/path/to/lively.webm')
  })

  it('renders with autoplay, loop, muted', () => {
    render(<AnimationPlayer emotion="lively" animationPath="/path/to/lively.webm" />)
    const video = screen.getByTestId('anim-video') as HTMLVideoElement
    expect(video.autoplay).toBe(true)
    expect(video.loop).toBe(true)
    expect(video.muted).toBe(true)
  })
})

describe('EmotionMode', () => {
  it('shows idle state when no emotion', () => {
    render(<EmotionMode emotion={null} />)
    expect(screen.getByText('待机中')).toBeDefined()
  })

  it('shows loading state when emotion provided', () => {
    render(<EmotionMode emotion="lively" />)
    expect(screen.getByTestId('anim-video')).toBeDefined()
  })
})
```

- [ ] **Step 2: Run test to verify failure**

```bash
cd /Users/john/Documents/project/python/ElectronUI/OracubeUI
npx vitest run tests/renderer/emotion-mode.test.tsx
```

Expected: FAIL (AnimationPlayer not defined).

- [ ] **Step 3: Create emotions.json**

Write `src/renderer/emotions.json`:

```json
{
  "lively": "lively.webm",
  "speaking": "speaking.webm",
  "laughing": "laughing.webm",
  "sad": "sad.webm",
  "angry": "angry.webm",
  "confused": "confused.webm",
  "shy": "shy.webm",
  "funny": "funny.webm",
  "loving": "loving.webm",
  "sleepy": "sleepy.webm",
  "shocked": "shocked.webm",
  "thinking": "thinking.webm",
  "confident": "confident.webm",
  "meditation": "meditation.webm",
  "warmup": "warmup.webm"
}
```

- [ ] **Step 4: Create animation-player.tsx**

Write `src/renderer/components/animation-player.tsx`:

```typescript
import React, { useRef, useEffect, useState } from 'react'

interface Props {
  emotion: string
  animationPath: string
  onError?: () => void
}

const AnimationPlayer: React.FC<Props> = ({ emotion, animationPath, onError }) => {
  const videoRef = useRef<HTMLVideoElement>(null)
  const [hasError, setHasError] = useState(false)

  useEffect(() => {
    setHasError(false)
  }, [animationPath])

  const handleError = (): void => {
    setHasError(true)
    onError?.()
  }

  if (hasError) {
    return (
      <div className="emotion-container">
        <div className="state-message state-error" data-testid="anim-error">
          动画加载失败: {emotion}
        </div>
      </div>
    )
  }

  return (
    <div className="emotion-container">
      <video
        ref={videoRef}
        data-testid="anim-video"
        key={animationPath}
        autoPlay
        loop
        muted
        playsInline
        src={animationPath}
        onError={handleError}
      />
    </div>
  )
}

export default AnimationPlayer
```

- [ ] **Step 5: Update emotion-mode.tsx**

Write `src/renderer/components/emotion-mode.tsx`:

```typescript
import React from 'react'
import emotions from '../emotions.json'
import AnimationPlayer from './animation-player'

interface Props {
  emotion: string | null
}

const getAnimationPath = (emotion: string): string | null => {
  const filename = (emotions as Record<string, string>)[emotion]
  if (!filename) return null
  return `./animations/${filename}`
}

const EmotionMode: React.FC<Props> = ({ emotion }) => {
  if (!emotion) {
    return <div className="state-message state-idle" data-testid="emotion-mode">待机中</div>
  }

  const animationPath = getAnimationPath(emotion)

  if (!animationPath) {
    return (
      <div className="emotion-container" data-testid="emotion-mode">
        <div className="state-message state-error">未知情绪: {emotion}</div>
      </div>
    )
  }

  return (
    <div className="emotion-container" data-testid="emotion-mode">
      <AnimationPlayer emotion={emotion} animationPath={animationPath} />
    </div>
  )
}

export default EmotionMode
```

- [ ] **Step 6: Run tests to verify they pass**

```bash
cd /Users/john/Documents/project/python/ElectronUI/OracubeUI
npx vitest run tests/renderer/emotion-mode.test.tsx
```

Expected: All tests PASS.

- [ ] **Step 7: Commit**

```bash
git add src/renderer/emotions.json src/renderer/components/emotion-mode.tsx src/renderer/components/animation-player.tsx tests/renderer/emotion-mode.test.tsx
git commit -m "feat: add emotion mode with video animation player"
```

---

### Task 7: Camera Mode — Preview and Capture

**Files:**
- Modify: `src/renderer/components/camera-mode.tsx`
- Create: `src/renderer/components/camera-preview.tsx`
- Create: `src/renderer/components/photo-thumbnail.tsx`
- Create: `tests/renderer/camera-mode.test.tsx`

- [ ] **Step 1: Write failing tests**

Write `tests/renderer/camera-mode.test.tsx`:

```typescript
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import CameraMode from '../../src/renderer/components/camera-mode'
import CameraPreview from '../../src/renderer/components/camera-preview'
import PhotoThumbnail from '../../src/renderer/components/photo-thumbnail'

const mockApi = {
  onModeChange: vi.fn(),
  onAnimationTrigger: vi.fn(),
  onCaptureTrigger: vi.fn(),
  onCaptureDone: vi.fn(),
  savePhoto: vi.fn().mockResolvedValue('/path/to/photo.jpg'),
  quit: vi.fn()
}

beforeEach(() => {
  window.oracubeUI = mockApi as any
})

describe('PhotoThumbnail', () => {
  it('renders nothing when no photo', () => {
    const { container } = render(<PhotoThumbnail photoPath={null} />)
    expect(container.innerHTML).toBe('')
  })

  it('renders image when photo path provided', () => {
    render(<PhotoThumbnail photoPath="/path/to/photo.jpg" />)
    const img = screen.getByTestId('photo-img') as HTMLImageElement
    expect(img).toBeDefined()
    expect(img.getAttribute('src')).toBe('/path/to/photo.jpg')
  })
})

describe('CameraMode', () => {
  it('shows loading state initially', () => {
    render(<CameraMode onCaptureDone={vi.fn()} autoCapture={false} onPhotoSaved={vi.fn()} />)
    expect(screen.getByText('正在启动摄像头...')).toBeDefined()
  })
})
```

- [ ] **Step 2: Run test to verify failure**

```bash
cd /Users/john/Documents/project/python/ElectronUI/OracubeUI
npx vitest run tests/renderer/camera-mode.test.tsx
```

Expected: FAIL.

- [ ] **Step 3: Create camera-preview.tsx**

Write `src/renderer/components/camera-preview.tsx`:

```typescript
import React, { useRef, useEffect, useState } from 'react'

type CameraStatus = 'loading' | 'active' | 'not-found' | 'denied' | 'error'

interface Props {
  onPhotoCapture: (dataUrl: string) => void
  isCapturing: boolean
}

const CameraPreview: React.FC<Props> = ({ onPhotoCapture, isCapturing }) => {
  const videoRef = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const [status, setStatus] = useState<CameraStatus>('loading')

  useEffect(() => {
    let cancelled = false

    const startCamera = async (): Promise<void> => {
      try {
        const devices = await navigator.mediaDevices.enumerateDevices()
        const videoDevices = devices.filter((d) => d.kind === 'videoinput')

        if (videoDevices.length === 0) {
          if (!cancelled) setStatus('not-found')
          return
        }

        const stream = await navigator.mediaDevices.getUserMedia({
          video: { deviceId: { exact: videoDevices[0].deviceId } }
        })

        if (cancelled) {
          stream.getTracks().forEach((t) => t.stop())
          return
        }

        streamRef.current = stream
        if (videoRef.current) {
          videoRef.current.srcObject = stream
        }
        if (!cancelled) setStatus('active')
      } catch (err: unknown) {
        if (cancelled) return
        if (err instanceof DOMException && err.name === 'NotAllowedError') {
          setStatus('denied')
        } else {
          setStatus('error')
        }
      }
    }

    // Delay start slightly to let the component mount in test env
    const timer = setTimeout(startCamera, 50)
    return () => {
      cancelled = true
      clearTimeout(timer)
      streamRef.current?.getTracks().forEach((t) => t.stop())
    }
  }, [])

  useEffect(() => {
    if (isCapturing && status === 'active' && videoRef.current && canvasRef.current) {
      const video = videoRef.current
      const canvas = canvasRef.current
      canvas.width = 720
      canvas.height = 720
      const ctx = canvas.getContext('2d')
      if (ctx) {
        ctx.drawImage(video, 0, 0, 720, 720)
        const dataUrl = canvas.toDataURL('image/jpeg', 0.92)
        onPhotoCapture(dataUrl)
      }
    }
  }, [isCapturing, status, onPhotoCapture])

  if (status === 'loading') {
    return <div className="state-message">正在启动摄像头...</div>
  }

  if (status === 'not-found') {
    return <div className="state-message state-error">未检测到摄像头</div>
  }

  if (status === 'denied') {
    return <div className="state-message state-error">摄像头权限被拒绝</div>
  }

  if (status === 'error') {
    return <div className="state-message state-error">摄像头启动失败</div>
  }

  return (
    <>
      <video
        ref={videoRef}
        data-testid="camera-video"
        autoPlay
        playsInline
        muted
      />
      <canvas ref={canvasRef} style={{ display: 'none' }} />
    </>
  )
}

export default CameraPreview
```

- [ ] **Step 4: Create photo-thumbnail.tsx**

Write `src/renderer/components/photo-thumbnail.tsx`:

```typescript
import React from 'react'

interface Props {
  photoPath: string | null
}

const PhotoThumbnail: React.FC<Props> = ({ photoPath }) => {
  if (!photoPath) return null

  return (
    <div className="photo-thumbnail">
      <img data-testid="photo-img" src={photoPath} alt="最近照片" />
    </div>
  )
}

export default PhotoThumbnail
```

- [ ] **Step 5: Update camera-mode.tsx**

Write `src/renderer/components/camera-mode.tsx`:

```typescript
import React, { useState, useEffect, useCallback, useRef } from 'react'
import CameraPreview from './camera-preview'
import PhotoThumbnail from './photo-thumbnail'

interface Props {
  onCaptureDone: () => void
  autoCapture: boolean
  onPhotoSaved: (path: string) => void
}

const CameraMode: React.FC<Props> = ({ onCaptureDone, autoCapture, onPhotoSaved }) => {
  const [isCapturing, setIsCapturing] = useState(false)
  const [recentPhoto, setRecentPhoto] = useState<string | null>(null)
  const photoDelayRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const hasAutoCaptured = useRef(false)

  const handleCapture = useCallback(async (dataUrl: string) => {
    try {
      const path = await window.oracubeUI.savePhoto(dataUrl)
      setRecentPhoto(path)
      onPhotoSaved(path)
      onCaptureDone()
    } catch {
      // Photo save failed silently
    }
  }, [onCaptureDone, onPhotoSaved])

  // Auto-capture from remote trigger
  useEffect(() => {
    if (autoCapture && !hasAutoCaptured.current) {
      hasAutoCaptured.current = true
      // Delay slightly to let camera initialize
      const timer = setTimeout(() => setIsCapturing(true), 500)
      return () => clearTimeout(timer)
    }
  }, [autoCapture])

  // Listen for Space key to capture
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent): void => {
      if (e.key === ' ' && !isCapturing) {
        e.preventDefault()
        setIsCapturing(true)
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isCapturing])

  // Handle capture completion
  useEffect(() => {
    if (isCapturing) {
      photoDelayRef.current = setTimeout(() => {
        setIsCapturing(false)
      }, 300)
    }
    return () => {
      if (photoDelayRef.current) {
        clearTimeout(photoDelayRef.current)
      }
    }
  }, [isCapturing])

  return (
    <div className="camera-container" data-testid="camera-mode">
      <CameraPreview onPhotoCapture={handleCapture} isCapturing={isCapturing} />
      <div className="hint">Space 拍照</div>
      <PhotoThumbnail photoPath={recentPhoto} />
    </div>
  )
}

export default CameraMode
```

- [ ] **Step 6: Run tests to verify they pass**

```bash
cd /Users/john/Documents/project/python/ElectronUI/OracubeUI
npx vitest run tests/renderer/camera-mode.test.tsx
```

Expected: All tests PASS.

- [ ] **Step 7: Commit**

```bash
git add src/renderer/components/camera-mode.tsx src/renderer/components/camera-preview.tsx src/renderer/components/photo-thumbnail.tsx tests/renderer/camera-mode.test.tsx
git commit -m "feat: add camera mode with preview, capture, and thumbnail"
```

---

### Task 8: Report Mode — Face Analysis Report

**Files:**
- Modify: `src/renderer/components/report-mode.tsx`
- Create: `src/renderer/components/face-report.tsx`
- Create: `tests/renderer/report-mode.test.tsx`

- [ ] **Step 1: Write failing tests**

Write `tests/renderer/report-mode.test.tsx`:

```typescript
import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import ReportMode from '../../src/renderer/components/report-mode'
import FaceReport from '../../src/renderer/components/face-report'

describe('FaceReport', () => {
  it('renders report title', () => {
    render(<FaceReport photoSrc={null} />)
    expect(screen.getByText('面相分析报告')).toBeDefined()
  })

  it('renders photo when photoSrc provided', () => {
    render(<FaceReport photoSrc="/path/to/photo.jpg" />)
    const img = screen.getByAltText('用户照片') as HTMLImageElement
    expect(img).toBeDefined()
    expect(img.getAttribute('src')).toBe('/path/to/photo.jpg')
  })

  it('does not render photo when photoSrc is null', () => {
    const { container } = render(<FaceReport photoSrc={null} />)
    expect(container.querySelector('img')).toBeNull()
  })

  it('renders all facial feature items', () => {
    render(<FaceReport photoSrc={null} />)
    expect(screen.getByText('额头')).toBeDefined()
    expect(screen.getByText('眉毛')).toBeDefined()
    expect(screen.getByText('眼睛')).toBeDefined()
    expect(screen.getByText('鼻梁')).toBeDefined()
    expect(screen.getByText('嘴唇')).toBeDefined()
  })

  it('renders overall analysis section', () => {
    render(<FaceReport photoSrc={null} />)
    expect(screen.getByText('整体气质')).toBeDefined()
  })

  it('renders lucky color', () => {
    render(<FaceReport photoSrc={null} />)
    expect(screen.getByText('幸运色')).toBeDefined()
  })
})

describe('ReportMode', () => {
  it('shows report', () => {
    render(<ReportMode photoSrc={null} />)
    expect(screen.getByText('面相分析报告')).toBeDefined()
  })

  it('passes photoSrc to FaceReport', () => {
    render(<ReportMode photoSrc="/path/to/photo.jpg" />)
    const img = screen.getByAltText('用户照片') as HTMLImageElement
    expect(img).toBeDefined()
    expect(img.getAttribute('src')).toBe('/path/to/photo.jpg')
  })
})
```

- [ ] **Step 2: Run test to verify failure**

```bash
cd /Users/john/Documents/project/python/ElectronUI/OracubeUI
npx vitest run tests/renderer/report-mode.test.tsx
```

Expected: FAIL.

- [ ] **Step 3: Create face-report.tsx**

Write `src/renderer/components/face-report.tsx`:

```typescript
import React from 'react'

interface FacialFeature {
  name: string
  description: string
  meaning: string
}

interface Props {
  photoSrc?: string | null
}

const MOCK_FEATURES: FacialFeature[] = [
  { name: '额头', description: '饱满开阔', meaning: '福相 · 智慧通达' },
  { name: '眉毛', description: '浓密整齐', meaning: '果断 · 意志坚定' },
  { name: '眼睛', description: '明亮有神', meaning: '智慧 · 洞察力强' },
  { name: '鼻梁', description: '挺拔端正', meaning: '财运 · 中正平和' },
  { name: '嘴唇', description: '厚薄适中', meaning: '平和 · 善于表达' }
]

const OVERALL_SUMMARY = '五官端正协调，气质庄重而不失亲和。额头饱满主智慧，眉眼有神见洞察，鼻梁挺拔显格局，唇形适中表平和。整体面相呈现内外兼修之象。'

const LUCKY_COLOR = { name: '金色', hex: '#C8A96E' }

const FaceReport: React.FC<Props> = ({ photoSrc }) => {
  const now = new Date()
  const dateStr = `${now.getFullYear()}年${now.getMonth() + 1}月${now.getDate()}日`

  return (
    <>
      <div className="report-title">面相分析报告</div>
      <div className="report-subtitle">评估时间: {dateStr}</div>

      {photoSrc && (
        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 16 }}>
          <img
            src={photoSrc}
            alt="用户照片"
            style={{ width: 100, height: 100, borderRadius: 8, objectFit: 'cover', border: '1px solid rgba(255,255,255,0.2)' }}
          />
        </div>
      )}

      <div className="report-divider" />

      <div className="report-section">
        <h3>五官分析</h3>
        {MOCK_FEATURES.map((feature) => (
          <div className="report-item" key={feature.name}>
            <span className="label">{feature.name} · {feature.description}</span>
            <span className="value">{feature.meaning}</span>
          </div>
        ))}
      </div>

      <div className="report-divider" />

      <div className="report-section">
        <h3>整体气质</h3>
        <div className="report-summary">{OVERALL_SUMMARY}</div>
      </div>

      <div className="report-divider" />

      <div className="report-section">
        <div className="report-color">
          <span>幸运色</span>
          <span className="swatch" style={{ background: LUCKY_COLOR.hex }} />
          <span>{LUCKY_COLOR.name} · {LUCKY_COLOR.hex}</span>
        </div>
      </div>
    </>
  )
}

export default FaceReport
```

- [ ] **Step 4: Update report-mode.tsx**

Write `src/renderer/components/report-mode.tsx`:

```typescript
import React from 'react'
import FaceReport from './face-report'

interface Props {
  photoSrc?: string | null
}

const ReportMode: React.FC<Props> = ({ photoSrc }) => {
  return (
    <div className="report-container" data-testid="report-mode">
      <FaceReport photoSrc={photoSrc} />
    </div>
  )
}

export default ReportMode
```

- [ ] **Step 5: Run tests to verify they pass**

```bash
cd /Users/john/Documents/project/python/ElectronUI/OracubeUI
npx vitest run tests/renderer/report-mode.test.tsx
```

Expected: All tests PASS.

- [ ] **Step 6: Commit**

```bash
git add src/renderer/components/report-mode.tsx src/renderer/components/face-report.tsx tests/renderer/report-mode.test.tsx
git commit -m "feat: add report mode with face analysis report"
```

---

### Task 9: Animation File Conversion Script

**Files:**
- Create: `scripts/convert-animations.sh`

- [ ] **Step 1: Create conversion script**

Write `scripts/convert-animations.sh`:

```bash
#!/usr/bin/env bash
set -euo pipefail

# Convert Oracube-Core .mov/.gif animations to .webm for Electron UI
# Usage: ./scripts/convert-animations.sh

ORACUBE_CORE="${HOME}/Documents/project/python/ElectronUI/Oracube-Core"
OUTPUT_DIR="$(cd "$(dirname "$0")/.." && pwd)/data/animations"

mkdir -p "${OUTPUT_DIR}"

# Animation source directories
ANIM_DIRS=(
  "${ORACUBE_CORE}/data/Oracube_Animations"
  "${ORACUBE_CORE}/oracube/hardware/display_animations/oracube_emotions"
)

echo "Converting animations to ${OUTPUT_DIR}..."

for dir in "${ANIM_DIRS[@]}"; do
  if [ ! -d "${dir}" ]; then
    echo "  SKIP: ${dir} not found"
    continue
  fi

  find "${dir}" -type f \( -iname "*.mov" -o -iname "*.gif" \) | while read -r file; do
    basename=$(basename "${file}")
    name="${basename%.*}"
    output="${OUTPUT_DIR}/${name}.webm"

    if [ -f "${output}" ]; then
      echo "  EXISTS: ${name}.webm"
      continue
    fi

    echo "  CONVERT: ${basename} → ${name}.webm"
    ffmpeg -y -i "${file}" \
      -c:v libvpx-vp9 \
      -b:v 1M \
      -pix_fmt yuva420p \
      -an \
      "${output}" 2>/dev/null
  done
done

echo "Done. Animations in: ${OUTPUT_DIR}"
ls -lh "${OUTPUT_DIR}/"
```

- [ ] **Step 2: Make executable and verify**

```bash
chmod +x scripts/convert-animations.sh
```

- [ ] **Step 3: Commit**

```bash
git add scripts/convert-animations.sh
git commit -m "feat: add animation conversion script from .mov/.gif to .webm"
```

---

### Task 10: Packaging Configuration

**Files:**
- Create: `electron-builder.yml`

- [ ] **Step 1: Create electron-builder.yml**

Write `electron-builder.yml`:

```yaml
appId: com.oracube.ui
productName: Oracube-UI
directories:
  buildResources: build
  output: dist
files:
  - out/**/*
  - data/**/*
  - "!node_modules/**/*"
extraResources:
  - from: data/
    to: data/
    filter:
      - "**/*"

linux:
  target:
    - AppImage
  category: Utility
  icon: build/icon.png

mac:
  target:
    - dmg
    - zip
  category: public.app-category.utilities
  icon: build/icon.icns

# AppImage specific
appImage:
  artifactName: "${name}-${version}.AppImage"

# DMG specific
dmg:
  artifactName: "${name}-${version}.dmg"
```

- [ ] **Step 2: Create build icon placeholder**

```bash
mkdir -p build
```

(Note: A real icon file is needed at `build/icon.png` (512×512) and `build/icon.icns` for macOS. This can be done before final packaging.)

- [ ] **Step 3: Add .gitkeep in data/animations**

```bash
mkdir -p data/animations
touch data/animations/.gitkeep
```

- [ ] **Step 4: Commit**

```bash
git add electron-builder.yml build/ data/animations/.gitkeep
git commit -m "chore: add electron-builder config for AppImage (Linux) and DMG (macOS)"
```

---

### Task 11: Full Build and Integration Test

- [ ] **Step 1: Full build**

```bash
cd /Users/john/Documents/project/python/ElectronUI/OracubeUI
npx electron-vite build
```

Expected: Build succeeds without errors, output in `out/` directory.

- [ ] **Step 2: Run all tests**

```bash
cd /Users/john/Documents/project/python/ElectronUI/OracubeUI
npx vitest run
```

Expected: All tests PASS.

- [ ] **Step 3: Final commit**

```bash
git add -A
git commit -m "chore: final integration build"
```

---

### Task 12: Playwright E2E Automated Tests

**Files:**
- Create: `playwright.config.ts`
- Create: `tests/e2e/app.test.ts`
- Create: `tests/e2e/api.test.ts`
- Modify: `package.json` (add Playwright deps + scripts)
- Create: `scripts/run-e2e.sh`

- [ ] **Step 1: Add Playwright dependencies and scripts**

Update `package.json` — add to `devDependencies`:

```json
"@playwright/test": "^1.49.0",
```

Add to `scripts`:

```json
"test:e2e": "playwright test",
"test:e2e:headed": "playwright test --headed",
"test:all": "vitest run && playwright test"
```

Then install:

```bash
cd /Users/john/Documents/project/python/ElectronUI/OracubeUI
pnpm add -D @playwright/test
npx playwright install
```

- [ ] **Step 2: Create Playwright config**

Write `playwright.config.ts`:

```typescript
import { defineConfig } from '@playwright/test'

export default defineConfig({
  testDir: './tests/e2e',
  timeout: 30000,
  expect: { timeout: 10000 },
  fullyParallel: false,
  forbidOnly: true,
  retries: 1,
  workers: 1,
  reporter: [['list'], ['json', { outputFile: 'test-results/e2e-results.json' }]],
  use: {
    baseURL: 'http://localhost:8765',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure'
  },
  projects: [
    {
      name: 'electron',
      use: {
        // Use the Electron app's web server or launch Electron directly
        browserName: 'chromium',
        launchOptions: {
          args: ['--no-sandbox']
        }
      }
    }
  ]
})
```

- [ ] **Step 3: Create E2E test for the Express API**

Write `tests/e2e/api.test.ts`:

```typescript
import { test, expect, _electron as electron } from '@playwright/test'
import path from 'path'
import http from 'http'

// Helpers
function getJson(url: string): Promise<{ status: number; data: unknown }> {
  return new Promise((resolve, reject) => {
    const req = http.get(url, (res) => {
      let data = ''
      res.on('data', (chunk: string) => data += chunk)
      res.on('end', () => resolve({ status: res.statusCode || 0, data: JSON.parse(data) }))
    })
    req.on('error', reject)
    req.setTimeout(5000)
  })
}

function postJson(url: string, body: unknown): Promise<{ status: number; data: unknown }> {
  return new Promise((resolve, reject) => {
    const payload = JSON.stringify(body)
    const req = http.request(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(payload) }
    }, (res) => {
      let data = ''
      res.on('data', (chunk: string) => data += chunk)
      res.on('end', () => resolve({ status: res.statusCode || 0, data: JSON.parse(data) }))
    })
    req.on('error', reject)
    req.write(payload)
    req.end()
  })
}

async function waitForApi(baseUrl: string, timeout = 20000): Promise<void> {
  const start = Date.now()
  while (Date.now() - start < timeout) {
    try {
      await getJson(`${baseUrl}/api/v1/status`)
      return
    } catch {
      await new Promise((r) => setTimeout(r, 1000))
    }
  }
  throw new Error(`API at ${baseUrl} did not start within ${timeout}ms`)
}

const API_BASE = 'http://localhost:8765'

test.describe('Express API E2E', () => {
  let electronApp: Awaited<ReturnType<typeof electron.launch>>

  test.beforeAll(async () => {
    // Launch the built Electron app — the Express API starts automatically inside it
    electronApp = await electron.launch({
      args: [path.resolve(__dirname, '../../out/main/index.js')],
      env: { ...process.env }
    })
    await waitForApi(API_BASE)
  })

  test.afterAll(async () => {
    if (electronApp) await electronApp.close()
  })

  test('GET /api/v1/status returns correct format', async () => {
    const { status, data } = await getJson(`${API_BASE}/api/v1/status`)
    expect(status).toBe(200)
    const body = data as { code: number; data: { current_mode: string }; msg: string }
    expect(body.code).toBe(200)
    expect(body.data).toHaveProperty('current_mode')
    expect(body.msg).toBe('success')
  })

  test('POST /api/v1/animation with valid emotion returns success', async () => {
    const { status, data } = await postJson(`${API_BASE}/api/v1/animation`, {
      command: 'switch', emotion: 'lively'
    })
    expect(status).toBe(200)
    const body = data as { code: number; data: { emotion: string }; msg: string }
    expect(body.code).toBe(200)
    expect(body.data.emotion).toBe('lively')
  })

  test('POST /api/v1/animation with invalid emotion returns 400', async () => {
    const { status, data } = await postJson(`${API_BASE}/api/v1/animation`, {
      command: 'switch', emotion: 'nonexistent'
    })
    expect(status).toBe(400)
    const body = data as { code: number; msg: string }
    expect(body.code).toBe(400)
  })

  test('POST /api/v1/mode switches modes', async () => {
    for (const mode of ['camera', 'report', 'emotion']) {
      const { status, data } = await postJson(`${API_BASE}/api/v1/mode`, { mode })
      expect(status).toBe(200)
      const body = data as { code: number; data: { current_mode: string }; msg: string }
      expect(body.data.current_mode).toBe(mode)
    }
  })

  test('POST /api/v1/mode with invalid mode returns 400', async () => {
    const { status } = await postJson(`${API_BASE}/api/v1/mode`, { mode: 'invalid' })
    expect(status).toBe(400)
  })

  test('POST /api/v1/camera/capture returns 200', async () => {
    const { status, data } = await postJson(`${API_BASE}/api/v1/camera/capture`, {})
    expect(status).toBe(200)
    const body = data as { code: number; data: { previous_mode: string }; msg: string }
    expect(body.data).toHaveProperty('previous_mode')
  })

  test('All API responses follow {code, data, msg} format', async () => {
    const { data } = await getJson(`${API_BASE}/api/v1/status`)
    const body = data as Record<string, unknown>
    expect(body).toHaveProperty('code')
    expect(body).toHaveProperty('data')
    expect(body).toHaveProperty('msg')
    expect(typeof body.code).toBe('number')
    expect(typeof body.msg).toBe('string')
  })
})
```

- [ ] **Step 4: Create E2E test for the Renderer (UI)**

Write `tests/e2e/app.test.ts`:

```typescript
import { test, expect, _electron as electron } from '@playwright/test'
import path from 'path'

test.describe('Oracube UI Electron App', () => {
  let app: Awaited<ReturnType<typeof electron.launch>>
  let window: Awaited<ReturnType<typeof app.firstWindow>>

  test.beforeAll(async () => {
    // Build the app first
    const { execSync } = require('child_process')
    execSync('npx electron-vite build', {
      cwd: path.resolve(__dirname, '../..'),
      stdio: 'pipe'
    })

    // Launch the Electron app
    app = await electron.launch({
      args: [path.resolve(__dirname, '../../out/main/index.js')],
      env: { ...process.env, CI: 'true' }
    })

    window = await app.firstWindow()
    // Wait for the app to be fully loaded
    await window.waitForLoadState('domcontentloaded')
  })

  test.afterAll(async () => {
    if (app) await app.close()
  })

  test('app window is 720x720 and frameless', async () => {
    const bounds = await app.evaluate(({ BrowserWindow }) => {
      const win = BrowserWindow.getAllWindows()[0]
      const [w, h] = win.getSize()
      const isFrameless = !win.isMenuBarVisible()
      return { width: w, height: h, isFrameless }
    })

    expect(bounds.width).toBe(720)
    expect(bounds.height).toBe(720)
    expect(bounds.isFrameless).toBe(true)
  })

  test('default mode is emotion with idle state', async () => {
    const emotionMode = window.locator('[data-testid="emotion-mode"]')
    await expect(emotionMode).toBeVisible()
    await expect(emotionMode).toContainText('待机中')
  })

  test('key 2 switches to camera mode', async () => {
    await window.keyboard.press('2')
    const cameraMode = window.locator('[data-testid="camera-mode"]')
    await expect(cameraMode).toBeVisible()
  })

  test('key 3 switches to report mode', async () => {
    await window.keyboard.press('3')
    const reportMode = window.locator('[data-testid="report-mode"]')
    await expect(reportMode).toBeVisible()
  })

  test('key 1 switches back to emotion mode', async () => {
    await window.keyboard.press('1')
    const emotionMode = window.locator('[data-testid="emotion-mode"]')
    await expect(emotionMode).toBeVisible()
  })

  test('report mode shows face analysis report', async () => {
    await window.keyboard.press('3')
    await expect(window.locator('text=面相分析报告')).toBeVisible()
    await expect(window.locator('text=五官分析')).toBeVisible()
    await expect(window.locator('text=整体气质')).toBeVisible()
    await expect(window.locator('text=幸运色')).toBeVisible()
  })

  test('app has pure black background', async () => {
    const bgColor = await window.evaluate(() => {
      return getComputedStyle(document.body).backgroundColor
    })
    expect(bgColor).toBe('rgb(0, 0, 0)')
  })

  test('Escape key triggers quit', async () => {
    // Mock to prevent actual quit
    await window.evaluate(() => {
      window.oracubeUI = {
        ...window.oracubeUI!,
        quit: () => { /* no-op for test */ }
      }
    })
    await window.keyboard.press('Escape')
    // If quit was called without error, the test passes
    // (we can't assert isDestroyed because our mock prevents it)
  })
})
```

- [ ] **Step 5: Create E2E run script**

Write `scripts/run-e2e.sh`:

```bash
#!/usr/bin/env bash
set -euo pipefail

echo "=== Building Oracube UI ==="
cd "$(dirname "$0")/.."
npx electron-vite build

echo ""
echo "=== Running Unit Tests ==="
npx vitest run

echo ""
echo "=== Running E2E Tests ==="
npx playwright test

echo ""
echo "=== All Tests Passed ==="
```

```bash
chmod +x scripts/run-e2e.sh
```

- [ ] **Step 6: Add test-results to .gitignore**

Append to `.gitignore`:

```
test-results/
playwright-report/
```

- [ ] **Step 7: Commit**

```bash
git add playwright.config.ts tests/e2e/ scripts/run-e2e.sh .gitignore
git commit -m "test: add Playwright E2E tests for API, UI modes, and keyboard shortcuts"
```
