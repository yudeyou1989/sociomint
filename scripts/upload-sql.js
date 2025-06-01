/**
 * 生成 Supabase SQL 执行指南
 *
 * 该脚本用于生成 Supabase SQL 执行指南，指导用户如何在 Supabase 控制台中执行 SQL 脚本。
 * 运行方式：node scripts/upload-sql.js
 */

require('dotenv').config();
const fs = require('fs');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');

// Supabase 客户端
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('错误: 缺少 Supabase 配置。请确保 .env 文件中包含 NEXT_PUBLIC_SUPABASE_URL 和 SUPABASE_SERVICE_ROLE_KEY。');
  process.exit(1);
}

/**
 * 生成 SQL 执行指南
 */
async function generateSqlGuide() {
  try {
    // 读取 SQL 文件
    const sqlFilePath = path.join(__dirname, 'setup-database.sql');
    const sqlContent = fs.readFileSync(sqlFilePath, 'utf8');

    console.log('SQL 文件读取成功，生成执行指南...');

    // 将 SQL 文件分割成单独的语句
    const statements = sqlContent
      .split(';')
      .map(stmt => stmt.trim())
      .filter(stmt => stmt.length > 0);

    console.log(`共有 ${statements.length} 条 SQL 语句需要执行`);

    // 生成指南文件
    const guideContent = `# Supabase SQL 执行指南

## 概述

本指南将帮助您在 Supabase 控制台中执行 SQL 脚本，以设置数据库表和函数。

## 步骤

1. 登录 Supabase 控制台：https://app.supabase.io
2. 选择您的项目
3. 点击左侧菜单中的 "SQL 编辑器"
4. 创建一个新的查询
5. 将以下 SQL 脚本复制粘贴到编辑器中
6. 点击 "运行" 按钮执行脚本

## SQL 脚本

\`\`\`sql
${sqlContent}
\`\`\`

## 验证

执行完成后，您可以通过以下方式验证表是否创建成功：

1. 点击左侧菜单中的 "表编辑器"
2. 检查是否存在以下表：
   - users
   - multisig_transactions
   - xiaohonghua_exchanges
   - error_logs
   - application_logs
   - blockchain_events
   - tasks
   - task_completions
   - exchange_rates
   - platform_verifications

## 注意事项

- 如果执行过程中遇到错误，请检查错误信息并解决问题
- 某些语句可能会因为表或函数已存在而失败，这是正常的
- 确保您有足够的权限执行这些 SQL 语句
`;

    // 写入指南文件
    const guidePath = path.join(__dirname, 'supabase-sql-guide.md');
    fs.writeFileSync(guidePath, guideContent);

    console.log(`SQL 执行指南已生成：${guidePath}`);
    console.log('请按照指南中的步骤在 Supabase 控制台中执行 SQL 脚本');
  } catch (error) {
    console.error('生成 SQL 执行指南时出错:', error);
    process.exit(1);
  }
}

// 执行主函数
generateSqlGuide();
