const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Supabase配置
const supabaseUrl = 'https://kiyyhitozmezuppziomx.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtpeXloaXRvem1lenVwcHppb214Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0MzY5MDg2OCwiZXhwIjoyMDU5MjY2ODY4fQ.2eHkwj8jLlkxpDPVdqaJfxOMGwenF8GaRUlbAPjgZ-Q';

// 备份的表名列表
const tablesToBackup = [
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

// 创建Supabase客户端
const supabase = createClient(supabaseUrl, supabaseKey);

// 确保备份目录存在
function ensureBackupDir() {
  const backupDir = path.join(__dirname, '..', 'backups');
  if (!fs.existsSync(backupDir)) {
    fs.mkdirSync(backupDir, { recursive: true });
    console.log(`创建备份目录: ${backupDir}`);
  }
  return backupDir;
}

// 生成备份文件名
function generateBackupFilename(tableName) {
  const now = new Date();
  const timestamp = [
    now.getFullYear(),
    String(now.getMonth() + 1).padStart(2, '0'),
    String(now.getDate()).padStart(2, '0'),
    String(now.getHours()).padStart(2, '0'),
    String(now.getMinutes()).padStart(2, '0')
  ].join('');
  
  return `${tableName}_${timestamp}.json`;
}

// 备份单个表
async function backupTable(tableName) {
  console.log(`正在备份表: ${tableName}`);
  try {
    // 查询表数据
    const { data, error } = await supabase
      .from(tableName)
      .select('*');
    
    if (error) {
      console.error(`备份表 ${tableName} 时出错:`, error.message);
      return false;
    }
    
    // 没有数据也创建备份文件，但会是空数组
    const backupData = data || [];
    
    // 创建备份文件
    const backupDir = ensureBackupDir();
    const filename = generateBackupFilename(tableName);
    const filePath = path.join(backupDir, filename);
    
    // 写入文件
    fs.writeFileSync(
      filePath, 
      JSON.stringify(backupData, null, 2), 
      'utf8'
    );
    
    console.log(`✅ 成功备份表 ${tableName} 到文件 ${filename}，包含 ${backupData.length} 条记录`);
    return true;
  } catch (error) {
    console.error(`备份表 ${tableName} 时发生异常:`, error.message);
    return false;
  }
}

// 备份数据库模式
async function backupSchema() {
  console.log(`正在备份数据库模式...`);
  try {
    // 获取所有表结构
    const { data: tables, error: tablesError } = await supabase
      .rpc('get_schema_info');
    
    if (tablesError) {
      console.error(`获取数据库模式时出错:`, tablesError.message);
      return false;
    }
    
    // 获取所有RLS策略
    const { data: policies, error: policiesError } = await supabase
      .rpc('get_policies');
    
    if (policiesError) {
      console.error(`获取RLS策略时出错:`, policiesError.message);
      return false;
    }
    
    // 创建模式备份
    const schemaBackup = {
      timestamp: new Date().toISOString(),
      tables: tables || [],
      policies: policies || []
    };
    
    // 创建备份文件
    const backupDir = ensureBackupDir();
    const filename = `schema_${schemaBackup.timestamp.split('T')[0]}.json`;
    const filePath = path.join(backupDir, filename);
    
    // 写入文件
    fs.writeFileSync(
      filePath, 
      JSON.stringify(schemaBackup, null, 2), 
      'utf8'
    );
    
    console.log(`✅ 成功备份数据库模式到文件 ${filename}`);
    return true;
  } catch (error) {
    console.error(`备份数据库模式时发生异常:`, error.message);
    return false;
  }
}

// 创建备份元数据文件
function createBackupMetadata(results) {
  const backupDir = ensureBackupDir();
  const metadata = {
    timestamp: new Date().toISOString(),
    results: results,
    success: results.every(result => result.success)
  };
  
  const filename = `backup_metadata_${metadata.timestamp.split('T')[0]}.json`;
  const filePath = path.join(backupDir, filename);
  
  fs.writeFileSync(
    filePath, 
    JSON.stringify(metadata, null, 2), 
    'utf8'
  );
  
  console.log(`✅ 已创建备份元数据文件: ${filename}`);
  return metadata;
}

// 备份所有表
async function backupAllTables() {
  console.log('开始备份数据库...\n');
  
  const results = [];
  
  // 首先备份数据库模式
  const schemaSuccess = await backupSchema();
  results.push({
    name: 'database_schema',
    success: schemaSuccess,
    timestamp: new Date().toISOString()
  });
  
  // 然后备份所有表数据
  for (const tableName of tablesToBackup) {
    const success = await backupTable(tableName);
    results.push({
      name: tableName,
      success,
      timestamp: new Date().toISOString()
    });
  }
  
  // 创建备份元数据
  const metadata = createBackupMetadata(results);
  
  console.log('\n======= 备份结果摘要 =======');
  console.log(`总表数: ${tablesToBackup.length + 1}`);
  console.log(`成功备份: ${results.filter(r => r.success).length}`);
  console.log(`失败: ${results.filter(r => !r.success).length}`);
  
  if (metadata.success) {
    console.log(`\n🎉 所有表已成功备份!`);
  } else {
    console.error(`\n⚠️ 有些表备份失败，请检查日志`);
  }
}

// 恢复单个表
async function restoreTable(filePath, tableName) {
  console.log(`正在从文件 ${filePath} 恢复表 ${tableName}...`);
  
  try {
    // 读取备份文件
    if (!fs.existsSync(filePath)) {
      console.error(`备份文件不存在: ${filePath}`);
      return false;
    }
    
    const backupData = JSON.parse(fs.readFileSync(filePath, 'utf8'));
    
    if (!Array.isArray(backupData)) {
      console.error(`备份文件格式错误，期望数组但得到: ${typeof backupData}`);
      return false;
    }
    
    if (backupData.length === 0) {
      console.log(`备份文件为空，表 ${tableName} 没有数据需要恢复`);
      return true;
    }
    
    // 清空表
    console.log(`清空表 ${tableName}...`);
    const { error: deleteError } = await supabase
      .from(tableName)
      .delete()
      .neq('id', '00000000-0000-0000-0000-000000000000'); // 删除所有行
    
    if (deleteError) {
      console.error(`清空表 ${tableName} 时出错:`, deleteError.message);
      return false;
    }
    
    // 恢复数据
    console.log(`正在插入 ${backupData.length} 条记录到表 ${tableName}...`);
    
    // 分批插入数据以避免请求过大
    const batchSize = 100;
    let success = true;
    
    for (let i = 0; i < backupData.length; i += batchSize) {
      const batch = backupData.slice(i, i + batchSize);
      
      const { error: insertError } = await supabase
        .from(tableName)
        .insert(batch);
      
      if (insertError) {
        console.error(`插入数据到表 ${tableName} 时出错:`, insertError.message);
        success = false;
        break;
      }
      
      console.log(`已插入 ${i + batch.length}/${backupData.length} 条记录`);
    }
    
    if (success) {
      console.log(`✅ 成功恢复表 ${tableName}`);
    } else {
      console.error(`❌ 恢复表 ${tableName} 失败`);
    }
    
    return success;
  } catch (error) {
    console.error(`恢复表 ${tableName} 时发生异常:`, error.message);
    return false;
  }
}

// 执行备份
backupAllTables(); 