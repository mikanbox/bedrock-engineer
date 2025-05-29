import { Tool } from '@aws-sdk/client-bedrock-runtime'
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

// codeInterpreter ツールの入力型（シンプル化版）
export type CodeInterpreterInput = {
  type: 'codeInterpreter'
  code: string // Python コードのみ - 最大限シンプル！
  inputFiles?: Array<{ path: string }> // Optional: files to mount in container
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

// Old complex CodeInterpreter definition removed - using simplified version above

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

/**
 * ツール定義（JSON Schema）
 *
 * Amazon Nova understanding models currently support only a subset of JsonSchema functionality when used to define the ToolInputSchema in Converse API.
 * The top level schema must be of type Object.
 * Only three fields are supported in the top-level Object - type (must be set to 'object'), properties, and required.
 * https://docs.aws.amazon.com/nova/latest/userguide/tool-use-definition.html#:~:text=the%20tool%20configuration.-,Note,-Amazon%20Nova%20understanding
 */
export const tools: Tool[] = [
  {
    toolSpec: {
      name: 'createFolder',
      description:
        'Create a new folder at the specified path. Use this when you need to create a new directory in the project structure.',
      inputSchema: {
        json: {
          type: 'object',
          properties: {
            path: {
              type: 'string',
              description: 'The path where the folder should be created'
            }
          },
          required: ['path']
        }
      }
    }
  },
  {
    toolSpec: {
      name: 'writeToFile',
      description:
        'Write content to an existing file at the specified path. Use this when you need to add or update content in an existing file.',
      inputSchema: {
        json: {
          type: 'object',
          properties: {
            path: {
              type: 'string',
              description: 'The path of the file to write to'
            },
            content: {
              type: 'string',
              description: 'The content to write to the file'
            }
          },
          required: ['path', 'content']
        }
      }
    }
  },
  {
    toolSpec: {
      name: 'applyDiffEdit',
      description: `Apply a diff edit to a file. This tool replaces the specified original text with updated text at the exact location in the file. Use this when you need to make precise modifications to existing file content. The tool ensures that only the specified text is replaced, keeping the rest of the file intact.

Example:
{
   path: '/path/to/file.ts',
   originalText: 'function oldName() {\n  // old implementation\n}',
   updatedText: 'function newName() {\n  // new implementation\n}'
}
        `,
      inputSchema: {
        json: {
          type: 'object',
          properties: {
            path: {
              type: 'string',
              description:
                'The absolute path of the file to modify. Make sure to provide the complete path starting from the root directory.'
            },
            originalText: {
              type: 'string',
              description:
                'The exact original text to be replaced. Must match the text in the file exactly, including whitespace and line breaks. If the text is not found, the operation will fail.'
            },
            updatedText: {
              type: 'string',
              description:
                'The new text that will replace the original text. Can be of different length than the original text. Whitespace and line breaks in this text will be preserved exactly as provided.'
            }
          },
          required: ['path', 'originalText', 'updatedText']
        }
      }
    }
  },
  {
    toolSpec: {
      name: 'readFiles',
      description:
        'Read the content of multiple files at the specified paths with line range filtering support. For Excel files, the content is converted to CSV format.',
      inputSchema: {
        json: {
          type: 'object',
          properties: {
            paths: {
              type: 'array',
              items: {
                type: 'string'
              },
              description:
                'Array of file paths to read. Supports text files and Excel files (.xlsx, .xls).'
            },
            options: {
              type: 'object',
              description: 'Optional configurations for reading files',
              properties: {
                encoding: {
                  type: 'string',
                  description: 'File encoding (default: utf-8)'
                },
                lines: {
                  type: 'object',
                  description: 'Line range to read from the file',
                  properties: {
                    from: {
                      type: 'number',
                      description: 'Starting line number (1-based, inclusive)'
                    },
                    to: {
                      type: 'number',
                      description: 'Ending line number (1-based, inclusive)'
                    }
                  }
                }
              }
            }
          },
          required: ['paths']
        }
      }
    }
  },
  {
    toolSpec: {
      name: 'listFiles',
      description:
        'List the entire directory structure, including all subdirectories and files, in a hierarchical format with line range filtering support. Use maxDepth to limit directory depth and lines to filter output.',
      inputSchema: {
        json: {
          type: 'object',
          properties: {
            path: {
              type: 'string',
              description: 'The root path to start listing the directory structure from'
            },
            options: {
              type: 'object',
              description: 'Optional configurations for listing files',
              properties: {
                ignoreFiles: {
                  type: 'array',
                  items: {
                    type: 'string'
                  },
                  description: 'Array of patterns to ignore when listing files (gitignore format)'
                },
                maxDepth: {
                  type: 'number',
                  description: 'Maximum depth of directory traversal (-1 for unlimited)'
                },
                recursive: {
                  type: 'boolean',
                  description: 'Whether to list files recursively'
                },
                lines: {
                  type: 'object',
                  description: 'Line range to display from the directory listing output',
                  properties: {
                    from: {
                      type: 'number',
                      description: 'Starting line number (1-based, inclusive)'
                    },
                    to: {
                      type: 'number',
                      description: 'Ending line number (1-based, inclusive)'
                    }
                  }
                }
              }
            }
          },
          required: ['path']
        }
      }
    }
  },
  {
    toolSpec: {
      name: 'moveFile',
      description:
        'Move a file from one location to another. Use this when you need to organize files in the project structure.',
      inputSchema: {
        json: {
          type: 'object',
          properties: {
            source: {
              type: 'string',
              description: 'The current path of the file'
            },
            destination: {
              type: 'string',
              description: 'The new path for the file'
            }
          },
          required: ['source', 'destination']
        }
      }
    }
  },
  {
    toolSpec: {
      name: 'copyFile',
      description:
        'Copy a file from one location to another. Use this when you need to duplicate a file in the project structure.',
      inputSchema: {
        json: {
          type: 'object',
          properties: {
            source: {
              type: 'string',
              description: 'The path of the file to copy'
            },
            destination: {
              type: 'string',
              description: 'The new path for the copied file'
            }
          },
          required: ['source', 'destination']
        }
      }
    }
  },
  {
    toolSpec: {
      name: 'tavilySearch',
      description:
        'Perform a web search using Tavily API to get up-to-date information or additional context. Use this when you need current information or feel a search could provide a better answer.',
      inputSchema: {
        json: {
          type: 'object',
          properties: {
            query: {
              type: 'string',
              description: 'The search query'
            },
            option: {
              type: 'object',
              description: 'Optional configurations for the search',
              properties: {
                include_raw_content: {
                  type: 'boolean',
                  description:
                    'Whether to include raw content in the search results. DEFAULT is false'
                }
              }
            }
          },
          required: ['query']
        }
      }
    }
  },
  {
    toolSpec: {
      name: 'fetchWebsite',
      description: `Fetch content from a specified URL with line range filtering support. If the cleaning option is true, extracts plain text content from HTML by removing markup and unnecessary elements. Default is false.`,
      inputSchema: {
        json: {
          type: 'object',
          properties: {
            url: {
              type: 'string',
              description: 'The URL to fetch content from'
            },
            options: {
              type: 'object',
              description: 'Optional request configurations',
              properties: {
                method: {
                  type: 'string',
                  description: 'HTTP method (GET, POST, etc.)',
                  enum: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'HEAD', 'OPTIONS']
                },
                headers: {
                  type: 'object',
                  description: 'Request headers',
                  additionalProperties: {
                    type: 'string'
                  }
                },
                body: {
                  type: 'string',
                  description: 'Request body (for POST, PUT, etc.)'
                },
                cleaning: {
                  type: 'boolean',
                  description:
                    'Optional. If true, extracts plain text content from HTML by removing markup and unnecessary elements. Default is false.'
                },
                lines: {
                  type: 'object',
                  description: 'Line range to display from the fetched content',
                  properties: {
                    from: {
                      type: 'number',
                      description: 'Starting line number (1-based, inclusive)'
                    },
                    to: {
                      type: 'number',
                      description: 'Ending line number (1-based, inclusive)'
                    }
                  }
                }
              }
            }
          },
          required: ['url']
        }
      }
    }
  },
  {
    toolSpec: {
      name: 'generateImage',
      description:
        'Generate an image using Amazon Bedrock Foundation Models. By default uses stability.sd3-5-large-v1:0. Images are saved to the specified path. For Titan models, specific aspect ratios and sizes are supported.',
      inputSchema: {
        json: {
          type: 'object',
          properties: {
            prompt: {
              type: 'string',
              description: 'Text description of the image you want to generate'
            },
            outputPath: {
              type: 'string',
              description:
                'Path where the generated image should be saved, including filename (e.g., "/path/to/image.png")'
            },
            negativePrompt: {
              type: 'string',
              description: 'Optional. Things to exclude from the image'
            },
            aspect_ratio: {
              type: 'string',
              description:
                'Optional. Aspect ratio of the generated image. For Titan models, specific sizes will be chosen based on the aspect ratio.',
              enum: [
                '1:1',
                '16:9',
                '2:3',
                '3:2',
                '4:5',
                '5:4',
                '9:16',
                '9:21',
                '5:3',
                '3:5',
                '7:9',
                '9:7',
                '6:11',
                '11:6',
                '5:11',
                '11:5',
                '9:5'
              ]
            },
            seed: {
              type: 'number',
              description:
                'Optional. Seed for deterministic generation. For Titan models, range is 0 to 2147483647.'
            },
            output_format: {
              type: 'string',
              description: 'Optional. Output format of the generated image',
              enum: ['png', 'jpeg', 'webp'],
              default: 'png'
            }
          },
          required: ['prompt', 'outputPath']
        }
      }
    }
  },
  {
    toolSpec: {
      name: 'recognizeImage',
      description:
        "Analyze and describe multiple images (up to 5) using Amazon Bedrock's Claude vision capabilities. The tool processes images in parallel and returns detailed descriptions.",
      inputSchema: {
        json: {
          type: 'object',
          properties: {
            imagePaths: {
              type: 'array',
              items: {
                type: 'string'
              },
              description:
                'Paths to the image files to analyze (maximum 5). Supports common formats: .jpg, .jpeg, .png, .gif, .webp'
            },
            prompt: {
              type: 'string',
              description:
                'Custom prompt to guide the image analysis (e.g., "Describe this image in detail", "What text appears in this image?", etc.). Default: "Describe this image in detail."'
            }
          },
          required: ['imagePaths']
        }
      }
    }
  },
  {
    toolSpec: {
      name: 'retrieve',
      description:
        'Retrieve information from a knowledge base using Amazon Bedrock Knowledge Base. Use this when you need to get information from a knowledge base.',
      inputSchema: {
        json: {
          type: 'object',
          properties: {
            knowledgeBaseId: {
              type: 'string',
              description: 'The ID of the knowledge base to retrieve from'
            },
            query: {
              type: 'string',
              description: 'The query to search for in the knowledge base'
            }
          },
          required: ['knowledgeBaseId', 'query']
        }
      }
    }
  },
  {
    toolSpec: {
      name: 'invokeBedrockAgent',
      description:
        'Invoke an Amazon Bedrock Agent using the specified agent ID and alias ID. Use this when you need to interact with an agent.',
      inputSchema: {
        json: {
          type: 'object',
          properties: {
            agentId: {
              type: 'string',
              description: 'The ID of the agent to invoke'
            },
            agentAliasId: {
              type: 'string',
              description: 'The alias ID of the agent to invoke'
            },
            sessionId: {
              type: 'string',
              description:
                'Optional. The session ID to use for the agent invocation. The session ID is issued when you execute invokeBedrockAgent for the first time and is included in the response. Specify it if you want to continue the conversation from the second time onwards.'
            },
            inputText: {
              type: 'string',
              description: 'The input text to send to the agent'
            },
            file: {
              type: 'object',
              description:
                'Optional. The file to send to the agent. Be sure to specify if you need to analyze files.',
              properties: {
                filePath: {
                  type: 'string',
                  description: 'The path of the file to send to the agent'
                },
                useCase: {
                  type: 'string',
                  description:
                    'The use case of the file. Specify "CODE_INTERPRETER" if Python code analysis is required. Otherwise, specify "CHAT".',
                  enum: ['CODE_INTERPRETER', 'CHAT']
                }
              }
            }
          },
          required: ['agentId', 'agentAliasId', 'inputText']
        }
      }
    }
  },
  {
    toolSpec: {
      name: 'executeCommand',
      description:
        'Execute a command or send input to a running process. First execute the command to get a PID, then use that PID to send input if needed. Usage: 1) First call with command and cwd to start process, 2) If input is required, call again with pid and stdin.',
      inputSchema: {
        json: {
          type: 'object',
          properties: {
            command: {
              type: 'string',
              description: 'The command to execute (used when starting a new process)'
            },
            cwd: {
              type: 'string',
              description: 'The working directory for the command execution (used with command)'
            },
            pid: {
              type: 'number',
              description:
                'Process ID to send input to (used when sending input to existing process)'
            },
            stdin: {
              type: 'string',
              description: 'Standard input to send to the process (used with pid)'
            }
          }
        }
      }
    }
  },
  {
    toolSpec: {
      name: 'think',
      description:
        'Use the tool to think about something. It will not obtain new information or make any changes to the repository, but just log the thought. Use it when complex reasoning or brainstorming is needed. For example, if you explore the repo and discover the source of a bug, call this tool to brainstorm several unique ways of fixing the bug, and assess which change(s) are likely to be simplest and most effective. Alternatively, if you receive some test results, call this tool to brainstorm ways to fix the failing tests.',
      inputSchema: {
        json: {
          type: 'object',
          properties: {
            thought: {
              type: 'string',
              description: 'Your thoughts.'
            }
          },
          required: ['thought']
        }
      }
    }
  },
  {
    toolSpec: {
      name: 'invokeFlow',
      description:
        'Invoke AWS Bedrock Flow to execute the specified flow. Flows can be used to automate workflows consisting of multiple steps.',
      inputSchema: {
        json: {
          type: 'object',
          properties: {
            flowIdentifier: {
              type: 'string',
              description: 'The identifier of the Flow to execute'
            },
            flowAliasIdentifier: {
              type: 'string',
              description: 'The alias identifier of the Flow'
            },
            input: {
              type: 'object',
              description: 'Input data for the Flow',
              properties: {
                content: {
                  type: 'object',
                  properties: {
                    document: {
                      description:
                        'Data to send to the Flow. Accepts strings, numbers, booleans, objects, and arrays.',
                      anyOf: [
                        { type: 'string' },
                        { type: 'number' },
                        { type: 'boolean' },
                        { type: 'object' },
                        { type: 'array' }
                      ]
                    }
                  },
                  required: ['document']
                }
              },
              required: ['content']
            }
          },
          required: ['flowIdentifier', 'flowAliasIdentifier', 'input']
        }
      }
    }
  },
  {
    toolSpec: {
      name: 'codeInterpreter',
      description:
        'Execute Python code in a secure Docker environment with pre-installed data science libraries. Input files can be mounted for analysis. No internet access for security.',
      inputSchema: {
        json: {
          type: 'object',
          properties: {
            code: {
              type: 'string',
              description: `Python code to execute in a secure Docker container with no internet access.

CRITICAL FILE HANDLING RULES:
- Input files: Mounted at /data/ directory (READ-ONLY). Access via inputFiles parameter.
- Output files: MUST be created in current working directory (/workspace) to persist on host.
- NEVER attempt to write to /data/ - it will fail with permission error.
- Only files in /workspace are automatically detected and made available on host system.

ENVIRONMENT-SPECIFIC LIBRARIES:
Basic Environment:
- Core: numpy==1.26.2, pandas==2.1.4
- Visualization: matplotlib==3.8.2
- Web: requests==2.31.0
- System: gcc, libffi-dev

Data Science Environment (recommended for analysis):
- Scientific: numpy==1.26.2, pandas==2.1.4, scipy==1.11.4
- Visualization: matplotlib==3.8.2, seaborn==0.13.0, plotly==5.17.0
- ML/Stats: scikit-learn==1.3.2, statsmodels==0.14.0
- Data Processing: openpyxl==3.1.2, beautifulsoup4==4.12.2, lxml==4.9.3
- Image: pillow==10.1.0
- Utils: ipython==8.18.1, requests==2.31.0
- System: gcc, g++, image processing libraries

ENVIRONMENT VARIABLES SET:
- MPLBACKEND='Agg' (for headless plotting)
- PYTHONUNBUFFERED='1' (immediate output)

BEST PRACTICES:
- Use specific library versions as listed above
- Save outputs with descriptive names: 'analysis_results.csv', 'visualization.png'
- Include error handling for file operations
- Create summary reports when performing complex analysis
- Use matplotlib with Agg backend for plot generation

RECOMMENDED OUTPUT PATTERNS:
# Data analysis results
df_results.to_csv('analysis_summary.csv', index=False)

# Visualizations
plt.figure(figsize=(10, 6))
# ... plotting code ...
plt.savefig('chart_analysis.png', dpi=300, bbox_inches='tight')
plt.close()

# Statistical reports
with open('statistical_report.txt', 'w') as f:
    f.write(f"Analysis Summary:\\n{summary_text}")

# Processed datasets
cleaned_data.to_excel('processed_data.xlsx', index=False)`
            },
            environment: {
              type: 'string',
              description: `Python environment selection:
- "basic": Lightweight environment with core libraries (numpy, pandas, matplotlib, requests)
- "datascience": Full data science stack with ML, statistics, and advanced visualization libraries
Default: "datascience" (recommended for most analytical tasks)`,
              enum: ['basic', 'datascience']
            },
            inputFiles: {
              type: 'array',
              description: `Input files to mount in the container at /data/ directory (READ-ONLY access).
Perfect for analyzing existing datasets without risk of modification.
Supported formats: CSV, Excel (.xlsx, .xls), JSON, images, text files, etc.`,
              items: {
                type: 'object',
                properties: {
                  path: {
                    type: 'string',
                    description: `Absolute path to input file on host system.
Example: "/Users/user/data/sales.csv" becomes "/data/sales.csv" in container.
File will be READ-ONLY - use pandas.read_csv('/data/sales.csv') to access.`
                  }
                },
                required: ['path']
              }
            }
          },
          required: ['code']
        }
      }
    }
  }
]
