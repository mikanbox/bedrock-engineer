import React, { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { ChevronLeftIcon, ChevronRightIcon } from '@heroicons/react/24/outline'
import { Modal } from 'flowbite-react'
import { AVAILABLE_VOICES, VoiceId } from '../../constants/voices'
import { VoiceVisual } from './VoiceVisual'

interface VoiceSelectorProps {
  isOpen: boolean
  selectedVoiceId: VoiceId
  onSelectVoice: (voiceId: VoiceId) => void
  onStartNewChat: () => void
  onCancel: () => void
}

export const VoiceSelector: React.FC<VoiceSelectorProps> = ({
  isOpen,
  selectedVoiceId,
  onSelectVoice,
  onStartNewChat,
  onCancel
}) => {
  const { t } = useTranslation()
  const [currentIndex, setCurrentIndex] = useState(0)
  const [animationKey, setAnimationKey] = useState(0)

  // 現在選択されている音声のインデックスを設定
  useEffect(() => {
    const index = AVAILABLE_VOICES.findIndex((voice) => voice.id === selectedVoiceId)
    if (index !== -1) {
      setCurrentIndex(index)
      // モーダルが開かれた時もアニメーションを再実行
      if (isOpen) {
        setAnimationKey((prev) => prev + 1)
      }
    }
  }, [selectedVoiceId, isOpen])

  const currentVoice = AVAILABLE_VOICES[currentIndex]

  const handlePrevious = () => {
    const newIndex = currentIndex > 0 ? currentIndex - 1 : AVAILABLE_VOICES.length - 1
    setCurrentIndex(newIndex)
    onSelectVoice(AVAILABLE_VOICES[newIndex].id)
    // 音声切り替え時にアニメーションを再実行
    setAnimationKey((prev) => prev + 1)
  }

  const handleNext = () => {
    const newIndex = currentIndex < AVAILABLE_VOICES.length - 1 ? currentIndex + 1 : 0
    setCurrentIndex(newIndex)
    onSelectVoice(AVAILABLE_VOICES[newIndex].id)
    // 音声切り替え時にアニメーションを再実行
    setAnimationKey((prev) => prev + 1)
  }

  const handleStartNewChat = () => {
    onStartNewChat()
  }

  return (
    <Modal dismissible show={isOpen} onClose={onCancel} size="md">
      <Modal.Header>{t('Select Voice')}</Modal.Header>
      <Modal.Body>
        <div className="p-4 text-center">
          {/* Voice Selection */}
          <div className="flex items-center justify-center gap-8 mb-8">
            {/* Previous Button */}
            <button
              onClick={handlePrevious}
              className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
              aria-label="Previous voice"
            >
              <ChevronLeftIcon className="w-6 h-6 text-gray-600 dark:text-gray-300" />
            </button>

            {/* Voice Visual and Info */}
            <div className="flex flex-col items-center">
              <VoiceVisual voiceId={currentVoice.id} animationKey={animationKey} />

              <div className="mt-4 text-center">
                <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                  {currentVoice.name}
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-300 mb-1">
                  {t(currentVoice.description)}
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  {t(currentVoice.characteristics)}
                </p>
              </div>
            </div>

            {/* Next Button */}
            <button
              onClick={handleNext}
              className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
              aria-label="Next voice"
            >
              <ChevronRightIcon className="w-6 h-6 text-gray-600 dark:text-gray-300" />
            </button>
          </div>

          {/* Indicators */}
          <div className="flex justify-center gap-2 mb-8">
            {AVAILABLE_VOICES.map((_, index) => (
              <button
                key={index}
                onClick={() => {
                  setCurrentIndex(index)
                  onSelectVoice(AVAILABLE_VOICES[index].id)
                  // インジケーター選択時にもアニメーションを再実行
                  setAnimationKey((prev) => prev + 1)
                }}
                className={`w-2 h-2 rounded-full transition-colors ${
                  index === currentIndex
                    ? 'bg-blue-500'
                    : 'bg-gray-300 dark:bg-gray-600 hover:bg-gray-400 dark:hover:bg-gray-500'
                }`}
                aria-label={`Select ${AVAILABLE_VOICES[index].name}`}
              />
            ))}
          </div>
        </div>
      </Modal.Body>
      <Modal.Footer>
        <div className="flex justify-center gap-4">
          <button
            onClick={onCancel}
            className="px-6 py-2 text-gray-600 dark:text-gray-300 hover:text-gray-800 dark:hover:text-white transition-colors"
          >
            {t('Cancel')}
          </button>
          <button
            onClick={handleStartNewChat}
            className="px-6 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
          >
            {t('Start New Chat')}
          </button>
        </div>
      </Modal.Footer>
    </Modal>
  )
}
