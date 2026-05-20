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

  useEffect(() => {
    if (autoCapture && !hasAutoCaptured.current) {
      hasAutoCaptured.current = true
      const timer = setTimeout(() => setIsCapturing(true), 500)
      return () => clearTimeout(timer)
    }
  }, [autoCapture])

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
