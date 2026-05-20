// @vitest-environment jsdom
import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import ReportMode from '../../src/renderer/components/report-mode'
import FaceReport from '../../src/renderer/components/face-report'

describe('FaceReport', () => {
  it('renders report title', () => {
    render(<FaceReport photoSrc={null} />)
    expect(screen.getByText('面相分析报告')).toBeDefined()
  })

  it('renders photo when photoSrc provided', () => {
    render(<FaceReport photoSrc="/path/to/photo.jpg" />)
    const img = screen.getByAltText('用户照片') as HTMLImageElement
    expect(img).toBeDefined()
    expect(img.getAttribute('src')).toBe('/path/to/photo.jpg')
  })

  it('does not render photo when photoSrc is null', () => {
    const { container } = render(<FaceReport photoSrc={null} />)
    expect(container.querySelector('img')).toBeNull()
  })

  it('renders all facial feature items', () => {
    const { container } = render(<FaceReport photoSrc={null} />)
    const items = container.querySelectorAll('.report-item')
    expect(items).toHaveLength(5)
  })

  it('renders overall analysis section', () => {
    render(<FaceReport photoSrc={null} />)
    expect(screen.getByText('整体气质')).toBeDefined()
  })

  it('renders lucky color', () => {
    render(<FaceReport photoSrc={null} />)
    expect(screen.getByText('幸运色')).toBeDefined()
  })
})

describe('ReportMode', () => {
  it('shows report', () => {
    render(<ReportMode photoSrc={null} />)
    expect(screen.getByText('面相分析报告')).toBeDefined()
  })

  it('passes photoSrc to FaceReport', () => {
    render(<ReportMode photoSrc="/path/to/photo.jpg" />)
    const img = screen.getByAltText('用户照片') as HTMLImageElement
    expect(img).toBeDefined()
    expect(img.getAttribute('src')).toBe('/path/to/photo.jpg')
  })
})
