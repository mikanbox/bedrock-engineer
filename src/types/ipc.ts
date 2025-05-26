// IPC通信の型定義を一元管理
export interface IPCChannelDefinitions {
  // Bedrock関連
  'bedrock:generateImage': {
    params: {
      modelId: string
      prompt: string
      negativePrompt?: string
      aspect_ratio?: string
      seed?: number
      output_format?: 'png' | 'jpeg' | 'webp'
    }
    result: {
      seeds?: number[]
      finish_reasons?: string[]
      images: string[]
    }
  }
  'bedrock:recognizeImage': {
    params: {
      imagePaths: string[]
      prompt?: string
      modelId?: string
    }
    result: string
  }
  'bedrock:retrieve': {
    params: {
      knowledgeBaseId: string
      query: string
      retrievalConfiguration?: any
    }
    result: any // AWS SDKの型に合わせる
  }
  'bedrock:invokeAgent': {
    params: {
      agentId: string
      agentAliasId: string
      sessionId?: string
      inputText: string
    }
    result: any // AWS SDKの型に合わせる
  }
  'bedrock:invokeFlow': {
    params: {
      flowIdentifier: string
      flowAliasIdentifier: string
      inputs?: any[]
      input?: any
      enableTrace?: boolean
    }
    result: any // 適切な戻り値の型
  }

  // ファイル操作関連
  'open-file': {
    params: void
    result: string | null
  }
  'open-directory': {
    params: void
    result: string | null
  }
  'get-local-image': {
    params: string // ファイルパス
    result: string // base64画像
  }

  // ウィンドウ関連
  'window:isFocused': {
    params: void
    result: boolean
  }

  // ユーティリティ
  'get-app-path': {
    params: void
    result: string
  }
  'fetch-website': {
    params: [string, any?] // url, options
    result: {
      status: number
      headers: Record<string, string>
      data: any
    }
  }

  // エージェント関連
  'read-shared-agents': {
    params: void
    result: {
      agents: any[]
      error: string | null
    }
  }
  'save-shared-agent': {
    params: [any, { format?: 'json' | 'yaml' }?] // agent, options
    result: {
      success: boolean
      filePath?: string
      format?: string
      error?: string
    }
  }

  // ログ関連
  'logger:log': {
    params: {
      level: 'error' | 'warn' | 'info' | 'debug' | 'verbose'
      message: string
      process?: string
      category?: string
      [key: string]: any
    }
    result: void
  }
}

// 型ヘルパー
export type IPCChannels = keyof IPCChannelDefinitions
export type IPCParams<C extends IPCChannels> = IPCChannelDefinitions[C]['params']
export type IPCResult<C extends IPCChannels> = IPCChannelDefinitions[C]['result']
