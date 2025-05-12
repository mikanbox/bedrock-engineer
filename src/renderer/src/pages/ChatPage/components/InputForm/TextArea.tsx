import React, { useCallback, useState, useMemo, useRef, useEffect } from 'react'
import { FiLoader, FiSend, FiX } from 'react-icons/fi'
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

  // テキストエリアの高さを自動調整する（10行まで）
  useEffect(() => {
    if (textareaRef.current) {
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
  }, [value])

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

      <div
        className={`relative ${dragActive ? 'bg-gray-100 dark:bg-gray-700' : ''}`}
        onDragEnter={handleDrag}
      >
        <div className="relative">
          <textarea
            ref={textareaRef}
            onCompositionStart={() => setIsComposing(true)}
            onCompositionEnd={() => setIsComposing(false)}
            className={`block w-full p-4 pb-16 text-sm text-gray-900 border border-gray-300 rounded-lg bg-gray-50 dark:text-white dark:bg-gray-800 z-9 resize-none ${
              dragActive ? 'border-blue-500' : ''
            }`}
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
          />

          {/* Model Selector, Thinking Mode, and Plan/Act Toggle at the bottom of textarea */}
          <div className="absolute left-4 bottom-3.5 flex items-center gap-2.5 z-10 pointer-events-auto">
            <div>
              <ModelSelector openable={true} />
            </div>
            {currentLLM.modelId.includes('anthropic.claude-3-7-sonnet') && (
              <div>
                <ThinkingModeSelector />
              </div>
            )}
          </div>

          {/* Plan/Act Toggle at the bottom right of textarea */}
          <div className="absolute right-14 bottom-3.5 z-10 pointer-events-auto">
            <PlanActToggle />
          </div>

          <button
            onClick={handleSubmit}
            disabled={disabled}
            className={`absolute end-2.5 bottom-2.5 rounded-lg ${
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
  )
}
