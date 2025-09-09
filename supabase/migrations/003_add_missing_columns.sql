-- Supabaseダッシュボードで実行するSQL
-- SQL Editorで以下のコマンドを実行してください

-- 1. eventsテーブルにクイックモード用のカラムを追加
ALTER TABLE events 
ADD COLUMN IF NOT EXISTS is_quick_mode BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS expires_at TIMESTAMP WITH TIME ZONE;

-- 2. user_idを任意にする（クイックモードは認証不要）
ALTER TABLE events 
ALTER COLUMN user_id DROP NOT NULL;

-- 3. dateカラムを任意にする（クイックモードでは日付指定不要）
ALTER TABLE events
ALTER COLUMN date DROP NOT NULL;

-- 4. 期限切れクイックイベントの自動削除用インデックス
CREATE INDEX IF NOT EXISTS idx_events_expires_at 
ON events(expires_at) 
WHERE expires_at IS NOT NULL;

-- 5. クイックモードイベントを識別するためのインデックス
CREATE INDEX IF NOT EXISTS idx_events_quick_mode
ON events(is_quick_mode)
WHERE is_quick_mode = true;