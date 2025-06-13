# リリース手順ガイド

このドキュメントでは、Bedrock Engineerのリリース方法について説明します。

## リリース手順

1. **バージョンアップ**:
   - `package.json`ファイルのバージョン番号を更新します：
     ```json
     {
       "name": "bedrock-engineer",
       "version": "X.Y.Z", // ここを更新
       ...
     }
     ```

2. **変更をコミット**:
   ```bash
   git add package.json
   git commit -m "chore: bump version to vX.Y.Z"
   ```

3. **タグを作成してプッシュ**:
   ```bash
   git tag vX.Y.Z
   git push origin vX.Y.Z
   ```

4. **リリース処理の監視**:
   - GitHub Actionsの進行状況を[Actionsタブ](https://github.com/aws-samples/bedrock-engineer/actions)で確認します。
   - ワークフローが正常に完了すると、以下の処理が自動的に行われます:
     1. Mac版とWindows版のビルドが実行される
     2. ビルド成果物が添付されたリリースが作成・公開される
     3. リリースノートが自動生成される

5. **リリース確認**:
   - [Releasesページ](https://github.com/aws-samples/bedrock-engineer/releases)で公開されたリリースを確認します
   - 添付されたインストーラーファイル（.dmg、.pkg、.exe）が含まれていることを確認します

## トラブルシューティング

### ビルドに失敗した場合:

1. GitHub Actionsのログを確認して問題を特定します
2. 問題を修正し、必要に応じてタグを削除して再度プッシュします：
   ```bash
   git tag -d vX.Y.Z
   git push --delete origin vX.Y.Z
   # 修正後
   git tag vX.Y.Z
   git push origin vX.Y.Z
   ```

### リリースに成果物が添付されていない場合:

1. ワークフローのログを確認し、アーティファクトが正しくビルドされているか確認
2. 問題を修正し、新しいバージョンでタグをプッシュするか、既存タグを削除して再プッシュ

## バージョニング規則

[セマンティックバージョニング](https://semver.org/lang/ja/)に従います：

- **メジャーバージョン (X)**: 互換性のない変更
- **マイナーバージョン (Y)**: 後方互換性のある機能追加
- **パッチバージョン (Z)**: 後方互換性のあるバグ修正