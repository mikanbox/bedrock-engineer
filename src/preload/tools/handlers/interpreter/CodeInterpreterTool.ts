/**
 * Simplified CodeInterpreter tool implementation
 * Execute Python code in secure Docker environment - maximum simplicity!
 */

import * as path from 'path'
import { BaseTool } from '../../base/BaseTool'
import { ValidationResult } from '../../base/types'
import { ExecutionError } from '../../base/errors'
import {
  CodeInterpreterInput,
  CodeInterpreterResult,
  WorkspaceConfig,
  ExecutionConfig,
  PythonEnvironment
} from './types'
import { DockerExecutor } from './DockerExecutor'
import { FileManager } from './FileManager'
import { SecurityManager } from './SecurityManager'

/**
 * Simplified CodeInterpreter tool - just provide Python code and get results!
 */
export class CodeInterpreterTool extends BaseTool<CodeInterpreterInput, CodeInterpreterResult> {
  readonly name = 'codeInterpreter'
  readonly description =
    'Execute Python code in a secure Docker environment with no internet access'

  private dockerExecutor: DockerExecutor
  private fileManager: FileManager

  // Static property to store current workspace path for UI access
  private static currentWorkspacePath: string | null = null
  private securityManager: SecurityManager
  private workspaceConfig: WorkspaceConfig

  /**
   * Get execution configuration based on user settings and environment
   */
  private getExecutionConfig(environment?: string): ExecutionConfig {
    const pythonEnvironment = this.validateEnvironment(environment)

    // Get user configuration from store
    const userConfig = this.storeManager.get('codeInterpreterTool')

    // Use user configuration or fall back to defaults
    const config = {
      timeout: 30,
      memoryLimit: pythonEnvironment === 'datascience' ? '256m' : '128m',
      cpuLimit: 0.5,
      environment: pythonEnvironment
    }

    // Apply user configuration if available
    if (userConfig && typeof userConfig === 'object') {
      if ('timeout' in userConfig && typeof userConfig.timeout === 'number') {
        config.timeout = userConfig.timeout
      }
      if ('memoryLimit' in userConfig && typeof userConfig.memoryLimit === 'string') {
        config.memoryLimit = userConfig.memoryLimit
      }
      if ('cpuLimit' in userConfig && typeof userConfig.cpuLimit === 'number') {
        config.cpuLimit = userConfig.cpuLimit
      }
    }

    return config
  }

  /**
   * Validate and normalize environment parameter
   */
  private validateEnvironment(environment?: string): PythonEnvironment {
    if (!environment) return 'datascience' // Default to data science environment

    if (environment === 'basic' || environment === 'datascience') {
      return environment as PythonEnvironment
    }

    this.logger.warn('Invalid environment specified, using default', {
      requested: environment,
      fallback: 'datascience'
    })
    return 'datascience'
  }

  constructor(dependencies: any) {
    super(dependencies)

    // Initialize simplified workspace configuration
    this.workspaceConfig = {
      basePath: process.cwd(),
      sessionId: this.generateSessionId(),
      maxFiles: 20,
      maxFileSize: 1024 * 1024, // 1MB
      allowedExtensions: ['.py', '.txt', '.csv', '.json', '.md', '.png', '.jpg'],
      cleanupOnExit: true
    }

    // Initialize components
    this.securityManager = new SecurityManager(this.logger)
    this.fileManager = new FileManager(this.logger, this.securityManager, this.workspaceConfig)
    this.dockerExecutor = new DockerExecutor(this.logger, this.securityManager)
  }

  /**
   * Get current workspace path for UI access
   */
  static getCurrentWorkspacePath(): string | null {
    return CodeInterpreterTool.currentWorkspacePath
  }

  /**
   * Simplified input validation - only check if code exists
   */
  protected validateInput(input: CodeInterpreterInput): ValidationResult {
    const errors: string[] = []

    // Check if code exists first
    if (!input.code) {
      errors.push('Code is required')
      return { isValid: false, errors } // Early return to avoid cascading errors
    }

    // Check if code is string
    if (typeof input.code !== 'string') {
      errors.push('Code must be a string')
      return { isValid: false, errors } // Early return for type error
    }

    // Check if code is not empty
    if (input.code.trim().length === 0) {
      errors.push('Code cannot be empty')
    }

    // Validate input files if provided
    if (input.inputFiles) {
      if (!Array.isArray(input.inputFiles)) {
        errors.push('inputFiles must be an array')
      } else {
        input.inputFiles.forEach((file, index) => {
          if (!file.path || typeof file.path !== 'string') {
            errors.push(`inputFiles[${index}].path is required and must be a string`)
          }
        })
      }
    }

    return {
      isValid: errors.length === 0,
      errors
    }
  }

