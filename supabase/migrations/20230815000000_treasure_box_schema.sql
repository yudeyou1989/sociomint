-- 宝箱系统表结构定义
-- 创建于: 2023-08-15
-- 更新于: 2025-04-26
-- 描述: 宝箱系统相关的数据表结构，包括宝箱配置和奖励记录

-- 添加服务账户检查函数
CREATE OR REPLACE FUNCTION public.rpc_is_service_account()
RETURNS boolean AS $$
BEGIN
  RETURN (SELECT is_service_role() OR (SELECT role = 'service_role' FROM auth.jwt));
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 添加管理员检查函数
CREATE OR REPLACE FUNCTION public.rpc_is_admin()
RETURNS boolean AS $$
BEGIN
  RETURN (
    (SELECT is_admin FROM public.profiles WHERE user_id = auth.uid()) OR
    (SELECT is_service_role() OR (SELECT role = 'service_role' FROM auth.jwt))
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 宝箱层级表
CREATE TABLE IF NOT EXISTS public.box_tiers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  description TEXT NOT NULL,
  probability FLOAT NOT NULL,
  min_value BIGINT NOT NULL,
  max_value BIGINT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 宝箱表
CREATE TABLE IF NOT EXISTS public.treasure_boxes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  creator_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  name TEXT NOT NULL,
  description TEXT,
  tier_id UUID REFERENCES public.box_tiers(id) ON DELETE SET NULL,
  min_applicants INTEGER NOT NULL DEFAULT 1,
  max_applicants INTEGER NOT NULL DEFAULT 1,
  current_applicants INTEGER NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'active',
  is_opened BOOLEAN NOT NULL DEFAULT false,
  is_public BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  opened_at TIMESTAMPTZ,
  CONSTRAINT applicants_range CHECK (max_applicants >= min_applicants AND min_applicants > 0)
);

