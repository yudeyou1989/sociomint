-- 宝箱统计函数
-- 创建于: 2025-05-01
-- 描述: 用于支持宝箱系统统计数据的SQL函数

-- 获取月度宝箱创建统计
CREATE OR REPLACE FUNCTION public.get_monthly_box_creation()
RETURNS TABLE (
  month TEXT,
  count BIGINT
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    TO_CHAR(DATE_TRUNC('month', created_at), 'YYYY-MM') AS month,
    COUNT(*) AS count
  FROM
    public.treasure_boxes
  GROUP BY
    DATE_TRUNC('month', created_at)
  ORDER BY
    DATE_TRUNC('month', created_at) ASC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 获取用户宝箱统计
CREATE OR REPLACE FUNCTION public.get_user_box_stats(user_id UUID)
RETURNS TABLE (
  total_boxes BIGINT,
  opened_boxes BIGINT,
  active_boxes BIGINT,
  common_boxes BIGINT,
  uncommon_boxes BIGINT,
  rare_boxes BIGINT,
  epic_boxes BIGINT,
  legendary_boxes BIGINT
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    COUNT(*) AS total_boxes,
    COUNT(CASE WHEN is_opened = true THEN 1 END) AS opened_boxes,
    COUNT(CASE WHEN status = 'active' AND is_opened = false THEN 1 END) AS active_boxes,
    COUNT(CASE WHEN bt.name = 'Common' THEN 1 END) AS common_boxes,
    COUNT(CASE WHEN bt.name = 'Uncommon' THEN 1 END) AS uncommon_boxes,
    COUNT(CASE WHEN bt.name = 'Rare' THEN 1 END) AS rare_boxes,
    COUNT(CASE WHEN bt.name = 'Epic' THEN 1 END) AS epic_boxes,
    COUNT(CASE WHEN bt.name = 'Legendary' THEN 1 END) AS legendary_boxes
  FROM
    public.treasure_boxes tb
  LEFT JOIN
    public.box_tiers bt ON tb.tier_id = bt.id
  WHERE
    tb.user_id = get_user_box_stats.user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 获取收益最高的宝箱
CREATE OR REPLACE FUNCTION public.get_top_reward_boxes(limit_count INTEGER DEFAULT 5)
RETURNS TABLE (
  box_id UUID,
  box_name TEXT,
  tier_name TEXT,
  total_reward NUMERIC,
  opened_at TIMESTAMPTZ
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    tb.id AS box_id,
    tb.name AS box_name,
    bt.name AS tier_name,
    SUM(br.token_amount) AS total_reward,
    tb.opened_at
  FROM
    public.treasure_boxes tb
  LEFT JOIN
    public.box_tiers bt ON tb.tier_id = bt.id
  LEFT JOIN
    public.box_rewards br ON tb.id = br.box_id
  WHERE
    tb.is_opened = true
  GROUP BY
    tb.id, tb.name, bt.name, tb.opened_at
  ORDER BY
    total_reward DESC
  LIMIT limit_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 创建RPC以获取宝箱总价值
CREATE OR REPLACE FUNCTION public.get_total_box_value()
RETURNS NUMERIC AS $$
DECLARE
  total_value NUMERIC;
BEGIN
  SELECT COALESCE(SUM(br.token_amount), 0)
  INTO total_value
  FROM public.box_rewards br;
  
  RETURN total_value;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 创建视图以简化统计查询
CREATE OR REPLACE VIEW public.box_tier_distribution AS
SELECT
  bt.name AS tier_name,
  COUNT(*) AS box_count,
  ROUND((COUNT(*) * 100.0 / (SELECT COUNT(*) FROM public.treasure_boxes)), 2) AS percentage
FROM
  public.treasure_boxes tb
JOIN
  public.box_tiers bt ON tb.tier_id = bt.id
GROUP BY
  bt.name
ORDER BY
  box_count DESC; 