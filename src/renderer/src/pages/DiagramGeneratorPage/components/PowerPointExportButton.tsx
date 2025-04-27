import React, { useState, useCallback } from 'react'
import { motion } from 'framer-motion'
import { convertXmlToPptxandSave } from '../utils/pptx/xmlToPptx'
import { useTranslation } from 'react-i18next'
import { DrawIoEmbedRef } from 'react-drawio'

interface PowerPointExportButtonProps {
  xml: string
  disabled?: boolean
  drawioRef?: React.RefObject<DrawIoEmbedRef>
}

export const PowerPointExportButton: React.FC<PowerPointExportButtonProps> = ({ 
  xml, 
  disabled,
  drawioRef 
}) => {
  const [isExporting, setIsExporting] = useState(false)
  const [selectedScale, setSelectedScale] = useState<number>(1/96) // デフォルトは1/96
  const { t } = useTranslation()

  // スケール選択ハンドラー
  const handleScaleSelect = useCallback((scale: number) => {
    setSelectedScale(scale)
  }, [])

  const handleExport = async () => {
    if (disabled || !xml || isExporting) return

    try {
      setIsExporting(true)
      console.log('[PPTX Export] Starting PowerPoint export process')
      console.log('[PPTX Export] DrawIO ref exists:', !!drawioRef)
      console.log('[PPTX Export] DrawIO ref current exists:', !!(drawioRef?.current))
      console.log('[PPTX Export] Using scale factor:', selectedScale)
            
      // XMLからPowerPointファイルを生成し保存する
      await convertXmlToPptxandSave(xml, 'AWS Architecture Diagram', selectedScale)
      
    } catch (error) {
      console.error('[PPTX Export] Failed to export PowerPoint:', error)
      // TODO: エラー通知の表示
    } finally {
      setIsExporting(false)
    }
  }

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center gap-2 mb-2">
        <span className="text-sm text-gray-600 dark:text-gray-300">
          {t('scaleOptions', 'スケール:')}
        </span>
        <div className="flex gap-1">
          <button
            className={`px-2 py-1 text-xs rounded-md transition-colors duration-200 ${
              selectedScale === 1/96
                ? 'bg-blue-500 text-white'
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600'
            }`}
            onClick={() => handleScaleSelect(1/96)}
          >
            1/96
          </button>
          <button
            className={`px-2 py-1 text-xs rounded-md transition-colors duration-200 ${
              selectedScale === 1/144
                ? 'bg-blue-500 text-white'
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600'
            }`}
            onClick={() => handleScaleSelect(1/144)}
          >
            1/144
          </button>
          <button
            className={`px-2 py-1 text-xs rounded-md transition-colors duration-200 ${
              selectedScale === 1/192
                ? 'bg-blue-500 text-white'
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600'
            }`}
            onClick={() => handleScaleSelect(1/192)}
          >
            1/192
          </button>
        </div>
      </div>
      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        className={`
          flex items-center gap-2 px-3 py-2 rounded-md
          ${isExporting || disabled
            ? 'bg-gray-300 text-gray-500 cursor-not-allowed dark:bg-gray-700'
            : 'bg-blue-500 text-white hover:bg-blue-600 dark:bg-blue-600 dark:hover:bg-blue-700'}
          transition-colors duration-200
        `}
        onClick={handleExport}
        disabled={isExporting || disabled}
      >
      {isExporting ? (
        <>
          <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          {t('exporting', 'Exporting...')}
        </>
      ) : (
        <>
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm3.293-7.707a1 1 0 011.414 0L9 10.586V3a1 1 0 112 0v7.586l1.293-1.293a1 1 0 111.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z" clipRule="evenodd" />
          </svg>
          {t('exportToPowerPoint', 'Export to PowerPoint')}
        </>
      )}
      </motion.button>
    </div>
  )
}
