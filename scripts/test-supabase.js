const { createClient } = require('@supabase/supabase-js');

async function main() {
  // 使用.mcp-config.json中的配置
  const supabaseUrl = 'https://kiyyhitozmezuppziomx.supabase.co';
  const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtpeXloaXRvem1lenVwcHppb214Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDM2OTA4NjgsImV4cCI6MjA1OTI2Njg2OH0.djjofAxZdg7EeRUixmhUomMOyIDkKU0exxhkW_PtBrg';

  // 创建supabase客户端
  const supabase = createClient(supabaseUrl, supabaseAnonKey);

  try {
    console.log('测试Supabase连接...');
    
    // 尝试执行最简单的查询 - 获取服务器时间
    const { data, error } = await supabase
      .from('_realtime')
      .select('*')
      .limit(1);
    
    if (error && error.code !== 'PGRST116') { // PGRST116表示表不存在，这是预期的
      // 尝试使用auth API来测试连接
      console.log('测试auth API...');
      const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
      
      if (sessionError) {
        throw sessionError;
      }
      
      console.log('成功连接到Supabase的Auth服务!');
      console.log('Session数据:', sessionData);
      return;
    }
    
    console.log('成功连接到Supabase!');
    if (data) {
      console.log('返回数据:', data);
    } else {
      console.log('(没有返回数据，但连接正常)');
    }
    
  } catch (error) {
    console.error('Supabase连接测试失败:', error);
  }
}

main(); 