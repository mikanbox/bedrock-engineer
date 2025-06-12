/**
 * System tools exports
 */

export { ScreenCaptureTool } from './ScreenCaptureTool'

import type { ToolDependencies } from '../../base/types'
import { ScreenCaptureTool } from './ScreenCaptureTool'

/**
 * Factory function to create all system tools
 */
export function createSystemTools(dependencies: ToolDependencies) {
  return [{ tool: new ScreenCaptureTool(dependencies), category: 'system' as const }]
}
