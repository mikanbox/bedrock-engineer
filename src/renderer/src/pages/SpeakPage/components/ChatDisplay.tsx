import React, { useEffect, useRef } from 'react'
import { ChatHistory, ChatMessage } from '../lib/ChatHistoryManager'
import { ThinkingState } from '../hooks/useSpeakChat'
import { ThinkingIndicator } from './ThinkingIndicator'

export interface ChatDisplayProps {
  chat: ChatHistory
  thinkingState: ThinkingState
  className?: string
  audioControls?: React.ReactNode
}

interface MessageItemProps {
  message: ChatMessage
  isLast: boolean
}

const MessageItem: React.FC<MessageItemProps> = ({ message, isLast }) => {
  const isUser = message.role.toUpperCase() === 'USER'
  const isAssistant = message.role.toUpperCase() === 'ASSISTANT'

  return (
    <div className={`flex ${isUser ? 'justify-end' : 'justify-start'} ${isLast ? 'mb-2' : 'mb-4'}`}>
      <div
        className={`max-w-[80%] ${
          isUser
            ? 'bg-blue-500 text-white'
            : isAssistant
              ? 'bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-gray-100'
              : 'bg-yellow-100 dark:bg-yellow-900 text-yellow-900 dark:text-yellow-100'
        } rounded-lg p-4 shadow-sm`}
      >
        {/* Role Label */}
        <div className="flex items-center space-x-2 mb-2">
          <div
            className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
              isUser
                ? 'bg-blue-600'
                : isAssistant
                  ? 'bg-gray-300 dark:bg-gray-600 text-gray-700 dark:text-gray-300'
                  : 'bg-yellow-300 dark:bg-yellow-700 text-yellow-800 dark:text-yellow-200'
            }`}
          >
            {isUser ? 'U' : isAssistant ? 'A' : 'S'}
          </div>
          <span
            className={`text-xs font-medium ${
              isUser
                ? 'text-blue-100'
                : isAssistant
                  ? 'text-gray-600 dark:text-gray-400'
                  : 'text-yellow-700 dark:text-yellow-300'
            }`}
          >
            {message.role.toUpperCase()}
          </span>
          {message.endOfResponse && (
            <span
              className={`text-xs ${
                isUser
                  ? 'text-blue-200'
                  : isAssistant
                    ? 'text-gray-500 dark:text-gray-400'
                    : 'text-yellow-600 dark:text-yellow-400'
              }`}
            >
              •
            </span>
          )}
        </div>

        {/* Message Content */}
        <div
          className={`text-sm leading-relaxed ${
            isUser
              ? 'text-white'
              : isAssistant
                ? 'text-gray-900 dark:text-gray-100'
                : 'text-yellow-900 dark:text-yellow-100'
          }`}
        >
          {message.message || 'No content'}
        </div>
      </div>
    </div>
  )
}

export const ChatDisplay: React.FC<ChatDisplayProps> = ({
  chat,
  thinkingState,
  className = '',
  audioControls
}) => {
  const chatContainerRef = useRef<HTMLDivElement>(null)

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight
    }
  }, [chat.history, thinkingState])

  const hasMessages = chat.history.length > 0
  const hasThinking =
    thinkingState.waitingForUserTranscription || thinkingState.waitingForAssistantResponse

  return (
    <div className={`flex flex-col h-full ${className}`}>
      {/* Chat Messages */}
      <div ref={chatContainerRef} className="flex-1 overflow-y-auto p-4 space-y-4">
        {!hasMessages && !hasThinking && (
          <div className="flex items-center justify-center h-full">
            <div className="text-center text-gray-500 dark:text-gray-400">
              <div className="w-16 h-16 mx-auto mb-4 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center">
                <svg
                  className="w-8 h-8 text-gray-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z"
                  />
                </svg>
              </div>
              <p className="text-lg font-medium mb-2">Ready to chat</p>
              <p className="text-sm mb-4">
                Click &quot;Start Speaking&quot; to begin your voice conversation
              </p>
              {audioControls && <div className="mt-4">{audioControls}</div>}
            </div>
          </div>
        )}

        {/* Render messages */}
        {chat.history.map((message, index) => (
          <MessageItem key={index} message={message} isLast={index === chat.history.length - 1} />
        ))}

        {/* Thinking indicators */}
        {hasThinking && (
          <div className="mt-4">
            <ThinkingIndicator thinkingState={thinkingState} />
          </div>
        )}
      </div>

      {/* Footer */}
      {hasMessages && (
        <div className="flex-shrink-0 p-2 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800">
          <div className="flex items-center justify-between">
            <button
              onClick={() => {
                if (chatContainerRef.current) {
                  chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight
                }
              }}
              className="text-xs text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 transition-colors"
            >
              Scroll to bottom
            </button>
            <span className="text-xs text-gray-500 dark:text-gray-400">
              {hasThinking ? 'Conversation in progress...' : 'Conversation paused'}
            </span>
          </div>
        </div>
      )}
    </div>
  )
}
