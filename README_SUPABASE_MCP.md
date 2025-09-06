# Supabase MCP統合ガイド

## Supabase MCPで自動化できること

### 現在手動で行っている作業
1. Supabaseプロジェクトの作成
2. データベーススキーマの適用
3. RLSポリシーの設定
4. 環境変数の設定

### MCP導入後に自動化される作業

#### 1. プロジェクトセットアップ
```bash
# MCP経由で自動実行
- Supabaseプロジェクト作成
- API Keys取得と.env.local設定
- データベース初期化
```

#### 2. スキーマ管理
```typescript
// MCPコマンドで自動生成
supabase.createTable('events', {
  id: 'uuid',
  unique_url: 'varchar(10)',
  name: 'varchar(255)',
  // ...
})
```

#### 3. リアルタイム機能
```typescript
// 自動的にリアルタイム対応
supabase.enableRealtimeFor('events')
supabase.enableRealtimeFor('participants')
supabase.enableRealtimeFor('expenses')
```

#### 4. 型定義の自動生成
```typescript
// データベーススキーマから自動生成
type Database = {
  public: {
    Tables: {
      events: {
        Row: Event
        Insert: Omit<Event, 'id' | 'created_at'>
        Update: Partial<Event>
      }
      // ...
    }
  }
}
```

## 実装済みのAPI層

すでに以下のAPI層を準備済み：

### `/src/lib/supabase/api/`
- `events.ts` - イベントCRUD + リアルタイム
- `participants.ts` - 参加者CRUD + リアルタイム  
- `expenses.ts` - 支払いCRUD + リアルタイム
- `index.ts` - 統合API

## MCP導入のメリット

1. **開発速度向上**
   - SQLマイグレーション記述不要
   - API関数の自動生成
   - 型安全性の自動保証

2. **エラー削減**
   - スキーマとコードの不一致を防止
   - RLSポリシーの自動検証
   - リアルタイム購読の自動管理

3. **保守性向上**
   - データベース変更の自動追跡
   - ロールバック機能
   - スキーマバージョニング

## 次のステップ

1. Supabase MCPをインストール
2. MCPコマンドでプロジェクト作成
3. 自動生成された型定義を使用
4. リアルタイム機能の活用

これにより、残りのPhase 1-4の実装が大幅に効率化されます。