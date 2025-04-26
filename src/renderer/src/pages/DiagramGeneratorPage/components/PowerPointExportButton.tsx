import React, { useState } from 'react'
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
  const { t } = useTranslation()

  const handleExport = async () => {
    if (disabled || !xml || isExporting) return

    try {
      setIsExporting(true)
      console.log('[PPTX Export] Starting PowerPoint export process')
      console.log('[PPTX Export] DrawIO ref exists:', !!drawioRef)
      console.log('[PPTX Export] DrawIO ref current exists:', !!(drawioRef?.current))
            
      // XMLからPowerPointファイルを生成し保存する
      await convertXmlToPptxandSave(xml, 'AWS Architecture Diagram')
      
    } catch (error) {
      console.error('[PPTX Export] Failed to export PowerPoint:', error)
      // TODO: エラー通知の表示
    } finally {
      setIsExporting(false)
    }
  }

  return (
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
  )
}