-- 宝箱奖励表 - 移除CASCADE以避免循环依赖
CREATE TABLE IF NOT EXISTS public.box_rewards (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  box_id UUID NOT NULL REFERENCES public.treasure_boxes(id) ON DELETE RESTRICT,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  token_address TEXT,
  token_amount NUMERIC(78,0),
  token_name TEXT,
  token_symbol TEXT,
  token_decimals INTEGER,
  reward_type TEXT NOT NULL,
  is_claimed BOOLEAN NOT NULL DEFAULT false,
  claimed_at TIMESTAMPTZ,
  tx_hash TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 创建索引
CREATE INDEX IF NOT EXISTS idx_treasure_boxes_user_id ON public.treasure_boxes(user_id);
CREATE INDEX IF NOT EXISTS idx_treasure_boxes_status ON public.treasure_boxes(status);
CREATE INDEX IF NOT EXISTS idx_box_rewards_box_id ON public.box_rewards(box_id);
CREATE INDEX IF NOT EXISTS idx_box_rewards_user_id ON public.box_rewards(user_id);
CREATE INDEX IF NOT EXISTS idx_box_tiers_name ON public.box_tiers(name);
CREATE INDEX IF NOT EXISTS idx_box_tiers_probability ON public.box_tiers(probability);

-- 启用RLS
ALTER TABLE public.treasure_boxes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.box_rewards ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.box_tiers ENABLE ROW LEVEL SECURITY;

-- 设置宝箱表的RLS策略
CREATE POLICY "任何人可以查看公开宝箱" ON public.treasure_boxes
  FOR SELECT USING (is_public = true OR user_id = auth.uid() OR creator_id = auth.uid());

CREATE POLICY "用户可以创建自己的宝箱" ON public.treasure_boxes
  FOR INSERT WITH CHECK (auth.uid() = user_id OR rpc_is_service_account());

CREATE POLICY "用户可以更新自己的宝箱" ON public.treasure_boxes
  FOR UPDATE USING (auth.uid() = user_id OR rpc_is_service_account())
  WITH CHECK (auth.uid() = user_id OR rpc_is_service_account());

CREATE POLICY "用户可以删除自己的宝箱" ON public.treasure_boxes
  FOR DELETE USING (auth.uid() = user_id OR rpc_is_service_account());

-- 设置宝箱奖励表的RLS策略 - 统一使用user_id = auth.uid()模式
CREATE POLICY "用户可以查看与自己相关的奖励" ON public.box_rewards
  FOR SELECT USING (
    user_id = auth.uid() OR
    box_id IN (SELECT id FROM public.treasure_boxes WHERE user_id = auth.uid() OR creator_id = auth.uid()) OR
    rpc_is_service_account()
  );

CREATE POLICY "用户可以创建奖励" ON public.box_rewards
  FOR INSERT WITH CHECK (
    box_id IN (SELECT id FROM public.treasure_boxes WHERE user_id = auth.uid()) OR
    rpc_is_service_account()
  );

CREATE POLICY "用户可以更新自己的奖励" ON public.box_rewards
  FOR UPDATE USING (
    user_id = auth.uid() OR
    box_id IN (SELECT id FROM public.treasure_boxes WHERE user_id = auth.uid()) OR
    rpc_is_service_account()
  ) WITH CHECK (
    user_id = auth.uid() OR
    box_id IN (SELECT id FROM public.treasure_boxes WHERE user_id = auth.uid()) OR
    rpc_is_service_account()
  );

CREATE POLICY "用户可以删除自己的奖励" ON public.box_rewards
  FOR DELETE USING (
    user_id = auth.uid() OR
    box_id IN (SELECT id FROM public.treasure_boxes WHERE user_id = auth.uid()) OR
    rpc_is_service_account()
  );

-- 设置宝箱层级表的RLS策略
CREATE POLICY "任何人可以查看宝箱层级" ON public.box_tiers
  FOR SELECT USING (true);

CREATE POLICY "只有管理员和服务账户可以管理宝箱层级" ON public.box_tiers
  FOR ALL USING (rpc_is_admin() OR rpc_is_service_account())
  WITH CHECK (rpc_is_admin() OR rpc_is_service_account());

-- 插入默认宝箱层级数据
INSERT INTO public.box_tiers (name, description, probability, min_value, max_value)
VALUES
  ('Common', '普通宝箱，包含基础奖励', 0.60, 1, 100),
  ('Uncommon', '不常见宝箱，包含稀有奖励', 0.25, 101, 500),
  ('Rare', '稀有宝箱，包含珍贵奖励', 0.10, 501, 2000),
  ('Epic', '史诗宝箱，包含极其珍贵的奖励', 0.04, 2001, 10000),
  ('Legendary', '传奇宝箱，包含最珍贵的奖励', 0.01, 10001, 100000)
ON CONFLICT (id) DO NOTHING;

-- 创建宝箱统计视图
CREATE OR REPLACE VIEW public.box_statistics AS
SELECT
  COUNT(*) AS total_boxes,
  COUNT(CASE WHEN status = 'active' AND is_opened = false THEN 1 END) AS active_boxes,
  COUNT(CASE WHEN is_opened = true THEN 1 END) AS opened_boxes,
  COUNT(DISTINCT user_id) AS unique_users,
  AVG(EXTRACT(EPOCH FROM (opened_at - created_at))/3600)::float AS avg_hours_to_open
FROM
  public.treasure_boxes;

-- 创建用户宝箱统计视图
CREATE OR REPLACE VIEW public.user_box_statistics AS
SELECT
  user_id,
  COUNT(*) AS total_boxes,
  COUNT(CASE WHEN status = 'active' AND is_opened = false THEN 1 END) AS unopened_boxes,
  COUNT(CASE WHEN is_opened = true THEN 1 END) AS opened_boxes,
  COUNT(CASE WHEN status = 'burned' THEN 1 END) AS burned_boxes,
  COUNT(CASE WHEN tier_id = (SELECT id FROM public.box_tiers WHERE name = 'Common' LIMIT 1) THEN 1 END) AS common_boxes,
  COUNT(CASE WHEN tier_id = (SELECT id FROM public.box_tiers WHERE name = 'Uncommon' LIMIT 1) THEN 1 END) AS uncommon_boxes,
  COUNT(CASE WHEN tier_id = (SELECT id FROM public.box_tiers WHERE name = 'Rare' LIMIT 1) THEN 1 END) AS rare_boxes,
  COUNT(CASE WHEN tier_id = (SELECT id FROM public.box_tiers WHERE name = 'Epic' LIMIT 1) THEN 1 END) AS epic_boxes,
  COUNT(CASE WHEN tier_id = (SELECT id FROM public.box_tiers WHERE name = 'Legendary' LIMIT 1) THEN 1 END) AS legendary_boxes
FROM public.treasure_boxes
GROUP BY user_id; 