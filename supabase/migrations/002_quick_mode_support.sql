-- クイックモードサポートのためのスキーマ更新

-- eventsテーブルに新しいカラムを追加
ALTER TABLE events 
ADD COLUMN IF NOT EXISTS is_quick_mode BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS expires_at TIMESTAMP WITH TIME ZONE;

-- クイックモードイベントの自動削除用インデックス
CREATE INDEX IF NOT EXISTS idx_events_expires_at 
ON events(expires_at) 
WHERE expires_at IS NOT NULL;

-- 30日経過したクイックモードイベントを自動削除する関数
CREATE OR REPLACE FUNCTION delete_expired_quick_events()
RETURNS void
LANGUAGE plpgsql
AS $$
BEGIN
  -- 期限切れのクイックイベントとその関連データを削除
  DELETE FROM events
  WHERE is_quick_mode = true 
    AND expires_at IS NOT NULL 
    AND expires_at < NOW();
END;
$$;

-- 定期的にクリーンアップを実行（Supabaseのcronジョブで実行）
-- 注: Supabaseダッシュボードで以下のcronジョブを設定してください
-- SELECT delete_expired_quick_events(); を毎日実行

-- user_idを任意にする（クイックモードは認証不要）
ALTER TABLE events 
ALTER COLUMN user_id DROP NOT NULL;