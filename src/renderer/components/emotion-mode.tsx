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
