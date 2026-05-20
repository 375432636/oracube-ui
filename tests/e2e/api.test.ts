import { test, expect, _electron as electron } from '@playwright/test'
import path from 'path'
import http from 'http'

// Helpers
function getJson(url: string): Promise<{ status: number; data: unknown }> {
  return new Promise((resolve, reject) => {
    const req = http.get(url, (res) => {
      let data = ''
      res.on('data', (chunk: string) => data += chunk)
      res.on('end', () => resolve({ status: res.statusCode || 0, data: JSON.parse(data) }))
    })
    req.on('error', reject)
    req.setTimeout(5000)
  })
}

function postJson(url: string, body: unknown): Promise<{ status: number; data: unknown }> {
  return new Promise((resolve, reject) => {
    const payload = JSON.stringify(body)
    const req = http.request(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(payload) }
    }, (res) => {
      let data = ''
      res.on('data', (chunk: string) => data += chunk)
      res.on('end', () => resolve({ status: res.statusCode || 0, data: JSON.parse(data) }))
    })
    req.on('error', reject)
    req.write(payload)
    req.end()
  })
}

async function waitForApi(baseUrl: string, timeout = 20000): Promise<void> {
  const start = Date.now()
  while (Date.now() - start < timeout) {
    try {
      await getJson(`${baseUrl}/api/v1/status`)
      return
    } catch {
      await new Promise((r) => setTimeout(r, 1000))
    }
  }
  throw new Error(`API at ${baseUrl} did not start within ${timeout}ms`)
}

const API_BASE = 'http://localhost:8765'

test.describe('Express API E2E', () => {
  let electronApp: Awaited<ReturnType<typeof electron.launch>>

  test.beforeAll(async () => {
    electronApp = await electron.launch({
      args: [path.resolve(__dirname, '../../out/main/index.js')],
      env: { ...process.env }
    })
    await waitForApi(API_BASE)
  })

  test.afterAll(async () => {
    if (electronApp) await electronApp.close()
  })

  test('GET /api/v1/status returns correct format', async () => {
    const { status, data } = await getJson(`${API_BASE}/api/v1/status`)
    expect(status).toBe(200)
    const body = data as { code: number; data: { current_mode: string }; msg: string }
    expect(body.code).toBe(200)
    expect(body.data).toHaveProperty('current_mode')
    expect(body.msg).toBe('success')
  })

  test('POST /api/v1/animation with valid emotion returns success', async () => {
    const { status, data } = await postJson(`${API_BASE}/api/v1/animation`, {
      command: 'switch', emotion: 'lively'
    })
    expect(status).toBe(200)
    const body = data as { code: number; data: { emotion: string }; msg: string }
    expect(body.code).toBe(200)
    expect(body.data.emotion).toBe('lively')
  })

  test('POST /api/v1/animation with invalid emotion returns 400', async () => {
    const { status, data } = await postJson(`${API_BASE}/api/v1/animation`, {
      command: 'switch', emotion: 'nonexistent'
    })
    expect(status).toBe(400)
    const body = data as { code: number; msg: string }
    expect(body.code).toBe(400)
  })

  test('POST /api/v1/mode switches modes', async () => {
    for (const mode of ['camera', 'report', 'emotion']) {
      const { status, data } = await postJson(`${API_BASE}/api/v1/mode`, { mode })
      expect(status).toBe(200)
      const body = data as { code: number; data: { current_mode: string }; msg: string }
      expect(body.data.current_mode).toBe(mode)
    }
  })

  test('POST /api/v1/mode with invalid mode returns 400', async () => {
    const { status } = await postJson(`${API_BASE}/api/v1/mode`, { mode: 'invalid' })
    expect(status).toBe(400)
  })

  test('POST /api/v1/camera/capture returns 200', async () => {
    const { status, data } = await postJson(`${API_BASE}/api/v1/camera/capture`, {})
    expect(status).toBe(200)
    const body = data as { code: number; data: { previous_mode: string }; msg: string }
    expect(body.data).toHaveProperty('previous_mode')
  })

  test('All API responses follow {code, data, msg} format', async () => {
    const { data } = await getJson(`${API_BASE}/api/v1/status`)
    const body = data as Record<string, unknown>
    expect(body).toHaveProperty('code')
    expect(body).toHaveProperty('data')
    expect(body).toHaveProperty('msg')
    expect(typeof body.code).toBe('number')
    expect(typeof body.msg).toBe('string')
  })
})
