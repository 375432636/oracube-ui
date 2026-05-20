import React from 'react'
import FaceReport from './face-report'

interface Props {
  photoSrc?: string | null
}

const ReportMode: React.FC<Props> = ({ photoSrc }) => {
  return (
    <div className="report-container" data-testid="report-mode">
      <FaceReport photoSrc={photoSrc} />
    </div>
  )
}

export default ReportMode
