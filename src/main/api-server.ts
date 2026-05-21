import express, { Request, Response } from 'express'
import { join } from 'path'
import { existsSync } from 'fs'
import { PHOTO_DIR } from './ipc-handlers'

export const API_PORT = 8765

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

  // Serve captured photos as static files
  if (existsSync(PHOTO_DIR)) {
    app.use('/photos', express.static(PHOTO_DIR))
  }

  const state: AppState = {
    currentMode: 'emotion',
    emotion: null,
    isPlaying: false,
    cameraAvailable: false,
    recentPhoto: null
  }

  app.get('/api/v1/status', (_req: Request, res: Response) => {
    res.json({
      code: 200,
      data: {
        current_mode: state.currentMode,
        emotion: state.emotion,
        is_playing: state.isPlaying,
        camera_available: state.cameraAvailable,
        recent_photo: state.recentPhoto
      },
      msg: 'success'
    })
  })

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

  app.post('/api/v1/camera/capture', (_req: Request, res: Response) => {
    const previousMode = state.currentMode
    state.currentMode = 'camera'
    onModeChange?.('camera', previousMode)
    onCapture?.()
    res.json({ code: 200, data: { previous_mode: previousMode }, msg: 'success' })
  })

  app.get('/api/v1/camera/latest-photo', (_req: Request, res: Response) => {
    res.json({
      code: 200,
      data: { path: state.recentPhoto, timestamp: new Date().toISOString() },
      msg: 'success'
    })
  })

  return app
}

export function startServer(
  port: number = 8765,
  onModeChange?: ModeChangeCallback,
  onAnimation?: AnimationCallback,
  onCapture?: CaptureCallback
) {
  const app = createServer(onModeChange, onAnimation, onCapture)
  return app.listen(port, () => {
    console.log(`Oracube API server listening on port ${port}`)
  })
}

export { VALID_EMOTIONS, VALID_MODES }
export type { Emotion, Mode, AppState }
