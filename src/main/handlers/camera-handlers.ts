import { IpcMainInvokeEvent, BrowserWindow, screen } from 'electron'
import * as path from 'path'
import * as fs from 'fs'
import * as os from 'os'
import { promisify } from 'util'
import { log } from '../../common/logger'

const writeFile = promisify(fs.writeFile)
const stat = promisify(fs.stat)

// カメラプレビューウィンドウの管理（複数ウィンドウ対応）
const cameraPreviewWindows: Map<string, BrowserWindow> = new Map()

interface CameraPreviewOptions {
  size?: 'small' | 'medium' | 'large'
  opacity?: number
  position?: 'bottom-right' | 'bottom-left' | 'top-right' | 'top-left'
  deviceId?: string
  deviceName?: string
  cameraIds?: string[] // 複数カメラ対応
  layout?: 'cascade' | 'grid' | 'single'
}

const PREVIEW_SIZES = {
  small: { width: 200, height: 150 },
  medium: { width: 320, height: 240 },
  large: { width: 480, height: 360 }
}

interface CameraCaptureResult {
  success: boolean
  filePath: string
  metadata: {
    width: number
    height: number
    format: string
    fileSize: number
    timestamp: string
    deviceId: string
    deviceName: string
  }
}

interface CameraCaptureRequest {
  base64Data: string // "data:image/jpeg;base64,..." format
  deviceId: string
  deviceName: string
  width: number
  height: number
  format: string
  outputPath?: string
}

/**
 * カメラプレビューウィンドウの位置を計算
 */
function calculatePreviewPosition(
  size: { width: number; height: number },
  position: string = 'bottom-right',
  index: number = 0
): { x: number; y: number } {
  const primaryDisplay = screen.getPrimaryDisplay()
  const { width: screenWidth, height: screenHeight } = primaryDisplay.workAreaSize
  const margin = 20
  const offset = index * 30 // カスケード配置用のオフセット

  switch (position) {
    case 'bottom-right':
      return {
        x: screenWidth - size.width - margin - offset,
        y: screenHeight - size.height - margin - offset
      }
    case 'bottom-left':
      return {
        x: margin + offset,
        y: screenHeight - size.height - margin - offset
      }
    case 'top-right':
      return {
        x: screenWidth - size.width - margin - offset,
        y: margin + offset
      }
    case 'top-left':
      return {
        x: margin + offset,
        y: margin + offset
      }
    default:
      return {
        x: screenWidth - size.width - margin - offset,
        y: screenHeight - size.height - margin - offset
      }
  }
}

/**
 * 複数カメラプレビューウィンドウの位置を計算（グリッド配置）
 */
function calculateGridPositions(
  size: { width: number; height: number },
  count: number,
  startPosition: string = 'bottom-right'
): { x: number; y: number }[] {
  const primaryDisplay = screen.getPrimaryDisplay()
  const { width: screenWidth, height: screenHeight } = primaryDisplay.workAreaSize
  const margin = 20
  const gap = 10

  const positions: { x: number; y: number }[] = []
  const cols = Math.ceil(Math.sqrt(count))
  const rows = Math.ceil(count / cols)

  for (let i = 0; i < count; i++) {
    const col = i % cols
    const row = Math.floor(i / cols)

    let baseX: number, baseY: number

    if (startPosition.includes('right')) {
      baseX = screenWidth - (cols * (size.width + gap) + margin - gap)
    } else {
      baseX = margin
    }

    if (startPosition.includes('bottom')) {
      baseY = screenHeight - (rows * (size.height + gap) + margin - gap)
    } else {
      baseY = margin
    }

    positions.push({
      x: baseX + col * (size.width + gap),
      y: baseY + row * (size.height + gap)
    })
  }

  return positions
}

/**
 * 個別のカメラプレビューウィンドウを作成
 */
