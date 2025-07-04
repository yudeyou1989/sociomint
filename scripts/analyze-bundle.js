/**
 * Bundle分析脚本
 * 分析构建产物大小和依赖关系
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// 分析配置
const ANALYSIS_CONFIG = {
  buildDir: '.next',
  outputFile: 'bundle-analysis.json',
  sizeThreshold: 1024 * 1024, // 1MB
  chunkThreshold: 500 * 1024,  // 500KB
};

/**
 * 获取文件大小
 */
function getFileSize(filePath) {
  try {
    const stats = fs.statSync(filePath);
    return stats.size;
  } catch (error) {
    return 0;
  }
}

/**
 * 格式化文件大小
 */
function formatSize(bytes) {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

/**
 * 分析静态文件
 */
function analyzeStaticFiles() {
  const staticDir = path.join(ANALYSIS_CONFIG.buildDir, 'static');
  const analysis = {
    totalSize: 0,
    fileCount: 0,
    largeFiles: [],
    byType: {},
  };

  if (!fs.existsSync(staticDir)) {
    return analysis;
  }

  function scanDirectory(dir) {
    const files = fs.readdirSync(dir);
    
    files.forEach(file => {
      const filePath = path.join(dir, file);
      const stat = fs.statSync(filePath);
      
      if (stat.isDirectory()) {
        scanDirectory(filePath);
      } else {
        const size = stat.size;
        const ext = path.extname(file);
        
        analysis.totalSize += size;
        analysis.fileCount++;
        
        // 按类型分组
        if (!analysis.byType[ext]) {
          analysis.byType[ext] = { count: 0, size: 0 };
        }
        analysis.byType[ext].count++;
        analysis.byType[ext].size += size;
        
        // 记录大文件
        if (size > ANALYSIS_CONFIG.chunkThreshold) {
          analysis.largeFiles.push({
            path: path.relative(ANALYSIS_CONFIG.buildDir, filePath),
            size: size,
            formattedSize: formatSize(size),
          });
        }
      }
    });
  }

  scanDirectory(staticDir);
  
  // 排序大文件
  analysis.largeFiles.sort((a, b) => b.size - a.size);
  
  return analysis;
}

/**
 * 分析JavaScript chunks
 */
function analyzeJSChunks() {
  const chunksDir = path.join(ANALYSIS_CONFIG.buildDir, 'static', 'chunks');
  const analysis = {
    totalSize: 0,
    chunkCount: 0,
    largeChunks: [],
    pages: {},
  };

  if (!fs.existsSync(chunksDir)) {
    return analysis;
  }

  const files = fs.readdirSync(chunksDir);
  
  files.forEach(file => {
    if (file.endsWith('.js')) {
      const filePath = path.join(chunksDir, file);
      const size = getFileSize(filePath);
      
      analysis.totalSize += size;
      analysis.chunkCount++;
      
      if (size > ANALYSIS_CONFIG.chunkThreshold) {
        analysis.largeChunks.push({
          name: file,
          size: size,
          formattedSize: formatSize(size),
        });
      }
      
      // 分析页面chunks
      if (file.startsWith('pages/')) {
        const pageName = file.replace('pages/', '').replace('.js', '');
        analysis.pages[pageName] = {
          size: size,
          formattedSize: formatSize(size),
        };
      }
    }
  });
  
  analysis.largeChunks.sort((a, b) => b.size - a.size);
  
  return analysis;
}

/**
 * 分析CSS文件
 */
function analyzeCSSFiles() {
  const cssDir = path.join(ANALYSIS_CONFIG.buildDir, 'static', 'css');
  const analysis = {
    totalSize: 0,
    fileCount: 0,
    files: [],
  };

  if (!fs.existsSync(cssDir)) {
    return analysis;
  }

  const files = fs.readdirSync(cssDir);
  
  files.forEach(file => {
    if (file.endsWith('.css')) {
      const filePath = path.join(cssDir, file);
      const size = getFileSize(filePath);
      
      analysis.totalSize += size;
      analysis.fileCount++;
      analysis.files.push({
        name: file,
        size: size,
        formattedSize: formatSize(size),
      });
    }
  });
  
  analysis.files.sort((a, b) => b.size - a.size);
  
  return analysis;
}

/**
 * 获取依赖信息
 */
function getDependencyInfo() {
  try {
    const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'));
    const dependencies = packageJson.dependencies || {};
    const devDependencies = packageJson.devDependencies || {};
    
    return {
      production: Object.keys(dependencies).length,
      development: Object.keys(devDependencies).length,
      total: Object.keys(dependencies).length + Object.keys(devDependencies).length,
      heavyDeps: [
        'react', 'react-dom', 'next', '@mui/material', 
        'ethers', '@wagmi/core', 'framer-motion'
      ].filter(dep => dependencies[dep]),
    };
  } catch (error) {
    return { production: 0, development: 0, total: 0, heavyDeps: [] };
  }
}

/**
 * 生成优化建议
 */
function generateOptimizationSuggestions(analysis) {
  const suggestions = [];
  
  // 检查大文件
  if (analysis.static.largeFiles.length > 0) {
    suggestions.push({
      type: 'warning',
      title: '发现大文件',
      description: `有 ${analysis.static.largeFiles.length} 个文件超过 ${formatSize(ANALYSIS_CONFIG.chunkThreshold)}`,
      files: analysis.static.largeFiles.slice(0, 5).map(f => f.path),
      recommendation: '考虑压缩图片、使用WebP格式或启用gzip压缩',
    });
  }
  
  // 检查大chunks
  if (analysis.js.largeChunks.length > 0) {
    suggestions.push({
      type: 'warning',
      title: '发现大JavaScript chunks',
      description: `有 ${analysis.js.largeChunks.length} 个chunk超过 ${formatSize(ANALYSIS_CONFIG.chunkThreshold)}`,
      chunks: analysis.js.largeChunks.slice(0, 5).map(c => c.name),
      recommendation: '考虑进一步代码分割或移除未使用的依赖',
    });
  }
  
  // 检查总体大小
  const totalSize = analysis.static.totalSize;
  if (totalSize > ANALYSIS_CONFIG.sizeThreshold) {
    suggestions.push({
      type: 'info',
      title: '总体bundle较大',
      description: `总大小: ${formatSize(totalSize)}`,
      recommendation: '考虑启用tree-shaking、移除未使用代码或使用动态导入',
    });
  }
  
  return suggestions;
}

/**
 * 主分析函数
 */
function analyzeBuild() {
  console.log('🔍 开始分析构建产物...\n');
  
  // 检查构建目录
  if (!fs.existsSync(ANALYSIS_CONFIG.buildDir)) {
    console.error('❌ 构建目录不存在，请先运行 npm run build');
    process.exit(1);
  }
  
  // 执行分析
  const analysis = {
    timestamp: new Date().toISOString(),
    static: analyzeStaticFiles(),
    js: analyzeJSChunks(),
    css: analyzeCSSFiles(),
    dependencies: getDependencyInfo(),
  };
  
  // 生成建议
  analysis.suggestions = generateOptimizationSuggestions(analysis);
  
  // 输出结果
  console.log('📊 分析结果:');
  console.log('='.repeat(50));
  
  console.log(`📁 静态文件: ${analysis.static.fileCount} 个文件, ${formatSize(analysis.static.totalSize)}`);
  console.log(`📜 JavaScript: ${analysis.js.chunkCount} 个chunks, ${formatSize(analysis.js.totalSize)}`);
  console.log(`🎨 CSS: ${analysis.css.fileCount} 个文件, ${formatSize(analysis.css.totalSize)}`);
  console.log(`📦 依赖: ${analysis.dependencies.total} 个包 (${analysis.dependencies.production} 生产 + ${analysis.dependencies.development} 开发)`);
  
  // 显示大文件
  if (analysis.static.largeFiles.length > 0) {
    console.log('\n🔍 大文件 (>500KB):');
    analysis.static.largeFiles.slice(0, 10).forEach(file => {
      console.log(`  ${file.formattedSize} - ${file.path}`);
    });
  }
  
  // 显示大chunks
  if (analysis.js.largeChunks.length > 0) {
    console.log('\n📦 大JavaScript chunks (>500KB):');
    analysis.js.largeChunks.slice(0, 10).forEach(chunk => {
      console.log(`  ${chunk.formattedSize} - ${chunk.name}`);
    });
  }
  
  // 显示建议
  if (analysis.suggestions.length > 0) {
    console.log('\n💡 优化建议:');
    analysis.suggestions.forEach((suggestion, index) => {
      console.log(`${index + 1}. ${suggestion.title}`);
      console.log(`   ${suggestion.description}`);
      console.log(`   建议: ${suggestion.recommendation}\n`);
    });
  }
  
  // 保存分析结果
  fs.writeFileSync(ANALYSIS_CONFIG.outputFile, JSON.stringify(analysis, null, 2));
  console.log(`📄 详细分析结果已保存到: ${ANALYSIS_CONFIG.outputFile}`);
  
  return analysis;
}

// 如果直接运行此脚本
if (require.main === module) {
  analyzeBuild();
}

module.exports = { analyzeBuild, formatSize };
