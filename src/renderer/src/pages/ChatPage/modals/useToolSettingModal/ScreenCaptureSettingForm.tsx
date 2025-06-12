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

        {/* 使用方法の説明 */}
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

        {/* AI分析機能の説明 */}
        <div className="mt-4 p-3 bg-purple-50 dark:bg-purple-900/20 dark:border dark:border-purple-700 rounded-md">
          <h5 className="font-medium mb-2 dark:text-purple-300">{t('AI Analysis Features')}</h5>
          <ul className="text-sm text-gray-700 dark:text-gray-200 space-y-1">
            <li>• {t('Extract and transcribe all visible text content')}</li>
            <li>• {t('Identify UI elements, buttons, and interface components')}</li>
            <li>• {t('Detect and describe error messages or alerts')}</li>
            <li>• {t('Provide contextual descriptions for debugging assistance')}</li>
            <li>• {t('Generate detailed visual documentation automatically')}</li>
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
            <li>
              • <strong>Windows/Linux:</strong> {t('No special permissions required')}
            </li>
            <li>• {t('Screenshots are automatically saved as PNG format for optimal quality')}</li>
            <li>• {t('Temporary files are automatically cleaned up after processing')}</li>
          </ul>
        </div>

        {/* 使用例 */}
        <div className="mt-4 p-3 bg-yellow-50 dark:bg-yellow-900/20 dark:border dark:border-yellow-700 rounded-md">
          <h5 className="font-medium mb-2 dark:text-yellow-300">{t('Usage Examples')}</h5>
          <ul className="text-sm text-gray-700 dark:text-gray-200 space-y-1">
            <li>• {t('Debug UI issues by capturing and analyzing error screens')}</li>
            <li>• {t('Generate documentation with automatic screen captures and descriptions')}</li>
            <li>• {t('Analyze application layouts and suggest improvements with AI insights')}</li>
            <li>• {t('Create visual bug reports with contextual AI-generated descriptions')}</li>
            <li>
              • {t("Extract text content from applications that don't support text selection")}
            </li>
            <li>• {t('Convert screenshots into searchable text content for documentation')}</li>
            <li>• {t('Analyze competitor interfaces and provide detailed descriptions')}</li>
          </ul>
        </div>

        {/* セキュリティ・プライバシー情報 */}
        <div className="mt-4 p-3 bg-red-50 dark:bg-red-900/20 dark:border dark:border-red-700 rounded-md">
          <h5 className="font-medium mb-2 dark:text-red-300">{t('Security & Privacy')}</h5>
          <ul className="text-sm text-gray-700 dark:text-gray-200 space-y-1">
            <li>• {t('Screenshots may contain sensitive information - use with caution')}</li>
            <li>• {t('AI analysis is performed using your configured AWS Bedrock models')}</li>
            <li>• {t('Captured images are temporarily stored and automatically cleaned up')}</li>
            <li>• {t('Only enable screen capture when necessary for your workflow')}</li>
            <li>
              • {t('Consider the privacy implications when capturing screens with personal data')}
            </li>
          </ul>
        </div>

        {/* パフォーマンス情報 */}
        <div className="mt-4 p-3 bg-gray-50 dark:bg-gray-800/20 dark:border dark:border-gray-600 rounded-md">
          <h5 className="font-medium mb-2 dark:text-gray-300">{t('Performance Notes')}</h5>
          <ul className="text-sm text-gray-700 dark:text-gray-200 space-y-1">
            <li>• {t('Screen capture is typically very fast (< 1 second)')}</li>
            <li>• {t('AI analysis may take 5-15 seconds depending on image complexity')}</li>
            <li>• {t('Claude 3.5 Haiku is faster but less detailed than Claude 3.5 Sonnet')}</li>
            <li>• {t('Large or high-resolution screens may take longer to analyze')}</li>
            <li>• {t('Network latency affects AI analysis response time')}</li>
          </ul>
        </div>
      </div>
    </div>
  )
}
