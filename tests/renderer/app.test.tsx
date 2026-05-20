// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import App from '../../src/renderer/app'

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

describe('App Shell', () => {
  it('renders in emotion mode by default', () => {
    render(<App />)
    expect(screen.getByTestId('emotion-mode')).toBeDefined()
  })

  it('switches to camera mode on key "2"', () => {
    render(<App />)
    fireEvent.keyDown(window, { key: '2' })
    expect(screen.getByTestId('camera-mode')).toBeDefined()
  })

  it('switches to report mode on key "3"', () => {
    render(<App />)
    fireEvent.keyDown(window, { key: '3' })
    expect(screen.getByTestId('report-mode')).toBeDefined()
  })

  it('switches to emotion mode on key "1"', () => {
    render(<App />)
    fireEvent.keyDown(window, { key: '2' })
    fireEvent.keyDown(window, { key: '1' })
    expect(screen.getByTestId('emotion-mode')).toBeDefined()
  })

  it('calls quit on Escape', () => {
    render(<App />)
    fireEvent.keyDown(window, { key: 'Escape' })
    expect(mockApi.quit).toHaveBeenCalled()
  })
})
