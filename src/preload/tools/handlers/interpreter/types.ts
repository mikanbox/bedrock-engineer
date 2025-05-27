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
 * User-configurable execution configuration
 */
export interface ExecutionConfig {
  timeout: number // User configurable: 30, 60, 120 seconds
  memoryLimit: string // User configurable: '128m', '256m', '512m', '1g'
  cpuLimit: number // User configurable: 0.5, 1.0, 2.0
  environment?: PythonEnvironment // Environment type
}

/**
 * CodeInterpreter container configuration for UI settings
 */
export interface CodeInterpreterContainerConfig {
  memoryLimit: string // Memory limit for containers
  cpuLimit: number // CPU limit for containers
  timeout: number // Execution timeout in seconds
}

/**
 * Docker availability status
 */
export interface DockerAvailabilityStatus {
  available: boolean
  version?: string
  error?: string
  lastChecked?: Date
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
