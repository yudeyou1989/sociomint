const { createClient } = require('@supabase/supabase-js');

// Supabase配置
const supabaseUrl = 'https://kiyyhitozmezuppziomx.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtpeXloaXRvem1lenVwcHppb214Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDM2OTA4NjgsImV4cCI6MjA1OTI2Njg2OH0.djjofAxZdg7EeRUixmhUomMOyIDkKU0exxhkW_PtBrg';

// 创建Supabase客户端
const supabase = createClient(supabaseUrl, supabaseKey);

// 验证迁移结果的表
const verifyTablesList = [
  'profiles',
  'wallet_connections',
  'social_connections',
  'tasks',
  'task_submissions',
  'task_applications',
  'blockchain_events',
  'sync_status',
  'treasure_boxes',
  'box_rewards',
  'box_tiers'
];

// 验证RLS策略
const verifyPolicies = [
  { table: 'profiles', policy: 'Allow individuals to view all profiles' },
  { table: 'profiles', policy: 'Allow individuals to update their own profile' },
  { table: 'wallet_connections', policy: 'Allow authenticated users to view all wallet connections' },
  { table: 'social_connections', policy: 'Allow authenticated users to view all social connections' },
  { table: 'tasks', policy: 'Tasks are viewable by everyone' },
  { table: 'tasks', policy: 'Tasks can only be updated by creator' },
  { table: 'treasure_boxes', policy: '任何人可以查看公开宝箱' },
  { table: 'treasure_boxes', policy: '用户可以创建自己的宝箱' },
  { table: 'box_rewards', policy: '用户可以查看与自己相关的奖励' }
];

// 验证表是否存在
async function verifyTables() {
  console.log('\n验证表是否创建成功...');
  
  const { data: tables, error } = await supabase
    .from('information_schema.tables')
    .select('table_name')
    .eq('table_schema', 'public');
  
  if (error) {
    console.error('获取表列表失败:', error.message);
    return false;
  }
  
  const existingTables = tables.map(t => t.table_name);
  
  let allTablesExist = true;
  for (const table of verifyTablesList) {
    if (existingTables.includes(table)) {
      console.log(`✅ 表 ${table} 已创建`);
    } else {
      console.error(`❌ 表 ${table} 未创建`);
      allTablesExist = false;
    }
  }
  
  return allTablesExist;
}

// 验证RLS策略是否应用
async function verifyPoliciesExist() {
  console.log('\n验证行级安全策略...');
  
  const { data: policies, error } = await supabase
    .rpc('get_policies');
  
  if (error) {
    console.error('获取策略列表失败:', error.message);
    return false;
  }
  
  let allPoliciesExist = true;
  for (const policy of verifyPolicies) {
    const policyExists = policies.some(p => 
      p.tablename === policy.table && p.policyname === policy.policy
    );
    
    if (policyExists) {
      console.log(`✅ 策略 "${policy.policy}" 已应用于表 ${policy.table}`);
    } else {
      console.error(`❌ 策略 "${policy.policy}" 未应用于表 ${policy.table}`);
      allPoliciesExist = false;
    }
  }
  
  return allPoliciesExist;
}

// 检查视图是否创建
async function verifyViews() {
  console.log('\n验证视图是否创建...');
  
  const views = ['box_statistics', 'user_box_statistics'];
  const { data: viewData, error } = await supabase
    .from('information_schema.views')
    .select('table_name')
    .eq('table_schema', 'public');
  
  if (error) {
    console.error('获取视图列表失败:', error.message);
    return false;
  }
  
  const existingViews = viewData.map(v => v.table_name);
  
  let allViewsExist = true;
  for (const view of views) {
    if (existingViews.includes(view)) {
      console.log(`✅ 视图 ${view} 已创建`);
    } else {
      console.error(`❌ 视图 ${view} 未创建`);
      allViewsExist = false;
    }
  }
  
  return allViewsExist;
}

// 测试简单的数据操作
async function testDataOperations() {
  console.log('\n测试基本数据操作...');
  
  // 测试宝箱层级表查询
  const { data: tiers, error: tierError } = await supabase
    .from('box_tiers')
    .select('*')
    .limit(1);
  
  if (tierError) {
    console.error('查询宝箱层级表失败:', tierError.message);
    return false;
  } else {
    console.log(`✅ 成功查询宝箱层级表，获取了 ${tiers.length} 条记录`);
  }
  
  return true;
}

// 主函数
async function main() {
  console.log('开始验证迁移结果...');
  
  const tablesExist = await verifyTables();
  const policiesExist = await verifyPoliciesExist();
  const viewsExist = await verifyViews();
  const dataOperationsWork = await testDataOperations();
  
  console.log('\n验证结果摘要:');
  console.log(`表结构: ${tablesExist ? '✅ 通过' : '❌ 失败'}`);
  console.log(`RLS策略: ${policiesExist ? '✅ 通过' : '❌ 失败'}`);
  console.log(`视图: ${viewsExist ? '✅ 通过' : '❌ 失败'}`);
  console.log(`数据操作: ${dataOperationsWork ? '✅ 通过' : '❌ 失败'}`);
  
  if (tablesExist && policiesExist && viewsExist && dataOperationsWork) {
    console.log('\n🎉 所有验证通过！迁移成功应用。');
  } else {
    console.error('\n⚠️ 有一些验证没有通过，请检查迁移结果。');
  }
}

main(); 