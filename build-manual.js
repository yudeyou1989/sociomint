/**
 * 手动构建脚本
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🚀 开始手动构建...');

try {
  // 清理旧的构建文件
  console.log('🧹 清理旧文件...');
  if (fs.existsSync('out')) {
    fs.rmSync('out', { recursive: true, force: true });
  }
  if (fs.existsSync('.next')) {
    fs.rmSync('.next', { recursive: true, force: true });
  }
  
  console.log('✅ 清理完成');
  
  // 运行构建
  console.log('🔨 开始构建...');
  execSync('node node_modules/.bin/next build', { 
    stdio: 'inherit',
    cwd: process.cwd()
  });
  
  console.log('✅ 构建完成！');
  
  // 检查构建结果
  if (fs.existsSync('out')) {
    const files = fs.readdirSync('out');
    console.log(`📁 构建输出包含 ${files.length} 个文件/目录:`);
    files.forEach(file => {
      console.log(`   - ${file}`);
    });
  } else {
    console.log('❌ 构建输出目录不存在');
  }
  
} catch (error) {
  console.error('❌ 构建失败:', error.message);
  process.exit(1);
}