async function createPreviewWindow(
  deviceId: string,
  deviceName: string,
  size: { width: number; height: number },
  position: { x: number; y: number },
  opacity: number
): Promise<BrowserWindow> {
  const previewWindow = new BrowserWindow({
    width: size.width,
    height: size.height,
    x: position.x,
    y: position.y,
    frame: false,
    alwaysOnTop: true,
    resizable: false,
    minimizable: false,
    maximizable: false,
    skipTaskbar: true,
    opacity: opacity,
    transparent: true,
    title: deviceName,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, '../preload/index.js'),
      webSecurity: true,
      additionalArguments: [`--camera-device-id=${deviceId}`, `--camera-device-name=${deviceName}`]
    }
  })

  // プレビュー用HTMLをロード
  const isDev = process.env.NODE_ENV === 'development'
  if (isDev && process.env.ELECTRON_RENDERER_URL) {
    await previewWindow.loadURL(
      `${process.env.ELECTRON_RENDERER_URL}/camera-preview.html?deviceId=${encodeURIComponent(deviceId)}&deviceName=${encodeURIComponent(deviceName)}`
    )
  } else {
    await previewWindow.loadFile(path.join(__dirname, '../renderer/camera-preview.html'))
  }

  // ウィンドウが閉じられたときの処理
  previewWindow.on('closed', () => {
    cameraPreviewWindows.delete(deviceId)
    log.info('Camera preview window closed', { deviceId, deviceName })
  })

  return previewWindow
}

