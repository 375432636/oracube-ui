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
