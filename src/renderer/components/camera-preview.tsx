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
