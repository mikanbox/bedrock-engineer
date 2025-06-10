import { AspectRatio, ImageGeneratorModel } from '../main/api/bedrock'

export type ToolName =
  | 'createFolder'
  | 'readFiles'
  | 'writeToFile'
  | 'listFiles'
  | 'moveFile'
  | 'copyFile'
  | 'tavilySearch'
  | 'fetchWebsite'
  | 'generateImage'
  | 'generateVideo'
  | 'checkMovieStatus'
  | 'downloadMovie'
  | 'retrieve'
  | 'invokeBedrockAgent'
  | 'executeCommand'
  | 'applyDiffEdit'
  | 'think'
  | 'recognizeImage'
  | 'invokeFlow'
  | 'codeInterpreter'
  | string // MCPツール名を許容するために文字列型も追加

/**
 * MCPツール関連のユーティリティ関数
 *
 * 注意: AWS APIの制約により、ツール名には [a-zA-Z0-9_-]+ の文字のみ許可されています。
 * そのため、MCPツールには "mcp:" ではなく "mcp_" プレフィックスを使用します。
 */
// MCPツール名であるかを判定する関数
export const isMcpTool = (name: string): boolean => {
  return name.startsWith('mcp_')
}

// MCPツール名を標準化する関数（通常のツール名をMCP識別子付きにする）
export const normalizeMcpToolName = (name: string): string => {
  if (isMcpTool(name)) {
    return name
  }
  return `mcp_${name}`
}

// MCP識別子を除いた素のツール名を取得する関数
export const getOriginalMcpToolName = (name: string): string => {
  if (isMcpTool(name)) {
    return name.substring(4) // 'mcp_'の長さ(4)以降の文字列を返す
  }
  return name
}

export interface ToolResult<T = any> {
  name: ToolName
  success: boolean
  message?: string
  error?: string
  result: T
}

// Line range interface for tools
export interface LineRange {
  from?: number
  to?: number
}

// ツールごとの入力型定義
export type CreateFolderInput = {
  type: 'createFolder'
  path: string
}

export type ReadFilesInput = {
  type: 'readFiles'
  paths: string[] // 複数のファイルパスを受け取るように変更
  options?: {
    encoding?: BufferEncoding
    lines?: LineRange
  }
}

export type WriteToFileInput = {
  type: 'writeToFile'
  path: string
  content: string
}

export type ListFilesInput = {
  type: 'listFiles'
  path: string
  options?: {
    maxDepth?: number
    ignoreFiles?: string[]
    lines?: LineRange
    recursive?: boolean
  }
}

export type MoveFileInput = {
  type: 'moveFile'
  source: string
  destination: string
}

export type CopyFileInput = {
  type: 'copyFile'
  source: string
  destination: string
}

export type TavilySearchInput = {
  type: 'tavilySearch'
  query: string
  option: {
    include_raw_content: boolean
  }
}

export type FetchWebsiteInput = {
  type: 'fetchWebsite'
  url: string
  options?: {
    method?: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH' | 'HEAD' | 'OPTIONS'
    headers?: Record<string, string>
    body?: string
    cleaning?: boolean
    lines?: LineRange
  }
}

export type GenerateImageInput = {
  type: 'generateImage'
  prompt: string
  outputPath: string
  modelId: ImageGeneratorModel
  negativePrompt?: string
  aspect_ratio?: AspectRatio
  seed?: number
  output_format?: 'png' | 'jpeg' | 'webp'
}

export type StartMovieGenerationInput = {
  type: 'generateVideo'
  prompt: string
  durationSeconds: number
  outputPath?: string
  seed?: number
}

export type CheckMovieStatusInput = {
  type: 'checkMovieStatus'
  invocationArn: string
}

export type DownloadMovieInput = {
  type: 'downloadMovie'
  invocationArn: string
  localPath?: string
}

export type RetrieveInput = {
  type: 'retrieve'
  knowledgeBaseId: string
  query: string
}

export type InvokeBedrockAgentInput = {
  type: 'invokeBedrockAgent'
  agentId: string
  agentAliasId: string
  inputText: string
  sessionId?: string
  file?: {
    filePath: string
    useCase: 'CODE_INTERPRETER' | 'CHAT'
  }
}

