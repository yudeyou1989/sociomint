#!/usr/bin/env node

/**
 * 快速项目检查脚本
 * 检查关键文件和配置
 */

const fs = require('fs');
const path = require('path');

class QuickChecker {
  constructor() {
    this.errors = [];
    this.warnings = [];
    this.passed = [];
    this.projectRoot = process.cwd();
  }

  /**
   * 运行快速检查
   */
  async runQuickCheck() {
    console.log('🔍 开始快速项目检查...\n');

    // 检查关键文件
    this.checkCriticalFiles();
    
    // 检查环境变量
    this.checkEnvironmentVariables();
    
    // 检查package.json
    this.checkPackageJson();
    
    // 检查TypeScript配置
    this.checkTypeScriptConfig();
    
    // 检查Next.js配置
    this.checkNextConfig();

    // 输出结果
    this.outputResults();
  }

  /**
   * 检查关键文件
   */
  checkCriticalFiles() {
    console.log('📁 检查关键文件...');
    
    const criticalFiles = [
      'package.json',
      'next.config.ts',
      'tsconfig.json',
      '.env.local',
      'src/app/layout.tsx',
      'src/app/page.tsx',
      'middleware.ts'
    ];

    for (const file of criticalFiles) {
      const filePath = path.join(this.projectRoot, file);
      if (fs.existsSync(filePath)) {
        this.passed.push(`关键文件 ${file} 存在`);
      } else {
        this.errors.push(`缺少关键文件: ${file}`);
      }
    }
  }

  /**
   * 检查环境变量
   */
  checkEnvironmentVariables() {
    console.log('🔧 检查环境变量...');
    
    const requiredEnvVars = [
      'NEXT_PUBLIC_SUPABASE_URL',
      'NEXT_PUBLIC_SUPABASE_ANON_KEY',
      'NEXT_PUBLIC_SM_TOKEN_ADDRESS',
      'NEXT_PUBLIC_SM_TOKEN_EXCHANGE_ADDRESS',
      'NEXT_PUBLIC_RPC_URL',
      'NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID'
    ];

    // 读取.env.local文件
    const envPath = path.join(this.projectRoot, '.env.local');
    if (fs.existsSync(envPath)) {
      const envContent = fs.readFileSync(envPath, 'utf8');
      
      for (const envVar of requiredEnvVars) {
        if (envContent.includes(`${envVar}=`) && !envContent.includes(`${envVar}=\n`)) {
          this.passed.push(`环境变量 ${envVar} 已配置`);
        } else {
          this.errors.push(`缺少环境变量: ${envVar}`);
        }
      }
    } else {
      this.errors.push('缺少 .env.local 文件');
    }
  }

  /**
   * 检查package.json
   */
  checkPackageJson() {
    console.log('📦 检查package.json...');
    
    const packagePath = path.join(this.projectRoot, 'package.json');
    if (fs.existsSync(packagePath)) {
      try {
        const packageJson = JSON.parse(fs.readFileSync(packagePath, 'utf8'));
        
        // 检查必需的脚本
        const requiredScripts = ['dev', 'build', 'start'];
        for (const script of requiredScripts) {
          if (packageJson.scripts && packageJson.scripts[script]) {
            this.passed.push(`脚本 ${script} 已配置`);
          } else {
            this.errors.push(`缺少脚本: ${script}`);
          }
        }

        // 检查关键依赖
        const criticalDeps = ['next', 'react', 'react-dom'];
        for (const dep of criticalDeps) {
          if (packageJson.dependencies && packageJson.dependencies[dep]) {
            this.passed.push(`依赖 ${dep} 已安装`);
          } else {
            this.errors.push(`缺少关键依赖: ${dep}`);
          }
        }

      } catch (error) {
        this.errors.push('package.json 格式错误');
      }
    }
  }

  /**
   * 检查TypeScript配置
   */
  checkTypeScriptConfig() {
    console.log('🔷 检查TypeScript配置...');
    
    const tsconfigPath = path.join(this.projectRoot, 'tsconfig.json');
    if (fs.existsSync(tsconfigPath)) {
      try {
        const tsconfig = JSON.parse(fs.readFileSync(tsconfigPath, 'utf8'));
        
        if (tsconfig.compilerOptions) {
          this.passed.push('TypeScript配置存在');
          
          // 检查关键配置
          if (tsconfig.compilerOptions.strict) {
            this.passed.push('TypeScript严格模式已启用');
          } else {
            this.warnings.push('建议启用TypeScript严格模式');
          }
        }
      } catch (error) {
        this.errors.push('tsconfig.json 格式错误');
      }
    } else {
      this.errors.push('缺少 tsconfig.json');
    }
  }

  /**
   * 检查Next.js配置
   */
  checkNextConfig() {
    console.log('⚡ 检查Next.js配置...');
    
    const nextConfigPath = path.join(this.projectRoot, 'next.config.ts');
    if (fs.existsSync(nextConfigPath)) {
      this.passed.push('Next.js配置文件存在');
      
      const configContent = fs.readFileSync(nextConfigPath, 'utf8');
      
      // 检查关键配置
      if (configContent.includes('experimental')) {
        this.passed.push('实验性功能已配置');
      }
      
      if (configContent.includes('webpack')) {
        this.passed.push('Webpack配置已自定义');
      }
    } else {
      this.warnings.push('缺少 next.config.ts');
    }
  }

  /**
   * 输出检查结果
   */
  outputResults() {
    console.log('\n' + '='.repeat(60));
    console.log('📊 快速检查结果');
    console.log('='.repeat(60));

    if (this.passed.length > 0) {
      console.log('\n✅ 通过的检查:');
      this.passed.forEach(item => console.log(`  ✓ ${item}`));
    }

    if (this.warnings.length > 0) {
      console.log('\n⚠️  警告:');
      this.warnings.forEach(item => console.log(`  ⚠ ${item}`));
    }

    if (this.errors.length > 0) {
      console.log('\n❌ 错误:');
      this.errors.forEach(item => console.log(`  ✗ ${item}`));
    }

    console.log('\n' + '='.repeat(60));
    console.log(`总计: ${this.passed.length} 通过, ${this.warnings.length} 警告, ${this.errors.length} 错误`);

    if (this.errors.length === 0) {
      console.log('\n🎉 快速检查通过！');
      process.exit(0);
    } else {
      console.log('\n🚨 发现错误，请修复后重试');
      process.exit(1);
    }
  }
}

// 运行检查
if (require.main === module) {
  const checker = new QuickChecker();
  checker.runQuickCheck().catch(error => {
    console.error('检查过程中发生错误:', error);
    process.exit(1);
  });
}

module.exports = QuickChecker;
