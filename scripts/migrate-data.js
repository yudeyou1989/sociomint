/**
 * Supabase 数据迁移脚本
 *
 * 该脚本用于将开发环境的数据迁移到生产环境。
 * 运行方式：node scripts/migrate-data.js
 */

require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

// 开发环境 Supabase 客户端
const devSupabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const devSupabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

// 生产环境 Supabase 客户端
const prodSupabaseUrl = process.env.PROD_SUPABASE_URL;
const prodSupabaseServiceKey = process.env.PROD_SUPABASE_SERVICE_ROLE_KEY;

if (!devSupabaseUrl || !devSupabaseServiceKey) {
  console.error('错误: 缺少开发环境 Supabase 配置。请确保 .env 文件中包含 NEXT_PUBLIC_SUPABASE_URL 和 SUPABASE_SERVICE_ROLE_KEY。');
  process.exit(1);
}

if (!prodSupabaseUrl || !prodSupabaseServiceKey) {
  console.error('错误: 缺少生产环境 Supabase 配置。请确保 .env 文件中包含 PROD_SUPABASE_URL 和 PROD_SUPABASE_SERVICE_ROLE_KEY。');
  process.exit(1);
}

const devSupabase = createClient(devSupabaseUrl, devSupabaseServiceKey);
const prodSupabase = createClient(prodSupabaseUrl, prodSupabaseServiceKey);

// 要迁移的表
const tables = [
  'users',
  'multisig_transactions',
  'xiaohonghua_exchanges',
  'tasks',
  'task_completions',
  'exchange_rates',
  'platform_verifications'
];

/**
 * 迁移表数据
 */
async function migrateTable(tableName) {
  console.log(`开始迁移表: ${tableName}`);

  try {
    // 从开发环境获取数据
    const { data, error } = await devSupabase
      .from(tableName)
      .select('*');

    if (error) {
      console.error(`从开发环境获取 ${tableName} 数据失败:`, error);
      return false;
    }

    if (!data || data.length === 0) {
      console.log(`表 ${tableName} 没有数据需要迁移`);
      return true;
    }

    console.log(`从开发环境获取到 ${data.length} 条 ${tableName} 数据`);

    // 将数据插入到生产环境
    const { error: insertError } = await prodSupabase
      .from(tableName)
      .insert(data);

    if (insertError) {
      console.error(`将数据插入到生产环境的 ${tableName} 表失败:`, insertError);
      return false;
    }

    console.log(`成功将 ${data.length} 条数据迁移到生产环境的 ${tableName} 表`);
    return true;
  } catch (error) {
    console.error(`迁移表 ${tableName} 时出错:`, error);
    return false;
  }
}

/**
 * 主函数
 */
async function main() {
  console.log('开始数据迁移...');

  let successCount = 0;
  let failCount = 0;

  for (const table of tables) {
    const success = await migrateTable(table);
    if (success) {
      successCount++;
    } else {
      failCount++;
    }
  }

  console.log('数据迁移完成');
  console.log(`成功: ${successCount} 个表`);
  console.log(`失败: ${failCount} 个表`);

  if (failCount > 0) {
    console.error('有些表迁移失败，请检查错误信息并手动处理');
    process.exit(1);
  }
}

// 执行主函数
main();
