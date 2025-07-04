/**
 * 部署验证脚本
 * 验证网站功能是否正常工作
 */

const https = require('https');
const http = require('http');

// 测试配置
const TESTS = {
  website: {
    url: 'https://sociomint.top',
    fallback: 'http://localhost:3000',
    timeout: 10000
  },
  api: {
    endpoints: [
      '/api/social-tasks',
      '/api/airdrop-pools',
      '/api/security/csrf'
    ],
    timeout: 5000
  }
};

/**
 * HTTP请求测试
 */
function makeRequest(url, timeout = 5000) {
  return new Promise((resolve, reject) => {
    const client = url.startsWith('https') ? https : http;
    
    const req = client.get(url, { timeout }, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        resolve({
          statusCode: res.statusCode,
          headers: res.headers,
          data: data.substring(0, 500) // 限制数据长度
        });
      });
    });
    
    req.on('timeout', () => {
      req.destroy();
      reject(new Error('Request timeout'));
    });
    
    req.on('error', reject);
  });
}

/**
 * 测试网站可访问性
 */
async function testWebsiteAccess() {
  console.log('🌐 测试网站访问...');
  
  try {
    const response = await makeRequest(TESTS.website.url, TESTS.website.timeout);
    
    if (response.statusCode === 200) {
      console.log('✅ 网站可正常访问');
      console.log(`   状态码: ${response.statusCode}`);
      console.log(`   内容类型: ${response.headers['content-type']}`);
      return true;
    } else {
      console.log(`⚠️ 网站返回状态码: ${response.statusCode}`);
      return false;
    }
  } catch (error) {
    console.log(`❌ 网站访问失败: ${error.message}`);
    
    // 尝试本地访问
    console.log('🔄 尝试本地访问...');
    try {
      const localResponse = await makeRequest(TESTS.website.fallback, TESTS.website.timeout);
      if (localResponse.statusCode === 200) {
        console.log('✅ 本地服务器正常运行');
        return true;
      }
    } catch (localError) {
      console.log(`❌ 本地访问也失败: ${localError.message}`);
    }
    
    return false;
  }
}

/**
 * 测试API端点
 */
async function testAPIEndpoints() {
  console.log('\n🔌 测试API端点...');
  
  const results = [];
  
  for (const endpoint of TESTS.api.endpoints) {
    const url = `${TESTS.website.url}${endpoint}`;
    console.log(`   测试: ${endpoint}`);
    
    try {
      const response = await makeRequest(url, TESTS.api.timeout);
      
      if (response.statusCode < 500) {
        console.log(`   ✅ ${endpoint} - 状态码: ${response.statusCode}`);
        results.push({ endpoint, success: true, statusCode: response.statusCode });
      } else {
        console.log(`   ❌ ${endpoint} - 服务器错误: ${response.statusCode}`);
        results.push({ endpoint, success: false, statusCode: response.statusCode });
      }
    } catch (error) {
      console.log(`   ❌ ${endpoint} - 连接失败: ${error.message}`);
      results.push({ endpoint, success: false, error: error.message });
    }
  }
  
  const successCount = results.filter(r => r.success).length;
  console.log(`\n📊 API测试结果: ${successCount}/${results.length} 成功`);
  
  return results;
}

/**
 * 测试关键页面
 */
async function testKeyPages() {
  console.log('\n📄 测试关键页面...');
  
  const pages = [
    '/',
    '/exchange',
    '/tasks',
    '/vault',
    '/market'
  ];
  
  const results = [];
  
  for (const page of pages) {
    const url = `${TESTS.website.url}${page}`;
    console.log(`   测试页面: ${page}`);
    
    try {
      const response = await makeRequest(url, TESTS.website.timeout);
      
      if (response.statusCode === 200) {
        console.log(`   ✅ ${page} - 正常加载`);
        results.push({ page, success: true });
      } else {
        console.log(`   ❌ ${page} - 状态码: ${response.statusCode}`);
        results.push({ page, success: false, statusCode: response.statusCode });
      }
    } catch (error) {
      console.log(`   ❌ ${page} - 加载失败: ${error.message}`);
      results.push({ page, success: false, error: error.message });
    }
  }
  
  const successCount = results.filter(r => r.success).length;
  console.log(`\n📊 页面测试结果: ${successCount}/${results.length} 成功`);
  
  return results;
}

/**
 * 检查环境变量配置
 */
function checkEnvironmentConfig() {
  console.log('\n⚙️ 检查环境配置...');
  
  const requiredVars = [
    'NEXT_PUBLIC_WALLET_CONNECT_PROJECT_ID',
    'NEXT_PUBLIC_SUPABASE_URL',
    'NEXT_PUBLIC_SUPABASE_ANON_KEY'
  ];
  
  const missingVars = [];
  
  requiredVars.forEach(varName => {
    if (!process.env[varName]) {
      missingVars.push(varName);
      console.log(`   ❌ 缺少环境变量: ${varName}`);
    } else {
      console.log(`   ✅ ${varName}: 已配置`);
    }
  });
  
  if (missingVars.length === 0) {
    console.log('✅ 所有必需的环境变量都已配置');
    return true;
  } else {
    console.log(`❌ 缺少 ${missingVars.length} 个环境变量`);
    return false;
  }
}

/**
 * 生成验证报告
 */
function generateReport(websiteTest, apiTests, pageTests, envCheck) {
  console.log('\n📋 验证报告');
  console.log('='.repeat(50));
  
  console.log(`🌐 网站访问: ${websiteTest ? '✅ 正常' : '❌ 失败'}`);
  console.log(`⚙️ 环境配置: ${envCheck ? '✅ 完整' : '❌ 不完整'}`);
  
  const apiSuccess = apiTests.filter(t => t.success).length;
  console.log(`🔌 API端点: ${apiSuccess}/${apiTests.length} 正常`);
  
  const pageSuccess = pageTests.filter(t => t.success).length;
  console.log(`📄 关键页面: ${pageSuccess}/${pageTests.length} 正常`);
  
  const overallScore = [websiteTest, envCheck, apiSuccess === apiTests.length, pageSuccess === pageTests.length]
    .filter(Boolean).length;
  
  console.log(`\n🎯 总体评分: ${overallScore}/4`);
  
  if (overallScore === 4) {
    console.log('🎉 所有测试通过，网站已准备就绪！');
  } else if (overallScore >= 2) {
    console.log('⚠️ 部分功能正常，需要修复一些问题');
  } else {
    console.log('❌ 存在严重问题，需要立即修复');
  }
  
  return overallScore;
}

/**
 * 主验证函数
 */
async function main() {
  console.log('🚀 开始部署验证...\n');
  
  try {
    // 执行所有测试
    const websiteTest = await testWebsiteAccess();
    const apiTests = await testAPIEndpoints();
    const pageTests = await testKeyPages();
    const envCheck = checkEnvironmentConfig();
    
    // 生成报告
    const score = generateReport(websiteTest, apiTests, pageTests, envCheck);
    
    // 返回结果
    process.exit(score >= 3 ? 0 : 1);
    
  } catch (error) {
    console.error('❌ 验证过程中出现错误:', error);
    process.exit(1);
  }
}

// 如果直接运行此脚本
if (require.main === module) {
  main();
}

module.exports = {
  testWebsiteAccess,
  testAPIEndpoints,
  testKeyPages,
  checkEnvironmentConfig
};
