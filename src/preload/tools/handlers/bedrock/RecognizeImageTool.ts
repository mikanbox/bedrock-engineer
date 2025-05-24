/**
 * RecognizeImage tool implementation
 */

import { ipcRenderer } from 'electron'
import * as fs from 'fs/promises'
import { BaseTool } from '../../base/BaseTool'
import { ValidationResult } from '../../base/types'
import { ToolResult } from '../../../../types/tools'

/**
 * Input type for RecognizeImageTool
 */
interface RecognizeImageInput {
  type: 'recognizeImage'
  imagePaths: string[] // 複数画像をサポート
  prompt?: string
}

/**
 * Result type for RecognizeImageTool - matches legacy implementation
 */
interface RecognizeImageResult extends ToolResult {
  name: 'recognizeImage'
  result: {
    images: Array<{
      path: string
      description: string
      success: boolean
    }>
    modelUsed: string
  }
}

/**
 * Tool for recognizing and analyzing images using AWS Bedrock
 */
export class RecognizeImageTool extends BaseTool<RecognizeImageInput, RecognizeImageResult> {
  readonly name = 'recognizeImage'
  readonly description = 'Analyze and describe images using AWS Bedrock vision models'

  /**
   * Validate input
   */
  protected validateInput(input: RecognizeImageInput): ValidationResult {
    const errors: string[] = []

    if (!input.imagePaths) {
      errors.push('Image paths are required')
    }

    if (!Array.isArray(input.imagePaths)) {
      errors.push('Image paths must be an array')
    }

    if (input.imagePaths && input.imagePaths.length === 0) {
      errors.push('At least one image path is required')
    }

    if (input.imagePaths && input.imagePaths.length > 5) {
      errors.push('Maximum 5 images are allowed')
    }

    if (input.imagePaths) {
      input.imagePaths.forEach((path, index) => {
        if (typeof path !== 'string') {
          errors.push(`Image path at index ${index} must be a string`)
        }
        if (path && path.trim().length === 0) {
          errors.push(`Image path at index ${index} cannot be empty`)
        }
      })
    }

    if (input.prompt !== undefined && typeof input.prompt !== 'string') {
      errors.push('Prompt must be a string')
    }

    return {
      isValid: errors.length === 0,
      errors
    }
  }

  /**
   * Execute the tool - following legacy implementation pattern
   */
  protected async executeInternal(input: RecognizeImageInput): Promise<RecognizeImageResult> {
    const { imagePaths, prompt } = input

    // Limit to maximum 5 images (following legacy implementation)
    const limitedPaths = imagePaths.slice(0, 5)

    this.logger.debug('Recognizing multiple images', {
      imageCount: limitedPaths.length,
      hasCustomPrompt: !!prompt
    })

    try {
      // Promise.all で並列処理 (following legacy implementation)
      const results = await Promise.all(
        limitedPaths.map(async (imagePath) => {
          try {
            // ファイル存在確認
            try {
              await fs.access(imagePath)
            } catch (error) {
              this.logger.error(`Image file not found: ${imagePath}`, { error })
              throw new Error(`Image file not found: ${imagePath}`)
            }

            // 個別の画像認識処理 - call main process for each image
            const description = await ipcRenderer.invoke('bedrock:recognizeImage', {
              imagePaths: [imagePath], // Single image per call
              prompt
            })

            this.logger.debug(`Successfully recognized image: ${this.sanitizePath(imagePath)}`, {
              path: imagePath,
              descriptionLength: description.text?.length || 0
            })

            return {
              path: imagePath,
              description: description.text || description,
              success: true
            }
          } catch (error) {
            this.logger.error(`Failed to recognize image: ${imagePath}`, {
              error: error instanceof Error ? error.message : String(error)
            })

            return {
              path: imagePath,
              description: `Error: ${error instanceof Error ? error.message : 'Failed to analyze this image'}`,
              success: false
            }
          }
        })
      )

      const successCount = results.filter((r) => r.success).length

      this.logger.info('Multiple image recognition completed', {
        total: limitedPaths.length,
        success: successCount,
        failed: limitedPaths.length - successCount
      })

      return {
        name: 'recognizeImage',
        success: successCount > 0, // 少なくとも1枚成功していればtrue
        message: `Analyzed ${successCount} of ${limitedPaths.length} images successfully`,
        result: {
          images: results,
          modelUsed: 'claude-3-sonnet' // Default model used
        }
      }
    } catch (error) {
      this.logger.error('Failed to recognize images', {
        error: error instanceof Error ? error.message : String(error),
        imageCount: limitedPaths.length
      })

      throw `Error recognizing images: ${JSON.stringify({
        success: false,
        name: 'recognizeImage',
        error: 'Failed to recognize images',
        message: error instanceof Error ? error.message : String(error)
      })}`
    }
  }

  /**
   * Sanitize file path for logging
   */
  private sanitizePath(path: string): string {
    // Extract just the filename for logging
    const parts = path.split(/[/\\]/)
    return parts[parts.length - 1] || path
  }

  /**
   * Override to return error as string for compatibility
   */
  protected shouldReturnErrorAsString(): boolean {
    return true
  }

  /**
   * Override to sanitize paths for logging
   */
  protected sanitizeInputForLogging(input: RecognizeImageInput): any {
    return {
      ...input,
      imagePaths: input.imagePaths.map((path) => this.sanitizePath(path)),
      prompt: input.prompt ? this.truncateForLogging(input.prompt, 100) : undefined
    }
  }
}
