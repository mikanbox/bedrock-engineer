import { ObjectExt } from './ObjectsExt'

// Use static path for AudioWorklet that works in both development and production
const getAudioWorkletUrl = (): string => {
  // In Electron, we need to construct the correct URL based on the app's location
  if (typeof window !== 'undefined' && window.location.protocol === 'file:') {
    // Production build - use relative path from the app's root
    return './worklets/audio-player-processor.js'
  } else {
    // Development server - use absolute path
    return '/worklets/audio-player-processor.js'
  }
}

export interface AudioPlayedListener {
  (samples: Float32Array): void
}

export class AudioPlayer {
  private onAudioPlayedListeners: AudioPlayedListener[]
  public initialized: boolean
  public audioContext: AudioContext | null
  private analyser: AnalyserNode | null
  private workletNode: AudioWorkletNode | null
  private recorderNode: ScriptProcessorNode | null

  constructor() {
    this.onAudioPlayedListeners = []
    this.initialized = false
    this.audioContext = null
    this.analyser = null
    this.workletNode = null
    this.recorderNode = null
  }

  addEventListener(event: string, callback: AudioPlayedListener): void {
    switch (event) {
      case 'onAudioPlayed':
        this.onAudioPlayedListeners.push(callback)
        break
      default:
        console.error(
          'Listener registered for event type: ' + JSON.stringify(event) + ' which is not supported'
        )
    }
  }

  async start(): Promise<void> {
    try {
      console.log('AudioPlayer: Starting initialization...')

      // Create audio context
      this.audioContext = new AudioContext({ sampleRate: 24000 })
      console.log('AudioPlayer: AudioContext created, state:', this.audioContext.state)

      // Resume context if suspended (required in some browsers)
      if (this.audioContext.state === 'suspended') {
        console.log('AudioPlayer: Resuming suspended AudioContext...')
        await this.audioContext.resume()
        console.log('AudioPlayer: AudioContext resumed, state:', this.audioContext.state)
      }

      this.analyser = this.audioContext.createAnalyser()
      this.analyser.fftSize = 512
      console.log('AudioPlayer: Analyser created')

      // Get the appropriate worklet URL based on environment
      const workletUrl = getAudioWorkletUrl()
      console.log('AudioPlayer: Loading AudioWorklet from:', workletUrl)

      try {
        await this.audioContext.audioWorklet.addModule(workletUrl)
        console.log('AudioPlayer: AudioWorklet module loaded successfully')
      } catch (error) {
        console.error('AudioPlayer: Failed to load AudioWorklet module:', error)
        throw new Error(`Failed to load AudioWorklet module: ${error}`)
      }

      this.workletNode = new AudioWorkletNode(this.audioContext, 'audio-player-processor')
      console.log('AudioPlayer: AudioWorkletNode created')

      this.workletNode.connect(this.analyser)
      this.analyser.connect(this.audioContext.destination)
      console.log('AudioPlayer: Audio nodes connected')

      this.recorderNode = this.audioContext.createScriptProcessor(512, 1, 1)
      this.recorderNode.onaudioprocess = (event) => {
        // Pass the input along as-is
        const inputData = event.inputBuffer.getChannelData(0)
        const outputData = event.outputBuffer.getChannelData(0)
        outputData.set(inputData)
        // Notify listeners that the audio was played
        const samples = new Float32Array(outputData.length)
        samples.set(outputData)
        this.onAudioPlayedListeners.map((listener) => listener(samples))
      }
      console.log('AudioPlayer: ScriptProcessorNode created')

      this.maybeOverrideInitialBufferLength()
      this.initialized = true
      console.log('AudioPlayer: Initialization completed successfully')
    } catch (error) {
      console.error('AudioPlayer: Failed to initialize:', error)
      this.initialized = false
      throw error
    }
  }

  bargeIn(): void {
    if (this.workletNode) {
      this.workletNode.port.postMessage({
        type: 'barge-in'
      })
    }
  }

  stop(): void {
    if (ObjectExt.exists(this.audioContext)) {
      this.audioContext!.close()
    }

    if (ObjectExt.exists(this.analyser)) {
      this.analyser!.disconnect()
    }

    if (ObjectExt.exists(this.workletNode)) {
      this.workletNode!.disconnect()
    }

    if (ObjectExt.exists(this.recorderNode)) {
      this.recorderNode!.disconnect()
    }

    this.initialized = false
    this.audioContext = null
    this.analyser = null
    this.workletNode = null
    this.recorderNode = null
  }

  private maybeOverrideInitialBufferLength(): void {
    // Read a user-specified initial buffer length from the URL parameters to help with tinkering
    const params = new URLSearchParams(window.location.search)
    const value = params.get('audioPlayerInitialBufferLength')
    if (value === null) {
      return // No override specified
    }
    const bufferLength = parseInt(value)
    if (isNaN(bufferLength)) {
      console.error('Invalid audioPlayerInitialBufferLength value:', JSON.stringify(value))
      return
    }
    if (this.workletNode) {
      this.workletNode.port.postMessage({
        type: 'initial-buffer-length',
        bufferLength: bufferLength
      })
    }
  }

  playAudio(samples: Float32Array): void {
    if (!this.initialized) {
      console.error(
        'The audio player is not initialized. Call start() before attempting to play audio.'
      )
      return
    }
    if (this.workletNode) {
      this.workletNode.port.postMessage({
        type: 'audio',
        audioData: samples
      })
    }
  }

  getSamples(): number[] | null {
    if (!this.initialized || !this.analyser) {
      return null
    }
    const bufferLength = this.analyser.frequencyBinCount
    const dataArray = new Uint8Array(bufferLength)
    this.analyser.getByteTimeDomainData(dataArray)
    return [...dataArray].map((e) => e / 128 - 1)
  }

  getVolume(): number {
    if (!this.initialized || !this.analyser) {
      return 0
    }
    const bufferLength = this.analyser.frequencyBinCount
    const dataArray = new Uint8Array(bufferLength)
    this.analyser.getByteTimeDomainData(dataArray)
    const normSamples = [...dataArray].map((e) => e / 128 - 1)
    let sum = 0
    for (let i = 0; i < normSamples.length; i++) {
      sum += normSamples[i] * normSamples[i]
    }
    return Math.sqrt(sum / normSamples.length)
  }
}
