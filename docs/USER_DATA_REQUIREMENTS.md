# Walican ユーザーデータ収集要件

## 1. ビジネス目的

### 主要目的
- **ユーザー行動分析**: 割り勘パターンや支払い傾向の把握
- **パーソナライゼーション**: ユーザーの利用パターンに基づく機能最適化
- **マーケティング活用**: ターゲティング広告や推奨機能の提供
- **サービス改善**: 利用データに基づく機能改善とUX向上

## 2. 収集するユーザー属性データ

### 基本属性（profiles テーブル）
```sql
- user_id: UUID (PRIMARY KEY)
- email: string (UNIQUE)
- display_name: string
- full_name: string (optional)
- avatar_url: string (optional)
- phone_number: string (optional)
- date_of_birth: date (optional)
- gender: enum('male', 'female', 'other', 'prefer_not_to_say')
- occupation: string (optional)
- income_range: enum (optional)
- location_prefecture: string (optional)
- location_city: string (optional)
- created_at: timestamp
- updated_at: timestamp
```

### ユーザー設定（user_preferences テーブル）
```sql
- user_id: UUID (FK)
- default_currency: string (default: 'JPY')
- default_split_method: enum('equal', 'custom', 'percentage')
- notification_enabled: boolean
- email_notifications: boolean
- push_notifications: boolean
- privacy_level: enum('public', 'friends', 'private')
- language: string (default: 'ja')
- timezone: string (default: 'Asia/Tokyo')
```

## 3. 行動履歴データ

### イベント参加履歴（event_participations テーブル）
```sql
- id: UUID
- user_id: UUID (FK)
- event_id: UUID (FK)
- participant_id: UUID (FK)
- joined_at: timestamp
- role: enum('organizer', 'participant')
- invitation_method: enum('direct_link', 'qr_code', 'share', 'search')
- device_type: string (mobile/desktop/tablet)
- browser: string
- os: string
- ip_address_hash: string (ハッシュ化)
```

### 支払い行動分析（payment_behaviors テーブル）
```sql
- id: UUID
- user_id: UUID (FK)
- event_id: UUID (FK)
- expense_id: UUID (FK)
- action_type: enum('created', 'edited', 'deleted', 'settled')
- amount: integer
- category: string
- split_method: enum('equal', 'custom', 'percentage')
- participants_count: integer
- is_payer: boolean
- timestamp: timestamp
- session_id: string
```

### ユーザーセッション（user_sessions テーブル）
```sql
- session_id: UUID
- user_id: UUID (FK)
- started_at: timestamp
- ended_at: timestamp
- duration_seconds: integer
- pages_viewed: integer
- actions_count: integer
- device_fingerprint: string
- ip_address_hash: string
- user_agent: string
- referrer: string
```

## 4. 分析用集計データ

### ユーザー統計（user_statistics テーブル）
```sql
- user_id: UUID (FK)
- total_events_created: integer
- total_events_participated: integer
- total_expenses_created: integer
- total_amount_paid: integer
- total_amount_owed: integer
- average_event_size: float
- favorite_category: string
- most_frequent_participants: jsonb (ユーザーIDのリスト)
- last_active_at: timestamp
- activity_score: integer (0-100)
```

### イベントパターン分析（event_patterns テーブル）
```sql
- user_id: UUID (FK)
- pattern_type: string (例: '飲み会', '旅行', '日常')
- frequency: integer
- average_participants: float
- average_amount: integer
- typical_categories: jsonb
- typical_day_of_week: integer
- typical_time_of_day: integer
```

## 5. プライバシー考慮事項

### 必須対応
1. **個人情報保護法（PIPA）準拠**
   - 利用目的の明示
   - 同意取得プロセス
   - オプトアウト機能

2. **GDPR対応（将来の国際展開用）**
   - データポータビリティ
   - 忘れられる権利
   - 明示的な同意

3. **データ匿名化**
   - IPアドレスのハッシュ化
   - 個人識別情報の暗号化
   - 集計データの匿名化

### 実装する機能
```typescript
// 同意管理
interface ConsentManagement {
  analytics_consent: boolean
  marketing_consent: boolean
  third_party_sharing: boolean
  consent_date: Date
  consent_version: string
}

// データ削除リクエスト
interface DataDeletionRequest {
  user_id: string
  requested_at: Date
  reason?: string
  status: 'pending' | 'processing' | 'completed'
  completed_at?: Date
}
```

## 6. データ活用例

### マーケティング活用
- **セグメンテーション**: 利用頻度、金額規模でユーザー分類
- **レコメンデーション**: 類似ユーザーの行動に基づく機能推奨
- **リテンション向上**: 離脱リスクの高いユーザーの特定

### プロダクト改善
- **機能優先順位**: 最も使われる機能の特定
- **UX最適化**: ユーザーフローの分析と改善
- **A/Bテスト**: 新機能の効果測定

### ビジネスインテリジェンス
- **収益予測**: ユーザー行動に基づく将来予測
- **市場分析**: 地域別、年齢別の利用傾向
- **競合分析**: 他サービスとの利用パターン比較

## 7. 実装優先順位

### Phase 1（即実装）
- [ ] 基本的なユーザープロファイル
- [ ] イベント参加履歴
- [ ] 支払い行動の記録

### Phase 2（3ヶ月以内）
- [ ] セッション追跡
- [ ] ユーザー統計の自動集計
- [ ] 基本的な分析ダッシュボード

### Phase 3（6ヶ月以内）
- [ ] 高度なパターン分析
- [ ] 機械学習による予測
- [ ] 自動レコメンデーション

## 8. セキュリティ要件

### データ保護
- **暗号化**: すべての個人情報は暗号化して保存
- **アクセス制御**: ロールベースのアクセス管理
- **監査ログ**: すべてのデータアクセスを記録

### コンプライアンス
- **データ保持期間**: 最終利用から2年間
- **定期監査**: 四半期ごとのセキュリティ監査
- **インシデント対応**: 48時間以内の通知義務

## 9. 技術実装

### Supabase RLS ポリシー
```sql
-- ユーザーは自分のデータのみアクセス可能
CREATE POLICY "Users can view own data" ON user_statistics
FOR SELECT USING (auth.uid() = user_id);

-- 管理者は全データにアクセス可能
CREATE POLICY "Admins can view all data" ON user_statistics
FOR ALL USING (
  EXISTS (
    SELECT 1 FROM user_roles
    WHERE user_id = auth.uid()
    AND role = 'admin'
  )
);
```

### データ収集SDK
```typescript
// クライアントサイドの追跡
class WalicanAnalytics {
  trackEvent(eventName: string, properties: Record<string, any>) {
    // イベント送信ロジック
  }
  
  trackPageView(pageName: string) {
    // ページビュー追跡
  }
  
  identifyUser(userId: string, traits: Record<string, any>) {
    // ユーザー識別
  }
}
```

## 10. KPI設定

### ユーザーエンゲージメント
- **DAU/MAU比率**: 目標 40%以上
- **平均セッション時間**: 5分以上
- **リテンション率**: 30日後 30%以上

### ビジネスメトリクス
- **ARPU**: 平均収益/ユーザー
- **LTV**: 顧客生涯価値
- **CAC**: 顧客獲得コスト

---

**注意事項**:
- このドキュメントは社内機密情報として取り扱うこと
- ユーザーデータの取り扱いは必ず法務部門と相談すること
- 実装前にプライバシーポリシーの更新が必要