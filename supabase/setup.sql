-- Supabase用の追加フィールド設定
-- もし既存のテーブルがある場合は、これらのフィールドを追加

-- eventsテーブルにcurrencyフィールドを追加（もし存在しない場合）
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name='events' AND column_name='currency') THEN
        ALTER TABLE events ADD COLUMN currency VARCHAR(3) DEFAULT 'JPY';
    END IF;
END $$;

-- participantsテーブルにemailフィールドを追加（もし存在しない場合）
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name='participants' AND column_name='email') THEN
        ALTER TABLE participants ADD COLUMN email VARCHAR(255);
    END IF;
END $$;

-- expensesテーブルにsplit_typeとsplitsフィールドを追加（もし存在しない場合）
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name='expenses' AND column_name='split_type') THEN
        ALTER TABLE expenses ADD COLUMN split_type VARCHAR(20) DEFAULT 'equal';
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name='expenses' AND column_name='splits') THEN
        ALTER TABLE expenses ADD COLUMN splits JSONB;
    END IF;
END $$;