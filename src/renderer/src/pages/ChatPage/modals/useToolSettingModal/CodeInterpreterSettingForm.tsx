import React from 'react'
import { useTranslation } from 'react-i18next'
import { ToggleSwitch } from 'flowbite-react'
import { useSettings } from '@renderer/contexts/SettingsContext'

export const CodeInterpreterSettingForm: React.FC = () => {
  const { t } = useTranslation()
  const { codeInterpreterEnabled, setCodeInterpreterEnabled } = useSettings()

  const handleToggle = (enabled: boolean) => {
    setCodeInterpreterEnabled(enabled)
  }

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-base font-bold text-gray-900 dark:text-white mb-2">
          {t('Code Interpreter')}
        </h3>
        <p className="text-sm text-gray-500 dark:text-gray-400">
          {t(
            'Enable the AI to execute Python code in a secure Docker environment for data analysis, calculations, and code execution.'
          )}
        </p>
      </div>

      <div className="bg-yellow-50 dark:bg-yellow-900/20 p-4 rounded-md border border-yellow-200 dark:border-yellow-800">
        <div className="flex items-center justify-between mb-3">
          <div>
            <h5 className="font-medium text-yellow-800 dark:text-yellow-200">
              {t('Code Interpreter Status')}
            </h5>
            <p className="text-sm text-yellow-700 dark:text-yellow-300 mt-1">
              {t('Enable or disable the code interpreter functionality')}
            </p>
          </div>
          <ToggleSwitch checked={codeInterpreterEnabled} onChange={handleToggle} label="" />
        </div>
      </div>

      <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-md">
        <h5 className="font-medium mb-2 text-blue-800 dark:text-blue-200">
          {t('Features & Capabilities')}
        </h5>
        <ul className="text-sm text-gray-700 dark:text-gray-300 space-y-2">
          <li className="flex items-start">
            <span className="text-green-500 mr-2">•</span>
            {t('Execute Python code in a secure Docker container')}
          </li>
          <li className="flex items-start">
            <span className="text-green-500 mr-2">•</span>
            {t('No internet access for enhanced security')}
          </li>
          <li className="flex items-start">
            <span className="text-green-500 mr-2">•</span>
            {t('Automatic file generation and detection')}
          </li>
          <li className="flex items-start">
            <span className="text-green-500 mr-2">•</span>
            {t('Support for data analysis and visualization')}
          </li>
          <li className="flex items-start">
            <span className="text-green-500 mr-2">•</span>
            {t('Mathematical calculations and scientific computing')}
          </li>
        </ul>
      </div>

      <div className="bg-amber-50 dark:bg-amber-900/20 p-4 rounded-md border border-amber-200 dark:border-amber-800">
        <h5 className="font-medium mb-2 text-amber-800 dark:text-amber-200">
          {t('Security & Limitations')}
        </h5>
        <ul className="text-sm text-gray-700 dark:text-gray-300 space-y-2">
          <li className="flex items-start">
            <span className="text-amber-500 mr-2">•</span>
            {t('Code runs in an isolated Docker environment')}
          </li>
          <li className="flex items-start">
            <span className="text-amber-500 mr-2">•</span>
            {t('No network access to external resources')}
          </li>
          <li className="flex items-start">
            <span className="text-amber-500 mr-2">•</span>
            {t('Generated files are temporary and may be cleared')}
          </li>
          <li className="flex items-start">
            <span className="text-amber-500 mr-2">•</span>
            {t('Execution time limits may apply')}
          </li>
        </ul>
      </div>

      <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-md">
        <h5 className="font-medium mb-2 text-gray-800 dark:text-gray-200">{t('Usage Examples')}</h5>
        <div className="text-sm text-gray-700 dark:text-gray-300 space-y-2">
          <p>
            <strong>{t('Data Analysis:')}</strong>{' '}
            {t('Process CSV files, perform statistical analysis')}
          </p>
          <p>
            <strong>{t('Visualization:')}</strong>{' '}
            {t('Create charts and graphs using matplotlib or plotly')}
          </p>
          <p>
            <strong>{t('Math & Science:')}</strong>{' '}
            {t('Solve complex equations, numerical simulations')}
          </p>
          <p>
            <strong>{t('File Processing:')}</strong> {t('Generate reports, process text files')}
          </p>
        </div>
      </div>
    </div>
  )
}
