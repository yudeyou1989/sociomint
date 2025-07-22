/**
 * 最终安全检查脚本
 * 在部署前进行最后的安全扫描
 */

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

// 颜色输出
const colors = {
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  reset: '\x1b[0m'
};

const log = {
  error: (msg) => console.log(`${colors.red}🚨 ${msg}${colors.reset}`),
  success: (msg) => console.log(`${colors.green}✅ ${msg}${colors.reset}`),
  warning: (msg) => console.log(`${colors.yellow}⚠️  ${msg}${colors.reset}`),
  info: (msg) => console.log(`${colors.blue}ℹ️  ${msg}${colors.reset}`),
  critical: (msg) => console.log(`${colors.magenta}💀 CRITICAL: ${msg}${colors.reset}`)
};

// 安全检查结果
const securityResults = {
  critical: [],
  high: [],
  medium: [],
  low: [],
  info: []
};

// 敏感信息模式
const SENSITIVE_PATTERNS = [
  {
    name: '私钥',
    pattern: /(?:private[_-]?key|privatekey)\s*[:=]\s*["\']?0x[a-fA-F0-9]{64}["\']?/gi,
    severity: 'critical'
  },
  {
    name: 'API密钥',
    pattern: /(?:api[_-]?key|apikey)\s*[:=]\s*["\']?[a-zA-Z0-9]{32,}["\']?/gi,
    severity: 'critical'
  },
  {
    name: '访问令牌',
    pattern: /(?:access[_-]?token|accesstoken)\s*[:=]\s*["\']?[a-zA-Z0-9]{32,}["\']?/gi,
    severity: 'critical'
  },
  {
    name: '密码',
    pattern: /(?:password|passwd|pwd)\s*[:=]\s*["\']?[a-zA-Z0-9!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]{8,}["\']?/gi,
    severity: 'high'
  },
  {
    name: 'JWT密钥',
    pattern: /(?:jwt[_-]?secret|jwtsecret)\s*[:=]\s*["\']?[a-zA-Z0-9+/=]{32,}["\']?/gi,
    severity: 'critical'
  },
  {
    name: '数据库连接字符串',
    pattern: /(?:mongodb|mysql|postgres|redis):\/\/[^\s"']+/gi,
    severity: 'high'
  },
  {
    name: 'AWS密钥',
    pattern: /AKIA[0-9A-Z]{16}/gi,
    severity: 'critical'
  },
  {
    name: 'Google API密钥',
    pattern: /AIza[0-9A-Za-z\-_]{35}/gi,
    severity: 'critical'
  },
  {
    name: 'Slack令牌',
    pattern: /xox[baprs]-[0-9a-zA-Z\-]{10,48}/gi,
    severity: 'high'
  },
  {
    name: 'GitHub令牌',
    pattern: /gh[pousr]_[A-Za-z0-9_]{36}/gi,
    severity: 'critical'
  }
];

// 不安全的代码模式
const INSECURE_PATTERNS = [
  {
    name: 'eval()使用',
    pattern: /\beval\s*\(/gi,
    severity: 'high',
    description: 'eval()可能导致代码注入攻击'
  },
  {
    name: 'innerHTML使用',
    pattern: /\.innerHTML\s*=/gi,
    severity: 'medium',
    description: 'innerHTML可能导致XSS攻击，建议使用textContent'
  },
  {
    name: 'document.write使用',
    pattern: /document\.write\s*\(/gi,
    severity: 'medium',
    description: 'document.write可能导致XSS攻击'
  },
  {
    name: 'dangerouslySetInnerHTML使用',
    pattern: /dangerouslySetInnerHTML/gi,
    severity: 'medium',
    description: '确保内容已经过清理'
  },
  {
    name: 'HTTP URL',
    pattern: /http:\/\/(?!localhost|127\.0\.0\.1|0\.0\.0\.0)/gi,
    severity: 'low',
    description: '生产环境应使用HTTPS'
  },
  {
    name: 'console.log',
    pattern: /console\.log\s*\(/gi,
    severity: 'low',
    description: '生产环境应移除调试日志'
  },
  {
    name: 'TODO注释',
    pattern: /\/\/\s*TODO|\/\*\s*TODO/gi,
    severity: 'low',
    description: '存在未完成的TODO项'
  },
  {
    name: 'FIXME注释',
    pattern: /\/\/\s*FIXME|\/\*\s*FIXME/gi,
    severity: 'medium',
    description: '存在需要修复的FIXME项'
  }
];

// 文件扩展名白名单
const SAFE_EXTENSIONS = [
  '.js', '.ts', '.tsx', '.jsx', '.json', '.md', '.txt', '.css', '.scss', '.sass',
  '.html', '.htm', '.xml', '.svg', '.png', '.jpg', '.jpeg', '.gif', '.webp',
  '.ico', '.woff', '.woff2', '.ttf', '.eot', '.mp4', '.webm', '.mp3', '.wav'
];

// 扫描文件内容
function scanFileContent(filePath, content) {
  const results = [];
  const fileName = path.basename(filePath);

  // 检查敏感信息
  SENSITIVE_PATTERNS.forEach(pattern => {
    const matches = content.match(pattern.pattern);
    if (matches) {
      matches.forEach(match => {
        results.push({
          type: 'sensitive',
          severity: pattern.severity,
          file: filePath,
          pattern: pattern.name,
          match: match.substring(0, 50) + '...',
          line: getLineNumber(content, match)
        });
      });
    }
  });

  // 检查不安全的代码模式
  INSECURE_PATTERNS.forEach(pattern => {
    const matches = content.match(pattern.pattern);
    if (matches) {
      matches.forEach(match => {
        results.push({
          type: 'insecure',
          severity: pattern.severity,
          file: filePath,
          pattern: pattern.name,
          description: pattern.description,
          match: match,
          line: getLineNumber(content, match)
        });
      });
    }
  });

  return results;
}

// 获取行号
function getLineNumber(content, match) {
  const index = content.indexOf(match);
  if (index === -1) return 1;
  
  return content.substring(0, index).split('\n').length;
}

// 扫描目录
function scanDirectory(dirPath, excludeDirs = []) {
  const results = [];
  
  if (!fs.existsSync(dirPath)) {
    return results;
  }

  const items = fs.readdirSync(dirPath);
  
  items.forEach(item => {
    const itemPath = path.join(dirPath, item);
    const stat = fs.statSync(itemPath);
    
    if (stat.isDirectory()) {
      // 跳过排除的目录
      if (excludeDirs.includes(item) || item.startsWith('.')) {
        return;
      }
      
      // 递归扫描子目录
      results.push(...scanDirectory(itemPath, excludeDirs));
    } else if (stat.isFile()) {
      // 检查文件扩展名
      const ext = path.extname(item).toLowerCase();
      if (!SAFE_EXTENSIONS.includes(ext) && ext !== '') {
        results.push({
          type: 'suspicious_file',
          severity: 'medium',
          file: itemPath,
          description: `可疑的文件类型: ${ext}`
        });
      }
      
      // 扫描文本文件内容
      if (['.js', '.ts', '.tsx', '.jsx', '.json', '.md', '.txt', '.css', '.scss', '.html'].includes(ext)) {
        try {
          const content = fs.readFileSync(itemPath, 'utf8');
          results.push(...scanFileContent(itemPath, content));
        } catch (error) {
          // 忽略读取错误
        }
      }
    }
  });
  
  return results;
}

// 检查文件权限
function checkFilePermissions() {
  log.info('检查文件权限...');
  
  const sensitiveFiles = [
    '.env',
    '.env.local',
    '.env.production',
    'private-keys.txt'
  ];
  
  sensitiveFiles.forEach(file => {
    const filePath = path.join(process.cwd(), file);
    if (fs.existsSync(filePath)) {
      try {
        const stats = fs.statSync(filePath);
        const mode = stats.mode & parseInt('777', 8);
        
        if (mode & parseInt('044', 8)) { // 检查是否对组和其他用户可读
          securityResults.high.push({
            type: 'file_permission',
            file: filePath,
            description: '敏感文件权限过于宽松'
          });
        }
      } catch (error) {
        // 忽略权限检查错误
      }
    }
  });
}

// 检查依赖安全性
function checkDependencySecurity() {
  log.info('检查依赖安全性...');
  
  const packagePath = path.join(process.cwd(), 'package.json');
  if (!fs.existsSync(packagePath)) {
    return;
  }
  
  const packageContent = JSON.parse(fs.readFileSync(packagePath, 'utf8'));
  const dependencies = { ...packageContent.dependencies, ...packageContent.devDependencies };
  
  // 检查已知的不安全包
  const insecurePackages = [
    'lodash', // 建议使用lodash-es
    'moment', // 建议使用dayjs或date-fns
    'request', // 已废弃
    'node-uuid' // 已废弃，使用uuid
  ];
  
  insecurePackages.forEach(pkg => {
    if (dependencies[pkg]) {
      securityResults.medium.push({
        type: 'insecure_dependency',
        package: pkg,
        description: `建议替换不安全或已废弃的依赖: ${pkg}`
      });
    }
  });
  
  // 检查版本固定
  Object.entries(dependencies).forEach(([pkg, version]) => {
    if (version.startsWith('^') || version.startsWith('~')) {
      securityResults.low.push({
        type: 'version_range',
        package: pkg,
        description: '建议在生产环境中固定依赖版本'
      });
    }
  });
}

// 检查构建输出安全性
function checkBuildSecurity() {
  log.info('检查构建输出安全性...');
  
  const outDir = path.join(process.cwd(), 'out');
  if (!fs.existsSync(outDir)) {
    securityResults.medium.push({
      type: 'build_missing',
      description: '构建输出目录不存在，请先构建项目'
    });
    return;
  }
  
  // 扫描构建输出中的敏感信息
  const buildResults = scanDirectory(outDir, ['node_modules']);
  buildResults.forEach(result => {
    if (result.severity === 'critical' || result.severity === 'high') {
      securityResults[result.severity].push({
        ...result,
        description: '构建输出中包含敏感信息'
      });
    }
  });
}

// 主扫描函数
function performSecurityScan() {
  log.info('开始安全扫描...');
  
  // 扫描源代码
  const sourceResults = scanDirectory(process.cwd(), [
    'node_modules', '.git', '.next', 'out', 'dist', 'build',
    'coverage', 'test-results', '.nyc_output'
  ]);
  
  // 按严重程度分类结果
  sourceResults.forEach(result => {
    securityResults[result.severity].push(result);
  });
  
  // 其他安全检查
  checkFilePermissions();
  checkDependencySecurity();
  checkBuildSecurity();
}

// 生成安全报告
function generateSecurityReport() {
  console.log('\n' + '='.repeat(70));
  console.log('🔒 安全扫描报告');
  console.log('='.repeat(70));
  
  const totalIssues = Object.values(securityResults).reduce((sum, arr) => sum + arr.length, 0);
  
  if (totalIssues === 0) {
    log.success('🎉 未发现安全问题！');
    return true;
  }
  
  // 显示关键问题
  if (securityResults.critical.length > 0) {
    log.critical(`发现 ${securityResults.critical.length} 个关键安全问题:`);
    securityResults.critical.forEach((issue, index) => {
      console.log(`   ${index + 1}. ${issue.pattern || issue.type}: ${issue.file || issue.description}`);
      if (issue.match) console.log(`      匹配: ${issue.match}`);
      if (issue.line) console.log(`      行号: ${issue.line}`);
    });
    console.log();
  }
  
  // 显示高危问题
  if (securityResults.high.length > 0) {
    log.error(`发现 ${securityResults.high.length} 个高危安全问题:`);
    securityResults.high.forEach((issue, index) => {
      console.log(`   ${index + 1}. ${issue.pattern || issue.type}: ${issue.file || issue.description}`);
      if (issue.description) console.log(`      说明: ${issue.description}`);
    });
    console.log();
  }
  
  // 显示中危问题
  if (securityResults.medium.length > 0) {
    log.warning(`发现 ${securityResults.medium.length} 个中危安全问题:`);
    securityResults.medium.slice(0, 10).forEach((issue, index) => {
      console.log(`   ${index + 1}. ${issue.pattern || issue.type}: ${issue.file || issue.description}`);
    });
    if (securityResults.medium.length > 10) {
      console.log(`   ... 还有 ${securityResults.medium.length - 10} 个问题`);
    }
    console.log();
  }
  
  // 显示低危问题统计
  if (securityResults.low.length > 0) {
    log.info(`发现 ${securityResults.low.length} 个低危问题（建议修复）`);
  }
  
  console.log('='.repeat(70));
  
  // 判断是否可以部署
  const canDeploy = securityResults.critical.length === 0 && securityResults.high.length === 0;
  
  if (canDeploy) {
    if (securityResults.medium.length > 0 || securityResults.low.length > 0) {
      log.warning('⚠️  存在一些安全建议，但可以部署');
    } else {
      log.success('🚀 安全检查通过，可以安全部署！');
    }
  } else {
    log.critical('❌ 存在严重安全问题，禁止部署！');
  }
  
  return canDeploy;
}

// 主函数
function main() {
  console.log('🔒 开始最终安全检查...\n');
  
  performSecurityScan();
  const canDeploy = generateSecurityReport();
  
  process.exit(canDeploy ? 0 : 1);
}

// 运行安全检查
if (require.main === module) {
  main();
}

module.exports = {
  performSecurityScan,
  generateSecurityReport,
  scanDirectory,
  scanFileContent
};
