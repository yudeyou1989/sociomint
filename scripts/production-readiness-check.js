#!/usr/bin/env node

/**
 * 生产环境就绪检查脚本
 * 验证项目是否准备好部署到生产环境
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

class ProductionReadinessChecker {
  constructor() {
    this.errors = [];
    this.warnings = [];
    this.passed = [];
    this.projectRoot = process.cwd();
  }

  /**
   * 运行所有检查
   */
  async runAllChecks() {
    console.log('🔍 开始生产环境就绪检查...\n');

    // 环境变量检查
    this.checkEnvironmentVariables();
    
    // 安全配置检查
    this.checkSecurityConfiguration();
    
    // 性能优化检查
    this.checkPerformanceOptimizations();
    
    // 构建检查
    await this.checkBuildProcess();
    
    // 测试覆盖率检查
    this.checkTestCoverage();
    
    // 依赖安全检查
    this.checkDependencySecurity();
    
    // 文档完整性检查
    this.checkDocumentation();
    
    // 监控配置检查
    this.checkMonitoringSetup();

    // 输出结果
    this.outputResults();
  }

  /**
   * 检查环境变量
   */
  checkEnvironmentVariables() {
    console.log('📋 检查环境变量配置...');

    const requiredEnvVars = [
      'NEXT_PUBLIC_SUPABASE_URL',
      'NEXT_PUBLIC_SUPABASE_ANON_KEY',
      'NEXT_PUBLIC_SM_TOKEN_ADDRESS',
      'NEXT_PUBLIC_SM_TOKEN_EXCHANGE_ADDRESS',
      'NEXT_PUBLIC_RPC_URL',
      'NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID'
    ];

    const optionalEnvVars = [
      'NEXT_PUBLIC_SENTRY_DSN',
      'NEXT_PUBLIC_GA_ID',
      'DISCORD_CLIENT_SECRET',
      'TWITTER_CLIENT_SECRET',
      'TELEGRAM_BOT_TOKEN'
    ];

    // 读取.env.local文件
    const envPath = path.join(this.projectRoot, '.env.local');
    let envVars = {};

    if (fs.existsSync(envPath)) {
      const envContent = fs.readFileSync(envPath, 'utf8');
      const lines = envContent.split('\n');

      for (const line of lines) {
        const trimmedLine = line.trim();
        if (trimmedLine && !trimmedLine.startsWith('#') && trimmedLine.includes('=')) {
          const [key, ...valueParts] = trimmedLine.split('=');
          const value = valueParts.join('=').trim();
          if (value && value !== '') {
            envVars[key.trim()] = value;
          }
        }
      }
    }

    // 检查必需的环境变量
    for (const envVar of requiredEnvVars) {
      if (!envVars[envVar] && !process.env[envVar]) {
        this.errors.push(`缺少必需的环境变量: ${envVar}`);
      } else {
        this.passed.push(`环境变量 ${envVar} 已配置`);
      }
    }

    // 检查可选的环境变量
    for (const envVar of optionalEnvVars) {
      if (!envVars[envVar] && !process.env[envVar]) {
        this.warnings.push(`可选环境变量未配置: ${envVar}`);
      } else {
        this.passed.push(`可选环境变量 ${envVar} 已配置`);
      }
    }

    // 检查环境变量格式
    if (process.env.NEXT_PUBLIC_SUPABASE_URL && !process.env.NEXT_PUBLIC_SUPABASE_URL.startsWith('https://')) {
      this.errors.push('Supabase URL 必须使用 HTTPS');
    }

    if (process.env.NEXT_PUBLIC_RPC_URL && !process.env.NEXT_PUBLIC_RPC_URL.startsWith('https://')) {
      this.warnings.push('RPC URL 建议使用 HTTPS');
    }
  }

  /**
   * 检查安全配置
   */
  checkSecurityConfiguration() {
    console.log('🔒 检查安全配置...');

    // 检查中间件是否存在
    const middlewarePath = path.join(this.projectRoot, 'middleware.ts');
    if (fs.existsSync(middlewarePath)) {
      this.passed.push('安全中间件已配置');
      
      // 检查中间件内容
      const middlewareContent = fs.readFileSync(middlewarePath, 'utf8');
      if (middlewareContent.includes('securityHeaders')) {
        this.passed.push('安全头部已配置');
      } else {
        this.warnings.push('安全头部配置可能不完整');
      }
    } else {
      this.errors.push('缺少安全中间件配置');
    }

    // 检查CSP配置
    const nextConfigPath = path.join(this.projectRoot, 'next.config.ts');
    if (fs.existsSync(nextConfigPath)) {
      const configContent = fs.readFileSync(nextConfigPath, 'utf8');
      if (configContent.includes('Content-Security-Policy')) {
        this.passed.push('CSP 策略已配置');
      } else {
        this.warnings.push('建议配置 Content Security Policy');
      }
    }

    // 检查敏感文件
    const sensitiveFiles = ['.env.local', '.env.production', 'private.key'];
    for (const file of sensitiveFiles) {
      const filePath = path.join(this.projectRoot, file);
      if (fs.existsSync(filePath)) {
        // 检查文件权限（Unix系统）
        try {
          const stats = fs.statSync(filePath);
          const mode = stats.mode & parseInt('777', 8);
          if (mode > parseInt('600', 8)) {
            this.warnings.push(`敏感文件 ${file} 权限过于宽松`);
          }
        } catch (error) {
          // Windows系统或其他错误
        }
      }
    }
  }

  /**
   * 检查性能优化
   */
  checkPerformanceOptimizations() {
    console.log('⚡ 检查性能优化...');

    // 检查Next.js配置
    const nextConfigPath = path.join(this.projectRoot, 'next.config.ts');
    if (fs.existsSync(nextConfigPath)) {
      const configContent = fs.readFileSync(nextConfigPath, 'utf8');
      
      if (configContent.includes('optimizePackageImports')) {
        this.passed.push('包导入优化已启用');
      } else {
        this.warnings.push('建议启用包导入优化');
      }

      if (configContent.includes('splitChunks')) {
        this.passed.push('代码分割已配置');
      } else {
        this.warnings.push('建议配置代码分割');
      }
    }

    // 检查懒加载组件
    const lazyComponentsPath = path.join(this.projectRoot, 'src/components/common/LazyComponents.tsx');
    if (fs.existsSync(lazyComponentsPath)) {
      this.passed.push('懒加载组件已实现');
    } else {
      this.warnings.push('建议实现懒加载组件');
    }

    // 检查图片优化
    const optimizedImagePath = path.join(this.projectRoot, 'src/components/common/OptimizedImage.tsx');
    if (fs.existsSync(optimizedImagePath)) {
      this.passed.push('图片优化组件已实现');
    } else {
      this.warnings.push('建议实现图片优化');
    }
  }

  /**
   * 检查构建过程
   */
  async checkBuildProcess() {
    console.log('🏗️ 检查构建过程...');

    try {
      // 检查是否可以成功构建
      console.log('  正在执行构建测试...');
      execSync('npm run build', { stdio: 'pipe', cwd: this.projectRoot });
      this.passed.push('项目构建成功');

      // 检查构建输出
      const buildDir = path.join(this.projectRoot, '.next');
      if (fs.existsSync(buildDir)) {
        const buildStats = fs.statSync(buildDir);
        this.passed.push('构建输出目录存在');

        // 检查静态文件
        const staticDir = path.join(buildDir, 'static');
        if (fs.existsSync(staticDir)) {
          this.passed.push('静态资源已生成');
        }
      }
    } catch (error) {
      this.errors.push(`构建失败: ${error.message}`);
    }
  }

  /**
   * 检查测试覆盖率
   */
  checkTestCoverage() {
    console.log('🧪 检查测试覆盖率...');

    try {
      // 运行测试并获取覆盖率
      const testResult = execSync('npm run test:coverage', { 
        stdio: 'pipe', 
        cwd: this.projectRoot 
      }).toString();

      // 解析覆盖率（简单实现）
      if (testResult.includes('All files')) {
        this.passed.push('测试覆盖率报告已生成');
      }

      // 检查覆盖率目录
      const coverageDir = path.join(this.projectRoot, 'coverage');
      if (fs.existsSync(coverageDir)) {
        this.passed.push('测试覆盖率报告已保存');
      }
    } catch (error) {
      this.warnings.push('无法运行测试覆盖率检查');
    }
  }

  /**
   * 检查依赖安全
   */
  checkDependencySecurity() {
    console.log('🛡️ 检查依赖安全...');

    try {
      // 运行npm audit
      const auditResult = execSync('npm audit --audit-level=moderate', { 
        stdio: 'pipe', 
        cwd: this.projectRoot 
      }).toString();

      if (auditResult.includes('found 0 vulnerabilities')) {
        this.passed.push('依赖安全检查通过');
      } else {
        this.warnings.push('发现依赖安全问题，请运行 npm audit fix');
      }
    } catch (error) {
      this.warnings.push('依赖安全检查失败，可能存在安全漏洞');
    }
  }

  /**
   * 检查文档完整性
   */
  checkDocumentation() {
    console.log('📚 检查文档完整性...');

    const requiredDocs = [
      'README.md',
      'DEPLOYMENT.md',
      'API.md'
    ];

    for (const doc of requiredDocs) {
      const docPath = path.join(this.projectRoot, doc);
      if (fs.existsSync(docPath)) {
        this.passed.push(`文档 ${doc} 存在`);
      } else {
        this.warnings.push(`缺少文档: ${doc}`);
      }
    }
  }

  /**
   * 检查监控设置
   */
  checkMonitoringSetup() {
    console.log('📊 检查监控设置...');

    // 检查监控配置文件
    const monitoringPath = path.join(this.projectRoot, 'src/lib/monitoring/productionMonitoring.ts');
    if (fs.existsSync(monitoringPath)) {
      this.passed.push('生产监控系统已配置');
    } else {
      this.warnings.push('建议配置生产监控系统');
    }

    // 检查错误边界
    const errorBoundaryPath = path.join(this.projectRoot, 'src/components/ErrorBoundary.tsx');
    if (fs.existsSync(errorBoundaryPath)) {
      this.passed.push('错误边界已实现');
    } else {
      this.warnings.push('建议实现错误边界');
    }
  }

  /**
   * 输出检查结果
   */
  outputResults() {
    console.log('\n' + '='.repeat(60));
    console.log('📊 生产环境就绪检查结果');
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
      console.log('\n🎉 项目已准备好部署到生产环境！');
      process.exit(0);
    } else {
      console.log('\n🚨 请修复错误后再部署到生产环境');
      process.exit(1);
    }
  }
}

// 运行检查
if (require.main === module) {
  const checker = new ProductionReadinessChecker();
  checker.runAllChecks().catch(error => {
    console.error('检查过程中发生错误:', error);
    process.exit(1);
  });
}

module.exports = ProductionReadinessChecker;
