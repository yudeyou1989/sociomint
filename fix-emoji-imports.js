#!/usr/bin/env node

/**
 * 自动修复项目中错误的emoji导入语法
 * 这个脚本会：
 * 1. 找到所有包含错误emoji导入的文件
 * 2. 移除错误的导入语句
 * 3. 添加正确的React Icons导入
 * 4. 替换文件中的emoji使用为React Icons组件
 */

const fs = require('fs');
const path = require('path');
const glob = require('glob');

// emoji到React Icons的映射
const emojiToIconMap = {
  '🐦': 'FaTwitter',
  '📱': 'FaTelegram', 
  '💬': 'FaDiscord',
  '📷': 'FaInstagram',
  '🔴': 'FaReddit',
  '➕': 'FaPlus',
  '🔨': 'FaHammer',
  '👤': 'FaUser',
  '🔄': 'FaSync',
  '💼': 'FaBriefcase',
  '📋': 'FaClipboard',
  '🗄️': 'FaArchive',
  '🪙': 'FaCoins',
  '📈': 'FaChartLine',
  '🔒': 'FaLock',
  '📜': 'FaFileContract',
  'ℹ️': 'FaInfoCircle',
  '⏰': 'FaClock',
  '🛡️': 'FaShieldAlt',
  '🎁': 'FaGift',
  '🌐': 'FaGlobe',
  '📘': 'FaFacebook',
  '🏠': 'FaHome'
};

// 获取所有需要修复的文件
function getFilesToFix() {
  const pattern = 'src/**/*.{tsx,ts}';
  const files = glob.sync(pattern);
  
  return files.filter(file => {
    const content = fs.readFileSync(file, 'utf8');
    return content.includes('临时注释以修复构建') || 
           content.includes('} from \'react-icons/fa\'; // 临时注释');
  });
}

// 修复单个文件
function fixFile(filePath) {
  console.log(`修复文件: ${filePath}`);
  
  let content = fs.readFileSync(filePath, 'utf8');
  let hasChanges = false;
  
  // 1. 移除错误的导入语句
  const badImportRegex = /\/\/ \/\/ import \{[\s\S]*?\} from 'react-icons\/fa'; \/\/ 临时注释以修复构建.*?\n/g;
  if (badImportRegex.test(content)) {
    content = content.replace(badImportRegex, '');
    hasChanges = true;
  }
  
  // 2. 找到文件中使用的emoji
  const usedEmojis = new Set();
  Object.keys(emojiToIconMap).forEach(emoji => {
    if (content.includes(emoji)) {
      usedEmojis.add(emoji);
    }
  });
  
  if (usedEmojis.size > 0) {
    // 3. 添加正确的React Icons导入
    const iconNames = Array.from(usedEmojis).map(emoji => emojiToIconMap[emoji]);
    const importStatement = `import { ${iconNames.join(', ')} } from 'react-icons/fa';\n`;
    
    // 找到合适的位置插入导入语句
    const importInsertRegex = /(import.*from.*;\n)/;
    if (importInsertRegex.test(content)) {
      content = content.replace(importInsertRegex, `$1${importStatement}`);
    } else {
      // 如果没有其他导入，在文件开头添加
      content = `${importStatement}\n${content}`;
    }
    
    // 4. 替换emoji使用为React Icons组件
    usedEmojis.forEach(emoji => {
      const iconName = emojiToIconMap[emoji];
      // 替换单独的emoji
      content = content.replace(new RegExp(`\\s*${emoji}\\s*`, 'g'), ` <${iconName} /> `);
      // 替换在JSX中的emoji
      content = content.replace(new RegExp(`{\\s*${emoji}\\s*}`, 'g'), `{<${iconName} />}`);
    });
    
    hasChanges = true;
  }
  
  // 5. 保存文件
  if (hasChanges) {
    fs.writeFileSync(filePath, content);
    console.log(`✅ 已修复: ${filePath}`);
    return true;
  } else {
    console.log(`⏭️  无需修复: ${filePath}`);
    return false;
  }
}

// 主函数
function main() {
  console.log('🧹 开始清理项目中的emoji导入问题...\n');
  
  const filesToFix = getFilesToFix();
  console.log(`发现 ${filesToFix.length} 个需要修复的文件\n`);
  
  let fixedCount = 0;
  
  filesToFix.forEach(file => {
    if (fixFile(file)) {
      fixedCount++;
    }
  });
  
  console.log(`\n🎉 清理完成！`);
  console.log(`📊 统计信息:`);
  console.log(`   - 检查文件: ${filesToFix.length}`);
  console.log(`   - 修复文件: ${fixedCount}`);
  console.log(`   - 跳过文件: ${filesToFix.length - fixedCount}`);
}

// 运行脚本
if (require.main === module) {
  main();
}

module.exports = { fixFile, getFilesToFix, emojiToIconMap };
