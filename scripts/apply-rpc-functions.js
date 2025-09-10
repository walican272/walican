const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('環境変数が設定されていません。.env.localファイルを確認してください。');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

const sql = `
-- 支出と分割を原子的に作成するための関数
CREATE OR REPLACE FUNCTION create_expense_with_splits(
  expense_data json,
  splits_data json[]
)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  new_expense_id uuid;
  expense_result json;
BEGIN
  -- 支出を作成
  INSERT INTO expenses (
    event_id,
    paid_by,
    amount,
    currency,
    category,
    description,
    receipt_url
  )
  VALUES (
    (expense_data->>'event_id')::uuid,
    (expense_data->>'paid_by')::uuid,
    (expense_data->>'amount')::decimal,
    expense_data->>'currency',
    expense_data->>'category',
    expense_data->>'description',
    expense_data->>'receipt_url'
  )
  RETURNING id INTO new_expense_id;

  -- 分割情報を作成
  IF array_length(splits_data, 1) > 0 THEN
    INSERT INTO expense_splits (
      expense_id,
      participant_id,
      amount,
      is_settled
    )
    SELECT 
      new_expense_id,
      (value->>'participant_id')::uuid,
      (value->>'amount')::decimal,
      COALESCE((value->>'is_settled')::boolean, false)
    FROM unnest(splits_data) AS value;
  END IF;

  -- 作成した支出情報を返す
  SELECT row_to_json(e.*) INTO expense_result
  FROM expenses e
  WHERE e.id = new_expense_id;

  RETURN expense_result;
EXCEPTION
  WHEN OTHERS THEN
    -- エラーが発生した場合はロールバック
    RAISE;
END;
$$;

-- 削除時も原子的に処理する関数
CREATE OR REPLACE FUNCTION delete_expense_with_splits(
  p_expense_id uuid
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- 分割情報を先に削除
  DELETE FROM expense_splits WHERE expense_id = p_expense_id;
  
  -- 支出を削除
  DELETE FROM expenses WHERE id = p_expense_id;
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Expense not found: %', p_expense_id;
  END IF;
END;
$$;

-- 関数の権限を設定
GRANT EXECUTE ON FUNCTION create_expense_with_splits(json, json[]) TO anon;
GRANT EXECUTE ON FUNCTION create_expense_with_splits(json, json[]) TO authenticated;
GRANT EXECUTE ON FUNCTION delete_expense_with_splits(uuid) TO anon;
GRANT EXECUTE ON FUNCTION delete_expense_with_splits(uuid) TO authenticated;
`;

async function applyRPCFunctions() {
  try {
    console.log('RPC関数を作成中...');
    
    // fetch APIを使用して直接SQL APIを呼び出す
    const response = await fetch(`${supabaseUrl}/rest/v1/rpc/query`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': supabaseServiceKey,
        'Authorization': `Bearer ${supabaseServiceKey}`
      },
      body: JSON.stringify({ query: sql })
    });

    if (!response.ok) {
      // 別の方法：SQL Editorエンドポイントを試す
      console.log('別の方法でSQLを実行中...');
      
      // Supabase管理APIを使用
      const mgmtResponse = await fetch(`https://api.supabase.com/v1/projects/${supabaseUrl.split('.')[0].split('//')[1]}/database/query`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${supabaseServiceKey}`
        },
        body: JSON.stringify({ query: sql })
      });
      
      if (!mgmtResponse.ok) {
        throw new Error(`SQL実行エラー: ${mgmtResponse.status}`);
      }
    }
    
    console.log('✅ RPC関数が正常に作成されました！');
    
    // 関数の存在を確認
    console.log('\n関数の存在を確認中...');
    const { data, error } = await supabase.rpc('create_expense_with_splits', {
      expense_data: {},
      splits_data: []
    }).single();
    
    if (error && !error.message.includes('violates not-null constraint')) {
      console.log('⚠️ 関数は作成されましたが、テスト実行でエラーが発生しました:', error.message);
    } else {
      console.log('✅ 関数が正常に動作しています！');
    }
    
  } catch (error) {
    console.error('❌ エラーが発生しました:', error.message);
    console.log('\n手動での実行が必要です:');
    console.log('1. Supabase Dashboardにログイン: https://supabase.com/dashboard');
    console.log('2. SQL Editorを開く');
    console.log('3. apply_rpc_functions.sqlの内容を実行');
  }
}

applyRPCFunctions();