export type ExecuteCommandInput = {
  type: 'executeCommand'
} & (
  | {
      command: string
      cwd: string
      pid?: never
      stdin?: never
    }
  | {
      command?: never
      cwd?: never
      pid: number
      stdin: string
    }
)

// 新しい applyDiffEdit ツールの入力型
export type ApplyDiffEditInput = {
  type: 'applyDiffEdit'
  path: string
  originalText: string
  updatedText: string
}

// think ツールの入力型
export type ThinkInput = {
  type: 'think'
  thought: string
}

// recognizeImage ツールの入力型
export type RecognizeImageInput = {
  type: 'recognizeImage'
  imagePaths: string[] // 複数画像をサポート（最大5枚）
  prompt?: string
}

// codeInterpreter ツールの入力型（操作別にディスクリミネーテッドユニオン化）
export type CodeInterpreterInput =
  | CodeInterpreterExecuteInput
  | CodeInterpreterStatusInput
  | CodeInterpreterCancelInput
  | CodeInterpreterListInput

// コード実行操作
export type CodeInterpreterExecuteInput = {
  type: 'codeInterpreter'
  operation?: 'execute'
  code: string // Python コードのみ - 最大限シンプル！
  inputFiles?: Array<{ path: string }> // Optional: files to mount in container
  environment?: 'basic' | 'datascience' // Python environment selection
  async?: boolean // 非同期実行モード（デフォルト: false）
}

// タスクステータス確認操作
export type CodeInterpreterStatusInput = {
  type: 'codeInterpreter'
  operation: 'status'
  taskId: string // 状態確認用のタスクID
}

// タスクキャンセル操作
export type CodeInterpreterCancelInput = {
  type: 'codeInterpreter'
  operation: 'cancel'
  taskId: string // キャンセル用のタスクID
}

// タスク一覧表示操作
export type CodeInterpreterListInput = {
  type: 'codeInterpreter'
  operation: 'list'
  statusFilter?: string // タスクステータスフィルター（optional）
}

// invokeFlow ツールの入力型
export type InvokeFlowInput = {
  type: 'invokeFlow'
  flowIdentifier: string
  flowAliasIdentifier: string
  input: {
    content: {
      document: any // string | number | boolean | object | any[] から any に変更
    }
    nodeName: string
    nodeOutputName: string
  }
}

// MCPツールの入力型
export type McpToolInput = {
  type: string // MCPツール名
  [key: string]: any // MCPツールの任意のパラメータ
}

// ディスクリミネーテッドユニオン型
export type ToolInput =
  | CreateFolderInput
  | ReadFilesInput
  | WriteToFileInput
  | ListFilesInput
  | MoveFileInput
  | CopyFileInput
  | TavilySearchInput
  | FetchWebsiteInput
  | GenerateImageInput
  | StartMovieGenerationInput
  | CheckMovieStatusInput
  | DownloadMovieInput
  | RecognizeImageInput
  | RetrieveInput
  | InvokeBedrockAgentInput
  | ExecuteCommandInput
  | ApplyDiffEditInput
  | ThinkInput
  | InvokeFlowInput
  | CodeInterpreterInput
  | McpToolInput // MCPツール入力を追加

// ツール名から入力型を取得するユーティリティ型
export type ToolInputTypeMap = {
  createFolder: CreateFolderInput
  readFiles: ReadFilesInput
  writeToFile: WriteToFileInput
  listFiles: ListFilesInput
  moveFile: MoveFileInput
  copyFile: CopyFileInput
  tavilySearch: TavilySearchInput
  fetchWebsite: FetchWebsiteInput
  generateImage: GenerateImageInput
  generateMovie: StartMovieGenerationInput
  generateVideo: StartMovieGenerationInput
  checkMovieStatus: CheckMovieStatusInput
  downloadMovie: DownloadMovieInput
  recognizeImage: RecognizeImageInput
  retrieve: RetrieveInput
  invokeBedrockAgent: InvokeBedrockAgentInput
  executeCommand: ExecuteCommandInput
  applyDiffEdit: ApplyDiffEditInput
  think: ThinkInput
  invokeFlow: InvokeFlowInput
  codeInterpreter: CodeInterpreterInput
  [key: string]: any // MCPツールに対応するためのインデックスシグネチャ
}
