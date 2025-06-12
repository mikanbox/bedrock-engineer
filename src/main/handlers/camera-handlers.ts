import { IpcMainInvokeEvent } from 'electron'
import * as path from 'path'
import * as fs from 'fs'
import * as os from 'os'
import { promisify } from 'util'
import { log } from '../../common/logger'

const writeFile = promisify(fs.writeFile)
const stat = promisify(fs.stat)

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

export const cameraHandlers = {
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