export const cameraHandlers = {
  /**
   * 複数カメラプレビューウィンドウを表示
   */
  'camera:show-preview-window': async (
    _event: IpcMainInvokeEvent,
    options: CameraPreviewOptions = {}
  ): Promise<{ success: boolean; message?: string }> => {
    try {
      log.info('Showing camera preview windows', options)

      const size = PREVIEW_SIZES[options.size || 'medium']
      const opacity = options.opacity || 0.9
      const cameraIds = options.cameraIds || ['default']
      const layout = options.layout || (cameraIds.length > 1 ? 'cascade' : 'single')

      // 既存のプレビューウィンドウをクリア
      for (const [, window] of cameraPreviewWindows.entries()) {
        if (window && !window.isDestroyed()) {
          window.close()
        }
      }
      cameraPreviewWindows.clear()

      let positions: { x: number; y: number }[] = []

      if (layout === 'grid' && cameraIds.length > 1) {
        // グリッド配置
        positions = calculateGridPositions(size, cameraIds.length, options.position)
      } else {
        // カスケード配置または単一ウィンドウ
        positions = cameraIds.map((_, index) =>
          calculatePreviewPosition(size, options.position, index)
        )
      }

      // 各カメラのプレビューウィンドウを作成
      for (let i = 0; i < cameraIds.length; i++) {
        const deviceId = cameraIds[i]
        const deviceName = `Camera ${i + 1}`
        const position = positions[i]

        try {
          const previewWindow = await createPreviewWindow(
            deviceId,
            deviceName,
            size,
            position,
            opacity
          )

          cameraPreviewWindows.set(deviceId, previewWindow)
          previewWindow.show()

          log.info('Camera preview window created', {
            deviceId,
            deviceName,
            position,
            size: options.size || 'medium'
          })
        } catch (windowError) {
          log.error('Failed to create preview window for camera', {
            deviceId,
            error: windowError instanceof Error ? windowError.message : String(windowError)
          })
        }
      }

      log.info('Camera preview windows shown successfully', {
        count: cameraPreviewWindows.size,
        layout,
        size: options.size || 'medium',
        opacity
      })

      return {
        success: true,
        message: `${cameraPreviewWindows.size} preview window(s) created`
      }
    } catch (error) {
      log.error('Failed to show camera preview windows', {
        error: error instanceof Error ? error.message : String(error)
      })
      return { success: false, message: error instanceof Error ? error.message : String(error) }
    }
  },

  /**
   * カメラプレビューウィンドウを非表示
   */
  'camera:hide-preview-window': async (
    _event: IpcMainInvokeEvent
  ): Promise<{ success: boolean; message?: string }> => {
    try {
      log.info('Hiding camera preview windows')

      let closedCount = 0
      for (const [, window] of cameraPreviewWindows.entries()) {
        if (window && !window.isDestroyed()) {
          window.close()
          closedCount++
        }
      }
      cameraPreviewWindows.clear()

      log.info('Camera preview windows hidden successfully', { closedCount })
      return {
        success: true,
        message:
          closedCount > 0 ? `${closedCount} preview window(s) closed` : 'No preview windows active'
      }
    } catch (error) {
      log.error('Failed to hide camera preview windows', {
        error: error instanceof Error ? error.message : String(error)
      })
      return { success: false, message: error instanceof Error ? error.message : String(error) }
    }
  },

  /**
   * カメラプレビューウィンドウの設定を更新
   */
  'camera:update-preview-settings': async (
    _event: IpcMainInvokeEvent,
    options: CameraPreviewOptions
  ): Promise<{ success: boolean; message?: string }> => {
    try {
      log.info('Updating camera preview settings', options)

      if (cameraPreviewWindows.size === 0) {
        return { success: false, message: 'No active preview windows' }
      }

      let updatedCount = 0
      for (const [deviceId, window] of cameraPreviewWindows.entries()) {
        if (window && !window.isDestroyed()) {
          try {
            // サイズを更新
            if (options.size) {
              const size = PREVIEW_SIZES[options.size]
              window.setSize(size.width, size.height)
            }

            // 位置を更新（複数ウィンドウの場合はカスケード配置）
            if (options.position) {
              const currentSize = window.getSize()
              const position = calculatePreviewPosition(
                { width: currentSize[0], height: currentSize[1] },
                options.position,
                updatedCount
              )
              window.setPosition(position.x, position.y)
            }

            // 透明度を更新
            if (options.opacity !== undefined) {
              window.setOpacity(options.opacity)
            }

            updatedCount++
          } catch (windowError) {
            log.error('Failed to update settings for preview window', {
              deviceId,
              error: windowError instanceof Error ? windowError.message : String(windowError)
            })
          }
        }
      }

      log.info('Camera preview settings updated successfully', { updatedCount })
      return {
        success: true,
        message: `${updatedCount} preview window(s) updated`
      }
    } catch (error) {
      log.error('Failed to update camera preview settings', {
        error: error instanceof Error ? error.message : String(error)
      })
      return { success: false, message: error instanceof Error ? error.message : String(error) }
    }
  },

  /**
   * カメラプレビューウィンドウの状態を取得
   */
  'camera:get-preview-status': async (
    _event: IpcMainInvokeEvent
  ): Promise<{
    isActive: boolean
    count: number
    windows: Array<{
      deviceId: string
      size: 'small' | 'medium' | 'large'
      opacity: number
    }>
  }> => {
    try {
      const activeWindows: Array<{
        deviceId: string
        size: 'small' | 'medium' | 'large'
        opacity: number
      }> = []

      for (const [deviceId, window] of cameraPreviewWindows.entries()) {
        if (window && !window.isDestroyed()) {
          const bounds = window.getBounds()
          const opacity = window.getOpacity()

          // サイズから設定を逆算
          let size: 'small' | 'medium' | 'large' = 'medium'
          for (const [key, value] of Object.entries(PREVIEW_SIZES)) {
            if (value.width === bounds.width && value.height === bounds.height) {
              size = key as 'small' | 'medium' | 'large'
              break
            }
          }

          activeWindows.push({
            deviceId,
            size,
            opacity
          })
        }
      }

      return {
        isActive: activeWindows.length > 0,
        count: activeWindows.length,
        windows: activeWindows
      }
    } catch (error) {
      log.error('Failed to get camera preview status', {
        error: error instanceof Error ? error.message : String(error)
      })
      return {
        isActive: false,
        count: 0,
        windows: []
      }
    }
  },

  /**
   * Renderer側から送信された画像データを保存する
   * getUserMedia APIでキャプチャした画像をファイルとして保存
   */
  'camera:save-captured-image': async (
    _event: IpcMainInvokeEvent,
    request: CameraCaptureRequest
  ): Promise<CameraCaptureResult> => {
    try {
      log.info('Saving captured camera image', {
        deviceId: request.deviceId,
        deviceName: request.deviceName,
        width: request.width,
        height: request.height,
        format: request.format
      })

      // Base64データからBuffer作成
      const base64Data = request.base64Data.replace(/^data:image\/[a-z]+;base64,/, '')
      const imageBuffer = Buffer.from(base64Data, 'base64')

      // 出力パスの決定
      const timestamp = Date.now()
      const filename = `camera_capture_${timestamp}.${request.format}`
      const outputPath = request.outputPath || path.join(os.tmpdir(), filename)

      // ファイルに保存
      await writeFile(outputPath, new Uint8Array(imageBuffer))

      // ファイル情報の取得
      const stats = await stat(outputPath)

      log.info('Camera capture saved successfully', {
        path: path.basename(outputPath),
        width: request.width,
        height: request.height,
        format: request.format,
        fileSize: stats.size,
        deviceName: request.deviceName
      })

      return {
        success: true,
        filePath: outputPath,
        metadata: {
          width: request.width,
          height: request.height,
          format: request.format,
          fileSize: stats.size,
          timestamp: new Date().toISOString(),
          deviceId: request.deviceId,
          deviceName: request.deviceName
        }
      }
    } catch (error) {
      log.error('Failed to save captured camera image', {
        error: error instanceof Error ? error.message : String(error)
      })
      throw error
    }
  }
} as const
