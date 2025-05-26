/**
 * ReadFiles tool implementation with line range support
 */

import * as fs from 'fs/promises'
import { BaseTool } from '../../base/BaseTool'
import { ValidationResult, ReadFileOptions } from '../../base/types'
import { ExecutionError } from '../../base/errors'
import {
  filterByLineRange,
  getLineRangeInfo,
  validateLineRange
} from '../../../lib/line-range-utils'

/**
 * Input type for ReadFilesTool
 */
interface ReadFilesInput {
  type: 'readFiles'
  paths: string[]
  options?: ReadFileOptions
}

/**
 * Tool for reading file contents with line range support
 */
export class ReadFilesTool extends BaseTool<ReadFilesInput, string> {
  readonly name = 'readFiles'
  readonly description = 'Read contents of specified files with line range filtering'

  /**
   * Validate input
   */
  protected validateInput(input: ReadFilesInput): ValidationResult {
    const errors: string[] = []

    // Basic validation
    if (!input.paths) {
      errors.push('Paths array is required')
    }

    if (!Array.isArray(input.paths)) {
      errors.push('Paths must be an array')
    } else if (input.paths.length === 0) {
      errors.push('At least one path is required')
    } else {
      input.paths.forEach((path, index) => {
        if (typeof path !== 'string') {
          errors.push(`Path at index ${index} must be a string`)
        }
      })
    }

    // Line range validation
    if (input.options?.lines) {
      const lineRangeErrors = validateLineRange(input.options.lines)
      errors.push(...lineRangeErrors)
    }

    return {
      isValid: errors.length === 0,
      errors
    }
  }

  /**
   * Execute the tool
   */
  protected async executeInternal(input: ReadFilesInput): Promise<string> {
    const { paths, options } = input

    this.logger.debug(`Reading files`, {
      fileCount: paths.length,
      hasLineRange: !!options?.lines
    })

    // Single file handling
    if (paths.length === 1) {
      return this.readSingleFile(paths[0], options)
    }

    // Multiple files handling
    return this.readMultipleFiles(paths, options)
  }

  /**
   * Read a single file with optional line range filtering
   */
  private async readSingleFile(filePath: string, options?: ReadFileOptions): Promise<string> {
    this.logger.debug(`Reading single file: ${filePath}`)

    try {
      const content = await fs.readFile(filePath, options?.encoding || 'utf-8')

      this.logger.debug(`File read successfully: ${filePath}`, {
        contentLength: content.length
      })

      return this.formatFileContent(filePath, content, options)
    } catch (error) {
      this.logger.error(`Error reading file: ${filePath}`, {
        error: error instanceof Error ? error.message : String(error)
      })

      throw new ExecutionError(
        `Error reading file ${filePath}: ${error instanceof Error ? error.message : String(error)}`,
        this.name,
        error instanceof Error ? error : undefined
      )
    }
  }

  /**
   * Read multiple files
   */
  private async readMultipleFiles(paths: string[], options?: ReadFileOptions): Promise<string> {
    this.logger.debug(`Reading multiple files: ${paths.length} files`)

    const fileContents: string[] = []

    // Read each file
    for (const filePath of paths) {
      try {
        this.logger.verbose(`Reading file: ${filePath}`)
        const content = await fs.readFile(filePath, options?.encoding || 'utf-8')
        const formattedContent = this.formatFileContent(filePath, content, options)
        fileContents.push(formattedContent)

        this.logger.verbose(`File read successfully: ${filePath}`, {
          contentLength: content.length
        })
      } catch (error) {
        this.logger.error(`Error reading file: ${filePath}`, {
          error: error instanceof Error ? error.message : String(error)
        })
        fileContents.push(
          `## Error reading file: ${filePath}\nError: ${
            error instanceof Error ? error.message : String(error)
          }`
        )
      }
    }

    // Combine content
    const combinedContent = fileContents.join('\n\n')
    this.logger.info(`Read ${paths.length} files successfully`)

    return combinedContent
  }

  /**
   * Format file content with header and line range filtering
   */
  private formatFileContent(filePath: string, content: string, options?: ReadFileOptions): string {
    // Apply line range filtering
    const filteredContent = filterByLineRange(content, options?.lines)

    // Generate line range info for header
    const lines = content.split('\n')
    const lineInfo = getLineRangeInfo(lines.length, options?.lines)
    const header = `File: ${filePath}${lineInfo}\n${'='.repeat(filePath.length + lineInfo.length + 6)}\n`

    return header + filteredContent
  }

  /**
   * Override to return error as string for compatibility
   */
  protected shouldReturnErrorAsString(): boolean {
    return true
  }
}
