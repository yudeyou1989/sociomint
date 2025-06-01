const fs = require('fs');
const path = require('path');

// 迁移文件路径
const migrationsDir = path.join(__dirname, '..', 'supabase', 'migrations');

// 按顺序执行的迁移文件
const migrationFiles = [
  '20250421000000_user_profiles_schema.sql',
  '20250421000001_task_system_schema.sql',
  '20250421000002_blockchain_sync_schema.sql',
  '20250421000003_auth_functions.sql'
];

// 提取迁移文件内容
function extractMigration(filePath) {
  console.log(`提取迁移文件: ${filePath}`);
  
  try {
    // 读取迁移文件内容
    const sqlContent = fs.readFileSync(filePath, 'utf8');
    
    // 输出内容到控制台
    console.log('\n=====================================================');
    console.log(`迁移文件: ${path.basename(filePath)}`);
    console.log('=====================================================\n');
    console.log(sqlContent);
    
    return true;
  } catch (error) {
    console.error(`提取迁移文件失败: ${filePath}`);
    console.error(`错误: ${error.message}`);
    return false;
  }
}

// 提取所有迁移文件
function extractMigrations() {
  for (const file of migrationFiles) {
    const filePath = path.join(migrationsDir, file);
    
    if (!fs.existsSync(filePath)) {
      console.error(`迁移文件不存在: ${filePath}`);
      continue;
    }
    
    extractMigration(filePath);
  }
  
  console.log('\n迁移文件提取完成。请复制上述SQL代码到Supabase控制台的SQL编辑器中执行。');
}

// 执行提取
extractMigrations(); 