import React, { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { FlowConfig } from '@/types/agent-chat'

/**
 * FlowsContent コンポーネントのプロパティ
 */
export interface FlowsContentProps {
  flows: FlowConfig[]
  onChange: (flows: FlowConfig[]) => void
}

/**
 * Bedrock Flow 設定コンポーネント
 */
export const FlowsContent: React.FC<FlowsContentProps> = ({ flows, onChange }) => {
  const { t } = useTranslation()
  const [flowId, setFlowId] = useState('')
  const [flowAliasId, setFlowAliasId] = useState('')
  const [description, setDescription] = useState('')

  // 新しい Flow を追加する関数
  const addFlow = () => {
    if (!flowId || !flowAliasId) return

    const newFlow: FlowConfig = {
      flowId,
      flowAliasId,
      description
    }

    onChange([...flows, newFlow])

    // フォームをリセット
    setFlowId('')
    setFlowAliasId('')
    setDescription('')
  }

  // Flow を削除する関数
  const removeFlow = (index: number) => {
    const updatedFlows = [...flows]
    updatedFlows.splice(index, 1)
    onChange(updatedFlows)
  }

  return (
    <div className="space-y-4">
      <p className="text-sm text-gray-600 dark:text-gray-400">
        {t('Configure which Bedrock Flows this agent can access.')}
      </p>
      {/* 新しい Flow を登録するフォーム */}
      <div className="flex flex-col gap-2 p-4 border border-gray-200 dark:border-gray-700 rounded-md">
        <h4 className="font-medium text-sm mb-2 dark:text-gray-200">{t('Add New Bedrock Flow')}</h4>

        <div className="flex-grow">
          <label className="block text-xs text-gray-600 dark:text-gray-400 mb-1">
            {t('Flow ID')}
          </label>
          <input
            type="text"
            value={flowId}
            onChange={(e) => setFlowId(e.target.value)}
            placeholder="e.g., FLOW123456"
            className="w-full p-2 text-sm border rounded dark:bg-gray-800 dark:border-gray-700 dark:text-gray-200"
          />
        </div>

        <div className="flex-grow">
          <label className="block text-xs text-gray-600 dark:text-gray-400 mb-1">
            {t('Flow Alias ID')}
          </label>
          <input
            type="text"
            value={flowAliasId}
            onChange={(e) => setFlowAliasId(e.target.value)}
            placeholder="e.g., ALIAS123456"
            className="w-full p-2 text-sm border rounded dark:bg-gray-800 dark:border-gray-700 dark:text-gray-200"
          />
        </div>

        <div className="flex-grow">
          <label className="block text-xs text-gray-600 dark:text-gray-400 mb-1">
            {t('Description')}
          </label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="e.g., Data processing workflow"
            rows={3}
            className="w-full p-2 text-sm border rounded dark:bg-gray-800 dark:border-gray-700 dark:text-gray-200 resize-vertical"
          />
        </div>

        <button
          onClick={addFlow}
          disabled={!flowId || !flowAliasId}
          className="px-4 py-2 text-sm text-white bg-blue-500 rounded hover:bg-blue-600 disabled:bg-gray-400 disabled:cursor-not-allowed"
        >
          {t('Add Flow')}
        </button>
      </div>

      {/* 登録済みの Flow 一覧 */}
      <div className="space-y-3 mt-6">
        <h4 className="font-medium text-sm dark:text-gray-200">{t('Registered Bedrock Flows')}</h4>

        {flows.length === 0 ? (
          <p className="text-sm text-gray-500 dark:text-gray-400 italic">
            {t('No Bedrock Flows registered yet')}
          </p>
        ) : (
          flows.map((flow, index) => (
            <div
              key={index}
              className="flex flex-col p-3 text-sm bg-gray-100 dark:bg-gray-900 dark:text-gray-300 rounded border border-gray-200 dark:border-gray-700"
            >
              <div className="flex items-center justify-between">
                <span className="font-mono">
                  {t('Flow ID')}: {flow.flowId}
                </span>
                <div className="flex gap-2">
                  <button
                    onClick={() => removeFlow(index)}
                    className="text-red-500 hover:text-red-600 p-1"
                    title="Remove"
                    aria-label="Remove flow"
                  >
                    {t('Remove')}
                  </button>
                </div>
              </div>
              <div className="mt-1">
                <span className="text-xs text-gray-600 dark:text-gray-400">
                  {t('Flow Alias ID')}: {flow.flowAliasId}
                </span>
              </div>
              <p className="text-xs text-gray-600 dark:text-gray-400 mt-1 whitespace-pre-line">
                {flow.description}
              </p>
            </div>
          ))
        )}
      </div>
    </div>
  )
}
