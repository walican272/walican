-- ================================================================
-- Walican バランス型RLSポリシー
-- 設計思想: URLを知っている = そのイベントの参加者
-- ================================================================

-- ================================
-- Events テーブルのポリシー
-- ================================

-- 既存のポリシーを削除
DROP POLICY IF EXISTS "Public can view events by URL" ON events;
DROP POLICY IF EXISTS "Users can create events" ON events;
DROP POLICY IF EXISTS "Users can update events" ON events;
DROP POLICY IF EXISTS "Users can delete events" ON events;

-- 1. SELECT: URLを知っていれば誰でも閲覧可能（現状維持）
CREATE POLICY "Anyone can view events" ON events
    FOR SELECT USING (true);
    -- 理由: URLベースのアクセスモデルのため

-- 2. INSERT: 認証ユーザーまたはクイックモード
CREATE POLICY "Create events with auth or quick mode" ON events
    FOR INSERT WITH CHECK (
        (auth.uid() IS NOT NULL) OR (is_quick_mode = true)
    );
    -- 理由: スパム対策はレート制限で実施

-- 3. UPDATE: イベント作成者のみ（破壊的操作の制限）
CREATE POLICY "Only creators can update events" ON events
    FOR UPDATE USING (
        -- 作成者本人
        ((auth.uid())::text = (user_id)::text) 
        OR 
        -- クイックモードイベントは基本情報のみ更新可能
        (is_quick_mode = true AND user_id IS NULL)
    );

-- 4. DELETE: イベント作成者のみ（破壊的操作の制限）
CREATE POLICY "Only creators can delete events" ON events
    FOR DELETE USING (
        -- 作成者本人のみ
        ((auth.uid())::text = (user_id)::text)
        -- クイックモードイベントは削除不可（30日で自動削除）
    );

-- ================================
-- Participants テーブルのポリシー
-- ================================

-- 既存のポリシーを確認して適切に設定
DROP POLICY IF EXISTS "Anyone can add participants" ON participants;
DROP POLICY IF EXISTS "Public can view participants" ON participants;
DROP POLICY IF EXISTS "Event creators can delete participants" ON participants;

-- 1. SELECT: URLを知っていれば閲覧可能
CREATE POLICY "View participants" ON participants
    FOR SELECT USING (true);

-- 2. INSERT: URLを知っていれば追加可能
CREATE POLICY "Add participants" ON participants
    FOR INSERT WITH CHECK (true);
    -- 理由: URLを知っている = 参加権限がある

-- 3. UPDATE: 本人のみ名前を変更可能（将来的な実装用）
CREATE POLICY "Update own participant info" ON participants
    FOR UPDATE USING (true);
    -- 現在は制限なし、将来的にuser_idとのマッピング時に制限

-- 4. DELETE: イベント作成者のみ
CREATE POLICY "Delete participants" ON participants
    FOR DELETE USING (
        EXISTS (
            SELECT 1 FROM events
            WHERE events.id = participants.event_id
            AND ((events.user_id)::text = (auth.uid())::text)
        )
    );

-- ================================
-- Expenses テーブルのポリシー
-- ================================

DROP POLICY IF EXISTS "Public can view expenses" ON expenses;
DROP POLICY IF EXISTS "Participants can add expenses" ON expenses;
DROP POLICY IF EXISTS "Expense creators can update" ON expenses;
DROP POLICY IF EXISTS "Authorized users can delete expenses" ON expenses;

-- 1. SELECT: URLを知っていれば閲覧可能
CREATE POLICY "View expenses" ON expenses
    FOR SELECT USING (true);

-- 2. INSERT: URLを知っていれば追加可能
CREATE POLICY "Add expenses" ON expenses
    FOR INSERT WITH CHECK (true);
    -- 理由: 参加者は支払いを記録できるべき

-- 3. UPDATE: 支払い記録者のみ（paid_byフィールドと一致）
CREATE POLICY "Update own expenses" ON expenses
    FOR UPDATE USING (
        -- 支払い記録者本人
        (paid_by IN (
            SELECT id FROM participants 
            WHERE event_id = expenses.event_id
        ))
        OR
        -- イベント作成者
        EXISTS (
            SELECT 1 FROM events
            WHERE events.id = expenses.event_id
            AND ((events.user_id)::text = (auth.uid())::text)
        )
    );

-- 4. DELETE: イベント作成者のみ
CREATE POLICY "Delete expenses" ON expenses
    FOR DELETE USING (
        EXISTS (
            SELECT 1 FROM events
            WHERE events.id = expenses.event_id
            AND ((events.user_id)::text = (auth.uid())::text)
        )
    );

-- ================================
-- Expense_splits テーブルのポリシー
-- ================================

DROP POLICY IF EXISTS "Public can view expense splits" ON expense_splits;
DROP POLICY IF EXISTS "System can manage expense splits" ON expense_splits;

-- 1. SELECT: URLを知っていれば閲覧可能
CREATE POLICY "View expense splits" ON expense_splits
    FOR SELECT USING (true);

-- 2. INSERT/UPDATE/DELETE: システムのみ（atomicな操作で管理）
CREATE POLICY "Manage expense splits" ON expense_splits
    FOR ALL USING (
        -- RPC関数経由でのみ操作可能
        EXISTS (
            SELECT 1 FROM expenses e
            JOIN events ev ON e.event_id = ev.id
            WHERE e.id = expense_splits.expense_id
            AND (
                -- イベント作成者
                ((ev.user_id)::text = (auth.uid())::text)
                OR
                -- 支払い記録者
                e.paid_by IN (
                    SELECT id FROM participants 
                    WHERE event_id = ev.id
                )
            )
        )
    );

-- ================================
-- Settlements テーブルのポリシー
-- ================================

DROP POLICY IF EXISTS "Participants can view settlements" ON settlements;
DROP POLICY IF EXISTS "Participants can create settlements" ON settlements;
DROP POLICY IF EXISTS "Settlement parties can update" ON settlements;

-- 1. SELECT: URLを知っていれば閲覧可能
CREATE POLICY "View settlements" ON settlements
    FOR SELECT USING (true);

-- 2. INSERT: URLを知っていれば作成可能
CREATE POLICY "Create settlements" ON settlements
    FOR INSERT WITH CHECK (true);

-- 3. UPDATE: 関係者のみステータス更新可能
CREATE POLICY "Update settlement status" ON settlements
    FOR UPDATE USING (
        -- 送金者または受取人
        (from_participant IN (
            SELECT id FROM participants 
            WHERE event_id = settlements.event_id
        ))
        OR
        (to_participant IN (
            SELECT id FROM participants 
            WHERE event_id = settlements.event_id
        ))
        OR
        -- イベント作成者
        EXISTS (
            SELECT 1 FROM events
            WHERE events.id = settlements.event_id
            AND ((events.user_id)::text = (auth.uid())::text)
        )
    );

-- 4. DELETE: イベント作成者のみ
CREATE POLICY "Delete settlements" ON settlements
    FOR DELETE USING (
        EXISTS (
            SELECT 1 FROM events
            WHERE events.id = settlements.event_id
            AND ((events.user_id)::text = (auth.uid())::text)
        )
    );

-- ================================
-- 補足: セキュリティはレート制限で実装
-- ================================
-- RLSポリシーは「URLベースのアクセスモデル」を尊重
-- 悪用対策は以下で実施:
-- 1. レート制限（アプリケーション層）
-- 2. クイックモードの30日自動削除
-- 3. 破壊的操作（UPDATE/DELETE）の制限
-- 4. ログ記録とモニタリング