  /**
   * Simplified execution - just run the code and return results
   */
  protected async executeInternal(input: CodeInterpreterInput): Promise<CodeInterpreterResult> {
    this.logger.info('Executing Python code', {
      codeLength: input.code.length,
      sessionId: this.workspaceConfig.sessionId
    })

    try {
      // Check Docker availability
      const dockerCheck = await this.dockerExecutor.checkDockerAvailability()
      if (!dockerCheck.available) {
        throw new ExecutionError(`Docker is not available: ${dockerCheck.error}`, this.name)
      }

      // Initialize workspace
      await this.fileManager.initializeWorkspace()
      const workspacePath = this.fileManager.getWorkspacePath()

      // Store workspace path for UI access
      CodeInterpreterTool.currentWorkspacePath = workspacePath

      // Clean up old workspaces (older than 24 hours) in background
      this.fileManager.cleanupOldWorkspaces(24).catch((error) => {
        this.logger.warn('Background cleanup of old workspaces failed', {
          error: error instanceof Error ? error.message : String(error)
        })
      })

      // Execute code with environment-specific configuration
      const config = this.getExecutionConfig(input.environment)
      const execution = await this.dockerExecutor.executeCode(
        input.code,
        'python',
        workspacePath,
        config,
        input.inputFiles
      )

      // Get list of generated files with absolute paths
      const filesList = await this.fileManager.listFiles()
      const generatedFiles =
        filesList.listedFiles
          ?.filter((f) => f.type === 'file' && !f.name.startsWith('temp_'))
          .map((f) => path.join(workspacePath, f.name)) || []

      // Create combined output with file information
      let combinedOutput = execution.stdout

      // Add input files information
      if (input.inputFiles && input.inputFiles.length > 0) {
        const inputFileNames = input.inputFiles
          .map((f) => `/data/${path.basename(f.path)}`)
          .join(', ')
        combinedOutput += `\n[Input files mounted: ${inputFileNames}]`
      }

      if (generatedFiles.length > 0) {
        // Show only filenames in output for readability, but store full paths in results
        const fileNames = generatedFiles.map((fullPath) => path.basename(fullPath))
        combinedOutput += `\n[Generated files: ${fileNames.join(', ')}]`
      }

      const isSuccess = execution.exitCode === 0
      const result: CodeInterpreterResult = {
        success: isSuccess,
        name: 'codeInterpreter',
        code: input.code, // Include the executed code in the result
        message: isSuccess ? 'Code executed successfully' : 'Code execution failed',
        output: combinedOutput,
        executionTime: execution.executionTime,
        result: {
          code: input.code, // Also include in result object for backward compatibility
          stdout: execution.stdout,
          stderr: execution.stderr,
          exitCode: execution.exitCode,
          files: generatedFiles
        }
      }

      // Add error field only if there's an error
      if (!isSuccess && execution.stderr) {
        result.error = execution.stderr
      }

      this.logger.info('Code execution completed', {
        success: isSuccess,
        exitCode: execution.exitCode,
        executionTime: execution.executionTime,
        generatedFiles: generatedFiles.length
      })

      return result
    } catch (error) {
      this.logger.error('CodeInterpreter execution failed', {
        error: error instanceof Error ? error.message : String(error)
      })

      return {
        success: false,
        name: 'codeInterpreter',
        code: input.code, // Include the executed code even in error cases
        message: 'Execution failed',
        output: '',
        error: error instanceof Error ? error.message : String(error),
        executionTime: 0,
        result: {
          code: input.code, // Also include in result object for backward compatibility
          stdout: '',
          stderr: error instanceof Error ? error.message : String(error),
          exitCode: 1,
          files: []
        }
      }
    }
  }

  /**
   * Generate unique session ID
   */
  private generateSessionId(): string {
    const timestamp = Date.now()
    const random = Math.random().toString(36).substring(2, 8)
    return `session_${timestamp}_${random}`
  }

  /**
   * Cleanup on tool disposal
   */
  async dispose(): Promise<void> {
    try {
      await this.dockerExecutor.stopAllContainers()
      await this.fileManager.cleanup()
    } catch (error) {
      this.logger.warn('Error during tool disposal', {
        error: error instanceof Error ? error.message : String(error)
      })
    }
  }

  /**
   * Sanitize input for logging (truncate long code)
   */
  protected sanitizeInputForLogging(input: CodeInterpreterInput): any {
    return {
      type: input.type,
      code: input.code ? this.truncateForLogging(input.code, 200) : '<no code>'
    }
  }
}
