#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

console.log('🔧 修复react-icons导入问题...');

// 图标映射表
const iconMap = {
  'FaExchangeAlt': '🔄',
  'FaHistory': '📜',
  'FaArrowRight': '➡️',
  'FaCopy': '📋',
  'FaTimes': '✕',
  'FaExternalLinkAlt': '🔗',
  'FaGavel': '🔨',
  'FaUser': '👤',
  'FaTasks': '📋',
  'FaGift': '🎁',
  'FaUsers': '👥',
  'FaPlus': '➕',
  'FaMinus': '➖',
  'FaTiktok': '🎵',
  'FaInstagram': '📷',
  'FaTwitter': '🐦',
  'FaDiscord': '💬',
  'FaTelegram': '📱',
  'FaYoutube': '📺',
  'FaFacebook': '📘',
  'FaLinkedin': '💼',
  'FaReddit': '🔴',
  'FaSnapchat': '👻',
  'FaWhatsapp': '💚',
  'FaWeibo': '🌐',
  'FaCoins': '🪙',
  'FaChartLine': '📈',
  'FaLock': '🔒',
  'FaInfoCircle': 'ℹ️',
  'FaDatabase': '🗄️',
  'FaUnlock': '🔓',
  'FaKey': '🔑',
  'FaShield': '🛡️',
  'FaClock': '⏰',
  'FaCalendar': '📅',
  'FaCheckCircle': '✅',
  'FaTimesCircle': '❌',
  'FaExclamationTriangle': '⚠️',
  'FaSearch': '🔍',
  'FaHome': '🏠',
  'BiWallet': '💼',
  'BiStore': '🏪',
  'BiCoin': '🪙',
  'BiTrendingUp': '📈',
  'BiShield': '🛡️',
  'BiMobile': '📱',
  'BiCheck': '✅',
  'BiX': '❌',
  'BiPlus': '➕',
  'BiMinus': '➖',
  'BiEdit': '✏️',
  'BiTrash': '🗑️',
  'BiRefresh': '🔄',
  'BiSearch': '🔍',
  'BiFilter': '🔽',
  'BiSort': '🔀',
  'BiDownload': '⬇️',
  'BiUpload': '⬆️',
  'BiLink': '🔗',
  'BiShare': '📤',
  'BiHeart': '❤️',
  'BiStar': '⭐',
  'BiBookmark': '🔖',
  'BiComment': '💬',
  'BiLike': '👍',
  'BiDislike': '👎'
};

// 递归查找所有tsx和ts文件
function findFiles(dir, files = []) {
  const items = fs.readdirSync(dir);
  
  for (const item of items) {
    const fullPath = path.join(dir, item);
    const stat = fs.statSync(fullPath);
    
    if (stat.isDirectory() && !item.startsWith('.') && item !== 'node_modules') {
      findFiles(fullPath, files);
    } else if (item.endsWith('.tsx') || item.endsWith('.ts')) {
      files.push(fullPath);
    }
  }
  
  return files;
}

// 修复单个文件
function fixFile(filePath) {
  let content = fs.readFileSync(filePath, 'utf8');
  let modified = false;
  
  // 检查是否有react-icons导入
  if (content.includes("from 'react-icons")) {
    console.log(`修复文件: ${filePath}`);
    
    // 注释掉react-icons导入
    content = content.replace(
      /import\s+{[^}]+}\s+from\s+['"]react-icons[^'"]*['"];?/g,
      (match) => `// ${match} // 临时注释以修复构建`
    );
    
    // 替换图标使用
    for (const [iconName, emoji] of Object.entries(iconMap)) {
      const regex = new RegExp(`<${iconName}[^>]*\\/>`, 'g');
      if (content.match(regex)) {
        content = content.replace(regex, `"${emoji}"`);
        modified = true;
      }

      // 处理带className的情况
      const regexWithClass = new RegExp(`<${iconName}[^>]*>`, 'g');
      if (content.match(regexWithClass)) {
        content = content.replace(regexWithClass, `"${emoji}"`);
        modified = true;
      }

      // 处理对象属性中的图标
      const objectRegex = new RegExp(`${iconName}:`, 'g');
      if (content.match(objectRegex)) {
        content = content.replace(objectRegex, `"${emoji}":`);
        modified = true;
      }

      // 处理直接使用的图标变量
      const varRegex = new RegExp(`\\b${iconName}\\b`, 'g');
      if (content.match(varRegex) && !content.includes(`// ${iconName}`)) {
        content = content.replace(varRegex, `"${emoji}"`);
        modified = true;
      }
    }
    
    if (modified) {
      fs.writeFileSync(filePath, content);
      console.log(`✅ 已修复: ${filePath}`);
    }
  }
}

// 查找并修复所有文件
const files = findFiles('src');
console.log(`找到 ${files.length} 个文件`);

for (const file of files) {
  try {
    fixFile(file);
  } catch (error) {
    console.error(`修复文件失败 ${file}:`, error.message);
  }
}

console.log('✅ 图标修复完成！');
