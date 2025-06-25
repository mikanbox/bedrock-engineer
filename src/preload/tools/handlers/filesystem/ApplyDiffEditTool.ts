/**
 * ApplyDiffEdit tool implementation
 */

import * as fs from 'fs/promises'
import { Tool } from '@aws-sdk/client-bedrock-runtime'
import { BaseTool } from '../../base/BaseTool'
import { ValidationResult } from '../../base/types'
import { ExecutionError } from '../../base/errors'
import { ToolResult } from '../../../../types/tools'

/**
 * Input type for ApplyDiffEditTool
 */
interface ApplyDiffEditInput {
  type: 'applyDiffEdit'
  path: string
  originalText: string
  updatedText: string
}

/**
 * Result type for ApplyDiffEditTool
 */
interface ApplyDiffEditResult extends ToolResult {
  name: 'applyDiffEdit'
  result: {
    path: string
    originalText: string
    updatedText: string
  } | null
}

/**
 * Tool for applying diff edits to files
 */
export class ApplyDiffEditTool extends BaseTool<ApplyDiffEditInput, ApplyDiffEditResult> {
  static readonly toolName = 'applyDiffEdit'
  static readonly toolDescription = `Apply a diff edit to a file. This tool replaces the specified original text with updated text at the exact location in the file. Use this when you need to make precise modifications to existing file content. The tool ensures that only the specified text is replaced, keeping the rest of the file intact.

Example:
{
   path: '/path/to/file.ts',
   originalText: 'function oldName() {\n  // old implementation\n}',
   updatedText: 'function newName() {\n  // new implementation\n}'
}
        `

  readonly name = ApplyDiffEditTool.toolName
  readonly description = ApplyDiffEditTool.toolDescription

  /**
   * AWS Bedrock tool specification
   */
  static readonly toolSpec: Tool['toolSpec'] = {
    name: ApplyDiffEditTool.toolName,
    description: ApplyDiffEditTool.toolDescription,
    inputSchema: {
      json: {
        type: 'object',
        properties: {
          path: {
            type: 'string',
            description:
              'The absolute path of the file to modify. Make sure to provide the complete path starting from the root directory.'
          },
          originalText: {
            type: 'string',
            description:
              'The exact original text to be replaced. Must match the text in the file exactly, including whitespace and line breaks. If the text is not found, the operation will fail.'
          },
          updatedText: {
            type: 'string',
            description:
              'The new text that will replace the original text. Can be of different length than the original text. Whitespace and line breaks in this text will be preserved exactly as provided.'
          }
        },
        required: ['path', 'originalText', 'updatedText']
      }
    }
  } as const

  /**
   * System prompt description
   */
  static readonly systemPromptDescription =
    'Make precise edits to existing files.\nRequires exact text matching including whitespace.'

  /**
   * Validate input
   */
  protected validateInput(input: ApplyDiffEditInput): ValidationResult {
    const errors: string[] = []

    if (!input.path) {
      errors.push('Path is required')
    }

    if (typeof input.path !== 'string') {
      errors.push('Path must be a string')
    }

    if (input.originalText === undefined || input.originalText === null) {
      errors.push('Original text is required')
    }

    if (typeof input.originalText !== 'string') {
      errors.push('Original text must be a string')
    }

    if (input.updatedText === undefined || input.updatedText === null) {
      errors.push('Updated text is required')
    }

    if (typeof input.updatedText !== 'string') {
      errors.push('Updated text must be a string')
    }

    return {
      isValid: errors.length === 0,
      errors
    }
  }

  /**
   * Execute the tool
   */
  protected async executeInternal(input: ApplyDiffEditInput): Promise<ApplyDiffEditResult> {
    const { path, originalText, updatedText } = input

    this.logger.debug(`Applying diff edit to file: ${path}`, {
      originalTextLength: originalText.length,
      updatedTextLength: updatedText.length
    })

    try {
      // Read the file content
      const fileContent = await fs.readFile(path, 'utf-8')

      // Check if the original text exists in the file
      if (!fileContent.includes(originalText)) {
        this.logger.warn(`Original text not found in file: ${path}`)

        return {
          name: 'applyDiffEdit',
          success: false,
          error: 'Original text not found in file',
          result: null
        }
      }

      // Replace the text
      const newContent = fileContent.replace(originalText, updatedText)

      // Write the updated content back to the file
      await fs.writeFile(path, newContent, 'utf-8')

      this.logger.info(`Successfully applied diff edit to file: ${path}`, {
        originalTextLength: originalText.length,
        updatedTextLength: updatedText.length
      })

      return {
        name: 'applyDiffEdit',
        success: true,
        message: 'Successfully applied diff edit',
        result: {
          path,
          originalText,
          updatedText
        }
      }
    } catch (error) {
      this.logger.error(`Error applying diff edit to file: ${path}`, {
        error: error instanceof Error ? error.message : String(error)
      })

      throw new ExecutionError(
        `Error applying diff edit: ${error instanceof Error ? error.message : String(error)}`,
        this.name,
        error instanceof Error ? error : undefined,
        { path }
      )
    }
  }

  /**
   * Override to return error as JSON string for compatibility
   */
  protected handleError(error: unknown): Error {
    const toolError = super.handleError(error) as Error

    // For this tool, we need to return a JSON string error
    return new Error(
      JSON.stringify({
        name: 'applyDiffEdit',
        success: false,
        error: toolError.message,
        result: null
      })
    )
  }

  /**
   * Override to sanitize text content for logging
   */
  protected sanitizeInputForLogging(input: ApplyDiffEditInput): any {
    return {
      ...input,
      originalText: this.truncateForLogging(input.originalText, 100),
      updatedText: this.truncateForLogging(input.updatedText, 100)
    }
  }
}
