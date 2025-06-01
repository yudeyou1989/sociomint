const { createClient } = require('@supabase/supabase-js');

// Supabase客户端配置
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://kiyyhitozmezuppziomx.supabase.co';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtpeXloaXRvem1lenVwcHppb214Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDM2OTA4NjgsImV4cCI6MjA1OTI2Njg2OH0.djjofAxZdg7EeRUixmhUomMOyIDkKU0exxhkW_PtBrg';

// 创建supabase客户端
const supabase = createClient(supabaseUrl, supabaseAnonKey);

// 验证表结构
async function verifyTableSchema() {
  try {
    console.log('开始验证表结构...');
    
    // 查询数据库表信息
    const { data: tables, error } = await supabase
      .rpc('get_tables');
    
    if (error) {
      // 尝试其他方法获取表信息
      console.log('使用rpc方法获取表信息失败，尝试直接查询...');
      
      // 尝试从profiles表获取信息
      const { error: profilesError } = await supabase
        .from('profiles')
        .select('id')
        .limit(1);
      
      if (profilesError && profilesError.code === '42P01') {
        console.error('错误: profiles表不存在，请确保已执行迁移脚本');
      } else {
        console.log('profiles表存在');
      }
      
      // 尝试从wallet_connections表获取信息
      const { error: walletsError } = await supabase
        .from('wallet_connections')
        .select('id')
        .limit(1);
      
      if (walletsError && walletsError.code === '42P01') {
        console.error('错误: wallet_connections表不存在，请确保已执行迁移脚本');
      } else {
        console.log('wallet_connections表存在');
      }
      
      // 尝试从social_connections表获取信息
      const { error: socialsError } = await supabase
        .from('social_connections')
        .select('id')
        .limit(1);
      
      if (socialsError && socialsError.code === '42P01') {
        console.error('错误: social_connections表不存在，请确保已执行迁移脚本');
      } else {
        console.log('social_connections表存在');
      }
      
      // 尝试从tasks表获取信息
      const { error: tasksError } = await supabase
        .from('tasks')
        .select('id')
        .limit(1);
      
      if (tasksError && tasksError.code === '42P01') {
        console.error('错误: tasks表不存在，请确保已执行迁移脚本');
      } else {
        console.log('tasks表存在');
      }
      
      // 尝试从task_submissions表获取信息
      const { error: submissionsError } = await supabase
        .from('task_submissions')
        .select('id')
        .limit(1);
      
      if (submissionsError && submissionsError.code === '42P01') {
        console.error('错误: task_submissions表不存在，请确保已执行迁移脚本');
      } else {
        console.log('task_submissions表存在');
      }
      
      // 尝试从blockchain_events表获取信息
      const { error: eventsError } = await supabase
        .from('blockchain_events')
        .select('id')
        .limit(1);
      
      if (eventsError && eventsError.code === '42P01') {
        console.error('错误: blockchain_events表不存在，请确保已执行迁移脚本');
      } else {
        console.log('blockchain_events表存在');
      }
      
      return;
    }
    
    // 打印表信息
    console.log('数据库表信息:');
    if (tables && tables.length > 0) {
      for (const table of tables) {
        console.log(`- ${table.table_name}`);
      }
    } else {
      console.log('未找到任何表');
    }
  } catch (error) {
    console.error('验证表结构失败:', error);
  }
}

// 验证权限
async function verifyPermissions() {
  try {
    console.log('\n开始验证权限...');
    
    // 尝试向profiles表插入数据（匿名用户应该被禁止）
    const { error: insertError } = await supabase
      .from('profiles')
      .insert({
        user_id: '00000000-0000-0000-0000-000000000000', // 伪造的用户ID
        username: 'test_user'
      });
    
    if (insertError && insertError.code === 'PGRST301') {
      console.log('权限验证成功: 匿名用户无法向profiles表插入数据');
    } else {
      console.error('权限验证失败: 匿名用户可以向profiles表插入数据或发生了其他错误');
      console.error('错误详情:', insertError);
    }
    
    // 尝试查询公开数据（匿名用户应该被允许）
    const { error: selectError } = await supabase
      .from('profiles')
      .select('username')
      .limit(1);
    
    if (!selectError) {
      console.log('权限验证成功: 匿名用户可以查询profiles表');
    } else {
      console.error('权限验证失败: 匿名用户无法查询profiles表');
      console.error('错误详情:', selectError);
    }
    
    // 尝试更新数据（匿名用户应该被禁止）
    const { error: updateError } = await supabase
      .from('profiles')
      .update({ bio: 'test' })
      .eq('id', '00000000-0000-0000-0000-000000000000');
    
    if (updateError && updateError.code === 'PGRST301') {
      console.log('权限验证成功: 匿名用户无法更新profiles表数据');
    } else {
      console.error('权限验证失败: 匿名用户可以更新profiles表数据或发生了其他错误');
      console.error('错误详情:', updateError);
    }
  } catch (error) {
    console.error('验证权限失败:', error);
  }
}

// 验证用户创建触发器
async function verifyTriggers() {
  try {
    console.log('\n开始验证触发器...');
    
    // 由于无法直接验证触发器，我们可以检查是否有现有的profiles记录
    const { data, error } = await supabase
      .from('profiles')
      .select('user_id')
      .limit(5);
    
    if (error) {
      console.error('无法查询profiles表:', error);
      return;
    }
    
    if (data && data.length > 0) {
      console.log(`找到${data.length}个用户资料记录，说明可能有用户创建触发器在工作`);
    } else {
      console.log('未找到用户资料记录，无法确认触发器是否工作');
    }
  } catch (error) {
    console.error('验证触发器失败:', error);
  }
}

// 验证数据库迁移状态
async function verifyMigrations() {
  try {
    console.log('\n开始验证数据库迁移状态...');
    
    // 尝试查询迁移表（如果有的话）
    const { data, error } = await supabase
      .from('schema_migrations')
      .select('*');
    
    if (error && error.code === '42P01') {
      console.log('schema_migrations表不存在，可能未使用标准迁移工具');
    } else if (error) {
      console.error('查询迁移状态失败:', error);
    } else if (data) {
      console.log('迁移记录:');
      for (const migration of data) {
        console.log(`- ${migration.version}: ${migration.name}`);
      }
    }
  } catch (error) {
    console.error('验证迁移状态失败:', error);
  }
}

// 主函数：运行所有验证
async function main() {
  console.log('===== Supabase 数据库结构验证 =====');
  console.log(`URL: ${supabaseUrl}`);
  console.log('==================================\n');
  
  await verifyTableSchema();
  await verifyPermissions();
  await verifyTriggers();
  await verifyMigrations();
  
  console.log('\n验证完成');
}

main(); 