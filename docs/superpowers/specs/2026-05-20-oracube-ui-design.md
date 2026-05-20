# Oracube Borderless UI — Design Spec

## 概述

基于 React + Electron 的无边界 UI 程序，部署在 Linux 上（AppImage 打包），作为 Oracube-Core Pipecat 语音管线的可视化展现层。提供 3 种模式（表情动画、摄像头、面相分析报告），通过 HTTP API 接收 Pipecat 的触发指令。

**核心原则：** 不修改 Oracube-Core 代码，通过 HTTP API 对接，参考 Oracube-Core 中 mpv 控制的命令风格设计接口。

## 技术栈

| 层面 | 选择 | 理由 |
|------|------|------|
| UI 框架 | React 19 + TypeScript | 公司标准，Oracube 现有前端保持一致 |
| 构建工具 | electron-vite | 统一管理 main/preload/renderer，原生 Vite HMR |
| 打包 | electron-builder | AppImage 最成熟的方案 |
| HTTP 服务 | Express（main process） | 轻量，参考 mpv 控制器的命令风格 |
| 摄像头 | navigator.mediaDevices.getUserMedia() | 标准 Web API，零依赖 |
| 包管理 | pnpm | 公司规范 |
| 样式 | 纯 CSS | 纯黑主题不需要复杂样式框架 |
| 视频格式 | WebM（VP8/VP9） | Chromium 原生支持，Oracube-Core 的 .mov 转换而来 |

## 窗口规格

| 属性 | 值 |
|------|-----|
| 尺寸 | 720 × 720 像素（固定） |
| 边框 | frameless（无边框） |
| 背景色 | #000000（纯黑） |
| 关闭 | Esc 键退出 |

## API 设计

### 通信架构

```
Pipecat Pipeline → HTTP POST :8765 → Express (main process)
  → ipcMain.send() → BrowserWindow.webContents.send()
  → React 组件响应
```

### 响应标准格式（公司规范）

```json
// 成功
{ "code": 200, "data": { ... }, "msg": "success" }
// 错误
{ "code": 400, "data": null, "msg": "错误描述" }
```

### 端点

#### 动画控制（参考 mpv 风格）

MPVController 的 `_send_command(["loadfile", path, "replace"])` 命令数组风格迁移到 HTTP API：

```http
POST /api/v1/animation
Content-Type: application/json

# 切换动画（自动切到表情模式）
{ "command": "switch", "emotion": "lively" }
→ { "code": 200, "data": { "emotion": "lively", "animation_path": "lively.webm" }, "msg": "success" }

# 暂停动画
{ "command": "pause" }
→ { "code": 200, "data": { "is_playing": false }, "msg": "success" }

# 恢复动画
{ "command": "resume" }
→ { "code": 200, "data": { "is_playing": true }, "msg": "success" }

# 退出（关闭应用）
{ "command": "quit" }
→ { "code": 200, "data": null, "msg": "success" }
```

#### 模式切换

```http
POST /api/v1/mode
{ "mode": "emotion" | "camera" | "report" }
→ { "code": 200, "data": { "current_mode": "emotion" }, "msg": "success" }
```

#### 拍照

```http
POST /api/v1/camera/capture
→ { "code": 200, "data": { "path": "~/.oracube-ui/photos/capture_20260520_143022.jpg", "timestamp": "2026-05-20T14:30:22+08:00" }, "msg": "success" }

GET /api/v1/camera/latest-photo
→ { "code": 200, "data": { "path": "~/.oracube-ui/photos/capture_20260520_143022.jpg", "timestamp": "2026-05-20T14:30:22+08:00" }, "msg": "success" }
```

#### 状态查询

```http
GET /api/v1/status
→ {
  "code": 200,
  "data": {
    "current_mode": "emotion",
    "emotion": "lively",
    "is_playing": true,
    "camera_available": true,
    "recent_photo": "~/.oracube-ui/photos/capture_20260520_143022.jpg"
  },
  "msg": "success"
}
```

### 情绪映射

与 Oracube-Core `animations.json` 保持一致的 15 种情绪：

```
lively, speaking, laughing, sad, angry, confused, shy, funny,
loving, sleepy, shocked, thinking, confident, meditation, warmup
```

## 快捷键

| 快捷键 | 功能 |
|--------|------|
| `1` | 切换到表情模式 |
| `2` | 切换到摄像头模式 |
| `3` | 切换到报告模式 |
| `Esc` | 退出应用 |
| `Space` | 摄像头模式下拍照 |

## 项目文件结构

