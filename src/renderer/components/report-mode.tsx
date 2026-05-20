import React from 'react'

interface Props {
  photoSrc?: string | null
}

const ReportMode: React.FC<Props> = () => {
  return (
    <div className="report-container" data-testid="report-mode">
      <div className="state-message">报告加载中...</div>
    </div>
  )
}

export default ReportMode
