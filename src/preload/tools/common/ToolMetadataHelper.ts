/**
 * Tool metadata helper utilities
 * Centralized tool metadata management for preload process
 */

import { ToolMetadataCollector } from '../registry'

/**
 * Cache for system prompt descriptions to avoid repeated API calls
 */
let systemPromptDescriptionsCache: Record<string, string> | null = null

/**
 * Get system prompt descriptions from ToolMetadataCollector (with caching)
 */
export function getSystemPromptDescriptions(): Record<string, string> {
  if (systemPromptDescriptionsCache === null) {
    systemPromptDescriptionsCache = ToolMetadataCollector.getSystemPromptDescriptions()
  }
  return systemPromptDescriptionsCache
}

/**
 * Get tool usage description by name
 * Uses dynamic system prompt descriptions from ToolMetadataCollector
 */
export function getToolUsageDescription(toolName: string): string {
  const descriptions = getSystemPromptDescriptions()
  return (
    descriptions[toolName] ||
    'External tool with specific functionality.\nRefer to tool documentation for usage.'
  )
}

/**
 * Reset cache - useful for testing or when tool metadata changes
 */
export function resetToolMetadataCache(): void {
  systemPromptDescriptionsCache = null
}

/**
 * Get all available tool names
 */
export function getAvailableToolNames(): string[] {
  const descriptions = getSystemPromptDescriptions()
  return Object.keys(descriptions)
}