```
oracube-ui/
├── package.json
├── tsconfig.json
├── electron-builder.yml          # AppImage (Linux) + dmg (macOS) 打包配置
├── electron.vite.config.ts
├── src/
│   ├── main/
│   │   ├── index.ts              # 窗口创建 (720x720, frameless)
│   │   ├── api-server.ts         # Express 服务 :8765
│   │   ├── api-routes.ts         # 路由处理器
│   │   └── ipc-handlers.ts       # IPC 通信封装
│   ├── preload/
│   │   └── index.ts              # contextBridge 暴露 API
│   └── renderer/
│       ├── index.html
│       ├── app.tsx               # 模式路由 + 快捷键监听 + 纯黑背景
│       ├── styles/
│       │   └── global.css        # 纯黑主题全局样式
│       └── components/
│           ├── emotion-mode.tsx       # 模式1
│           │   └── animation-player.tsx
│           ├── camera-mode.tsx        # 模式2
│           │   ├── camera-preview.tsx
│           │   └── photo-thumbnail.tsx
│           └── report-mode.tsx        # 模式3
│               └── face-report.tsx
├── data/
│   └── animations/               # .webm 动画文件
│       ├── lively.webm
│       ├── speaking.webm
│       └── ...
└── (运行时创建于 ~/.oracube-ui/photos/)  # 拍照保存目录（固定，XDG 风格用户目录）
```

## 三个模式详细设计

### 模式1：表情动画

**组件：** `emotion-mode.tsx` + `animation-player.tsx`

- `<video>` 标签自动播放，loop，muted，无控制条
- object-fit: cover 填充 720×720
- 切换情绪时替换 `<source>` 或 `<video src>`
- 动画文件预加载（切换到表情模式时预加载当前指定情绪）

**状态覆盖：**
- `idle` → 纯黑背景，显示"待机中"
- `loading` → 纯黑背景，显示加载中
- `playing` → 全屏播放动画
- `error` → 显示"动画加载失败" + 情绪名称

### 模式2：摄像头

**组件：** `camera-mode.tsx` + `camera-preview.tsx` + `photo-thumbnail.tsx`

- `mount` → `enumerateDevices()` 取第一个 `videoinput` → `getUserMedia({ video: { deviceId } })`
- `<video srcObject={stream}>` 实时画面
- 拍照：`canvas.drawImage(video)` → `canvas.toBlob('image/jpeg')` → IPC 写文件
- 保存路径：`~/.oracube-ui/photos/capture_YYYYMMDD_HHmmss.jpg`
- 缩略图：右下角 160×160，新照片覆盖旧照片

**Pipecat 远端拍照流程：**
```
POST /api/v1/camera/capture
  → 记录当前 mode
  → 切换到 camera mode
  → 拍照 → 保存 → 显示缩略图
  → 等待 2 秒
  → 切回原 mode
```

**状态覆盖：**
- `loading` → "正在启动摄像头..."
- `camera-not-found` → "未检测到摄像头"
- `permission-denied` → "摄像头权限被拒绝"
- `active` → 实时画面 + 拍照按钮
- `no-photo-yet` → 无缩略图

### 模式3：面相分析报告

**组件：** `report-mode.tsx` + `face-report.tsx`

单屏 HTML 报告，纯黑背景深色卡片 + 金色文字：

- 顶部：标题 + 分析时间
- 中部：用户照片缩略图 + 五官分析（额头、眉毛、眼睛、鼻梁、嘴唇）
- 底部：整体气质描述 + 幸运色建议
- 支持垂直滚动（单屏优先）
- 数据目前由内部 mock 生成，预留对接正式分析引擎的接口

**状态覆盖：**
- `loading` → "生成报告中..."
- `ready` → 报告内容显示
- `error` → "报告生成失败"

## 动画文件管理

从 Oracube-Core 的 `data/Oracube_Animations/` 和 `oracube_emotions/` 中将 `.mov`/`.gif` 转换为 `.webm`：

```bash
ffmpeg -i lively.mov -c:v libvpx-vp9 -b:v 1M lively.webm
```

转换后的文件放置在 `data/animations/` 目录。在代码中维护情绪映射配置 JSON。

## 打包配置

```yaml
# electron-builder.yml
appId: com.oracube.ui
productName: Oracube-UI
linux:
  target:
    - AppImage
  category: Utility
  icon: build/icon.png
mac:
  target:
    - dmg
    - zip
  category: public.app-category.utilities
  icon: build/icon.icns
```

- **Linux**: 输出 `.AppImage` 文件，`chmod +x` 即可运行
- **macOS**: 输出 `.dmg`（安装包）和 `.zip`（直接解压可运行）

## 错误处理与边界

| 场景 | 处理 |
|------|------|
| Oracube-Core 未运行 | API 服务正常监听，但不影响 UI 本机操作 |
| 摄像头不可用 | 模式2 显示 "未检测到摄像头" 提示，不影响其他模式 |
| 动画文件缺失 | 显示情绪名称作为 fallback |
| 报告生成失败 | 显示错误状态，可重试 |
| HTTP 请求无效参数 | 返回 400 + 错误描述 |
| API 服务端口被占用 | 启动时检测端口，输出错误日志 |

## 质量标准

- TypeScript 类型注解完整
- 函数包含参数和返回值类型
- React 组件使用 PascalCase 命名
- 文件使用 kebab-case 命名
- 日志统一使用 `electron-log`（替代 console.log）
- 异常捕获指定具体类型，不使用裸 catch
