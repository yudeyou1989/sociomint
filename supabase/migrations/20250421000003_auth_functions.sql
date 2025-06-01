-- 用户认证系统的辅助函数和触发器
-- 创建于: 2025-04-21
-- 描述: 用于支持钱包登录和用户配置文件自动创建的函数和触发器

-- 创建触发器函数，在新用户注册时自动创建配置文件
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (user_id, username, avatar, created_at, updated_at)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'preferred_username', 'user_' || FLOOR(RANDOM() * 1000000)::TEXT),
    COALESCE(NEW.raw_user_meta_data->>'avatar_url', NULL),
    NOW(),
    NOW()
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 为auth.users表创建触发器，在插入新用户时自动创建配置文件
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 创建函数，根据钱包地址获取用户ID
CREATE OR REPLACE FUNCTION public.get_user_id_from_wallet(wallet_address TEXT)
RETURNS UUID AS $$
DECLARE
  user_id UUID;
BEGIN
  SELECT wc.user_id INTO user_id
  FROM public.wallet_connections wc
  WHERE wc.wallet_address = get_user_id_from_wallet.wallet_address;
  
  RETURN user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 创建函数，验证消息签名并登录用户（模拟实现）
-- 注意：实际的签名验证应在应用层实现，此处仅为示例
CREATE OR REPLACE FUNCTION public.login_with_wallet(wallet_address TEXT, signature TEXT, message TEXT)
RETURNS JSONB AS $$
DECLARE
  user_id UUID;
  result JSONB;
BEGIN
  -- 获取与钱包地址关联的用户ID
  user_id := public.get_user_id_from_wallet(wallet_address);
  
  -- 如果找到用户，返回成功
  IF user_id IS NOT NULL THEN
    -- 注意：实际应用中应该验证签名
    -- 此处仅为示例，假设签名有效
    
    result := jsonb_build_object(
      'success', true,
      'user_id', user_id
    );
    RETURN result;
  END IF;
  
  -- 未找到用户，返回失败
  result := jsonb_build_object(
    'success', false,
    'message', '未找到与该钱包地址关联的用户'
  );
  RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 创建函数，根据社交账号信息获取用户ID
CREATE OR REPLACE FUNCTION public.get_user_id_from_social(platform TEXT, platform_id TEXT)
RETURNS UUID AS $$
DECLARE
  user_id UUID;
BEGIN
  SELECT sc.user_id INTO user_id
  FROM public.social_connections sc
  WHERE sc.platform = get_user_id_from_social.platform
    AND sc.platform_id = get_user_id_from_social.platform_id;
  
  RETURN user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 创建函数，验证用户是否有管理员权限
CREATE OR REPLACE FUNCTION public.is_admin(user_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
  is_admin BOOLEAN;
BEGIN
  -- 此处应查询实际的管理员表或角色表
  -- 本示例仅使用一个预设的管理员ID列表
  RETURN user_id IN (
    -- 添加实际管理员ID
    'xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx'::UUID
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER; 