#!/usr/bin/env node

const { spawn } = require('child_process');

console.log('🔍 开始调试构建过程...');

const build = spawn('npx', ['next', 'build'], {
  stdio: ['inherit', 'pipe', 'pipe'],
  cwd: process.cwd()
});

build.stdout.on('data', (data) => {
  console.log('STDOUT:', data.toString());
});

build.stderr.on('data', (data) => {
  console.error('STDERR:', data.toString());
});

build.on('close', (code) => {
  console.log(`构建进程退出，代码: ${code}`);
  if (code !== 0) {
    console.error('❌ 构建失败');
  } else {
    console.log('✅ 构建成功');
  }
});

build.on('error', (err) => {
  console.error('❌ 构建进程错误:', err);
});
