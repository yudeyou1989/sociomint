/**
 * 性能基准测试脚本
 * 测试应用的加载性能和运行时性能
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// 颜色输出
const colors = {
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
  reset: '\x1b[0m'
};

const log = {
  error: (msg) => console.log(`${colors.red}❌ ${msg}${colors.reset}`),
  success: (msg) => console.log(`${colors.green}✅ ${msg}${colors.reset}`),
  warning: (msg) => console.log(`${colors.yellow}⚠️  ${msg}${colors.reset}`),
  info: (msg) => console.log(`${colors.blue}ℹ️  ${msg}${colors.reset}`),
  metric: (msg) => console.log(`${colors.cyan}📊 ${msg}${colors.reset}`)
};

// 性能基准
const PERFORMANCE_BENCHMARKS = {
  bundleSize: {
    excellent: 500 * 1024, // 500KB
    good: 1024 * 1024,     // 1MB
    acceptable: 2048 * 1024 // 2MB
  },
  chunkCount: {
    excellent: 10,
    good: 20,
    acceptable: 50
  },
  buildTime: {
    excellent: 30000,  // 30秒
    good: 60000,       // 1分钟
    acceptable: 120000 // 2分钟
  }
};

// 性能测试结果
const performanceResults = {
  bundleSize: 0,
  chunkCount: 0,
  buildTime: 0,
  staticFiles: 0,
  totalSize: 0,
  gzipSize: 0,
  issues: [],
  recommendations: []
};

// 格式化文件大小
function formatBytes(bytes) {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

// 格式化时间
function formatTime(ms) {
  if (ms < 1000) return `${ms}ms`;
  if (ms < 60000) return `${(ms / 1000).toFixed(1)}s`;
  return `${(ms / 60000).toFixed(1)}m`;
}

// 获取目录大小
function getDirectorySize(dirPath) {
  let totalSize = 0;
  let fileCount = 0;
  
  if (!fs.existsSync(dirPath)) {
    return { size: 0, count: 0 };
  }
  
  function calculateSize(currentPath) {
    const stats = fs.statSync(currentPath);
    
    if (stats.isFile()) {
      totalSize += stats.size;
      fileCount++;
    } else if (stats.isDirectory()) {
      const files = fs.readdirSync(currentPath);
      files.forEach(file => {
        calculateSize(path.join(currentPath, file));
      });
    }
  }
  
  calculateSize(dirPath);
  return { size: totalSize, count: fileCount };
}

// 分析构建输出
function analyzeBuildOutput() {
  log.info('分析构建输出...');
  
  const outDir = path.join(process.cwd(), 'out');
  if (!fs.existsSync(outDir)) {
    log.error('构建输出目录不存在，请先运行 npm run build');
    return false;
  }
  
  // 分析总体大小
  const { size: totalSize, count: fileCount } = getDirectorySize(outDir);
  performanceResults.totalSize = totalSize;
  performanceResults.staticFiles = fileCount;
  
  log.metric(`总文件数: ${fileCount}`);
  log.metric(`总大小: ${formatBytes(totalSize)}`);
  
  // 分析静态资源
  const staticDir = path.join(outDir, '_next', 'static');
  if (fs.existsSync(staticDir)) {
    const { size: staticSize } = getDirectorySize(staticDir);
    performanceResults.bundleSize = staticSize;
    
    log.metric(`静态资源大小: ${formatBytes(staticSize)}`);
    
    // 分析chunk文件
    const chunksDir = path.join(staticDir, 'chunks');
    if (fs.existsSync(chunksDir)) {
      const chunkFiles = fs.readdirSync(chunksDir).filter(file => file.endsWith('.js'));
      performanceResults.chunkCount = chunkFiles.length;
      
      log.metric(`JavaScript chunk数量: ${chunkFiles.length}`);
      
      // 分析最大的chunk文件
      let largestChunk = { name: '', size: 0 };
      chunkFiles.forEach(file => {
        const filePath = path.join(chunksDir, file);
        const stats = fs.statSync(filePath);
        if (stats.size > largestChunk.size) {
          largestChunk = { name: file, size: stats.size };
        }
      });
      
      if (largestChunk.name) {
        log.metric(`最大chunk: ${largestChunk.name} (${formatBytes(largestChunk.size)})`);
      }
    }
  }
  
  return true;
}

// 测试构建时间
function measureBuildTime() {
  log.info('测试构建时间...');
  
  try {
    // 清理之前的构建
    const outDir = path.join(process.cwd(), 'out');
    if (fs.existsSync(outDir)) {
      fs.rmSync(outDir, { recursive: true, force: true });
    }
    
    const nextDir = path.join(process.cwd(), '.next');
    if (fs.existsSync(nextDir)) {
      fs.rmSync(nextDir, { recursive: true, force: true });
    }
    
    // 测量构建时间
    const startTime = Date.now();
    
    log.info('开始构建...');
    execSync('npm run build', { 
      stdio: 'pipe',
      cwd: process.cwd()
    });
    
    const endTime = Date.now();
    const buildTime = endTime - startTime;
    
    performanceResults.buildTime = buildTime;
    log.metric(`构建时间: ${formatTime(buildTime)}`);
    
    return true;
  } catch (error) {
    log.error(`构建失败: ${error.message}`);
    return false;
  }
}

// 分析包大小
function analyzePackageSize() {
  log.info('分析包大小...');
  
  try {
    // 运行bundle分析器
    const result = execSync('npx next-bundle-analyzer', { 
      stdio: 'pipe',
      cwd: process.cwd()
    });
    
    log.success('Bundle分析完成');
  } catch (error) {
    log.warning('Bundle分析器不可用，跳过详细分析');
  }
}

// 检查性能问题
function checkPerformanceIssues() {
  log.info('检查性能问题...');
  
  // 检查bundle大小
  if (performanceResults.bundleSize > PERFORMANCE_BENCHMARKS.bundleSize.acceptable) {
    performanceResults.issues.push({
      type: 'bundle_size',
      severity: 'high',
      message: `Bundle大小过大: ${formatBytes(performanceResults.bundleSize)}`,
      recommendation: '考虑代码分割、tree-shaking和依赖优化'
    });
  } else if (performanceResults.bundleSize > PERFORMANCE_BENCHMARKS.bundleSize.good) {
    performanceResults.issues.push({
      type: 'bundle_size',
      severity: 'medium',
      message: `Bundle大小较大: ${formatBytes(performanceResults.bundleSize)}`,
      recommendation: '建议进一步优化bundle大小'
    });
  }
  
  // 检查chunk数量
  if (performanceResults.chunkCount > PERFORMANCE_BENCHMARKS.chunkCount.acceptable) {
    performanceResults.issues.push({
      type: 'chunk_count',
      severity: 'medium',
      message: `Chunk数量过多: ${performanceResults.chunkCount}`,
      recommendation: '考虑合并小的chunk文件'
    });
  }
  
  // 检查构建时间
  if (performanceResults.buildTime > PERFORMANCE_BENCHMARKS.buildTime.acceptable) {
    performanceResults.issues.push({
      type: 'build_time',
      severity: 'medium',
      message: `构建时间过长: ${formatTime(performanceResults.buildTime)}`,
      recommendation: '考虑优化构建配置和依赖'
    });
  }
  
  // 检查文件数量
  if (performanceResults.staticFiles > 1000) {
    performanceResults.issues.push({
      type: 'file_count',
      severity: 'low',
      message: `静态文件数量较多: ${performanceResults.staticFiles}`,
      recommendation: '考虑合并或优化静态资源'
    });
  }
}

// 生成性能建议
function generateRecommendations() {
  const recommendations = [];
  
  // 基于bundle大小的建议
  if (performanceResults.bundleSize > PERFORMANCE_BENCHMARKS.bundleSize.good) {
    recommendations.push('启用gzip压缩');
    recommendations.push('使用动态导入进行代码分割');
    recommendations.push('移除未使用的依赖');
    recommendations.push('使用webpack-bundle-analyzer分析bundle组成');
  }
  
  // 基于chunk数量的建议
  if (performanceResults.chunkCount > PERFORMANCE_BENCHMARKS.chunkCount.good) {
    recommendations.push('优化splitChunks配置');
    recommendations.push('合并小的chunk文件');
    recommendations.push('使用vendor chunk策略');
  }
  
  // 基于构建时间的建议
  if (performanceResults.buildTime > PERFORMANCE_BENCHMARKS.buildTime.good) {
    recommendations.push('启用增量构建');
    recommendations.push('使用构建缓存');
    recommendations.push('优化TypeScript配置');
    recommendations.push('减少不必要的polyfill');
  }
  
  // 通用建议
  recommendations.push('启用HTTP/2服务器推送');
  recommendations.push('使用CDN加速静态资源');
  recommendations.push('实现资源预加载策略');
  recommendations.push('优化图片格式和大小');
  
  performanceResults.recommendations = recommendations;
}

// 生成性能报告
function generatePerformanceReport() {
  console.log('\n' + '='.repeat(70));
  console.log('📊 性能基准测试报告');
  console.log('='.repeat(70));
  
  // 显示关键指标
  console.log('\n📈 关键性能指标:');
  console.log(`   Bundle大小: ${formatBytes(performanceResults.bundleSize)}`);
  console.log(`   Chunk数量: ${performanceResults.chunkCount}`);
  console.log(`   构建时间: ${formatTime(performanceResults.buildTime)}`);
  console.log(`   静态文件: ${performanceResults.staticFiles} 个`);
  console.log(`   总大小: ${formatBytes(performanceResults.totalSize)}`);
  
  // 性能评级
  console.log('\n🏆 性能评级:');
  
  // Bundle大小评级
  let bundleGrade = 'F';
  if (performanceResults.bundleSize <= PERFORMANCE_BENCHMARKS.bundleSize.excellent) {
    bundleGrade = 'A';
  } else if (performanceResults.bundleSize <= PERFORMANCE_BENCHMARKS.bundleSize.good) {
    bundleGrade = 'B';
  } else if (performanceResults.bundleSize <= PERFORMANCE_BENCHMARKS.bundleSize.acceptable) {
    bundleGrade = 'C';
  }
  console.log(`   Bundle大小: ${bundleGrade}`);
  
  // Chunk数量评级
  let chunkGrade = 'F';
  if (performanceResults.chunkCount <= PERFORMANCE_BENCHMARKS.chunkCount.excellent) {
    chunkGrade = 'A';
  } else if (performanceResults.chunkCount <= PERFORMANCE_BENCHMARKS.chunkCount.good) {
    chunkGrade = 'B';
  } else if (performanceResults.chunkCount <= PERFORMANCE_BENCHMARKS.chunkCount.acceptable) {
    chunkGrade = 'C';
  }
  console.log(`   Chunk优化: ${chunkGrade}`);
  
  // 构建时间评级
  let buildGrade = 'F';
  if (performanceResults.buildTime <= PERFORMANCE_BENCHMARKS.buildTime.excellent) {
    buildGrade = 'A';
  } else if (performanceResults.buildTime <= PERFORMANCE_BENCHMARKS.buildTime.good) {
    buildGrade = 'B';
  } else if (performanceResults.buildTime <= PERFORMANCE_BENCHMARKS.buildTime.acceptable) {
    buildGrade = 'C';
  }
  console.log(`   构建速度: ${buildGrade}`);
  
  // 显示问题
  if (performanceResults.issues.length > 0) {
    console.log('\n⚠️  发现的性能问题:');
    performanceResults.issues.forEach((issue, index) => {
      const severity = issue.severity === 'high' ? '🔴' : 
                      issue.severity === 'medium' ? '🟡' : '🔵';
      console.log(`   ${index + 1}. ${severity} ${issue.message}`);
      console.log(`      建议: ${issue.recommendation}`);
    });
  }
  
  // 显示建议
  if (performanceResults.recommendations.length > 0) {
    console.log('\n💡 性能优化建议:');
    performanceResults.recommendations.slice(0, 10).forEach((rec, index) => {
      console.log(`   ${index + 1}. ${rec}`);
    });
  }
  
  console.log('\n' + '='.repeat(70));
  
  // 总体评估
  const hasHighIssues = performanceResults.issues.some(issue => issue.severity === 'high');
  const hasMediumIssues = performanceResults.issues.some(issue => issue.severity === 'medium');
  
  if (!hasHighIssues && !hasMediumIssues) {
    log.success('🚀 性能表现优秀，可以部署！');
    return true;
  } else if (!hasHighIssues) {
    log.warning('⚠️  性能表现良好，建议优化后部署');
    return true;
  } else {
    log.error('❌ 存在严重性能问题，建议优化后再部署');
    return false;
  }
}

// 主函数
function main() {
  console.log('📊 开始性能基准测试...\n');
  
  // 测试构建时间
  if (!measureBuildTime()) {
    process.exit(1);
  }
  
  // 分析构建输出
  if (!analyzeBuildOutput()) {
    process.exit(1);
  }
  
  // 分析包大小
  analyzePackageSize();
  
  // 检查性能问题
  checkPerformanceIssues();
  
  // 生成建议
  generateRecommendations();
  
  // 生成报告
  const canDeploy = generatePerformanceReport();
  
  process.exit(canDeploy ? 0 : 1);
}

// 运行性能测试
if (require.main === module) {
  main();
}

module.exports = {
  analyzeBuildOutput,
  measureBuildTime,
  checkPerformanceIssues,
  generatePerformanceReport
};
