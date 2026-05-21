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
        if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
          if (!cancelled) setStatus('not-found')
          return
        }

        const devices = await navigator.mediaDevices.enumerateDevices()
        const videoDevices = devices.filter((d) => d.kind === 'videoinput')

        if (videoDevices.length === 0) {
          if (!cancelled) setStatus('not-found')
          return
        }

        let stream: MediaStream
        try {
          stream = await navigator.mediaDevices.getUserMedia({
            video: { deviceId: { exact: videoDevices[0].deviceId }, width: 720, height: 720 }
          })
        } catch {
          stream = await navigator.mediaDevices.getUserMedia({
            video: { width: 720, height: 720 }
          })
        }

        if (cancelled) {
          stream.getTracks().forEach((t) => t.stop())
          return
        }

        streamRef.current = stream

        // Set srcObject immediately and let the video element handle play
        if (videoRef.current) {
          videoRef.current.srcObject = stream
        }

        if (!cancelled) setStatus('active')
      } catch (err: unknown) {
        if (cancelled) return
        if (err instanceof DOMException && err.name === 'NotAllowedError') {
          setStatus('denied')
        } else if (err instanceof DOMException && err.name === 'NotFoundError') {
          setStatus('not-found')
        } else {
          setStatus('error')
        }
      }
    }

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

  const isActive = status === 'active'

  return (
    <div style={{ width: '100%', height: '100%', position: 'relative', background: '#000', overflow: 'hidden' }}>
      {!isActive && (
        <div className="state-message" style={{ position: 'absolute', inset: 0, zIndex: 2 }}>
          {status === 'loading' && '正在启动摄像头...'}
          {status === 'not-found' && <span className="state-error">未检测到摄像头</span>}
          {status === 'denied' && <span className="state-error">摄像头权限被拒绝</span>}
          {status === 'error' && <span className="state-error">摄像头启动失败</span>}
        </div>
      )}
      {/* Always render video, always visible. Overlay covers it when not active. */}
      <video
        ref={videoRef}
        data-testid="camera-video"
        autoPlay
        playsInline
        muted
        style={{
          width: '100%',
          height: '100%',
          objectFit: 'contain',
          display: 'block',
          background: '#000'
        }}
      />
      <canvas ref={canvasRef} style={{ display: 'none' }} />
    </div>
  )
}

export default CameraPreview
