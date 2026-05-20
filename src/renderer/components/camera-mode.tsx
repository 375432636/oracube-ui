import React from 'react'

interface Props {
  onCaptureDone: () => void
  autoCapture: boolean
  onPhotoSaved: (path: string) => void
}

const CameraMode: React.FC<Props> = () => {
  return (
    <div className="camera-container" data-testid="camera-mode">
      <div className="state-message">摄像头待启动</div>
    </div>
  )
}

export default CameraMode
