import React, { useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { Label, Select } from 'flowbite-react'
import { useSettings } from '@renderer/contexts/SettingsContext'

export const ScreenCaptureSettingForm: React.FC = () => {
  const { t } = useTranslation()
  const { recognizeImageModel, setRecognizeImageModel, availableModels } = useSettings()

  // Vision-capable モデルをフィルタリング（Claude と Nova シリーズ）
  const visionCapableModels = useMemo(() => {
    return availableModels
      .filter(
        (model) =>
          model.modelId.includes('anthropic.claude') || model.modelId.includes('amazon.nova')
      )
      .sort((a, b) => a.modelName.localeCompare(b.modelName))
  }, [availableModels])

  return (
    <div className="prose dark:prose-invert max-w-none w-full">
      {/* ツールの説明 */}
      <div className="mb-6 w-full">
        <p className="mb-4 text-gray-700 dark:text-gray-300">
          {t(
            'tool info.screenCapture.description',
            'The screenCapture tool captures the current screen and saves it as an image file. When a recognition prompt is provided, the captured image will be automatically analyzed with AI to extract text content, identify UI elements, and provide detailed visual descriptions for debugging and documentation purposes.'
          )}
        </p>
      </div>

      {/* 設定フォーム */}
      <div className="flex flex-col gap-4 p-4 border border-gray-200 dark:border-gray-700 rounded-md mb-6 w-full">
        <h4 className="font-medium text-sm mb-2 dark:text-gray-200">
          {t('AI Image Analysis Settings')}
        </h4>

        {/* LLMモデル選択 */}
        <div className="w-full">
          <Label htmlFor="recognizeImageModel" value={t('AI Model for Image Analysis')} />
          <Select
            id="recognizeImageModel"
            value={recognizeImageModel}
            onChange={(e) => setRecognizeImageModel(e.target.value)}
            className="mt-2 w-full"
          >
            {visionCapableModels.map((model) => (
              <option key={model.modelId} value={model.modelId}>
                {model.modelName}
              </option>
            ))}
          </Select>
        </div>

        {/* 使用方法 */}
        <div className="mt-4 p-3 bg-blue-50 dark:bg-blue-900/20 dark:border dark:border-blue-700 rounded-md">
          <h5 className="font-medium mb-2 dark:text-blue-300">{t('How to Use')}</h5>
          <ul className="text-sm text-gray-700 dark:text-gray-200 space-y-1">
            <li>
              • <strong>{t('Screen capture only')}:</strong>{' '}
              {t('Use without any prompt to capture screen image only')}
            </li>
            <li>
              • <strong>{t('Screen capture + AI analysis')}:</strong>{' '}
              {t('Provide a recognition prompt to automatically analyze the captured image')}
            </li>
            <li>
              • <strong>{t('Example prompts')}:</strong>{' '}
              {t(
                '"Describe this error screen", "Extract all text from this image", "Analyze the UI layout"'
              )}
            </li>
          </ul>
        </div>

        {/* プラットフォーム要件 */}
        <div className="mt-4 p-3 bg-green-50 dark:bg-green-900/20 dark:border dark:border-green-700 rounded-md">
          <h5 className="font-medium mb-2 dark:text-green-300">{t('Platform Requirements')}</h5>
          <ul className="text-sm text-gray-700 dark:text-gray-200 space-y-1">
            <li>
              • <strong>macOS:</strong>{' '}
              {t(
                'Screen Recording permission required in System Preferences > Security & Privacy > Privacy > Screen Recording'
              )}
            </li>
          </ul>
        </div>
      </div>
    </div>
  )
}
