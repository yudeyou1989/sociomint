-- 创建平台验证表
CREATE TABLE IF NOT EXISTS public.platform_verifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  wallet_address TEXT NOT NULL,
  platform TEXT NOT NULL,
  platform_username TEXT NOT NULL,
  platform_user_id TEXT NOT NULL,
  verification_time TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  verification_data JSONB DEFAULT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 创建索引
CREATE INDEX IF NOT EXISTS platform_verifications_wallet_address_idx ON public.platform_verifications (wallet_address);
CREATE INDEX IF NOT EXISTS platform_verifications_platform_idx ON public.platform_verifications (platform);
CREATE UNIQUE INDEX IF NOT EXISTS platform_verifications_wallet_platform_idx ON public.platform_verifications (wallet_address, platform);

-- 启用行级安全策略
ALTER TABLE public.platform_verifications ENABLE ROW LEVEL SECURITY;

-- 创建安全策略
-- 任何人都可以插入新验证（通过API控制）
CREATE POLICY "任何人都可以插入新验证" ON public.platform_verifications
  FOR INSERT
  WITH CHECK (true);

-- 用户只能查看自己的验证记录（需要匹配 wallet_address）
CREATE POLICY "用户只能查看自己的验证记录" ON public.platform_verifications
  FOR SELECT
  USING (wallet_address = auth.jwt() ->> 'wallet_address');

-- 用户不能更新或删除验证记录
CREATE POLICY "禁止用户更新验证记录" ON public.platform_verifications
  FOR UPDATE
  USING (false);

CREATE POLICY "禁止用户删除验证记录" ON public.platform_verifications
  FOR DELETE
  USING (false);

-- 创建触发器以自动更新 updated_at 字段
CREATE OR REPLACE FUNCTION update_modified_column()
RETURNS TRIGGER AS $$
BEGIN
   NEW.updated_at = NOW();
   RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_platform_verifications_updated_at
BEFORE UPDATE ON public.platform_verifications
FOR EACH ROW
EXECUTE FUNCTION update_modified_column();

-- 添加注释
COMMENT ON TABLE public.platform_verifications IS '存储用户社交平台验证信息';
COMMENT ON COLUMN public.platform_verifications.wallet_address IS '用户钱包地址';
COMMENT ON COLUMN public.platform_verifications.platform IS '社交平台名称（如 twitter, telegram, discord）';
COMMENT ON COLUMN public.platform_verifications.platform_username IS '用户在平台上的用户名';
COMMENT ON COLUMN public.platform_verifications.platform_user_id IS '平台用户ID';
COMMENT ON COLUMN public.platform_verifications.verification_time IS '验证时间';
COMMENT ON COLUMN public.platform_verifications.verification_data IS '额外的验证数据（如个人资料信息）';

-- 授予服务角色权限
GRANT SELECT, INSERT ON public.platform_verifications TO service_role; 