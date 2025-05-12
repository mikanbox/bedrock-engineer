import React, { useMemo } from 'react'
import useSetting from '@renderer/hooks/useSetting'
import { AgentFormProps } from './types'
import { useAgentForm } from './useAgentForm'
import { usePromptGeneration } from './usePromptGeneration'
import { formEventUtils } from './utils/formEventUtils'
import { useAgentFilter } from '../AgentList'

// 分割されたコンポーネントのインポート
import { AgentFormSidebar } from './components/AgentFormSidebar'
import { AgentFormContent } from './components/AgentFormContent'
import { FormActionButtons } from './components/FormActionButtons'

/**
 * エージェント作成・編集フォームコンポーネント
 * サイドバー形式のレイアウトに変更し、階層をより明確に表示
 */
export const AgentForm: React.FC<AgentFormProps> = ({ agent, onSave, onCancel }) => {
  const { projectPath, agents } = useSetting()
  const { availableTags } = useAgentFilter(agents)

  // フォーム状態管理フック
  const {
    formData,
    activeTab,
    agentTools,
    agentCategory,
    isLoadingMcpTools,
    tempMcpTools,
    updateField,
    handleSubmit,
    handleToolsChange,
    handleCategoryChange,
    handleTabChange,
    fetchMcpTools
  } = useAgentForm(agent, onSave)

  // システムプロンプトとシナリオ更新ハンドラー
  const handleSystemPromptGenerated = React.useCallback(
    (prompt: string) => updateField('system', prompt),
    [updateField]
  )

  const handleScenariosGenerated = React.useCallback(
    (scenarios: Array<{ title: string; content: string }>) => updateField('scenarios', scenarios),
    [updateField]
  )

  const handleAdditionalInstructionChange = React.useCallback(
    (value: string) => updateField('additionalInstruction', value),
    [updateField]
  )

  // 標準ツールとMCPツールを結合
  const combinedTools = useMemo(() => {
    // MCPツールが存在し、有効なtoolSpecを持つもののみフィルタリング
    const mcpToolsToUse = tempMcpTools.filter((tool) => tool.toolSpec?.name)
    // 標準ツールとMCPツールを結合
    return [...agentTools, ...mcpToolsToUse]
  }, [agentTools, tempMcpTools])

  // プロンプト生成フック - 結合したツール情報を渡す
  const { generateSystemPrompt, generateScenarios, isGeneratingSystem, isGeneratingScenarios } =
    usePromptGeneration(
      formData.name,
      formData.description,
      formData.system,
      handleSystemPromptGenerated,
      handleScenariosGenerated,
      formData.additionalInstruction,
      combinedTools
    )

  // 合成された生成状態
  const isGenerating = isGeneratingSystem || isGeneratingScenarios

  return (
    <div>
      <form
        onSubmit={formEventUtils.createSubmitHandler(handleSubmit)}
        className="flex flex-col h-full"
        style={{ height: '100%', maxHeight: '100%', display: 'flex' }}
        onClick={formEventUtils.preventPropagation}
      >
        {/* スクロール可能なメインコンテンツエリア */}
        <div className="flex flex-1 min-h-0">
          {/* 左側のサイドバーナビゲーション - 画面幅に応じて幅を変更 */}
          <div className="lg:w-64 w-16 border-r border-gray-200 dark:border-gray-600 flex-shrink-0 overflow-y-auto transition-all duration-300 dark:bg-gray-800">
            <AgentFormSidebar
              activeTab={activeTab}
              onTabChange={handleTabChange}
              onToolsTabClick={() => fetchMcpTools(formData.mcpServers)}
            />
          </div>

          {/* 右側のコンテンツエリア - スクロール可能なコンテンツ */}
          <div className="flex-1 overflow-y-auto p-4 pb-16 dark:bg-gray-800">
            {/* タブコンテンツ */}
            <AgentFormContent
              activeTab={activeTab}
              formData={formData}
              agentTools={agentTools}
              agentCategory={agentCategory}
              updateField={updateField}
              handleToolsChange={handleToolsChange}
              handleCategoryChange={handleCategoryChange}
              projectPath={projectPath}
              isLoadingMcpTools={isLoadingMcpTools}
              tempMcpTools={tempMcpTools}
              handleAutoGeneratePrompt={generateSystemPrompt}
              handleGenerateScenarios={generateScenarios}
              isGeneratingSystem={isGeneratingSystem}
              isGeneratingScenarios={isGeneratingScenarios}
              availableTags={availableTags}
              fetchMcpTools={fetchMcpTools}
              handleAdditionalInstructionChange={handleAdditionalInstructionChange}
            />
          </div>
        </div>

        {/* フッター固定部分 - 常に画面下部に表示 */}
        <div className="flex-shrink-0 px-4 py-4 sticky bottom-0 z-10 bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700">
          <FormActionButtons onCancel={onCancel} isGenerating={isGenerating} />
        </div>
      </form>
    </div>
  )
}
