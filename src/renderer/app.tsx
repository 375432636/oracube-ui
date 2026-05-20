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
      captureTimerRef.current = setTimeout(() => {
        setCurrentMode(prev)
      }, 2000)
    }
  }, [capturePreviousMode])

  const handlePhotoSaved = useCallback((path: string) => {
    setRecentPhoto(path)
  }, [])

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

// Only mount root in browser (not in test environment)
const rootEl = typeof document !== 'undefined' ? document.getElementById('root') : null
if (rootEl) {
  const root = createRoot(rootEl)
  root.render(<App />)
}

export default App
