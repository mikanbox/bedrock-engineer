import { IpcMainInvokeEvent } from 'electron'
import { bedrock } from '../api'
import { createCategoryLogger } from '../../common/logger'

const bedrockLogger = createCategoryLogger('bedrock:ipc')

export const bedrockHandlers = {
  'bedrock:generateImage': async (_event: IpcMainInvokeEvent, params: any) => {
    bedrockLogger.debug('Generating image', {
      modelId: params.modelId,
      promptLength: params.prompt?.length
    })
    const result = await bedrock.generateImage(params)
    bedrockLogger.info('Image generated successfully')
    return result
  },

  'bedrock:recognizeImage': async (_event: IpcMainInvokeEvent, params: any) => {
    bedrockLogger.debug('Recognizing images', {
      imagePaths: params.imagePaths,
      imageCount: params.imagePaths?.length || 0,
      hasPrompt: !!params.prompt
    })

    // ImageRecognitionServiceは単一のimagePathを期待するため、配列から最初の要素を取り出す
    const result = await bedrock.recognizeImage({
      imagePath: params.imagePaths[0], // 配列から単一の文字列を取り出す
      prompt: params.prompt,
      modelId: params.modelId
    })

    bedrockLogger.info('Images recognized successfully')
    return result
  },

  'bedrock:retrieve': async (_event: IpcMainInvokeEvent, params: any) => {
    bedrockLogger.debug('Retrieving from knowledge base', {
      knowledgeBaseId: params.knowledgeBaseId,
      queryLength: params.query?.length
    })

    // Transform parameters to match AWS Bedrock Knowledge Base API format
    const retrieveCommand = {
      knowledgeBaseId: params.knowledgeBaseId,
      retrievalQuery: {
        text: params.query
      },
      ...(params.retrievalConfiguration && {
        retrievalConfiguration: params.retrievalConfiguration
      })
    }

    const result = await bedrock.retrieve(retrieveCommand)
    bedrockLogger.info('Retrieved successfully from knowledge base')
    return result
  },

  'bedrock:invokeAgent': async (_event: IpcMainInvokeEvent, params: any) => {
    bedrockLogger.debug('Invoking Bedrock agent', {
      agentId: params.agentId,
      agentAliasId: params.agentAliasId,
      hasSessionId: !!params.sessionId
    })
    const result = await bedrock.invokeAgent(params)
    bedrockLogger.info('Agent invoked successfully')
    return result
  },

  'bedrock:invokeFlow': async (_event: IpcMainInvokeEvent, params: any) => {
    bedrockLogger.debug('Invoking Bedrock flow', {
      flowIdentifier: params.flowIdentifier,
      flowAliasIdentifier: params.flowAliasIdentifier
    })

    // Ensure params has the correct structure
    const invokeFlowParams = {
      flowIdentifier: params.flowIdentifier,
      flowAliasIdentifier: params.flowAliasIdentifier,
      // Handle both input (legacy) and inputs (correct format)
      inputs: params.inputs || (params.input ? [params.input] : []),
      enableTrace: params.enableTrace
    }

    const result = await bedrock.invokeFlow(invokeFlowParams)
    bedrockLogger.info('Flow invoked successfully')
    return result
  }
} as const
