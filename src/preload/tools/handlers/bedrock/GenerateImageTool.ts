/**
 * GenerateImage tool implementation
 */

import { promises as fs } from 'fs'
import * as path from 'path'
import { ipc } from '../../../ipc-client'
import { BaseTool } from '../../base/BaseTool'
import { ValidationResult } from '../../base/types'
import { ExecutionError } from '../../base/errors'
import { ToolResult } from '../../../../types/tools'

// Default model for image generation
const DEFAULT_IMAGE_MODEL = 'stability.sd3-5-large-v1:0'

/**
 * Input type for GenerateImageTool
 */
interface GenerateImageInput {
  type: 'generateImage'
  prompt: string
  outputPath: string
  modelId?: string // Made optional to support default model
  negativePrompt?: string
  aspect_ratio?: string
  seed?: number
  output_format?: 'png' | 'jpeg' | 'webp'
}

/**
 * Result type for GenerateImageTool - matches legacy implementation
 */
interface GenerateImageResult extends ToolResult {
  name: 'generateImage'
  result: {
    imagePath: string
    modelUsed: string
    seed?: number
    prompt: string
    negativePrompt?: string
    aspect_ratio: string
  }
}

/**
 * Tool for generating images using AWS Bedrock
 */
export class GenerateImageTool extends BaseTool<GenerateImageInput, GenerateImageResult> {
  readonly name = 'generateImage'
  readonly description = 'Generate images using AWS Bedrock image generation models'

  /**
   * Validate input
   */
  protected validateInput(input: GenerateImageInput): ValidationResult {
    const errors: string[] = []

    if (!input.prompt) {
      errors.push('Prompt is required')
    }

    if (typeof input.prompt !== 'string') {
      errors.push('Prompt must be a string')
    }

    if (input.prompt && input.prompt.trim().length === 0) {
      errors.push('Prompt cannot be empty')
    }

    if (!input.outputPath) {
      errors.push('Output path is required')
    }

    if (typeof input.outputPath !== 'string') {
      errors.push('Output path must be a string')
    }

    // modelId is now optional - will use default if not provided
    if (input.modelId !== undefined && typeof input.modelId !== 'string') {
      errors.push('Model ID must be a string')
    }

    if (input.negativePrompt !== undefined && typeof input.negativePrompt !== 'string') {
      errors.push('Negative prompt must be a string')
    }

    if (input.aspect_ratio !== undefined && typeof input.aspect_ratio !== 'string') {
      errors.push('Aspect ratio must be a string')
    }

    if (input.seed !== undefined) {
      if (typeof input.seed !== 'number') {
        errors.push('Seed must be a number')
      }
    }

    if (input.output_format !== undefined) {
      const validFormats = ['png', 'jpeg', 'webp']
      if (!validFormats.includes(input.output_format)) {
        errors.push('Output format must be one of: png, jpeg, webp')
      }
    }

    return {
      isValid: errors.length === 0,
      errors
    }
  }

  /**
   * Execute the tool
   */
  protected async executeInternal(input: GenerateImageInput): Promise<GenerateImageResult> {
    const { prompt, outputPath, negativePrompt, aspect_ratio, seed, output_format = 'png' } = input

    // Determine model ID with priority: input > configured > default
    let modelId: string = input.modelId || ''
    if (!modelId) {
      // Get configured model from store
      const generateImageConfig = this.storeManager.get<{ modelId?: string }>('generateImageTool')
      modelId = generateImageConfig?.modelId || DEFAULT_IMAGE_MODEL
    }

    this.logger.debug('Generating image with Bedrock', {
      promptLength: prompt.length,
      modelId,
      outputPath,
      aspect_ratio,
      usingDefaultModel: !input.modelId,
      configuredModel: this.storeManager.get<{ modelId?: string }>('generateImageTool')?.modelId
    })

    try {
      this.logger.info('Calling Bedrock image generation API', {
        modelId,
        aspect_ratio,
        output_format,
        usingDefaultModel: !input.modelId
      })

      // Call the main process API using type-safe IPC function
      const response = await ipc('bedrock:generateImage', {
        prompt,
        modelId,
        negativePrompt,
        aspect_ratio,
        seed,
        output_format
      })

      if (!response.images || response.images.length === 0) {
        throw new Error('No image was generated')
      }

      this.logger.debug('Image generated successfully, saving to disk', {
        outputPath,
        imageDataLength: response.images[0].length
      })

      // Save the image to file (following legacy implementation)
      const imageData = response.images[0]
      const binaryData = Buffer.from(imageData, 'base64')

      // Ensure directory exists
      const dir = path.dirname(outputPath)
      await fs.mkdir(dir, { recursive: true })

      // Write the file
      await fs.writeFile(outputPath, new Uint8Array(binaryData))

      // Verify file was written successfully
      try {
        await fs.access(outputPath)
        const stats = await fs.stat(outputPath)
        if (stats.size === 0) {
          throw new Error('Generated image file is empty')
        }
      } catch (verifyError) {
        throw new Error(
          `Failed to verify saved image: ${verifyError instanceof Error ? verifyError.message : String(verifyError)}`
        )
      }

      this.logger.info('Image saved successfully', {
        outputPath,
        modelId,
        seed: response.seeds?.[0],
        aspect_ratio: aspect_ratio ?? '1:1'
      })

      return {
        success: true,
        name: 'generateImage',
        message: `Image generated successfully and saved to ${outputPath}`,
        result: {
          imagePath: outputPath,
          prompt,
          negativePrompt,
          aspect_ratio: aspect_ratio ?? '1:1',
          modelUsed: modelId,
          seed: response.seeds?.[0]
        }
      }
    } catch (error) {
      this.logger.error('Error generating image', {
        error: error instanceof Error ? error.message : String(error),
        prompt: this.truncateForLogging(prompt, 100),
        modelId
      })

      throw new ExecutionError(
        `Error generating image: ${error instanceof Error ? error.message : String(error)}`,
        this.name,
        error instanceof Error ? error : undefined,
        {
          prompt: this.truncateForLogging(prompt, 100),
          modelId,
          outputPath
        }
      )
    }
  }

  /**
   * Override to return error as string for compatibility
   */
  protected shouldReturnErrorAsString(): boolean {
    return true
  }

  /**
   * Override to sanitize prompt for logging
   */
  protected sanitizeInputForLogging(input: GenerateImageInput): any {
    const configuredModel = this.storeManager.get<{ modelId?: string }>(
      'generateImageTool'
    )?.modelId
    const effectiveModelId = input.modelId || configuredModel || DEFAULT_IMAGE_MODEL

    return {
      ...input,
      prompt: this.truncateForLogging(input.prompt, 200),
      negativePrompt: input.negativePrompt
        ? this.truncateForLogging(input.negativePrompt, 100)
        : undefined,
      modelId: effectiveModelId
    }
  }
}
