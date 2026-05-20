import React from 'react'

interface FacialFeature {
  name: string
  description: string
  meaning: string
}

interface Props {
  photoSrc?: string | null
}

const MOCK_FEATURES: FacialFeature[] = [
  { name: '额头', description: '饱满开阔', meaning: '福相 · 智慧通达' },
  { name: '眉毛', description: '浓密整齐', meaning: '果断 · 意志坚定' },
  { name: '眼睛', description: '明亮有神', meaning: '智慧 · 洞察力强' },
  { name: '鼻梁', description: '挺拔端正', meaning: '财运 · 中正平和' },
  { name: '嘴唇', description: '厚薄适中', meaning: '平和 · 善于表达' }
]

const OVERALL_SUMMARY = '五官端正协调，气质庄重而不失亲和。额头饱满主智慧，眉眼有神见洞察，鼻梁挺拔显格局，唇形适中表平和。整体面相呈现内外兼修之象。'

const LUCKY_COLOR = { name: '金色', hex: '#C8A96E' }

const FaceReport: React.FC<Props> = ({ photoSrc }) => {
  const now = new Date()
  const dateStr = `${now.getFullYear()}年${now.getMonth() + 1}月${now.getDate()}日`

  return (
    <>
      <div className="report-title">面相分析报告</div>
      <div className="report-subtitle">评估时间: {dateStr}</div>

      {photoSrc && (
        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 16 }}>
          <img
            src={photoSrc}
            alt="用户照片"
            style={{ width: 100, height: 100, borderRadius: 8, objectFit: 'cover', border: '1px solid rgba(255,255,255,0.2)' }}
          />
        </div>
      )}

      <div className="report-divider" />

      <div className="report-section">
        <h3>五官分析</h3>
        {MOCK_FEATURES.map((feature) => (
          <div className="report-item" key={feature.name}>
            <span className="label">{feature.name} · {feature.description}</span>
            <span className="value">{feature.meaning}</span>
          </div>
        ))}
      </div>

      <div className="report-divider" />

      <div className="report-section">
        <h3>整体气质</h3>
        <div className="report-summary">{OVERALL_SUMMARY}</div>
      </div>

      <div className="report-divider" />

      <div className="report-section">
        <div className="report-color">
          <span>幸运色</span>
          <span className="swatch" style={{ background: LUCKY_COLOR.hex }} />
          <span>{LUCKY_COLOR.name} · {LUCKY_COLOR.hex}</span>
        </div>
      </div>
    </>
  )
}

export default FaceReport
