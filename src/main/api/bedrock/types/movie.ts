// Amazon Nova Reel related types

export interface GenerateMovieRequest {
  prompt: string
  durationSeconds: number
  outputPath?: string
  seed?: number
  s3Uri: string // S3 output location (required)
  inputImages?: string[] // Array of local image file paths
  prompts?: string[] // Array of prompts for each shot (when using multiple images)
}

export interface GeneratedMovie {
  invocationArn: string
  status: AsyncInvocationStatus
  outputLocation?: string
  localPath?: string
  error?: string
}

export interface AsyncInvocationStatus {
  invocationArn: string
  modelId: string
  status: 'InProgress' | 'Completed' | 'Failed'
  submitTime: Date
  endTime?: Date
  outputDataConfig?: {
    s3OutputDataConfig: {
      s3Uri: string
    }
  }
  failureMessage?: string
}

export interface ImageSource {
  format: 'png' | 'jpeg'
  source: {
    bytes?: string // Base64 encoded image for TEXT_VIDEO
    s3Location?: {
      uri: string // S3 URI for MULTI_SHOT_MANUAL
    }
  }
}

export interface Shot {
  text: string
  image?: ImageSource
}

export interface NovaReelRequest {
  taskType: 'TEXT_VIDEO' | 'MULTI_SHOT_AUTOMATED' | 'MULTI_SHOT_MANUAL'
  textToVideoParams?: {
    text: string
    images?: ImageSource[] // For TEXT_VIDEO with image input
  }
  multiShotAutomatedParams?: {
    text: string
  }
  multiShotManualParams?: {
    shots: Shot[] // For MULTI_SHOT_MANUAL with multiple images
  }
  videoGenerationConfig: {
    durationSeconds?: number // Optional for MULTI_SHOT_MANUAL mode
    fps: number // Fixed at 24
    dimension: string // Fixed at '1280x720'
    seed: number
  }
}

export interface StartAsyncInvokeRequest {
  modelId: string
  modelInput: NovaReelRequest
  outputDataConfig: {
    s3OutputDataConfig: {
      s3Uri: string
    }
  }
}

export interface AsyncInvocationResponse {
  invocationArn: string
}

export interface GetAsyncInvokeResponse {
  invocationArn: string
  modelId: string
  status: 'InProgress' | 'Completed' | 'Failed'
  submitTime: Date
  endTime?: Date
  outputDataConfig?: {
    s3OutputDataConfig: {
      s3Uri: string
    }
  }
  failureMessage?: string
}

// Nova Reel model constants
export const NOVA_REEL_MODEL_ID = 'amazon.nova-reel-v1:1'
export const NOVA_REEL_RESOLUTION = '1280x720'
export const NOVA_REEL_FPS = 24

// Duration validation - 6 seconds for TEXT_VIDEO, multiple of 6 between 12-120 seconds for MULTI_SHOT_AUTOMATED
export const VALID_DURATIONS = [
  6, 12, 18, 24, 30, 36, 42, 48, 54, 60, 66, 72, 78, 84, 90, 96, 102, 108, 114, 120
]

export function isValidDuration(duration: number): boolean {
  return VALID_DURATIONS.includes(duration)
}

export function getTaskTypeForDuration(duration: number): 'TEXT_VIDEO' | 'MULTI_SHOT_AUTOMATED' {
  return duration === 6 ? 'TEXT_VIDEO' : 'MULTI_SHOT_AUTOMATED'
}

export function getTaskTypeForRequest(
  duration: number,
  hasInputImages: boolean
): 'TEXT_VIDEO' | 'MULTI_SHOT_AUTOMATED' | 'MULTI_SHOT_MANUAL' {
  if (hasInputImages) {
    return duration === 6 ? 'TEXT_VIDEO' : 'MULTI_SHOT_MANUAL'
  } else {
    return duration === 6 ? 'TEXT_VIDEO' : 'MULTI_SHOT_AUTOMATED'
  }
}
