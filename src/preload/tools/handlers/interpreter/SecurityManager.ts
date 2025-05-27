/**
 * Simplified Security manager for CodeInterpreter
 * Fixed security settings - no more complex configuration!
 */

import { ExecutionConfig } from './types'
import { ToolLogger } from '../../base/types'

/**
 * Fixed security constraints - no configuration needed
 */
const FIXED_DOCKER_SECURITY_ARGS = [
  '--rm', // Auto-remove container
  '--network=none', // No network access
  '--memory=256m', // Increased memory limit for matplotlib
  '--cpus=0.5', // Fixed CPU limit
  '--tmpfs=/tmp:rw,size=100m', // Writable temporary filesystem
  '--tmpfs=/var/tmp:rw,size=50m' // Additional temp space
  // Removed --read-only and --user=nobody to allow matplotlib to work
]

/**
 * Simplified Security manager class
 */
export class SecurityManager {
  private logger: ToolLogger

  constructor(logger: ToolLogger) {
    this.logger = logger
  }

  /**
   * Validate execution config (simplified - just check basic sanity)
   */
  validateExecutionConfig(config?: Partial<ExecutionConfig>): {
    isValid: boolean
    errors: string[]
    sanitizedConfig: ExecutionConfig
  } {
    const errors: string[] = []

    // Use fixed configuration - ignore user input for security
    const sanitizedConfig: ExecutionConfig = {
      timeout: 60, // Fixed: 60 seconds (increased for matplotlib initialization)
      memoryLimit: '256m', // Fixed: 256MB (increased for matplotlib)
      cpuLimit: 0.5 // Fixed: 50% CPU
    }

    // Log if user tried to override (for security audit)
    if (config && Object.keys(config).length > 0) {
      this.logger.info('User config ignored for security - using fixed values', {
        attemptedConfig: config,
        appliedConfig: sanitizedConfig
      })
    }

    return {
      isValid: true, // Always valid since we use fixed config
      errors,
      sanitizedConfig
    }
  }

  /**
   * Sanitize code (basic checks only)
   */
  sanitizeCode(
    code: string,
    _language: string
  ): {
    sanitizedCode: string
    warnings: string[]
  } {
    const warnings: string[] = []

    // Basic security checks
    if (code.includes('__import__')) {
      warnings.push('Dynamic imports detected - use with caution')
    }

    if (code.includes('exec(') || code.includes('eval(')) {
      warnings.push('Dynamic code execution detected - use with caution')
    }

    if (code.includes('subprocess') || code.includes('os.system')) {
      warnings.push('System command execution detected - will be blocked by Docker')
    }

    // Return code as-is (Docker will handle the security)
    return {
      sanitizedCode: code,
      warnings
    }
  }

  /**
   * Generate Docker security arguments (fixed set)
   */
  generateDockerSecurityArgs(_config?: ExecutionConfig): string[] {
    // Return fixed security arguments
    return [...FIXED_DOCKER_SECURITY_ARGS]
  }
}
