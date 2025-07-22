#!/usr/bin/env node

const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🔍 开始详细调试构建过程...');

// 清理旧文件
console.log('🧹 清理旧文件...');
if (fs.existsSync('out')) {
  fs.rmSync('out', { recursive: true });
}
if (fs.existsSync('.next')) {
  fs.rmSync('.next', { recursive: true });
}

const build = spawn('npx', ['next', 'build'], {
  stdio: ['inherit', 'pipe', 'pipe'],
  cwd: process.cwd(),
  env: { ...process.env, NODE_ENV: 'production' }
});

let stdout = '';
let stderr = '';

build.stdout.on('data', (data) => {
  const output = data.toString();
  stdout += output;
  console.log('STDOUT:', output);
});

build.stderr.on('data', (data) => {
  const output = data.toString();
  stderr += output;
  console.error('STDERR:', output);
});

build.on('close', (code) => {
  console.log(`\n构建进程退出，代码: ${code}`);
  
  // 保存构建日志
  fs.writeFileSync('build-log.txt', `STDOUT:\n${stdout}\n\nSTDERR:\n${stderr}`);
  
  // 检查构建结果
  if (fs.existsSync('out')) {
    console.log('✅ out目录存在');
    const files = fs.readdirSync('out');
    console.log(`📁 out目录包含 ${files.length} 个文件/目录:`);
    files.forEach(file => {
      const filePath = path.join('out', file);
      const stat = fs.statSync(filePath);
      console.log(`   - ${file} ${stat.isDirectory() ? '(目录)' : '(文件)'}`);
    });
    
    // 查找HTML文件
    const findHtml = (dir, prefix = '') => {
      const items = fs.readdirSync(dir);
      items.forEach(item => {
        const fullPath = path.join(dir, item);
        const stat = fs.statSync(fullPath);
        if (stat.isDirectory()) {
          findHtml(fullPath, prefix + item + '/');
        } else if (item.endsWith('.html')) {
          console.log(`🌐 找到HTML文件: ${prefix}${item}`);
        }
      });
    };
    
    findHtml('out');
  } else {
    console.log('❌ out目录不存在');
  }
  
  if (code !== 0) {
    console.error('❌ 构建失败');
  } else {
    console.log('✅ 构建成功');
  }
});

build.on('error', (err) => {
  console.error('❌ 构建进程错误:', err);
});
