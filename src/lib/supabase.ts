import { createClient } from '@supabase/supabase-js';

// 使用环境变量或回退到硬编码值
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://kiyyhitozmezuppziomx.supabase.co';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtpeXloaXRvem1lenVwcHppb214Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDM2OTA4NjgsImV4cCI6MjA1OTI2Njg2OH0.djjofAxZdg7EeRUixmhUomMOyIDkKU0exxhkW_PtBrg';

// 创建supabase客户端
export const supabase = createClient(supabaseUrl, supabaseAnonKey);

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