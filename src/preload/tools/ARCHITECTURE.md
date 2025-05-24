# Tool System Architecture Guide

## 概要

このドキュメントは、Bedrock Engineer のツールシステムのアーキテクチャと、新しいツールを実装する際のガイドラインを提供します。

## ディレクトリ構造

```
/src/preload/tools/
├── base/              # 基底クラスと共通型
│   ├── types.ts       # 共通型定義
│   ├── errors.ts      # 統一エラークラス
│   └── BaseTool.ts    # 抽象基底クラス
├── common/            # 共通コンポーネント
│   ├── ChunkManager.ts # チャンク処理
│   ├── StoreManager.ts # ストアアクセス
│   └── Logger.ts      # ロギング
├── handlers/          # ツール実装
│   ├── filesystem/    # ファイルシステム関連
│   ├── bedrock/       # AWS Bedrock関連
│   ├── web/           # Web関連
│   ├── command/       # コマンド実行
│   ├── thinking/      # 思考ツール
│   └── mcp/           # MCP統合
├── registry.ts        # ツール登録システム
└── index.ts           # エントリーポイント
```

## アーキテクチャの原則

### 1. 単一責任の原則

- 各ツールは1つの明確な責任を持つ
- ツール間の依存関係を最小限に抑える

### 2. 依存性注入

- すべてのツールは `ToolDependencies` を通じて共通機能にアクセス
- 直接的な依存関係を避け、テスタビリティを向上

### 3. 統一インターフェース

- すべてのツールは `BaseTool` を継承
- 一貫したエラーハンドリングとロギング

### 4. 自己完結性

- 各ツールは必要な設定を自身で取得
- 外部からの設定注入に依存しない

## ツール実装ガイド

### 基本的な実装パターン

```typescript
import { BaseTool } from '../../base/BaseTool'
import { ValidationResult } from '../../base/types'
import { ExecutionError } from '../../base/errors'
import { ToolResult } from '../../../../types/tools'

// 1. 入力型の定義
interface MyToolInput {
  type: 'myTool' // ツール名と一致させる
  requiredParam: string
  optionalParam?: number
}

// 2. 結果型の定義（必要に応じて）
interface MyToolResult extends ToolResult {
  name: 'myTool'
  result: {
    // 結果の構造を定義
  }
}

// 3. ツールクラスの実装
export class MyTool extends BaseTool<MyToolInput, MyToolResult> {
  readonly name = 'myTool'
  readonly description = 'ツールの説明'

  // 4. 入力検証
  protected validateInput(input: MyToolInput): ValidationResult {
    const errors: string[] = []

    if (!input.requiredParam) {
      errors.push('Required parameter is missing')
    }

    return {
      isValid: errors.length === 0,
      errors
    }
  }

  // 5. ツールの実行ロジック
  protected async executeInternal(input: MyToolInput): Promise<MyToolResult> {
    // 実装
  }

  // 6. 互換性のためのオプション
  protected shouldReturnErrorAsString(): boolean {
    return true // 旧システムとの互換性が必要な場合
  }

  // 7. ログ用の入力サニタイズ（オプション）
  protected sanitizeInputForLogging(input: MyToolInput): any {
    return {
      ...input,
      sensitiveData: '[REDACTED]'
    }
  }
}
```

### ストアからの設定取得

ツールが実行時に設定を必要とする場合、`StoreManager` を使用して取得します：

```typescript
protected async executeInternal(input: MyToolInput): Promise<MyToolResult> {
  // ストアから設定を取得
  const config = this.storeManager.get('myToolConfig') as MyConfig | undefined
  const apiKey = config?.apiKey

  if (!apiKey) {
    throw new ExecutionError('API key not configured', this.name)
  }

  // デフォルト値の設定例
  const settings = this.storeManager.get('settings') as Settings | undefined
  const timeout = settings?.timeout || 5000  // デフォルト: 5秒

  // 実装の続き...
}
```

### エラーハンドリング

適切なエラータイプを使用してエラーを投げます：

```typescript
import {
  ExecutionError,
  ValidationError,
  NetworkError,
  PermissionDeniedError
} from '../../base/errors'

// 実行エラー
throw new ExecutionError('詳細なエラーメッセージ', this.name, originalError, metadata)

// ネットワークエラー
throw new NetworkError('API呼び出しに失敗', this.name, url, statusCode)

// 権限エラー
throw new PermissionDeniedError('権限がありません', this.name, resource)
```

### ロギング

構造化ログを使用して、デバッグとモニタリングを容易にします：

