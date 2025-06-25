import React, { useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { useSettings } from '@renderer/contexts/SettingsContext'

type PlanActToggleProps = {
  className?: string
}

const planModeStyle = 'bg-yellow-300 text-gray-700'
const actModeStyle =
  'bg-gradient-to-r from-cyan-500 via-blue-500 to-cyan-400 bg-[length:200%_100%] animate-gradient-x text-white'
const unselectedStyle = 'bg-gray-50 dark:bg-gray-800 text-gray-300 hover:text-gray-400'

export const PlanActToggle: React.FC<PlanActToggleProps> = ({ className = '' }) => {
  const { t } = useTranslation()
  const { planMode, setPlanMode } = useSettings()

  // プラットフォームに応じたキー表示を決定
  const modifierKey = useMemo(() => {
    const isMac = navigator.platform.toLowerCase().includes('mac')
    return isMac ? '⌘' : 'Ctrl'
  }, [])

  return (
    <div
      className={`flex rounded-full border dark:border-gray-700 overflow-hidden bg-gray-800 ${className}`}
    >
      <button
        className={`px-3 py-1 text-xs font-medium transition-colors ${
          planMode ? planModeStyle : unselectedStyle
        }`}
        onClick={() => setPlanMode(true)}
        aria-pressed={planMode}
        title={t(`Plan mode - Read-only tools enabled (${modifierKey}+Shift+A)`)}
      >
        Plan
      </button>
      <button
        className={`px-3 py-1 text-xs font-medium transition-colors ${
          !planMode ? actModeStyle : unselectedStyle
        }`}
        onClick={() => setPlanMode(false)}
        aria-pressed={!planMode}
        title={t(`Act mode - All tools enabled (${modifierKey}+Shift+A)`)}
      >
        Act
      </button>
    </div>
  )
}
