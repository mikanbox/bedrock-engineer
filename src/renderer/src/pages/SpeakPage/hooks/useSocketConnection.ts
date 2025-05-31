import { useEffect, useRef, useState, useCallback } from 'react'
import { io, Socket } from 'socket.io-client'

export type ConnectionStatus = 'disconnected' | 'connecting' | 'connected' | 'error'

export interface SocketEvents {
  contentStart: (data: any) => void
  textOutput: (data: any) => void
  audioOutput: (data: any) => void
  contentEnd: (data: any) => void
  streamComplete: () => void
  error: (error: any) => void
}

export interface UseSocketConnectionReturn {
  socket: Socket | null
  status: ConnectionStatus
  sendAudioInput: (audioData: string) => void
  sendPromptStart: () => void
  sendSystemPrompt: (prompt: string) => void
  sendAudioStart: () => void
  sendStopAudio: () => void
  connect: () => void
  disconnect: () => void
}

export function useSocketConnection(
  serverUrl?: string,
  events?: Partial<SocketEvents>
): UseSocketConnectionReturn {
  const [status, setStatus] = useState<ConnectionStatus>('disconnected')
  const socketRef = useRef<Socket | null>(null)

  // Connect to server
  const connect = useCallback(() => {
    if (socketRef.current?.connected) {
      return
    }

    if (!serverUrl) {
      console.error('Cannot connect: serverUrl is required')
      setStatus('error')
      events?.error?.(new Error('Server URL is required'))
      return
    }

    setStatus('connecting')

    try {
      const socket = io(serverUrl)
      socketRef.current = socket

      // Connection event handlers
      socket.on('connect', () => {
        console.log('Connected to server:', socket.id)
        setStatus('connected')
      })

      socket.on('disconnect', (reason) => {
        console.log('Disconnected from server:', reason)
        setStatus('disconnected')
      })

      socket.on('connect_error', (error) => {
        console.error('Connection error:', error)
        setStatus('error')
        events?.error?.(error)
      })

      // Application event handlers
      socket.on('contentStart', (data) => {
        console.log('contentStart received:', data)
        events?.contentStart?.(data)
      })

      socket.on('textOutput', (data) => {
        console.log('textOutput received:', data)
        events?.textOutput?.(data)
      })

      socket.on('audioOutput', (data) => {
        console.log('audioOutput received')
        events?.audioOutput?.(data)
      })

      socket.on('contentEnd', (data) => {
        console.log('contentEnd received:', data)
        events?.contentEnd?.(data)
      })

      socket.on('streamComplete', () => {
        console.log('streamComplete received')
        events?.streamComplete?.()
      })

      socket.on('error', (error) => {
        console.error('Socket error:', error)
        setStatus('error')
        events?.error?.(error)
      })
    } catch (error) {
      console.error('Failed to create socket connection:', error)
      setStatus('error')
      events?.error?.(error)
    }
  }, [serverUrl, events])

  // Disconnect from server
  const disconnect = useCallback(() => {
    if (socketRef.current) {
      socketRef.current.disconnect()
      socketRef.current = null
      setStatus('disconnected')
    }
  }, [])

  // Send audio input data
  const sendAudioInput = useCallback((audioData: string) => {
    if (socketRef.current?.connected) {
      socketRef.current.emit('audioInput', audioData)
    } else {
      console.warn('Cannot send audio input: socket not connected')
    }
  }, [])

  // Send prompt start
  const sendPromptStart = useCallback(() => {
    if (socketRef.current?.connected) {
      console.log('Sending promptStart')
      socketRef.current.emit('promptStart')
    } else {
      console.warn('Cannot send prompt start: socket not connected')
    }
  }, [])

  // Send system prompt
  const sendSystemPrompt = useCallback((prompt: string) => {
    if (socketRef.current?.connected) {
      console.log('Sending systemPrompt:', prompt)
      socketRef.current.emit('systemPrompt', prompt)
    } else {
      console.warn('Cannot send system prompt: socket not connected')
    }
  }, [])

  // Send audio start
  const sendAudioStart = useCallback(() => {
    if (socketRef.current?.connected) {
      console.log('Sending audioStart')
      socketRef.current.emit('audioStart')
    } else {
      console.warn('Cannot send audio start: socket not connected')
    }
  }, [])

  // Send stop audio
  const sendStopAudio = useCallback(() => {
    if (socketRef.current?.connected) {
      console.log('Sending stopAudio')
      socketRef.current.emit('stopAudio')
    } else {
      console.warn('Cannot send stop audio: socket not connected')
    }
  }, [])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      disconnect()
    }
  }, [disconnect])

  return {
    socket: socketRef.current,
    status,
    sendAudioInput,
    sendPromptStart,
    sendSystemPrompt,
    sendAudioStart,
    sendStopAudio,
    connect,
    disconnect
  }
}
