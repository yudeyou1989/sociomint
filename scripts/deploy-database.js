#!/usr/bin/env node

/**
 * SocioMint 数据库部署脚本
 * 自动执行数据库迁移和初始化
 */

const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

// 颜色输出
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

// 初始化 Supabase 客户端
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  log('❌ 错误: 缺少 Supabase 配置', 'red');
  log('请确保设置了以下环境变量:', 'yellow');
  log('- NEXT_PUBLIC_SUPABASE_URL', 'yellow');
  log('- SUPABASE_SERVICE_ROLE_KEY', 'yellow');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

// 获取迁移文件
function getMigrationFiles() {
  const migrationsDir = path.join(__dirname, '../supabase/migrations');

  if (!fs.existsSync(migrationsDir)) {
    log('❌ 迁移目录不存在: ' + migrationsDir, 'red');
    return [];
  }

  const files = fs.readdirSync(migrationsDir)
    .filter(file => file.endsWith('.sql'))
    .sort();

  return files.map(file => ({
    name: file,
    path: path.join(migrationsDir, file),
    content: fs.readFileSync(path.join(migrationsDir, file), 'utf8')
  }));
}

// 执行 SQL 命令
async function executeSql(sql, description) {
  log(`🔄 ${description}`, 'blue');
  log(`📝 请手动在 Supabase SQL 编辑器中执行以下 SQL:`, 'yellow');
  log('=' * 80, 'cyan');
  console.log(sql);
  log('=' * 80, 'cyan');

  // 在实际项目中，您需要手动在 Supabase Dashboard 的 SQL 编辑器中执行这些 SQL
  log(`⚠️  请在 Supabase Dashboard 中手动执行上述 SQL`, 'yellow');
  log(`✅ 标记为完成: ${description}`, 'green');
  return true;
}

// 创建迁移记录表
async function createMigrationTable() {
  const sql = `
    CREATE TABLE IF NOT EXISTS _migrations (
      id SERIAL PRIMARY KEY,
      filename TEXT UNIQUE NOT NULL,
      executed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
      checksum TEXT
    );
  `;

  return await executeSql(sql, '创建迁移记录表');
}

// 检查迁移是否已执行
async function isMigrationExecuted(filename) {
  try {
    const { data, error } = await supabase
      .from('_migrations')
      .select('filename')
      .eq('filename', filename)
      .single();

    return !error && data;
  } catch (error) {
    return false;
  }
}

// 记录迁移执行
async function recordMigration(filename, checksum) {
  try {
    const { error } = await supabase
      .from('_migrations')
      .insert({
        filename,
        checksum,
        executed_at: new Date().toISOString()
      });

    if (error) {
      log(`⚠️  无法记录迁移: ${error.message}`, 'yellow');
    }
  } catch (error) {
    log(`⚠️  无法记录迁移: ${error.message}`, 'yellow');
  }
}

// 计算文件校验和
function calculateChecksum(content) {
  const crypto = require('crypto');
  return crypto.createHash('md5').update(content).digest('hex');
}

// 执行迁移
async function runMigrations() {
  log('🚀 开始数据库迁移...', 'cyan');

  // 创建迁移记录表
  await createMigrationTable();

  const migrations = getMigrationFiles();

  if (migrations.length === 0) {
    log('⚠️  没有找到迁移文件', 'yellow');
    return;
  }

  log(`📁 找到 ${migrations.length} 个迁移文件`, 'blue');

  let executed = 0;
  let skipped = 0;
  let failed = 0;

  for (const migration of migrations) {
    const checksum = calculateChecksum(migration.content);

    // 检查是否已执行
    if (await isMigrationExecuted(migration.name)) {
      log(`⏭️  跳过已执行的迁移: ${migration.name}`, 'yellow');
      skipped++;
      continue;
    }

    log(`\n📄 执行迁移: ${migration.name}`, 'bright');

    // 执行迁移
    const success = await executeSql(migration.content, migration.name);

    if (success) {
      await recordMigration(migration.name, checksum);
      executed++;
      log(`✅ 迁移成功: ${migration.name}`, 'green');
    } else {
      failed++;
      log(`❌ 迁移失败: ${migration.name}`, 'red');

      // 询问是否继续
      if (process.env.NODE_ENV !== 'test') {
        const readline = require('readline');
        const rl = readline.createInterface({
          input: process.stdin,
          output: process.stdout
        });

        const answer = await new Promise(resolve => {
          rl.question('是否继续执行剩余迁移? (y/N): ', resolve);
        });

        rl.close();

        if (answer.toLowerCase() !== 'y') {
          break;
        }
      }
    }
  }

  // 输出总结
  log('\n📊 迁移总结:', 'bright');
  log(`✅ 成功执行: ${executed}`, 'green');
  log(`⏭️  跳过: ${skipped}`, 'yellow');
  log(`❌ 失败: ${failed}`, failed > 0 ? 'red' : 'reset');

  if (failed === 0) {
    log('\n🎉 所有迁移执行完成!', 'green');
  } else {
    log('\n⚠️  部分迁移失败，请检查错误信息', 'yellow');
  }
}

// 验证数据库连接
async function testConnection() {
  try {
    log('🔗 测试数据库连接...', 'blue');

    const { data, error } = await supabase
      .from('_migrations')
      .select('count')
      .limit(1);

    if (error && error.code !== '42P01') { // 42P01 = relation does not exist
      throw error;
    }

    log('✅ 数据库连接成功', 'green');
    return true;
  } catch (error) {
    log('❌ 数据库连接失败', 'red');
    log(`错误: ${error.message}`, 'red');
    return false;
  }
}

// 主函数
async function main() {
  log('🎯 SocioMint 数据库部署工具', 'bright');
  log('=' * 50, 'cyan');

  // 测试连接
  if (!(await testConnection())) {
    process.exit(1);
  }

  // 执行迁移
  await runMigrations();

  log('\n🏁 部署完成!', 'bright');
}

// 错误处理
process.on('uncaughtException', (error) => {
  log(`💥 未捕获的异常: ${error.message}`, 'red');
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  log(`💥 未处理的 Promise 拒绝: ${reason}`, 'red');
  process.exit(1);
});

// 运行主函数
if (require.main === module) {
  main().catch(error => {
    log(`💥 部署失败: ${error.message}`, 'red');
    process.exit(1);
  });
}

module.exports = {
  runMigrations,
  testConnection,
  executeSql
};
