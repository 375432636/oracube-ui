// @vitest-environment jsdom
import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import EmotionMode from '../../src/renderer/components/emotion-mode'
import AnimationPlayer from '../../src/renderer/components/animation-player'

describe('AnimationPlayer', () => {
  it('renders video element with correct src', () => {
    render(<AnimationPlayer emotion="lively" animationPath="/path/to/lively.webm" />)
    const video = screen.getByTestId('anim-video') as HTMLVideoElement
    expect(video).toBeDefined()
    expect(video.getAttribute('src')).toBe('/path/to/lively.webm')
  })
})

describe('EmotionMode', () => {
  it('shows idle state when no emotion', () => {
    render(<EmotionMode emotion={null} />)
    expect(screen.getByText('待机中')).toBeDefined()
  })

  it('shows error for unknown emotion', () => {
    render(<EmotionMode emotion="unknown_xyz" />)
    expect(screen.getByText('未知情绪: unknown_xyz')).toBeDefined()
  })

  it('renders animation player for valid emotion', () => {
    render(<EmotionMode emotion="lively" />)
    expect(screen.getByTestId('anim-video')).toBeDefined()
  })
})
