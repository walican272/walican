-- ================================================================
-- Walican ユーザー分析用スキーマ
-- 個人情報収集と行動履歴追跡のためのテーブル定義
-- ================================================================

-- ================================
-- ユーザープロファイル拡張
-- ================================

-- ユーザープロファイルテーブル
CREATE TABLE IF NOT EXISTS profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email VARCHAR(255) UNIQUE NOT NULL,
    display_name VARCHAR(100),
    full_name VARCHAR(200),
    avatar_url TEXT,
    phone_number VARCHAR(20),
    date_of_birth DATE,
    gender VARCHAR(20) CHECK (gender IN ('male', 'female', 'other', 'prefer_not_to_say')),
    occupation VARCHAR(100),
    income_range VARCHAR(50),
    location_prefecture VARCHAR(50),
    location_city VARCHAR(100),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ユーザー設定テーブル
CREATE TABLE IF NOT EXISTS user_preferences (
    user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    default_currency VARCHAR(3) DEFAULT 'JPY',
    default_split_method VARCHAR(20) DEFAULT 'equal',
    notification_enabled BOOLEAN DEFAULT true,
    email_notifications BOOLEAN DEFAULT true,
    push_notifications BOOLEAN DEFAULT false,
    privacy_level VARCHAR(20) DEFAULT 'private',
    language VARCHAR(5) DEFAULT 'ja',
    timezone VARCHAR(50) DEFAULT 'Asia/Tokyo',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ================================
-- 行動追跡テーブル
-- ================================

-- イベント参加履歴
CREATE TABLE IF NOT EXISTS event_participations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    event_id UUID REFERENCES events(id) ON DELETE CASCADE,
    participant_id UUID REFERENCES participants(id) ON DELETE CASCADE,
    joined_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    role VARCHAR(20) DEFAULT 'participant',
    invitation_method VARCHAR(20),
    device_type VARCHAR(20),
    browser VARCHAR(50),
    os VARCHAR(50),
    ip_address_hash VARCHAR(64), -- SHA-256ハッシュ
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 支払い行動分析
CREATE TABLE IF NOT EXISTS payment_behaviors (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    event_id UUID REFERENCES events(id) ON DELETE CASCADE,
    expense_id UUID REFERENCES expenses(id) ON DELETE CASCADE,
    action_type VARCHAR(20) NOT NULL,
    amount INTEGER,
    category VARCHAR(50),
    split_method VARCHAR(20),
    participants_count INTEGER,
    is_payer BOOLEAN DEFAULT false,
    session_id UUID,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ユーザーセッション
CREATE TABLE IF NOT EXISTS user_sessions (
    session_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    started_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    ended_at TIMESTAMP WITH TIME ZONE,
    duration_seconds INTEGER,
    pages_viewed INTEGER DEFAULT 0,
    actions_count INTEGER DEFAULT 0,
    device_fingerprint VARCHAR(64),
    ip_address_hash VARCHAR(64),
    user_agent TEXT,
    referrer TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ================================
-- 集計・分析テーブル
-- ================================

-- ユーザー統計
CREATE TABLE IF NOT EXISTS user_statistics (
    user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    total_events_created INTEGER DEFAULT 0,
    total_events_participated INTEGER DEFAULT 0,
    total_expenses_created INTEGER DEFAULT 0,
    total_amount_paid INTEGER DEFAULT 0,
    total_amount_owed INTEGER DEFAULT 0,
    average_event_size FLOAT,
    favorite_category VARCHAR(50),
    most_frequent_participants JSONB,
    last_active_at TIMESTAMP WITH TIME ZONE,
    activity_score INTEGER DEFAULT 0,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- イベントパターン分析
CREATE TABLE IF NOT EXISTS event_patterns (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    pattern_type VARCHAR(50),
    frequency INTEGER DEFAULT 0,
    average_participants FLOAT,
    average_amount INTEGER,
    typical_categories JSONB,
    typical_day_of_week INTEGER,
    typical_time_of_day INTEGER,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ================================
-- プライバシー管理
-- ================================

-- 同意管理
CREATE TABLE IF NOT EXISTS consent_management (
    user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    analytics_consent BOOLEAN DEFAULT false,
    marketing_consent BOOLEAN DEFAULT false,
    third_party_sharing BOOLEAN DEFAULT false,
    consent_date TIMESTAMP WITH TIME ZONE,
    consent_version VARCHAR(20),
    ip_address_hash VARCHAR(64),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- データ削除リクエスト
CREATE TABLE IF NOT EXISTS data_deletion_requests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    requested_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    reason TEXT,
    status VARCHAR(20) DEFAULT 'pending',
    completed_at TIMESTAMP WITH TIME ZONE,
    deleted_data_summary JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ================================
-- インデックス作成
-- ================================

CREATE INDEX IF NOT EXISTS idx_profiles_email ON profiles(email);
CREATE INDEX IF NOT EXISTS idx_profiles_location ON profiles(location_prefecture, location_city);
CREATE INDEX IF NOT EXISTS idx_event_participations_user ON event_participations(user_id);
CREATE INDEX IF NOT EXISTS idx_event_participations_event ON event_participations(event_id);
CREATE INDEX IF NOT EXISTS idx_payment_behaviors_user ON payment_behaviors(user_id);
CREATE INDEX IF NOT EXISTS idx_payment_behaviors_session ON payment_behaviors(session_id);
CREATE INDEX IF NOT EXISTS idx_user_sessions_user ON user_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_user_sessions_ended ON user_sessions(ended_at);
CREATE INDEX IF NOT EXISTS idx_user_statistics_activity ON user_statistics(activity_score);
CREATE INDEX IF NOT EXISTS idx_event_patterns_user ON event_patterns(user_id);

-- ================================
-- RLSポリシー
-- ================================

-- プロファイルは本人のみ編集可能
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own profile" ON profiles
    FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update own profile" ON profiles
    FOR UPDATE USING (auth.uid() = id);

-- 設定は本人のみアクセス可能
ALTER TABLE user_preferences ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage own preferences" ON user_preferences
    FOR ALL USING (auth.uid() = user_id);

-- 統計データは本人のみ閲覧可能
ALTER TABLE user_statistics ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own statistics" ON user_statistics
    FOR SELECT USING (auth.uid() = user_id);

-- 同意管理は本人のみ
ALTER TABLE consent_management ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage own consent" ON consent_management
    FOR ALL USING (auth.uid() = user_id);

-- ================================
-- トリガー関数
-- ================================

-- updated_atの自動更新
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- 各テーブルにトリガーを設定
CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON profiles
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_preferences_updated_at BEFORE UPDATE ON user_preferences
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_statistics_updated_at BEFORE UPDATE ON user_statistics
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_event_patterns_updated_at BEFORE UPDATE ON event_patterns
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ================================
-- 統計集計関数
-- ================================

-- ユーザー統計を更新する関数
CREATE OR REPLACE FUNCTION update_user_statistics(p_user_id UUID)
RETURNS void AS $$
BEGIN
    INSERT INTO user_statistics (user_id)
    VALUES (p_user_id)
    ON CONFLICT (user_id) DO UPDATE SET
        total_events_created = (
            SELECT COUNT(*) FROM events WHERE user_id = p_user_id
        ),
        total_events_participated = (
            SELECT COUNT(DISTINCT event_id) 
            FROM participants p
            WHERE p.user_id = p_user_id
        ),
        total_expenses_created = (
            SELECT COUNT(*) 
            FROM expenses e
            JOIN participants p ON e.paid_by = p.id
            WHERE p.user_id = p_user_id
        ),
        last_active_at = NOW(),
        updated_at = NOW();
END;
$$ LANGUAGE plpgsql;

-- ================================
-- 初期データ
-- ================================

-- デフォルトのパターンタイプ
INSERT INTO event_patterns (user_id, pattern_type, frequency)
SELECT 
    id,
    pattern,
    0
FROM 
    auth.users,
    (VALUES ('飲み会'), ('旅行'), ('日常'), ('イベント'), ('その他')) AS patterns(pattern)
ON CONFLICT DO NOTHING;