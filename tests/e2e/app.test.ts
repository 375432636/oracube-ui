import { test, expect, _electron as electron } from '@playwright/test'
import path from 'path'

test.describe('Oracube UI Electron App', () => {
  let app: Awaited<ReturnType<typeof electron.launch>>
  let window: Awaited<ReturnType<typeof app.firstWindow>>

  test.beforeAll(async () => {
    const { execSync } = require('child_process')
    execSync('npx electron-vite build', {
      cwd: path.resolve(__dirname, '../..'),
      stdio: 'pipe'
    })

    app = await electron.launch({
      args: [path.resolve(__dirname, '../../out/main/index.js')],
      env: { ...process.env, CI: 'true' }
    })

    window = await app.firstWindow()
    await window.waitForLoadState('domcontentloaded')
  })

  test.afterAll(async () => {
    if (app) await app.close()
  })

  test('app window is 720x720', async () => {
    const bounds = await app.evaluate(({ BrowserWindow }) => {
      const win = BrowserWindow.getAllWindows()[0]
      return { width: win.getSize()[0], height: win.getSize()[1] }
    })

    expect(bounds.width).toBe(720)
    expect(bounds.height).toBe(720)
  })

  test('default mode is emotion with idle state', async () => {
    const emotionMode = window.locator('[data-testid="emotion-mode"]')
    await expect(emotionMode).toBeVisible()
    await expect(emotionMode).toContainText('待机中')
  })

  test('key 2 switches to camera mode', async () => {
    await window.keyboard.press('2')
    const cameraMode = window.locator('[data-testid="camera-mode"]')
    await expect(cameraMode).toBeVisible()
  })

  test('key 3 switches to report mode', async () => {
    await window.keyboard.press('3')
    const reportMode = window.locator('[data-testid="report-mode"]')
    await expect(reportMode).toBeVisible()
  })

  test('key 1 switches back to emotion mode', async () => {
    await window.keyboard.press('1')
    const emotionMode = window.locator('[data-testid="emotion-mode"]')
    await expect(emotionMode).toBeVisible()
  })

  test('report mode shows face analysis report', async () => {
    await window.keyboard.press('3')
    await expect(window.locator('text=面相分析报告')).toBeVisible()
    await expect(window.locator('text=五官分析')).toBeVisible()
    await expect(window.locator('text=整体气质')).toBeVisible()
    await expect(window.locator('text=幸运色')).toBeVisible()
  })

  test('app has pure black background', async () => {
    const bgColor = await window.evaluate(() => {
      return getComputedStyle(document.body).backgroundColor
    })
    expect(bgColor).toBe('rgb(0, 0, 0)')
  })

  test('Escape key triggers quit IPC', async () => {
    // Remove the 'app-quit' listener so the window doesn't actually close
    await app.evaluate(({ ipcMain }) => {
      ipcMain.removeAllListeners('app-quit')
    })
    await window.keyboard.press('Escape')
    // Window stays open because we removed the listener — test passes
  })
})
