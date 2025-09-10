# Supabase RPC関数のセットアップ

## エラーの原因
`create_expense_with_splits` RPC関数がSupabaseデータベースに存在しないため、404エラーが発生しています。

## 解決方法

### 手動での適用（推奨）

1. [Supabase Dashboard](https://supabase.com/dashboard)にログイン
2. プロジェクト `nkxeawivmzxbnoakpkvz` を選択
3. 左メニューから「SQL Editor」を選択
4. `apply_rpc_functions.sql` ファイルの内容をコピー
5. SQL Editorに貼り付けて「Run」をクリック

### 確認方法

SQLエディタで以下のクエリを実行して、関数が作成されたことを確認：

```sql
SELECT 
  proname as function_name,
  pg_get_function_result(oid) as return_type
FROM pg_proc
WHERE proname IN ('create_expense_with_splits', 'delete_expense_with_splits');
```

## 今後の対応

### マイグレーションの自動化
今後、以下のコマンドでマイグレーションを自動化することを検討：

```bash
# Supabase CLIのセットアップ
npm install -g supabase

# ログイン
supabase login

# プロジェクトのリンク
supabase link --project-ref nkxeawivmzxbnoakpkvz

# マイグレーションの適用
supabase db push
```

## トラブルシューティング

### 権限エラーが発生した場合
```sql
-- anonとauthenticatedユーザーに権限を付与
GRANT EXECUTE ON FUNCTION create_expense_with_splits(json, json[]) TO anon;
GRANT EXECUTE ON FUNCTION create_expense_with_splits(json, json[]) TO authenticated;
```

### 関数が既に存在する場合
`CREATE OR REPLACE FUNCTION` を使用しているため、既存の関数は上書きされます。