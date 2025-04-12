import React from 'react'
import LocalImage from '@renderer/components/LocalImage'
import { useTranslation } from 'react-i18next'

export interface RecognizeImageResponse {
  success: boolean
  name: string
  message: string
  result: {
    imagePath: string
    description: string
    modelUsed: string
  }
}

export const RecognizeImageResult: React.FC<{ response: RecognizeImageResponse }> = ({
  response
}) => {
  const { t } = useTranslation()
  const { result } = response

  return (
    <div className="flex flex-col md:flex-row gap-4 bg-gray-800 text-white dark:bg-gray-900 dark:text-gray-100 p-4 rounded-lg overflow-hidden shadow-sm border border-gray-700 dark:border-gray-800">
      {/* 左側：画像表示 */}
      <div className="flex-shrink-0 md:w-1/3">
        <LocalImage
          src={result.imagePath}
          alt={t('Analyzed image')}
          className="aspect-auto h-[25vh] object-contain"
        />
        <div className="mt-2 text-xs text-gray-400 truncate" title={result.imagePath}>
          {result.imagePath}
        </div>
      </div>

      {/* 右側：解析結果 */}
      <div className="flex-1 h-[25vh] overflow-y-auto">
        <h3 className="text-lg font-medium mb-2">{t('Image Analysis')}</h3>
        <div className="bg-gray-900 dark:bg-gray-800 p-3 rounded-md">
          <p className="text-gray-300 whitespace-pre-wrap">{result.description}</p>

          <div className="mt-4 text-xs text-gray-400">
            {t('Analyzed with')}: <span className="font-mono">{result.modelUsed}</span>
          </div>
        </div>
      </div>
    </div>
  )
}
