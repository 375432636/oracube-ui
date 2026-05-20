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