```typescript
// デバッグログ
this.logger.debug('処理を開始', {
  param1: input.param1,
  param2: input.param2
})

// 情報ログ
this.logger.info('処理が完了', {
  resultCount: results.length,
  duration: Date.now() - startTime
})

// エラーログ
this.logger.error('エラーが発生', {
  error: error.message,
  stack: error.stack,
  input: this.sanitizeInputForLogging(input)
})
```

### チャンク処理

大きなデータを扱う場合は、`ChunkManager` を使用します：

```typescript
// チャンクの作成とキャッシュ
const chunks = await this.chunkManager.getOrCreate(
  'file', // タイプ: 'file' | 'directory' | 'web'
  cacheKey,
  async () => ChunkManager.createFileChunks(content, filePath, chunkSize)
)

// 特定のチャンクを取得
if (input.chunkIndex) {
  const chunk = this.chunkManager.getChunk(chunks, input.chunkIndex)
  return ChunkManager.formatChunkOutput(chunk, 'File Content')
}
```

## ツールの登録

### 1. インデックスファイルの作成

各カテゴリに `index.ts` を作成：

```typescript
// handlers/mycategory/index.ts
export { MyTool } from './MyTool'

import type { ToolDependencies } from '../../base/types'
import { MyTool } from './MyTool'

export function createMyCategoryTools(dependencies: ToolDependencies) {
  return [{ tool: new MyTool(dependencies), category: 'mycategory' as const }]
}
```

### 2. メインインデックスへの登録

`src/preload/tools/index.ts` に追加：

```typescript
// Register my category tools
const { createMyCategoryTools } = await import('./handlers/mycategory')
const myCategoryTools = createMyCategoryTools(dependencies)
myCategoryTools.forEach(({ tool, category }) => {
  toolRegistry!.register(tool, category)
})
```

## ベストプラクティス

### 1. 型安全性

- 入力と出力の型を明確に定義
- 型アサーションは最小限に
- ジェネリクスを活用

### 2. エラーハンドリング

- 適切なエラータイプを使用
- エラーメッセージは具体的に
- メタデータを含める

### 3. ロギング

- 構造化ログを使用
- センシティブデータをサニタイズ
- 適切なログレベルを選択

### 4. パフォーマンス

- 大きなデータはチャンク処理
- 不要な処理を避ける
- 非同期処理を適切に使用

### 5. テスタビリティ

- 依存性注入を活用
- 純粋関数として実装可能な部分は分離
- モックしやすい設計

## よくある実装パターン

### ファイル操作ツール

```typescript
import * as fs from 'fs/promises'
import * as path from 'path'

protected async executeInternal(input: FileInput): Promise<string> {
  try {
    const content = await fs.readFile(input.path, 'utf-8')
    // 処理...
  } catch (error) {
    throw new ExecutionError(
      `ファイルの読み取りに失敗: ${error.message}`,
      this.name,
      error
    )
  }
}
```

### API呼び出しツール

```typescript
protected async executeInternal(input: ApiInput): Promise<ApiResult> {
  const apiKey = this.getApiKey()  // ストアから取得

  try {
    const response = await fetch(url, {
      headers: { 'Authorization': `Bearer ${apiKey}` }
    })

    if (!response.ok) {
      throw new NetworkError(
        `API error: ${response.statusText}`,
        this.name,
        url,
        response.status
      )
    }

    return await response.json()
  } catch (error) {
    // エラーハンドリング
  }
}
```

### 設定依存ツール

```typescript
protected async executeInternal(input: ToolInput): Promise<ToolResult> {
  // エージェント固有の設定を取得
  const agentId = this.storeManager.get('selectedAgentId') as string
  const agent = findAgentById(agentId)

  // デフォルト値を含む設定の取得
  const config = this.storeManager.get('toolConfig') as Config | undefined
  const setting = config?.setting || 'default-value'

  // 処理...
}
```

## トラブルシューティング

### よくある問題と解決方法

1. **ツールが登録されない**

   - `index.ts` への登録を確認
   - カテゴリが正しいか確認
   - ツール名の重複を確認

2. **エラーが正しく表示されない**

   - `shouldReturnErrorAsString()` の実装を確認
   - エラータイプが適切か確認

3. **ログが出力されない**

   - ログレベルの設定を確認
   - `sanitizeInputForLogging` でエラーが発生していないか確認

4. **チャンク処理が機能しない**
   - キャッシュキーが一意か確認
   - チャンクインデックスの範囲を確認

## まとめ

このツールシステムは、拡張性、保守性、型安全性を重視して設計されています。新しいツールを追加する際は、既存のパターンに従い、一貫性を保つことが重要です。

質問や提案がある場合は、プロジェクトのメンテナーに連絡してください。
