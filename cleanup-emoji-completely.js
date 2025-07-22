#!/usr/bin/env node

/**
 * 彻底清理项目中的emoji问题
 * 这个脚本会：
 * 1. 删除所有错误的emoji导入语句
 * 2. 删除所有emoji字符
 * 3. 只保留必要的React Icons导入
 * 4. 用简洁的文本或HTML符号替代emoji
 */

const fs = require('fs');
const path = require('path');
const glob = require('glob');

// 需要彻底清理的文件模式
const CLEANUP_PATTERNS = [
  'src/**/*.tsx',
  'src/**/*.ts'
];

// 错误的导入模式
const BAD_IMPORT_PATTERNS = [
  /\/\/ \/\/ \/\/ import \{[\s\S]*?\} from 'react-icons\/fa'; \/\/ 临时注释以修复构建.*?\n/g,
  /\/\/ \/\/ import \{[\s\S]*?\} from 'react-icons\/fa'; \/\/ 临时注释以修复构建.*?\n/g,
  /\/\/ import \{[\s\S]*?\} from 'react-icons\/fa'; \/\/ 临时注释以修复构建.*?\n/g,
];

// emoji到简单替代的映射
const EMOJI_REPLACEMENTS = {
  '🐦': '',
  '📱': '',
  '💬': '',
  '📷': '',
  '🔴': '',
  '➕': '+',
  '🔨': '',
  '👤': '',
  '🔄': '',
  '💼': '',
  '📋': '',
  '🗄️': '',
  '🪙': '',
  '📈': '',
  '🔒': '',
  '📜': '',
  'ℹ️': '',
  '⏰': '',
  '🛡️': '',
  '🎁': '',
  '🌐': '',
  '📘': '',
  '🏠': '',
  '✕': '×',
  '✅': '✓',
  '❌': '×',
  '🏪': '',
  '🔴': ''
};

// 获取所有需要清理的文件
function getFilesToClean() {
  let allFiles = [];
  CLEANUP_PATTERNS.forEach(pattern => {
    const files = glob.sync(pattern);
    allFiles = allFiles.concat(files);
  });
  
  // 去重
  return [...new Set(allFiles)].filter(file => {
    const content = fs.readFileSync(file, 'utf8');
    return content.includes('临时注释以修复构建') || 
           hasEmojis(content);
  });
}

// 检查文件是否包含emoji
function hasEmojis(content) {
  return Object.keys(EMOJI_REPLACEMENTS).some(emoji => content.includes(emoji));
}

// 彻底清理单个文件
function cleanFile(filePath) {
  console.log(`清理文件: ${filePath}`);
  
  let content = fs.readFileSync(filePath, 'utf8');
  let hasChanges = false;
  
  // 1. 移除所有错误的导入语句
  BAD_IMPORT_PATTERNS.forEach(pattern => {
    if (pattern.test(content)) {
      content = content.replace(pattern, '');
      hasChanges = true;
    }
  });
  
  // 2. 删除所有emoji字符
  Object.keys(EMOJI_REPLACEMENTS).forEach(emoji => {
    const replacement = EMOJI_REPLACEMENTS[emoji];
    if (content.includes(emoji)) {
      // 删除emoji前后的空格，避免留下多余空格
      const emojiRegex = new RegExp(`\\s*${escapeRegExp(emoji)}\\s*`, 'g');
      content = content.replace(emojiRegex, replacement ? ` ${replacement} ` : ' ');
      hasChanges = true;
    }
  });
  
  // 3. 清理多余的空格和空行
  content = content.replace(/\s+/g, ' '); // 多个空格变成一个
  content = content.replace(/\n\s*\n\s*\n/g, '\n\n'); // 多个空行变成两个
  
  // 4. 保存文件
  if (hasChanges) {
    fs.writeFileSync(filePath, content);
    console.log(`✅ 已清理: ${filePath}`);
    return true;
  } else {
    console.log(`⏭️  无需清理: ${filePath}`);
    return false;
  }
}

// 转义正则表达式特殊字符
function escapeRegExp(string) {
  return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

// 主函数
function main() {
  console.log('🧹 开始彻底清理项目中的emoji问题...\n');
  
  const filesToClean = getFilesToClean();
  console.log(`发现 ${filesToClean.length} 个需要清理的文件\n`);
  
  if (filesToClean.length === 0) {
    console.log('🎉 没有发现需要清理的文件！');
    return;
  }
  
  let cleanedCount = 0;
  
  filesToClean.forEach(file => {
    if (cleanFile(file)) {
      cleanedCount++;
    }
  });
  
  console.log(`\n🎉 清理完成！`);
  console.log(`📊 统计信息:`);
  console.log(`   - 检查文件: ${filesToClean.length}`);
  console.log(`   - 清理文件: ${cleanedCount}`);
  console.log(`   - 跳过文件: ${filesToClean.length - cleanedCount}`);
  
  console.log(`\n✨ 所有emoji和错误导入已彻底删除！`);
  console.log(`💡 建议: 重启开发服务器以确保更改生效`);
}

// 运行脚本
if (require.main === module) {
  main();
}

module.exports = { cleanFile, getFilesToClean, EMOJI_REPLACEMENTS };
