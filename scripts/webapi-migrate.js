const fetch = require('node-fetch');
const fs = require('fs');
const path = require('path');

// Supabase配置
const supabaseUrl = 'https://kiyyhitozmezuppziomx.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtpeXloaXRvem1lenVwcHppb214Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDM2OTA4NjgsImV4cCI6MjA1OTI2Njg2OH0.djjofAxZdg7EeRUixmhUomMOyIDkKU0exxhkW_PtBrg';

// 迁移文件
const migrationFiles = [
  '20250421000000_user_profiles_schema.sql',
  '20250421000001_task_system_schema.sql',
  '20250421000002_blockchain_sync_schema.sql',
  '20250421000003_auth_functions.sql',
  '20230815000000_treasure_box_schema.sql', // 已修复的宝箱系统文件
  '20250501000000_box_stats_functions.sql'  // 新添加的宝箱统计函数
];

// 验证迁移结果的表
const verifyTablesList = [
  'profiles',
  'wallet_connections',
  'social_connections',
  'tasks',
  'task_submissions',
  'task_applications',
  'blockchain_sync_status',
  'treasure_boxes',
  'box_rewards',
  'box_tiers'
];

// 验证迁移结果的函数
const verifyFunctionsList = [
  'get_monthly_box_creation',
  'get_user_box_stats',
  'get_top_reward_boxes',
  'get_total_box_value'
];

// 验证迁移结果的视图
const verifyViewsList = [
  'box_statistics',
  'user_box_statistics',
  'box_tier_distribution'
];

async function executeSql(sql) {
  try {
    console.log(`执行SQL查询，长度: ${sql.length}字符`);
    
    // 发送SQL查询到Supabase API
    const response = await fetch(`${supabaseUrl}/rest/v1/rpc/pg_query`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': supabaseKey,
        'Authorization': `Bearer ${supabaseKey}`
      },
      body: JSON.stringify({
        query: sql
      })
    });
    
    if (!response.ok) {
      let errorText = '';
      try {
        const errorData = await response.json();
        errorText = JSON.stringify(errorData);
      } catch (e) {
        errorText = await response.text();
      }
      console.error(`SQL查询失败: ${response.status} ${response.statusText}`);
      console.error(`错误详情: ${errorText}`);
      return false;
    }
    
    console.log('SQL查询成功');
    return true;
  } catch (error) {
    console.error(`执行SQL出错: ${error.message}`);
    return false;
  }
}

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

async function verifyTables() {
  console.log('\n验证表是否创建成功...');
  
  for (const table of verifyTablesList) {
    try {
      // 执行SQL检查表是否存在
      const checkTableSql = `
        SELECT EXISTS (
          SELECT FROM information_schema.tables 
          WHERE table_schema = 'public' 
          AND table_name = '${table}'
        ) as exists
      `;
      
      const response = await fetch(`${supabaseUrl}/rest/v1/rpc/pg_query`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'apikey': supabaseKey,
          'Authorization': `Bearer ${supabaseKey}`
        },
        body: JSON.stringify({
          query: checkTableSql
        })
      });
      
      if (!response.ok) {
        console.error(`检查表 ${table} 失败: ${response.status} ${response.statusText}`);
        continue;
      }
      
      const result = await response.json();
      if (result[0]?.exists) {
        console.log(`✅ 表 ${table} 成功创建`);
      } else {
        console.error(`❌ 表 ${table} 未创建`);
      }
    } catch (error) {
      console.error(`验证表 ${table} 时出错: ${error.message}`);
    }
  }
}

async function verifyFunctions() {
  console.log('\n验证函数是否创建成功...');
  
  for (const func of verifyFunctionsList) {
    try {
      // 执行SQL检查函数是否存在
      const checkFuncSql = `
        SELECT EXISTS (
          SELECT FROM pg_proc p 
          JOIN pg_namespace n ON p.pronamespace = n.oid 
          WHERE n.nspname = 'public' 
          AND p.proname = '${func}'
        ) as exists
      `;
      
      const response = await fetch(`${supabaseUrl}/rest/v1/rpc/pg_query`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'apikey': supabaseKey,
          'Authorization': `Bearer ${supabaseKey}`
        },
        body: JSON.stringify({
          query: checkFuncSql
        })
      });
      
      if (!response.ok) {
        console.error(`检查函数 ${func} 失败: ${response.status} ${response.statusText}`);
        continue;
      }
      
      const result = await response.json();
      if (result[0]?.exists) {
        console.log(`✅ 函数 ${func} 成功创建`);
      } else {
        console.error(`❌ 函数 ${func} 未创建`);
      }
    } catch (error) {
      console.error(`验证函数 ${func} 时出错: ${error.message}`);
    }
  }
}

async function verifyViews() {
  console.log('\n验证视图是否创建成功...');
  
  for (const view of verifyViewsList) {
    try {
      // 执行SQL检查视图是否存在
      const checkViewSql = `
        SELECT EXISTS (
          SELECT FROM information_schema.views 
          WHERE table_schema = 'public' 
          AND table_name = '${view}'
        ) as exists
      `;
      
      const response = await fetch(`${supabaseUrl}/rest/v1/rpc/pg_query`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'apikey': supabaseKey,
          'Authorization': `Bearer ${supabaseKey}`
        },
        body: JSON.stringify({
          query: checkViewSql
        })
      });
      
      if (!response.ok) {
        console.error(`检查视图 ${view} 失败: ${response.status} ${response.statusText}`);
        continue;
      }
      
      const result = await response.json();
      if (result[0]?.exists) {
        console.log(`✅ 视图 ${view} 成功创建`);
      } else {
        console.error(`❌ 视图 ${view} 未创建`);
      }
    } catch (error) {
      console.error(`验证视图 ${view} 时出错: ${error.message}`);
    }
  }
}

async function main() {
  console.log('开始应用迁移文件...\n');
  
  for (const file of migrationFiles) {
    const success = await applyMigration(file);
    if (!success) {
      console.error(`迁移 ${file} 失败，停止执行后续迁移`);
      break;
    }
  }
  
  // 验证迁移结果
  await verifyTables();
  await verifyFunctions();
  await verifyViews();
  
  console.log('\n迁移过程完成');
}

main(); 