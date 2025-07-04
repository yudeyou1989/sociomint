import { createClient } from '@supabase/supabase-js';

// Supabase配置
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

// 验证必需的环境变量
if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing required Supabase environment variables. Please check NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY.');
}

// 输出调试信息
console.log('Initializing Supabase with URL:', supabaseUrl);

// 创建Supabase客户端
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true
  },
  realtime: {
    // 开启实时订阅功能
    enabled: true
  }
});

// 添加自定义钩子，用于检测Supabase连接状态
export const checkSupabaseConnection = async () => {
  try {
    // 尝试执行简单查询来检测连接状态
    const { data, error } = await supabase.from('box_tiers').select('count(*)', { count: 'exact', head: true });

    if (error) {
      console.error('Supabase连接错误:', error);
      return false;
    }

    return true;
  } catch (error) {
    console.error('检查Supabase连接时出错:', error);
    return false;
  }
};

// 辅助函数：处理Supabase错误
export const handleSupabaseError = (error: any) => {
  console.error('Supabase操作错误:', error);

  // 根据错误类型返回友好的错误消息
  if (error.code === '23505') {
    return '该记录已存在，请勿重复创建。';
  } else if (error.code === '23503') {
    return '引用的记录不存在，无法完成操作。';
  } else if (error.code === '42501') {
    return '您没有权限执行此操作。';
  } else if (error.message) {
    return error.message;
  }

  return '操作失败，请重试或联系管理员。';
};

// 导出一个简单的测试函数，用于验证连接
export const testSupabaseConnection = async () => {
  try {
    // 测试auth服务，这通常总是可用的
    const { data, error } = await supabase.auth.getSession();
    if (error) {
      throw error;
    }
    return { success: true, data };
  } catch (error) {
    console.error('Supabase连接测试失败:', error);
    return { success: false, error };
  }
};