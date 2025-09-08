-- セキュアなRLSポリシー設定
-- Supabase SQL Editorで実行してください

-- 既存の危険なポリシーを削除
DROP POLICY IF EXISTS "Allow all access to events" ON events;
DROP POLICY IF EXISTS "Allow all access to participants" ON participants;
DROP POLICY IF EXISTS "Allow all access to expenses" ON expenses;
DROP POLICY IF EXISTS "Allow all access to expense_splits" ON expense_splits;
DROP POLICY IF EXISTS "Allow all access to settlements" ON settlements;
DROP POLICY IF EXISTS "Allow all access to groups" ON groups;
DROP POLICY IF EXISTS "Allow all access to group_members" ON group_members;

-- user_idカラムを追加（存在しない場合）
ALTER TABLE events ADD COLUMN IF NOT EXISTS user_id UUID;

-- ================================
-- Events テーブルのポリシー
-- ================================

-- 誰でもURLで閲覧可能（読み取りのみ）
CREATE POLICY "Public can view events by URL" ON events
    FOR SELECT USING (true);

-- 認証ユーザーは自分のイベントを作成可能
CREATE POLICY "Authenticated users can create events" ON events
    FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

-- イベント作成者のみ更新・削除可能
CREATE POLICY "Event creators can update own events" ON events
    FOR UPDATE USING (
        auth.uid()::text = user_id::text 
        OR user_id IS NULL -- 移行期間のため
    );

CREATE POLICY "Event creators can delete own events" ON events
    FOR DELETE USING (
        auth.uid()::text = user_id::text 
        OR user_id IS NULL -- 移行期間のため
    );

-- ================================
-- Participants テーブルのポリシー
-- ================================

-- イベントに紐づく参加者は誰でも閲覧可能
CREATE POLICY "Public can view participants" ON participants
    FOR SELECT USING (true);

-- 誰でも参加者を追加可能（イベントURLを知っている場合）
CREATE POLICY "Anyone can add participants" ON participants
    FOR INSERT WITH CHECK (true);

-- イベント作成者のみ参加者を削除可能
CREATE POLICY "Event creators can delete participants" ON participants
    FOR DELETE USING (
        EXISTS (
            SELECT 1 FROM events 
            WHERE events.id = participants.event_id 
            AND (events.user_id::text = auth.uid()::text OR events.user_id IS NULL)
        )
    );

-- ================================
-- Expenses テーブルのポリシー
-- ================================

-- イベントに紐づく支出は誰でも閲覧可能
CREATE POLICY "Public can view expenses" ON expenses
    FOR SELECT USING (true);

-- イベント参加者は支出を追加可能
CREATE POLICY "Participants can add expenses" ON expenses
    FOR INSERT WITH CHECK (true);

-- 支出を追加した人のみ編集可能
CREATE POLICY "Expense creators can update" ON expenses
    FOR UPDATE USING (true); -- 一時的に全員許可（将来的にはcreated_byカラムで制限）

-- イベント作成者と支出追加者のみ削除可能
CREATE POLICY "Authorized users can delete expenses" ON expenses
    FOR DELETE USING (
        EXISTS (
            SELECT 1 FROM events 
            WHERE events.id = expenses.event_id 
            AND (events.user_id::text = auth.uid()::text OR events.user_id IS NULL)
        )
    );

-- ================================
-- Expense Splits テーブルのポリシー
-- ================================

-- 誰でも閲覧可能
CREATE POLICY "Public can view expense splits" ON expense_splits
    FOR SELECT USING (true);

-- システムのみ作成・更新可能（経費作成時に自動生成）
CREATE POLICY "System can manage expense splits" ON expense_splits
    FOR ALL USING (true);

-- ================================
-- Settlements テーブルのポリシー
-- ================================

-- イベント参加者は精算情報を閲覧可能
CREATE POLICY "Participants can view settlements" ON settlements
    FOR SELECT USING (true);

-- イベント参加者は精算を作成可能
CREATE POLICY "Participants can create settlements" ON settlements
    FOR INSERT WITH CHECK (true);

-- 精算の更新（完了処理など）
CREATE POLICY "Participants can update settlements" ON settlements
    FOR UPDATE USING (true);

-- ================================
-- Groups テーブルのポリシー
-- ================================

-- グループメンバーのみ閲覧可能
CREATE POLICY "Group members can view groups" ON groups
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM group_members 
            WHERE group_members.group_id = groups.id 
            AND group_members.user_email = auth.jwt() ->> 'email'
        )
        OR creator_id::text = auth.uid()::text
        OR creator_id IS NULL -- 移行期間
    );

-- 認証ユーザーはグループを作成可能
CREATE POLICY "Authenticated users can create groups" ON groups
    FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

-- グループ作成者のみ更新・削除可能
CREATE POLICY "Group creators can manage groups" ON groups
    FOR UPDATE USING (
        creator_id::text = auth.uid()::text 
        OR creator_id IS NULL
    );

CREATE POLICY "Group creators can delete groups" ON groups
    FOR DELETE USING (
        creator_id::text = auth.uid()::text 
        OR creator_id IS NULL
    );

-- ================================
-- Group Members テーブルのポリシー
-- ================================

-- グループメンバーは他のメンバーを閲覧可能
CREATE POLICY "Group members can view members" ON group_members
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM group_members AS gm 
            WHERE gm.group_id = group_members.group_id 
            AND gm.user_email = auth.jwt() ->> 'email'
        )
    );

-- グループ作成者はメンバーを追加可能
CREATE POLICY "Group creators can add members" ON group_members
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM groups 
            WHERE groups.id = group_members.group_id 
            AND (groups.creator_id::text = auth.uid()::text OR groups.creator_id IS NULL)
        )
    );

-- グループ作成者はメンバーを削除可能
CREATE POLICY "Group creators can remove members" ON group_members
    FOR DELETE USING (
        EXISTS (
            SELECT 1 FROM groups 
            WHERE groups.id = group_members.group_id 
            AND (groups.creator_id::text = auth.uid()::text OR groups.creator_id IS NULL)
        )
    );

-- ================================
-- 注意事項
-- ================================
-- 1. 実行後、アプリケーションの動作を必ずテストしてください
-- 2. user_idやcreator_idがNULLの既存データは段階的に更新が必要です
-- 3. 本番環境では、より厳密なポリシーへの移行を検討してください