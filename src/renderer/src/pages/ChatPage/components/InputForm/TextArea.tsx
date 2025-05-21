import React, { useCallback, useState, useMemo, useRef, useEffect } from 'react'
import { FiLoader, FiSend, FiX, FiChevronUp, FiChevronDown } from 'react-icons/fi'
import { useTranslation } from 'react-i18next'
import toast from 'react-hot-toast'
import { ModelSelector } from '../ModelSelector'
import { ThinkingModeSelector } from '../ThinkingModeSelector'
import { PlanActToggle } from './PlanActToggle'
import { useSettings } from '@renderer/contexts/SettingsContext'

export type AttachedImage = {
  file: File
  preview: string
  base64: string
}

type TextAreaProps = {
  value: string
  onChange: (value: string) => void
  onSubmit: (value: string, images: AttachedImage[]) => void
  disabled?: boolean
  isComposing: boolean
  setIsComposing: (value: boolean) => void
  sendMsgKey?: 'Enter' | 'Cmd+Enter'
}

export const TextArea: React.FC<TextAreaProps> = ({
  value,
  onChange,
  onSubmit,
  disabled = false,
  isComposing,
  setIsComposing,
  sendMsgKey = 'Enter'
}) => {
  const { t } = useTranslation()
  const { currentLLM, planMode, setPlanMode } = useSettings()
  const [dragActive, setDragActive] = useState(false)
  const [attachedImages, setAttachedImages] = useState<AttachedImage[]>([])
  const [isScrolledToBottom, setIsScrolledToBottom] = useState(true)
  const [isManuallyResized, setIsManuallyResized] = useState(false)
  const [textareaHeight, setTextareaHeight] = useState<number>(72) // 3行分の初期高さ (24px * 3)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  // プラットフォームに応じた Modifire キーの表示を決定
  const modifierKey = useMemo(() => {
    const isMac = navigator.platform.toLowerCase().includes('mac')
    return isMac ? '⌘' : 'Ctrl'
  }, [])

  // プレースホルダーテキストの生成
  const placeholder = useMemo(() => {
    return t('textarea.placeholder', { modifier: modifierKey })
  }, [t, modifierKey])

  // グローバルなキーボードショートカットのイベントリスナーを設定
  useEffect(() => {
    const handleGlobalKeyDown = (e: KeyboardEvent) => {
      // Cmd+Shift+A (または Ctrl+Shift+A) でPlan/Actモードを切り替え
      if ((e.metaKey || e.ctrlKey) && e.shiftKey && e.key.toLowerCase() === 'a') {
        e.preventDefault()
        setPlanMode(!planMode)
      }
    }

    window.addEventListener('keydown', handleGlobalKeyDown)
    return () => {
      window.removeEventListener('keydown', handleGlobalKeyDown)
    }
  }, [planMode, setPlanMode, t])

  // ユーザーが手動でリサイズしたことを検知する
  useEffect(() => {
    const textarea = textareaRef.current
    if (!textarea) return

    const handleMouseDown = (e: MouseEvent) => {
      // リサイズハンドルでのマウスダウンを検知
      const { clientX, clientY } = e
      const { bottom, right } = textarea.getBoundingClientRect()
      const resizeHandleSize = 16 // リサイズハンドルのサイズ（ピクセル）

      // マウスがテキストエリアの右下隅（リサイズハンドル）にあるかどうかを確認
      if (
        clientX > right - resizeHandleSize &&
        clientX < right &&
        clientY > bottom - resizeHandleSize &&
        clientY < bottom
      ) {
        const handleMouseUp = () => {
          setIsManuallyResized(true)
          document.removeEventListener('mouseup', handleMouseUp)
        }
        document.addEventListener('mouseup', handleMouseUp)
      }
    }

    textarea.addEventListener('mousedown', handleMouseDown)
    return () => {
      textarea.removeEventListener('mousedown', handleMouseDown)
    }
  }, [])

  // テキストエリアの高さを自動調整する（ユーザーが手動でリサイズしていない場合のみ）
  useEffect(() => {
    if (textareaRef.current && !isManuallyResized) {
      // テキストエリアのスクロールの高さまでリサイズする（最小の高さは3行分、最大は10行分）
      textareaRef.current.style.height = 'auto'
      const lineHeight = 24 // 1行あたり約24px
      const minHeight = 3 * lineHeight // 3行分の高さ
      const maxHeight = 10 * lineHeight // 4行分の高さ（これを超えるとスクロール）
      const scrollHeight = textareaRef.current.scrollHeight

      // 高さを制限し、10行を超える場合はオーバーフロー設定を変更
      if (scrollHeight > maxHeight) {
        textareaRef.current.style.height = `${maxHeight}px`
        textareaRef.current.style.overflowY = 'auto' // スクロールバーを表示
      } else {
        textareaRef.current.style.height = `${Math.max(minHeight, scrollHeight)}px`
        textareaRef.current.style.overflowY = 'hidden' // スクロールバーを非表示
      }
    }
  }, [value, isManuallyResized])

  // スクロール位置を監視して、最下部までスクロールしたかどうかを判定する
  useEffect(() => {
    const textarea = textareaRef.current
    if (!textarea) return

    const handleScroll = () => {
      const isAtBottom = textarea.scrollHeight - textarea.scrollTop - textarea.clientHeight < 10
      setIsScrolledToBottom(isAtBottom)
    }

    textarea.addEventListener('scroll', handleScroll)
    // 初期状態を設定
    handleScroll()

    return () => {
      textarea.removeEventListener('scroll', handleScroll)
    }
  }, [])

  const validateAndProcessImage = useCallback(
    (file: File) => {
      if (file.size > 3.75 * 1024 * 1024) {
        toast.error(t('textarea.imageValidation.tooLarge'))
        return
      }

      const reader = new FileReader()
      reader.onload = () => {
        const base64 = reader.result as string
        const img = new Image()
        img.onload = () => {
          if (img.width > 8000 || img.height > 8000) {
            toast.error(t('textarea.imageValidation.dimensionTooLarge'))
            return
          }
          setAttachedImages((prev) => [
            ...prev,
            {
              file,
              preview: base64,
              base64: base64.split(',')[1]
            }
          ])
        }
        img.src = base64
      }
      reader.readAsDataURL(file)
    },
    [t]
  )

  const handlePaste = useCallback(
    async (e: React.ClipboardEvent) => {
      const items = e.clipboardData?.items
      if (!items) return

      const imageItems = Array.from(items).filter((item) => item.type.indexOf('image') !== -1)

      if (imageItems.length === 0) return

      if (attachedImages.length + imageItems.length > 20) {
        toast.error(t('textarea.imageValidation.tooManyImages'))
        return
      }

      for (const item of imageItems) {
        const file = item.getAsFile()
        if (!file) continue

        const fileType = file.type.split('/')[1].toLowerCase()
        if (!['png', 'jpeg', 'jpg', 'gif', 'webp'].includes(fileType)) {
          toast.error(t('textarea.imageValidation.unsupportedFormat', { format: fileType }))
          continue
        }

        validateAndProcessImage(file)
      }
    },
    [attachedImages.length, validateAndProcessImage, t]
  )

  const handleKeyDown = (e: React.KeyboardEvent) => {
    // Cmd+Shift+A でPlan/Actモードを切り替え（テキストエリア内でも有効にする）
    if ((e.metaKey || e.ctrlKey) && e.shiftKey && e.key.toLowerCase() === 'a') {
      e.preventDefault()
      setPlanMode(!planMode)

      // モード切り替え通知
      const newMode = !planMode ? 'Plan' : 'Act'
      toast.success(t(`Switched to ${newMode} mode`), {
        duration: 2000,
        position: 'bottom-center',
        icon: '🔄'
      })
      return
    }

    // メッセージ送信のキー入力処理
    if (isComposing) {
      return
    }

    const cmdenter = e.key === 'Enter' && (e.metaKey || e.ctrlKey)
    const enter = e.key === 'Enter'

    if (
      (sendMsgKey === 'Enter' && enter && !e.shiftKey) ||
      (sendMsgKey === 'Cmd+Enter' && cmdenter)
    ) {
      e.preventDefault()
      handleSubmit()
    }
  }

  const handleSubmit = () => {
    if (value.trim() === '') {
      toast.error(t('Enter at least one character of text'))
      return
    }
    if (value.trim() || attachedImages.length > 0) {
      onSubmit(value, attachedImages)
      setAttachedImages([])
    }
  }

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true)
    } else if (e.type === 'dragleave') {
      setDragActive(false)
    }
  }, [])

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault()
      e.stopPropagation()
      setDragActive(false)

      const allFiles = Array.from(e.dataTransfer.files)

      // 画像ファイルと非画像ファイルを分ける
      const imageFiles = allFiles.filter((file) => {
        const fileType = file.type.split('/')[0]
        return fileType === 'image'
      })

      const nonImageFiles = allFiles.filter((file) => {
        const fileType = file.type.split('/')[0]
        return fileType !== 'image'
      })

      // 画像ファイルを処理
      const validImageFiles = imageFiles.filter((file) => {
        const type = file.type.split('/')[1]?.toLowerCase()
        if (!type || !['png', 'jpeg', 'jpg', 'gif', 'webp'].includes(type)) {
          toast.error(
            t('textarea.imageValidation.unsupportedFormat', { format: type || 'unknown' })
          )
          return false
        }
        return true
      })

      if (attachedImages.length + validImageFiles.length > 20) {
        toast.error(t('textarea.imageValidation.tooManyImages'))
        return
      }

      validImageFiles.forEach(validateAndProcessImage)

      // 非画像ファイルのパスをテキストエリアに追加
      if (nonImageFiles.length > 0) {
        const filePaths = nonImageFiles.map((file) => file.path || file.name).join('\n')

        // 現在のカーソル位置またはテキスト末尾に挿入
        if (textareaRef.current) {
          const cursorPos = textareaRef.current.selectionStart
          const currentValue = value
          const newValue =
            currentValue.substring(0, cursorPos) + filePaths + currentValue.substring(cursorPos)

          onChange(newValue)
        } else {
          // テキストエリア参照がない場合は末尾に追加
          onChange(value + (value ? '\n' : '') + filePaths)
        }
      }
    },
    [attachedImages.length, validateAndProcessImage, t, value, onChange]
  )

  const removeImage = (index: number) => {
    setAttachedImages((prev) => prev.filter((_, i) => i !== index))
  }

  return (
    <div className="relative w-full">
      {attachedImages.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-2">
          {attachedImages.map((image, index) => (
            <div key={index} className="relative group">
              <img
                src={image.preview}
                alt={t('textarea.aria.removeImage')}
                className="w-20 h-20 object-cover rounded-lg"
              />
              <button
                onClick={() => removeImage(index)}
                className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                aria-label={t('textarea.aria.removeImage')}
              >
                <FiX size={14} />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Container with border that wraps both textarea and controls */}
      <div
        className={`relative border border-gray-300 rounded-lg bg-gray-50 dark:bg-gray-800 dark:border-gray-700 ${
          dragActive ? 'border-blue-500' : ''
        }`}
        onDragEnter={handleDrag}
      >
        <div className="relative textarea-container">
          {/* Resize bar at the top */}
          <div
            className="resize-bar h-2 w-full bg-gray-200 hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600 cursor-ns-resize rounded-t-lg"
            onMouseDown={(e) => {
              e.preventDefault()

              // 初期位置を記録
              const startY = e.clientY
              // 現在のテキストエリアの実際の高さを取得（stateではなく実際のDOM要素から）
              const startHeight = textareaRef.current
                ? textareaRef.current.clientHeight
                : textareaHeight

              // マウスの移動を追跡
              const handleMouseMove = (moveEvent: MouseEvent) => {
                // 移動距離を計算（上に移動すると高さ増加、下に移動すると高さ減少）
                const deltaY = startY - moveEvent.clientY
                // 現在の高さから直接変更する（最小値と最大値の制約あり）
                const newHeight = Math.max(72, Math.min(500, startHeight + deltaY))

                if (textareaRef.current) {
                  setTextareaHeight(newHeight)
                  textareaRef.current.style.height = `${newHeight}px`
                  setIsManuallyResized(true)
                }
              }

              // マウスボタンが離されたときのハンドラ
              const handleMouseUp = () => {
                document.removeEventListener('mousemove', handleMouseMove)
                document.removeEventListener('mouseup', handleMouseUp)
              }

              // イベントリスナーを追加
              document.addEventListener('mousemove', handleMouseMove)
              document.addEventListener('mouseup', handleMouseUp)
            }}
          />

          {/* Textarea without border */}
          <textarea
            ref={textareaRef}
            onCompositionStart={() => setIsComposing(true)}
            onCompositionEnd={() => setIsComposing(false)}
            className="block w-full p-4 pb-16 text-sm text-gray-900 border-none bg-transparent dark:text-white resize-none focus:outline-none focus:ring-0"
            placeholder={placeholder}
            value={value}
            onChange={(e) => {
              onChange(e.target.value)
            }}
            onKeyDown={(e) => !disabled && handleKeyDown(e)}
            onPaste={handlePaste}
            onDragEnter={handleDrag}
            onDragLeave={handleDrag}
            onDragOver={handleDrag}
            onDrop={handleDrop}
            required
            rows={3}
            style={{ height: `${textareaHeight}px` }}
          />
        </div>

        {/* Controls at the bottom */}
        <div
          className={`absolute bottom-0 left-0 right-0 flex items-center justify-between px-4 py-2 bg-gray-50 dark:bg-gray-800 rounded-b-lg ${isScrolledToBottom ? 'border-t border-gray-200 dark:border-gray-700' : ''}`}
        >
          <div className="flex items-center gap-2.5 z-10 pointer-events-auto">
            <div>
              <ModelSelector openable={true} />
            </div>
            {currentLLM.modelId.includes('anthropic.claude-3-7-sonnet') && (
              <div>
                <ThinkingModeSelector />
              </div>
            )}
          </div>

          <div className="flex items-center gap-2">
            <div>
              <PlanActToggle />
            </div>
            <button
              onClick={handleSubmit}
              disabled={disabled}
              className={`rounded-lg ${
                disabled ? '' : 'hover:bg-gray-200'
              } px-2 py-2 dark:text-white dark:hover:bg-gray-700`}
              aria-label={disabled ? t('textarea.aria.sending') : t('textarea.aria.sendMessage')}
            >
              {disabled ? (
                <FiLoader className="text-xl animate-spin" />
              ) : (
                <FiSend className="text-xl" />
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
