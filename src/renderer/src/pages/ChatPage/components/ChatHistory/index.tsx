import React, { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { FiMoreHorizontal, FiEdit2, FiTrash2, FiZap } from 'react-icons/fi'
import { RiArchiveStackLine } from 'react-icons/ri'
import { SessionMetadata } from '@/types/chat/history'
import { useChatHistory } from '@renderer/contexts/ChatHistoryContext'
import { generateSessionTitle } from '../../utils/titleGenerator'
import { useLightProcessingModel } from '@renderer/lib/modelSelection'

interface ChatHistoryProps {
  onSessionSelect: (sessionId: string) => void
  currentSessionId?: string
}

export const ChatHistory: React.FC<ChatHistoryProps> = ({ onSessionSelect, currentSessionId }) => {
  const [editingSessionId, setEditingSessionId] = useState<string>()
  const [editTitle, setEditTitle] = useState('')
  const [menuOpenSessionId, setMenuOpenSessionId] = useState<string>()
  const [isGlobalMenuOpen, setIsGlobalMenuOpen] = useState(false)
  const [isComposing, setIsComposing] = useState(false)
  const [isGenerating, setIsGenerating] = useState(false)
  const { getLightModelId } = useLightProcessingModel()
  const { t } = useTranslation()

  // ChatHistoryContext から sessions と操作関数を取得
  const { sessions, getSession, updateSessionTitle, deleteSession, deleteAllSessions } =
    useChatHistory()

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as HTMLElement
      if (editingSessionId && !target.closest('.editing-input')) {
        setEditingSessionId(undefined)
      }
      if (!target.closest('.global-menu') && !target.closest('.global-menu-button')) {
        setIsGlobalMenuOpen(false)
      }
      setMenuOpenSessionId(undefined)
    }
    document.addEventListener('click', handleClickOutside)
    return () => {
      document.removeEventListener('click', handleClickOutside)
    }
  }, [editingSessionId])

  const handleSessionClick = async (sessionId: string) => {
    onSessionSelect(sessionId)
  }

  const handleDeleteSession = async (sessionId: string, e: React.MouseEvent) => {
    e.stopPropagation()
    deleteSession(sessionId)
    setMenuOpenSessionId(undefined)
  }

  const handleDeleteAllSessions = async (e: React.MouseEvent) => {
    e.stopPropagation()
    const confirmed = window.confirm(t('Are you sure you want to delete all chat sessions?'))
    if (confirmed) {
      deleteAllSessions()
      setIsGlobalMenuOpen(false)
    }
  }

  const startEditing = (sessionId: string, title: string, e: React.MouseEvent) => {
    e.stopPropagation()
    setEditingSessionId(sessionId)
    setEditTitle(title)
    setMenuOpenSessionId(undefined)
  }

  const saveTitle = (sessionId: string, e: React.MouseEvent | React.KeyboardEvent) => {
    e.stopPropagation()
    if (editTitle.trim()) {
      updateSessionTitle(sessionId, editTitle.trim())
    }
    setEditingSessionId(undefined)
  }

  const generateAITitle = async (session: SessionMetadata, e: React.MouseEvent) => {
    e.stopPropagation()
    setIsGenerating(true)

    try {
      // セッションの詳細を取得
      const sessionDetails = getSession(session.id)
      if (!sessionDetails) {
        throw new Error('Session not found')
      }

      // 軽量処理用モデルIDを取得
      const lightModelId = getLightModelId()

      // 軽量モデルでタイトルを生成
      const newTitle = await generateSessionTitle(sessionDetails, lightModelId, t)

      if (newTitle) {
        // タイトルを更新
        updateSessionTitle(session.id, newTitle)
        setMenuOpenSessionId(undefined)
      }
    } catch (error) {
      console.error('Failed to generate AI title:', error)
      // エラーメッセージは generateSessionTitle 内で既に表示されるため不要
    } finally {
      setIsGenerating(false)
    }
  }

  const generateAITitleForAllSession = async (e: React.MouseEvent) => {
    try {
      setIsGenerating(true)
      for (const session of sessions) {
        // タイトルが 'Chat' で始まるセッションのみ対象とする
        if (session.title.startsWith('Chat')) {
          await generateAITitle(session, e)
        }
      }
      setIsGlobalMenuOpen(false)
    } finally {
      setIsGenerating(false)
    }
  }

  const toggleMenu = (sessionId: string, e: React.MouseEvent) => {
    e.stopPropagation()
    setMenuOpenSessionId(menuOpenSessionId === sessionId ? undefined : sessionId)
  }

  const toggleGlobalMenu = (e: React.MouseEvent) => {
    e.stopPropagation()
    setIsGlobalMenuOpen(!isGlobalMenuOpen)
  }

  const handleCompositionStart = () => {
    setIsComposing(true)
  }

  const handleCompositionEnd = () => {
    setIsComposing(false)
  }

  const handleKeyDown = (e: React.KeyboardEvent, sessionId: string) => {
    if (isComposing) return

    if (e.key === 'Enter') {
      saveTitle(sessionId, e)
    } else if (e.key === 'Escape') {
      setEditingSessionId(undefined)
    }
  }

  if (sessions.length === 0) {
    return (
      <div className="p-4 text-center text-gray-500 dark:text-gray-400">{t('No chat history')}</div>
    )
  }

  const menuButtonClasses =
    'text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-400 p-1 rounded-md hover:bg-gray-100 dark:hover:bg-gray-600 h-8 w-8 flex items-center justify-center'

  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleString()
  }

  return (
    <div className="chat-history p-3">
      <h2
        className="text-sm font-semibold mb-4 text-gray-800 dark:text-gray-200 flex items-center justify-between hover:cursor-pointer hover:text-gray-600 dark:hover:text-gray-300"
        onClick={toggleGlobalMenu}
      >
        <div className="flex items-center">
          <RiArchiveStackLine className="inline-block mr-2 w-4 h-4" />
          {t('Chat History')}
        </div>
        <div className="relative">
          {isGlobalMenuOpen && (
            <div
              className="global-menu absolute right-0 mt-1 w-48 bg-white dark:bg-gray-800 rounded-md shadow-lg border border-gray-200 dark:border-gray-700 z-10"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="py-1">
                <button
                  onClick={generateAITitleForAllSession}
                  disabled={isGenerating}
                  className="w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-2"
                >
                  {isGenerating ? (
                    <span className="animate-spin w-4 h-4">⌛</span>
                  ) : (
                    <FiZap className="w-4 h-4" />
                  )}
                  {t('Generate All Titles')}
                </button>
                <button
                  onClick={handleDeleteAllSessions}
                  className="w-full text-left px-4 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-2 border-t border-gray-100 dark:border-gray-700"
                >
                  <FiTrash2 className="w-4 h-4" />
                  {t('Delete All')}
                </button>
              </div>
            </div>
          )}
        </div>
      </h2>
      <div className="session-list space-y-2">
        {sessions.map((session) => (
          <div
            key={session.id}
            onClick={() => handleSessionClick(session.id)}
            className={`session-item p-3 rounded-lg cursor-pointer hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors duration-200
              ${currentSessionId === session.id ? 'bg-gray-200 dark:bg-gray-700' : ''}`}
          >
            <div className="flex justify-between items-center min-h-[32px]">
              {editingSessionId === session.id ? (
                <div
                  className="flex items-center w-full editing-input"
                  onClick={(e) => e.stopPropagation()}
                >
                  <input
                    type="text"
                    value={editTitle}
                    onChange={(e) => setEditTitle(e.target.value)}
                    className="flex-1 px-2 py-1 text-sm border rounded dark:bg-gray-800 dark:border-gray-600 min-w-0"
                    autoFocus
                    onKeyDown={(e) => handleKeyDown(e, session.id)}
                    onCompositionStart={handleCompositionStart}
                    onCompositionEnd={handleCompositionEnd}
                  />
                </div>
              ) : (
                <div className="flex items-center justify-between w-full">
                  <div className="relative flex-1 min-w-0 pr-2">
                    <h3
                      className="font-medium text-gray-800 dark:text-gray-200 text-sm truncate"
                      title={session.title}
                    >
                      {session.title}
                    </h3>
                    <p className="text-xs text-gray-500 dark:text-gray-400 whitespace-nowrap">
                      {formatDate(session.updatedAt)} · {session.messageCount} messages
                    </p>
                  </div>
                  <div className="relative flex-shrink-0">
                    <button
                      onClick={(e) => toggleMenu(session.id, e)}
                      className={menuButtonClasses}
                    >
                      <FiMoreHorizontal className="w-4 h-4" />
                    </button>
                    {menuOpenSessionId === session.id && (
                      <div
                        className="absolute right-0 mt-1 w-48 bg-white dark:bg-gray-800 rounded-md shadow-lg border border-gray-200 dark:border-gray-700 z-10"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <div className="py-1">
                          <button
                            onClick={(e) => startEditing(session.id, session.title, e)}
                            className="w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-2"
                          >
                            <FiEdit2 className="w-4 h-4" />
                            {t('Edit title')}
                          </button>
                          <button
                            onClick={(e) => generateAITitle(session, e)}
                            disabled={isGenerating}
                            className="w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-2 border-t border-gray-100 dark:border-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            {isGenerating ? (
                              <span className="animate-spin w-4 h-4">⌛</span>
                            ) : (
                              <FiZap className="w-4 h-4" />
                            )}
                            {t('Generate title')}
                          </button>
                          <button
                            onClick={(e) => handleDeleteSession(session.id, e)}
                            className="w-full text-left px-4 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-2 border-t border-gray-100 dark:border-gray-700"
                          >
                            <FiTrash2 className="w-4 h-4" />
                            {t('Delete')}
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
