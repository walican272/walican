-- 支出と分割を原子的に作成するための関数
CREATE OR REPLACE FUNCTION create_expense_with_splits(
  expense_data json,
  splits_data json[]
)
RETURNS json
LANGUAGE plpgsql
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

-- 削除時も原子的に処理
CREATE OR REPLACE FUNCTION delete_expense_with_splits(
  expense_id uuid
)
RETURNS void
LANGUAGE plpgsql
AS $$
BEGIN
  -- 分割情報を先に削除
  DELETE FROM expense_splits WHERE expense_id = expense_id;
  
  -- 支出を削除
  DELETE FROM expenses WHERE id = expense_id;
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Expense not found: %', expense_id;
  END IF;
END;
$$;