/**
 * Retrieve tool implementation
 */

import { ipcRenderer } from 'electron'
import { BaseTool } from '../../base/BaseTool'
import { ValidationResult } from '../../base/types'
import { ToolResult } from '../../../../types/tools'

/**
 * Input type for RetrieveTool
 */
interface RetrieveInput {
  type: 'retrieve'
  query: string
  knowledgeBaseId: string
  retrievalConfiguration?: {
    vectorSearchConfiguration: {
      numberOfResults?: number
      overrideSearchType?: 'HYBRID' | 'SEMANTIC'
      filter?: {
        equals?: {
          key: string
          value: any
        }
      }
    }
  }
}

/**
 * Result type for RetrieveTool - matches legacy implementation
 */
interface RetrieveResult extends ToolResult {
  name: 'retrieve'
  result: any // Use any to match legacy implementation flexibility
}

/**
 * Tool for retrieving information from AWS Bedrock Knowledge Base
 */
export class RetrieveTool extends BaseTool<RetrieveInput, RetrieveResult> {
  readonly name = 'retrieve'
  readonly description = 'Retrieve relevant information from AWS Bedrock Knowledge Base'

  /**
   * Validate input
   */
  protected validateInput(input: RetrieveInput): ValidationResult {
    const errors: string[] = []

    if (!input.query) {
      errors.push('Query is required')
    }

    if (typeof input.query !== 'string') {
      errors.push('Query must be a string')
    }

    if (input.query && input.query.trim().length === 0) {
      errors.push('Query cannot be empty')
    }

    if (!input.knowledgeBaseId) {
      errors.push('Knowledge base ID is required')
    }

    if (typeof input.knowledgeBaseId !== 'string') {
      errors.push('Knowledge base ID must be a string')
    }

    if (input.retrievalConfiguration) {
      const config = input.retrievalConfiguration.vectorSearchConfiguration

      if (config.numberOfResults !== undefined) {
        if (typeof config.numberOfResults !== 'number' || config.numberOfResults < 1) {
          errors.push('Number of results must be a positive number')
        }
      }

      if (config.overrideSearchType !== undefined) {
        if (!['HYBRID', 'SEMANTIC'].includes(config.overrideSearchType)) {
          errors.push('Override search type must be either HYBRID or SEMANTIC')
        }
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
  protected async executeInternal(input: RetrieveInput): Promise<RetrieveResult> {
    const { query, knowledgeBaseId, retrievalConfiguration } = input

    this.logger.debug('Retrieving from Knowledge Base', {
      knowledgeBaseId,
      query
    })

    try {
      this.logger.info('Calling Bedrock Knowledge Base', {
        knowledgeBaseId,
        queryLength: query.length
      })

      const result = await ipcRenderer.invoke('bedrock:retrieve', {
        query,
        knowledgeBaseId,
        retrievalConfiguration
      })

      this.logger.info('Knowledge Base retrieval successful', {
        knowledgeBaseId,
        retrievalResultsCount: result.retrievalResults?.length || 0
      })

      if (result.retrievalResults?.length) {
        this.logger.debug('Retrieval results summary', {
          topResult: {
            sourceUri: result.retrievalResults[0].location?.type
              ? result.retrievalResults[0].location?.s3Location?.uri || 'unknown'
              : 'unknown',
            score: result.retrievalResults[0].score
          },
          resultsCount: result.retrievalResults.length
        })
      } else {
        this.logger.warn('Knowledge Base returned no results', {
          knowledgeBaseId,
          query
        })
      }

      return {
        success: true,
        name: 'retrieve',
        message: `Retrieved information from knowledge base ${knowledgeBaseId}`,
        result
      }
    } catch (error: any) {
      this.logger.error('Error retrieving from Knowledge Base', {
        knowledgeBaseId,
        query,
        error: error.message,
        errorName: error.name
      })

      throw `Error retrieve: ${JSON.stringify({
        success: false,
        name: 'retrieve',
        error: 'Failed to retrieve information from knowledge base',
        message: error.message
      })}`
    }
  }

  /**
   * Override to return error as string for compatibility
   */
  protected shouldReturnErrorAsString(): boolean {
    return true
  }

  /**
   * Override to sanitize query for logging
   */
  protected sanitizeInputForLogging(input: RetrieveInput): any {
    return {
      ...input,
      query: this.truncateForLogging(input.query, 200),
      knowledgeBaseId: input.knowledgeBaseId.substring(0, 8) + '...' // Show only first 8 chars
    }
  }
}
