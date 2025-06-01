/**
 * Supabase 生产环境迁移脚本
 *
 * 该脚本用于将开发环境的数据迁移到生产环境。
 * 运行方式：node scripts/migrate-to-production.js
 */

require('dotenv').config();
const fs = require('fs');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');

// 开发环境 Supabase 客户端
const devSupabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const devSupabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

// 生产环境 Supabase 客户端
const prodSupabaseUrl = process.env.PROD_SUPABASE_URL;
const prodSupabaseServiceKey = process.env.PROD_SUPABASE_SERVICE_ROLE_KEY;

// 检查开发环境配置
if (!devSupabaseUrl || !devSupabaseServiceKey) {
  console.warn('警告: 缺少开发环境 Supabase 配置。将继续生成迁移指南，但无法连接到开发环境。');
}

// 检查生产环境配置
if (!prodSupabaseUrl || !prodSupabaseServiceKey) {
  console.warn('警告: 缺少生产环境 Supabase 配置。将继续生成迁移指南，但无法连接到生产环境。');
}

// 创建 Supabase 客户端（如果配置存在）
let devSupabase = null;
let prodSupabase = null;

if (devSupabaseUrl && devSupabaseServiceKey) {
  devSupabase = createClient(devSupabaseUrl, devSupabaseServiceKey);
}

if (prodSupabaseUrl && prodSupabaseServiceKey) {
  prodSupabase = createClient(prodSupabaseUrl, prodSupabaseServiceKey);
}

/**
 * 生成迁移指南
 */
async function generateMigrationGuide() {
  try {
    // 读取 SQL 文件
    const sqlFilePath = path.join(__dirname, 'setup-database.sql');
    const sqlContent = fs.readFileSync(sqlFilePath, 'utf8');

    console.log('SQL 文件读取成功，生成迁移指南...');

    // 生成指南文件
    const guideContent = `# Supabase 生产环境迁移指南

## 概述

本指南将帮助您将开发环境的数据迁移到生产环境。

## 步骤

### 1. 创建生产环境 Supabase 项目

1. 登录 Supabase 控制台：https://app.supabase.io
2. 点击 "New Project" 创建一个新项目
3. 填写项目信息：
   - 名称：SocioMint-Production
   - 数据库密码：设置一个强密码
   - 区域：选择离您的用户最近的区域
4. 点击 "Create new project" 创建项目

### 2. 设置生产环境数据库

1. 在新创建的项目中，点击左侧菜单中的 "SQL 编辑器"
2. 创建一个新的查询
3. 将以下 SQL 脚本复制粘贴到编辑器中
4. 点击 "运行" 按钮执行脚本

\`\`\`sql
${sqlContent}
\`\`\`

### 3. 配置生产环境

1. 在生产环境 Supabase 项目中，点击左侧菜单中的 "Project Settings"
2. 点击 "API" 选项卡
3. 复制 "Project URL" 和 "anon public" 密钥
4. 更新您的 .env 文件，添加以下内容：

\`\`\`
PROD_SUPABASE_URL=您的生产环境项目URL
PROD_SUPABASE_ANON_KEY=您的生产环境anon public密钥
PROD_SUPABASE_SERVICE_ROLE_KEY=您的生产环境service_role密钥
\`\`\`

### 4. 迁移数据

如果您需要迁移开发环境的数据到生产环境，可以使用以下方法：

#### 方法一：手动导出导入

1. 在开发环境 Supabase 项目中，点击左侧菜单中的 "表编辑器"
2. 选择要导出的表
3. 点击 "导出" 按钮，选择 CSV 格式
4. 在生产环境 Supabase 项目中，点击左侧菜单中的 "表编辑器"
5. 选择要导入的表
6. 点击 "导入" 按钮，选择之前导出的 CSV 文件

#### 方法二：使用迁移脚本

运行以下命令迁移数据：

\`\`\`
node scripts/migrate-data.js
\`\`\`

### 5. 更新前端配置

1. 更新 vercel.json 文件，将 Supabase 配置更新为生产环境的配置
2. 部署前端应用到生产环境

## 注意事项

- 确保生产环境的安全设置得当
- 定期备份生产环境数据
- 监控生产环境的性能和错误
`;

    // 写入指南文件
    const guidePath = path.join(__dirname, 'supabase-migration-guide.md');
    fs.writeFileSync(guidePath, guideContent);

    console.log(`迁移指南已生成：${guidePath}`);
    console.log('请按照指南中的步骤将开发环境的数据迁移到生产环境');
  } catch (error) {
    console.error('生成迁移指南时出错:', error);
    process.exit(1);
  }
}

/**
 * 创建数据迁移脚本
 */
function createDataMigrationScript() {
  try {
    // 创建数据迁移脚本
    const scriptContent = `/**
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
  console.log(\`开始迁移表: \${tableName}\`);

  try {
    // 从开发环境获取数据
    const { data, error } = await devSupabase
      .from(tableName)
      .select('*');

    if (error) {
      console.error(\`从开发环境获取 \${tableName} 数据失败:\`, error);
      return false;
    }

    if (!data || data.length === 0) {
      console.log(\`表 \${tableName} 没有数据需要迁移\`);
      return true;
    }

    console.log(\`从开发环境获取到 \${data.length} 条 \${tableName} 数据\`);

    // 将数据插入到生产环境
    const { error: insertError } = await prodSupabase
      .from(tableName)
      .insert(data);

    if (insertError) {
      console.error(\`将数据插入到生产环境的 \${tableName} 表失败:\`, insertError);
      return false;
    }

    console.log(\`成功将 \${data.length} 条数据迁移到生产环境的 \${tableName} 表\`);
    return true;
  } catch (error) {
    console.error(\`迁移表 \${tableName} 时出错:\`, error);
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
  console.log(\`成功: \${successCount} 个表\`);
  console.log(\`失败: \${failCount} 个表\`);

  if (failCount > 0) {
    console.error('有些表迁移失败，请检查错误信息并手动处理');
    process.exit(1);
  }
}

// 执行主函数
main();
`;

    // 写入脚本文件
    const scriptPath = path.join(__dirname, 'migrate-data.js');
    fs.writeFileSync(scriptPath, scriptContent);

    console.log(`数据迁移脚本已生成：${scriptPath}`);
  } catch (error) {
    console.error('创建数据迁移脚本时出错:', error);
    process.exit(1);
  }
}

// 执行主函数
generateMigrationGuide();
createDataMigrationScript();
