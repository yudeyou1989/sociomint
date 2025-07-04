import { supabase } from './supabase';

/**
 * 检查Supabase连接状态
 * @returns 包含连接状态和错误信息的对象
 */
export async function checkSupabaseConnection(): Promise<{ connected: boolean; error?: string }> {
  try {
    // 尝试执行一个简单的查询来检查连接状态
    const { data, error } = await supabase
      .from('health_check')
      .select('count')
      .single();

    // 如果查询失败但错误信息表明是表不存在的问题，则可能是数据库连接正常但表不存在
    if (error && error.code === '42P01') {
      // 尝试另一个操作，例如查询auth.users
      const { error: authError } = await supabase.auth.getSession();
      
      if (!authError) {
        return { connected: true };
      }
      
      return { 
        connected: false, 
        error: `Supabase已连接，但health_check表不存在，认证API错误: ${authError.message}` 
      };
    }
    
    // 如果有其他错误
    if (error) {
      return { 
        connected: false, 
        error: `连接错误: ${error.message}` 
      };
    }
    
    return { connected: true };
  } catch (error) {
    return { 
      connected: false, 
      error: `未预期的错误: ${error instanceof Error ? error.message : String(error)}` 
    };
  }
}

/**
 * 执行简单查询测试Supabase
 * @param tableName 表名
 * @returns 查询结果和状态
 */
export async function testSupabaseQuery(tableName: string): Promise<{ 
  success: boolean; 
  data?: any; 
  error?: string;
  count?: number;
}> {
  try {
    // 尝试查询指定表的数量
    const { data, error, count } = await supabase
      .from(tableName)
      .select('*', { count: 'exact' })
      .limit(1);
    
    if (error) {
      return { 
        success: false, 
        error: `查询错误: ${error.message}` 
      };
    }
    
    return { 
      success: true, 
      data, 
      count 
    };
  } catch (error) {
    return { 
      success: false, 
      error: `未预期的错误: ${error instanceof Error ? error.message : String(error)}` 
    };
  }
} 