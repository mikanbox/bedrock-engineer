/**
 * Simplified types for CodeInterpreter tool
 */

import { ToolResult } from '../../../../types/tools'

/**
 * Supported programming languages (currently Python only)
 */
export type SupportedLanguage = 'python'

/**
 * Python execution environments with different library sets
 */
export type PythonEnvironment = 'basic' | 'datascience'

/**
 * Docker image build configuration
 */
export interface DockerImageConfig {
  name: string
  tag: string
  environment: PythonEnvironment
  libraries: string[]
  systemPackages?: string[]
  environmentVariables?: Record<string, string>
}

/**
 * Docker build result
 */
export interface DockerBuildResult {
  success: boolean
  imageName: string
  buildTime: number
  error?: string
}

/**
 * Input file for CodeInterpreter
 */
export interface InputFile {
  path: string // ホスト側のファイルパス
}

/**
 * Simplified CodeInterpreter input type - only code is required!
 */
export interface CodeInterpreterInput {
  type: 'codeInterpreter'
  code: string // The only required field - maximum simplicity!
  environment?: PythonEnvironment // Optional: 'basic' | 'datascience' (default: 'datascience')
  inputFiles?: InputFile[] // Optional: files to mount in container
}

/**
 * Code execution result (internal)
 */
export interface CodeExecutionResult {
  stdout: string
  stderr: string
  exitCode: number
  executionTime: number
}

/**
 * Simplified CodeInterpreter result type
 */
export interface CodeInterpreterResult extends ToolResult {
  name: 'codeInterpreter'
  code: string // The executed code - included in result for UI display
  output: string // Combined stdout + file info for easy consumption
  error?: string // stderr (only when error occurs)
  executionTime: number
  result: {
    code: string // The executed code - duplicated here for backward compatibility
    stdout: string
    stderr: string
    exitCode: number
    files: string[] // List of generated files
  }
}

/**
 * Fixed execution configuration (no longer user-configurable)
 */
export interface ExecutionConfig {
  timeout: number // Fixed: 30 seconds
  memoryLimit: string // Fixed: '128m'
  cpuLimit: number // Fixed: 0.5
  environment?: PythonEnvironment // Environment type
}

/**
 * Workspace configuration (simplified, mostly internal)
 */
export interface WorkspaceConfig {
  basePath: string
  sessionId: string
  maxFiles: number
  maxFileSize: number
  allowedExtensions: string[]
  cleanupOnExit: boolean
}
