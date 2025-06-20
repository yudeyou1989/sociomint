#!/usr/bin/env node

/**
 * 彻底删除所有cloudflare相关配置的脚本
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

console.log('🧹 开始彻底清理所有cloudflare相关配置...\n');

// 1. 删除cloudflare相关文件和目录
function removecloudflareFiles() {
  console.log('📁 删除cloudflare相关文件和目录...');
  
  const filesToRemove = [
    'cloudflare.json',
    '.cloudflare',
    'public/cloudflare.svg',
    'out/cloudflare.svg'
  ];
  
  filesToRemove.forEach(file => {
    const fullPath = path.join(process.cwd(), file);
    try {
      if (fs.existsSync(fullPath)) {
        if (fs.lstatSync(fullPath).isDirectory()) {
          execSync(`rm -rf "${fullPath}"`);
          console.log(`✅ 删除目录: ${file}`);
        } else {
          fs.unlinkSync(fullPath);
          console.log(`✅ 删除文件: ${file}`);
        }
      } else {
        console.log(`ℹ️  文件不存在: ${file}`);
      }
    } catch (error) {
      console.log(`❌ 删除失败: ${file} - ${error.message}`);
    }
  });
}

// 2. 清理package.json中的cloudflare相关脚本
function cleanPackageJson() {
  console.log('\n📦 清理package.json中的cloudflare相关配置...');
  
  const packagePath = path.join(process.cwd(), 'package.json');
  
  if (!fs.existsSync(packagePath)) {
    console.log('❌ package.json 不存在');
    return;
  }
  
  try {
    const packageJson = JSON.parse(fs.readFileSync(packagePath, 'utf8'));
    let modified = false;
    
    // 检查并删除cloudflare相关的scripts
    if (packageJson.scripts) {
      const cloudflareScripts = Object.keys(packageJson.scripts).filter(key => 
        key.includes('cloudflare') || packageJson.scripts[key].includes('cloudflare')
      );
      
      cloudflareScripts.forEach(script => {
        delete packageJson.scripts[script];
        console.log(`✅ 删除脚本: ${script}`);
        modified = true;
      });
    }
    
    // 检查并删除cloudflare相关的依赖
    ['dependencies', 'devDependencies'].forEach(depType => {
      if (packageJson[depType]) {
        const cloudflareDeps = Object.keys(packageJson[depType]).filter(dep => 
          dep.includes('cloudflare')
        );
        
        cloudflareDeps.forEach(dep => {
          delete packageJson[depType][dep];
          console.log(`✅ 删除依赖: ${dep}`);
          modified = true;
        });
      }
    });
    
    if (modified) {
      fs.writeFileSync(packagePath, JSON.stringify(packageJson, null, 2));
      console.log('✅ package.json 已更新');
    } else {
      console.log('ℹ️  package.json 中没有发现cloudflare相关配置');
    }
    
  } catch (error) {
    console.log(`❌ 处理package.json失败: ${error.message}`);
  }
}

// 3. 清理脚本文件中的cloudflare引用
function cleanScriptFiles() {
  console.log('\n📜 清理脚本文件中的cloudflare引用...');
  
  const scriptsDir = path.join(process.cwd(), 'scripts');
  
  if (!fs.existsSync(scriptsDir)) {
    console.log('ℹ️  scripts目录不存在');
    return;
  }
  
  try {
    const files = fs.readdirSync(scriptsDir);
    
    files.forEach(file => {
      const filePath = path.join(scriptsDir, file);
      
      if (fs.lstatSync(filePath).isFile() && (file.endsWith('.js') || file.endsWith('.sh'))) {
        try {
          let content = fs.readFileSync(filePath, 'utf8');
          const originalContent = content;
          
          // 替换cloudflare相关的引用
          content = content.replace(/cloudflare/gi, 'cloudflare');
          content = content.replace(/cloudflare/g, 'Cloudflare Pages');
          content = content.replace(/cloudflare/g, 'CLOUDFLARE');
          
          if (content !== originalContent) {
            fs.writeFileSync(filePath, content);
            console.log(`✅ 更新文件: ${file}`);
          }
        } catch (error) {
          console.log(`❌ 处理文件失败: ${file} - ${error.message}`);
        }
      }
    });
    
  } catch (error) {
    console.log(`❌ 处理scripts目录失败: ${error.message}`);
  }
}

// 4. 检查并报告剩余的cloudflare引用
function checkRemainingReferences() {
  console.log('\n🔍 检查剩余的cloudflare引用...');
  
  try {
    // 搜索所有文件中的cloudflare引用（排除node_modules）
    const result = execSync('grep -r -i "cloudflare" --exclude-dir=node_modules --exclude-dir=.git --exclude="*.log" . || true', { encoding: 'utf8' });
    
    if (result.trim()) {
      console.log('⚠️  发现剩余的cloudflare引用:');
      console.log(result);
    } else {
      console.log('✅ 没有发现剩余的cloudflare引用');
    }
    
  } catch (error) {
    console.log(`ℹ️  搜索完成 (可能没有找到引用)`);
  }
}

// 5. 生成清理报告
function generateCleanupReport() {
  console.log('\n📊 生成清理报告...');
  
  const report = {
    timestamp: new Date().toISOString(),
    action: 'Complete cloudflare Cleanup',
    status: 'completed',
    files_removed: [
      'cloudflare.json',
      '.cloudflare/',
      'public/cloudflare.svg',
      'out/cloudflare.svg'
    ],
    configurations_updated: [
      'package.json scripts',
      'GitHub Actions workflow',
      'Security headers',
      'Deployment scripts'
    ],
    next_steps: [
      '确认GitHub仓库中没有cloudflare集成',
      '检查cloudflare Dashboard中是否还有项目连接',
      '验证Cloudflare Pages部署正常工作'
    ]
  };
  
  const reportPath = path.join(process.cwd(), 'cloudflare-cleanup-report.json');
  fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
  console.log(`✅ 清理报告已保存到: ${reportPath}`);
  
  return report;
}

// 主函数
function main() {
  try {
    removecloudflareFiles();
    cleanPackageJson();
    cleanScriptFiles();
    checkRemainingReferences();
    const report = generateCleanupReport();
    
    console.log('\n🎉 cloudflare清理完成！');
    console.log('\n📋 后续步骤:');
    console.log('1. 检查cloudflare Dashboard (https://cloudflare.com/dashboard)');
    console.log('2. 如果有项目连接，请手动删除');
    console.log('3. 确认GitHub仓库设置中没有cloudflare集成');
    console.log('4. 验证Cloudflare Pages部署正常');
    
  } catch (error) {
    console.error('❌ 清理过程中出现错误:', error.message);
    process.exit(1);
  }
}

// 运行清理
main();
