import React, { useMemo } from 'react'
import useSetting from '@renderer/hooks/useSetting'
import { AgentFormProps } from './types'
import { useAgentForm } from './useAgentForm'
import { usePromptGeneration } from './usePromptGeneration'
import { formEventUtils } from './utils/formEventUtils'
import { useAgentFilter } from '../AgentList'

// 分割されたコンポーネントのインポート
import { AgentFormTabs } from './components/AgentFormTabs'
import { AgentFormContent } from './components/AgentFormContent'
import { FormActionButtons } from './components/FormActionButtons'

/**
 * エージェント作成・編集フォームコンポーネント
 * リファクタリングにより、コンポーネントを分割し責務を明確化
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
    <form
      onSubmit={formEventUtils.createSubmitHandler(handleSubmit)}
      className="space-y-4"
      style={{ minHeight: '1100px' }}
      onClick={formEventUtils.preventPropagation}
    >
      {/* タブ切り替えナビゲーション */}
      <AgentFormTabs
        activeTab={activeTab}
        onTabChange={handleTabChange}
        onToolsTabClick={() => fetchMcpTools(formData.mcpServers)}
      />

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

      {/* フォームアクションボタン */}
      <FormActionButtons onCancel={onCancel} isGenerating={isGenerating} />
    </form>
  )
}
