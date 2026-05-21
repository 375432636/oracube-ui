# Oracube UI

Oracube 设备的无边框桌面控制界面，基于 Electron + React + TypeScript 构建。提供表情动画播放、USB 摄像头拍照、面相分析报告三种模式，可通过 HTTP API 由 Pipecat 程序远程控制。

## 功能

| 模式 | 快捷键 | 说明 |
|------|--------|------|
| 表情模式 | `1` | 播放动画表情（Pipecat 通过 API 触发） |
| 摄像头模式 | `2` | USB 摄像头实时预览，按 `Space` 拍照 |
| 报告模式 | `3` | 面相分析报告展示 |

所有模式也可通过 HTTP API 远程切换。

## 效果

![Oracube UI 报告模式](https://via.placeholder.com/360x360/000000/C8A96E?text=Oracube+UI)

- 720×720 无边框纯黑窗口
- Pipecat HTTP API 驱动表情动画
- `navigator.mediaDevices` 自动选取第一个 USB 摄像头
- 照片保存至 `~/.oracube-ui/photos/`
- 纯前端渲染面相分析报告

## 快速开始

```bash
# 安装依赖
npm install --legacy-peer-deps

# 开发模式
npm run dev

# 构建
npm run build

# 运行测试
npm test
npm run test:e2e      # E2E 测试
npm run test:all       # 全部测试
```

## 打包

```bash
# Linux AppImage
npm run package:linux

# macOS DMG + ZIP
npm run package:mac
```

产物输出至 `dist/` 目录。

## 系统要求

- Node.js >= 18
- npm
- ffmpeg（用于动画格式转换）
- USB 摄像头（摄像头模式需要）

## API 接口

服务运行在 `http://localhost:8765`。

### 获取状态

```bash
curl http://localhost:8765/api/v1/status
```

响应：
```json
{
  "code": 200,
  "data": {
    "current_mode": "emotion",
    "emotion": null,
    "is_playing": false,
    "camera_available": false,
    "recent_photo": null
  },
  "msg": "success"
}
```

### 切换动画

```bash
curl -X POST http://localhost:8765/api/v1/animation \
  -H "Content-Type: application/json" \
  -d '{"command":"switch","emotion":"lively"}'
```

支持的情绪：`lively`, `speaking`, `laughing`, `sad`, `angry`, `confused`, `shy`, `funny`, `loving`, `sleepy`, `shocked`, `thinking`, `confident`, `meditation`, `warmup`

### 切换模式

```bash
curl -X POST http://localhost:8765/api/v1/mode \
  -H "Content-Type: application/json" \
  -d '{"mode":"camera"}'
```

### 远程拍照

```bash
curl -X POST http://localhost:8765/api/v1/camera/capture \
  -H "Content-Type: application/json" \
  -d '{}'
```

### 获取最新照片

```bash
curl http://localhost:8765/api/v1/camera/latest-photo
```

## 项目结构

```
src/
├── main/                  # Electron 主进程
│   ├── index.ts           # 窗口创建 + 应用生命周期
│   ├── api-server.ts      # Express HTTP API (端口 8765)
│   └── ipc-handlers.ts    # IPC 主进程↔渲染进程通信
├── preload/               # 预加载脚本
│   ├── index.ts           # contextBridge API 暴露
│   └── index.d.ts         # Window API 类型声明
└── renderer/              # React 渲染进程
    ├── app.tsx            # 应用根组件（模式路由 + 快捷键）
    ├── emotions.json      # 情绪 → 动画文件映射
    ├── global.css         # 纯黑主题样式
    └── components/
        ├── emotion-mode.tsx       # 表情模式
        ├── animation-player.tsx    # 视频动画播放器
        ├── camera-mode.tsx         # 摄像头模式
        ├── camera-preview.tsx      # 摄像头实时预览
        ├── photo-thumbnail.tsx     # 照片缩略图
        ├── report-mode.tsx         # 报告模式容器
        └── face-report.tsx         # 面相分析报告
tests/
├── main/                  # 主进程单元测试
├── renderer/              # 渲染进程组件测试
└── e2e/                   # Playwright E2E 测试
scripts/
└── convert-animations.sh  # .gif/.mov → .webm 转换脚本
data/animations/           # 动画文件目录
```

## 动画

动画文件使用 VP9 编码的 `.webm` 格式。转换命令：

```bash
./scripts/convert-animations.sh
```

源文件来自 `Oracube-Core` 项目中的 `.gif` 动画。

## 技术栈

- **框架**: Electron 33 + React 19 + TypeScript
- **构建**: electron-vite 2 + Vite 5
- **API**: Express 4 (端口 8765)
- **摄像头**: Web API `navigator.mediaDevices.getUserMedia()`
- **测试**: Vitest + @testing-library/react + Playwright
- **打包**: electron-builder (AppImage + DMG)
