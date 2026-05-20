import { describe, it, expect } from 'vitest'
import request from 'supertest'
import { createServer } from '../../src/main/api-server'

describe('API Server', () => {
  const app = createServer()

  it('GET /api/v1/status returns current state', async () => {
    const res = await request(app).get('/api/v1/status')
    expect(res.status).toBe(200)
    expect(res.body.code).toBe(200)
    expect(res.body.data).toHaveProperty('current_mode')
    expect(res.body.data).toHaveProperty('emotion')
    expect(res.body.data).toHaveProperty('is_playing')
    expect(res.body.data).toHaveProperty('camera_available')
    expect(res.body.msg).toBe('success')
  })

  it('POST /api/v1/animation with valid emotion returns success', async () => {
    const res = await request(app)
      .post('/api/v1/animation')
      .send({ command: 'switch', emotion: 'lively' })
    expect(res.status).toBe(200)
    expect(res.body.code).toBe(200)
    expect(res.body.data.emotion).toBe('lively')
  })

  it('POST /api/v1/animation with invalid emotion returns 400', async () => {
    const res = await request(app)
      .post('/api/v1/animation')
      .send({ command: 'switch', emotion: 'nonexistent' })
    expect(res.status).toBe(400)
    expect(res.body.code).toBe(400)
  })

  it('POST /api/v1/animation pause returns success', async () => {
    const res = await request(app)
      .post('/api/v1/animation')
      .send({ command: 'pause' })
    expect(res.status).toBe(200)
  })

  it('POST /api/v1/animation resume returns success', async () => {
    const res = await request(app)
      .post('/api/v1/animation')
      .send({ command: 'resume' })
    expect(res.status).toBe(200)
  })

  it('POST /api/v1/mode switches mode', async () => {
    const res = await request(app)
      .post('/api/v1/mode')
      .send({ mode: 'camera' })
    expect(res.status).toBe(200)
    expect(res.body.data.current_mode).toBe('camera')
  })

  it('POST /api/v1/mode with invalid mode returns 400', async () => {
    const res = await request(app)
      .post('/api/v1/mode')
      .send({ mode: 'invalid' })
    expect(res.status).toBe(400)
  })

  it('POST /api/v1/camera/capture returns 200', async () => {
    const res = await request(app).post('/api/v1/camera/capture')
    expect(res.status).toBe(200)
  })

  it('POST /api/v1/animation with unknown command returns 400', async () => {
    const res = await request(app)
      .post('/api/v1/animation')
      .send({ command: 'unknown' })
    expect(res.status).toBe(400)
  })
})
