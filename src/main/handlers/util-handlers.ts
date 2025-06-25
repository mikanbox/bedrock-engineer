import { IpcMainInvokeEvent, app } from 'electron'
import { spawn } from 'child_process'
import { log } from '../../common/logger'
import { join } from 'path'
import fs from 'fs'
import { is } from '@electron-toolkit/utils'

export const utilHandlers = {
  'get-app-path': async (_event: IpcMainInvokeEvent) => {
    return app.getAppPath()
  },

  'fetch-website': async (_event: IpcMainInvokeEvent, url: string, options?: any) => {
    try {
      const response = await fetch(url, {
        ...options,
        headers: {
          ...options?.headers,
          'User-Agent':
            'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
        }
      })

      const contentType = response.headers.get('content-type')

      if (contentType?.includes('application/json')) {
        const json = await response.json()
        return {
          status: response.status,
          headers: Object.fromEntries(response.headers),
          data: json
        }
      } else {
        const text = await response.text()
        return {
          status: response.status,
          headers: Object.fromEntries(response.headers),
          data: text
        }
      }
    } catch (error) {
      log.error('Error fetching website', {
        url,
        error: error instanceof Error ? error.message : String(error)
      })
      throw error
    }
  },

  'check-docker-availability': async (_event: IpcMainInvokeEvent) => {
    return new Promise((resolve) => {
      const dockerProcess = spawn('docker', ['--version'], { stdio: 'pipe' })

      let output = ''
      let errorOutput = ''

      dockerProcess.stdout?.on('data', (data) => {
        output += data.toString()
      })

      dockerProcess.stderr?.on('data', (data) => {
        errorOutput += data.toString()
      })

      dockerProcess.on('close', (code) => {
        if (code === 0 && output.includes('Docker version')) {
          // Extract version information
          const versionMatch = output.match(/Docker version (\d+\.\d+\.\d+)/)
          const version = versionMatch ? versionMatch[1] : 'Unknown'

          resolve({
            available: true,
            version,
            lastChecked: new Date()
          })
        } else {
          resolve({
            available: false,
            error: errorOutput || 'Docker not found or not running',
            lastChecked: new Date()
          })
        }
      })

      dockerProcess.on('error', (error) => {
        resolve({
          available: false,
          error: error.message,
          lastChecked: new Date()
        })
      })

      // Timeout after 5 seconds
      setTimeout(() => {
        dockerProcess.kill()
        resolve({
          available: false,
          error: 'Docker check timed out',
          lastChecked: new Date()
        })
      }, 5000)
    })
  },

  'get-icon': async (_event: IpcMainInvokeEvent, iconType: 'aws' | 'resource', name: string) => {
    let fileNamePatterns: string[] = []
    
    fileNamePatterns = [
      `Aws_48_Light/Arch_AWS-${name}_48.svg`,
      `Aws_48_Light/Arch_Amazon-${name}_48.svg`,
      `Aws_48_Light/Arch_${name}_48.svg`,
      `Res_48_Light/Res_${name}_48_Light.svg`,
      `Res_48_Light/Res_AWS-${name}_48_Light.svg`,
      `Res_48_Light/Res_Amazon-${name}_48_Light.svg`
    ]
    
    let basePath: string;
    if (is.dev) {
      basePath = app.getAppPath();
    } else {
      // プロダクション環境ではリソースディレクトリから取得
      // extraResourcesで指定したリソースはprocess.resourcesPathからアクセス可能
      basePath = process.resourcesPath;
    }

    for (const fileName of fileNamePatterns) {
      const iconPath = join(basePath, `icons/`, fileName)
      log.info(`Loading`, { name, path: iconPath, pattern: fileName })

      try {  
        const imageBuffer = await fs.promises.readFile(iconPath, { encoding: null })
        return `data:image/svg+xml;base64,${imageBuffer.toString('base64')}`
      } catch (error) {
        // 最後のパターンでも失敗した場合のみエラーログを出力
        if (fileName === fileNamePatterns[fileNamePatterns.length - 1]) {
          log.error(`Failed to get ${iconType} icon after trying all patterns`, { 
            name,
            triedPatterns: fileNamePatterns,
            error: error instanceof Error ? error.message : String(error)
          })
        } 
      }
    }
    
    return null
  }
} as const
