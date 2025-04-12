import React, { useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { useSettings } from '@renderer/contexts/SettingsContext'
import { LLM } from '@/types/llm'
import { Label, Select } from 'flowbite-react'

export const RecognizeImageSettingForm: React.FC = () => {
  const { t } = useTranslation()
  const { recognizeImageModel, setRecognizeImageModel, availableModels } = useSettings()

  // Claude関連モデルのみをフィルタリング
  const claudeModels = useMemo(() => {
    return availableModels
      .filter((model) => model.modelId.includes('anthropic.claude'))
      .sort((a, b) => a.modelName.localeCompare(b.modelName))
  }, [availableModels])

  // モデル変更のハンドラー
  const handleModelChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setRecognizeImageModel(e.target.value)
  }

  return (
    <div className="prose dark:prose-invert max-w-none">
      <div className="mb-6">
        <h3 className="text-lg font-medium">{t('Image Recognition Settings')}</h3>
        <p className="text-gray-600 dark:text-gray-400 mt-1 mb-4">
          {t('Select which model to use for image recognition tasks')}
        </p>
      </div>

      <div className="mb-6 max-w-lg">
        <div className="mb-4">
          <Label htmlFor="recognizeImageModel" value={t('Recognition Model')} />
          <Select
            id="recognizeImageModel"
            value={recognizeImageModel}
            onChange={handleModelChange}
            className="mt-2"
          >
            {claudeModels.map((model: LLM) => (
              <option key={model.modelId} value={model.modelId}>
                {model.modelName}
              </option>
            ))}
          </Select>
          <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
            {t('Only Claude models with vision capabilities are supported')}
          </p>
        </div>

        <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg">
          <h4 className="text-sm font-medium text-blue-700 dark:text-blue-300 mb-2">
            {t('About Image Recognition')}
          </h4>
          <p className="text-sm text-blue-700 dark:text-blue-300">
            {t(
              "Image recognition uses Claude's vision capabilities to analyze and describe images. The selected model will be used when you run the recognizeImage tool."
            )}
          </p>
        </div>
      </div>
    </div>
  )
}
