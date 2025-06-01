const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Supabase配置
const supabaseUrl = 'https://kiyyhitozmezuppziomx.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtpeXloaXRvem1lenVwcHppb214Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0MzY5MDg2OCwiZXhwIjoyMDU5MjY2ODY4fQ.2eHkwj8jLlkxpDPVdqaJfxOMGwenF8GaRUlbAPjgZ-Q';

// 创建Supabase客户端 - 使用service_role密钥以获得完全权限
const supabase = createClient(supabaseUrl, supabaseKey);

// 迁移文件
const migrationFiles = [
  '20250421000000_user_profiles_schema.sql',
  '20250421000001_task_system_schema.sql',
  '20250421000002_blockchain_sync_schema.sql',
  '20250421000003_auth_functions.sql',
  '20230815000000_treasure_box_schema.sql' // 已修复的宝箱系统文件
];

// 使用Supabase服务端API执行SQL查询
async function executeSql(sql) {
  try {
    console.log(`执行SQL查询，长度: ${sql.length}字符`);
    
    const { error } = await supabase.rpc('pg_execute', { sql_query: sql });
    
    if (error) {
      console.error(`SQL查询失败: ${error.message}`);
      if (error.details) console.error(`错误详情: ${error.details}`);
      return false;
    }
    
    console.log('SQL查询成功');
    return true;
  } catch (error) {
    console.error(`执行SQL出错: ${error.message}`);
    if (error.stack) console.error(error.stack);
    return false;
  }
}

// 应用单个迁移文件
async function applyMigration(fileName) {
  const filePath = path.join(__dirname, '..', 'supabase', 'migrations', fileName);
  
  try {
    if (!fs.existsSync(filePath)) {
      console.error(`文件不存在: ${filePath}`);
      return false;
    }
    
    console.log(`应用迁移: ${fileName}`);
    const sql = fs.readFileSync(filePath, 'utf8');
    
    // 将SQL分割成小块执行，每块最多10KB
    const chunks = [];
    const maxChunkSize = 10 * 1024;
    let currentChunk = '';
    
    // 按语句分割SQL
    const statements = sql.split(';');
    
    for (const statement of statements) {
      // 跳过空语句
      if (!statement.trim()) continue;
      
      // 如果添加当前语句会超过最大块大小，保存当前块并开始新块
      if (currentChunk.length + statement.length + 1 > maxChunkSize && currentChunk.length > 0) {
        chunks.push(currentChunk + ';');
        currentChunk = '';
      }
      
      // 添加当前语句到当前块
      currentChunk += statement + ';';
    }
    
    // 添加最后一个块
    if (currentChunk.length > 0) {
      chunks.push(currentChunk);
    }
    
    console.log(`将迁移分割为 ${chunks.length} 个块执行`);
    
    // 顺序执行每个块
    for (let i = 0; i < chunks.length; i++) {
      console.log(`执行块 ${i+1}/${chunks.length}`);
      const success = await executeSql(chunks[i]);
      if (!success) {
        console.error(`执行块 ${i+1}/${chunks.length} 失败，停止后续执行`);
        return false;
      }
    }
    
    console.log(`迁移 ${fileName} 成功应用`);
    return true;
  } catch (error) {
    console.error(`应用迁移 ${fileName} 时出错: ${error.message}`);
    return false;
  }
}

// 验证表是否创建成功
async function verifyTables() {
  console.log('\n验证表是否创建成功...');
  
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
  
  const { data, error } = await supabase.rpc('list_tables', {
    schema_name: 'public'
  });
  
  if (error) {
    console.error('获取表列表失败:', error.message);
    return;
  }
  
  const existingTables = data || [];
  
  for (const table of verifyTablesList) {
    if (existingTables.includes(table)) {
      console.log(`✅ 表 ${table} 成功创建`);
    } else {
      console.error(`❌ 表 ${table} 未创建`);
    }
  }
}

// 主函数
async function main() {
  console.log('开始应用迁移文件...\n');
  
  // 清理已有表（仅用于重新测试）
  if (process.argv.includes('--clean')) {
    console.log('清理模式：将删除现有表...');
    await executeSql(`
      DROP SCHEMA public CASCADE;
      CREATE SCHEMA public;
      GRANT ALL ON SCHEMA public TO postgres;
      GRANT ALL ON SCHEMA public TO public;
    `);
    console.log('成功清理数据库\n');
  }
  
  // 应用所有迁移文件
  for (const file of migrationFiles) {
    const success = await applyMigration(file);
    if (!success) {
      console.error(`迁移 ${file} 失败，停止执行后续迁移`);
      break;
    }
  }
  
  // 验证迁移结果
  await verifyTables();
  
  console.log('\n迁移过程完成');
}

main(); 