// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import CameraMode from '../../src/renderer/components/camera-mode'
import PhotoThumbnail from '../../src/renderer/components/photo-thumbnail'

const mockApi = {
  onModeChange: vi.fn(),
  onAnimationTrigger: vi.fn(),
  onCaptureTrigger: vi.fn(),
  onCaptureDone: vi.fn(),
  savePhoto: vi.fn().mockResolvedValue('/path/to/photo.jpg'),
  quit: vi.fn()
}

beforeEach(() => {
  window.oracubeUI = mockApi as any
})

describe('PhotoThumbnail', () => {
  it('renders nothing when no photo', () => {
    const { container } = render(<PhotoThumbnail photoPath={null} />)
    expect(container.innerHTML).toBe('')
  })

  it('renders image when photo path provided', () => {
    render(<PhotoThumbnail photoPath="/path/to/photo.jpg" />)
    const img = screen.getByTestId('photo-img') as HTMLImageElement
    expect(img).toBeDefined()
    expect(img.getAttribute('src')).toBe('/path/to/photo.jpg')
  })
})

describe('CameraMode', () => {
  it('renders with data-testid', () => {
    render(<CameraMode onCaptureDone={vi.fn()} autoCapture={false} onPhotoSaved={vi.fn()} />)
    expect(screen.getByTestId('camera-mode')).toBeDefined()
  })
})
