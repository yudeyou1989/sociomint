#!/usr/bin/env node

/**
 * 验证 Vercel 配置脚本
 * 检查 Token、项目 ID 和组织 ID 是否正确
 */

const https = require('https');

// 从环境变量获取配置
const VERCEL_TOKEN = process.env.VERCEL_TOKEN || 'O3F0DCvIyw745z1TQOUlAxu4';
const VERCEL_ORG_ID = process.env.VERCEL_ORG_ID || 'team_KiW6xdXGylcFvjyC1wxH6WcF';
const VERCEL_PROJECT_ID = process.env.VERCEL_PROJECT_ID || 'prj_RqumjDOALyEZZx6aDFjmungZMl1C';

console.log('🔍 验证 Vercel 配置...\n');

// 验证 Token
function verifyToken() {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'api.vercel.com',
      path: '/v2/user',
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${VERCEL_TOKEN}`,
        'Content-Type': 'application/json'
      }
    };

    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => data += chunk);
      res.on('end', () => {
        if (res.statusCode === 200) {
          const user = JSON.parse(data);
          console.log('✅ Token 验证成功');
          console.log(`   用户: ${user.username || user.name}`);
          console.log(`   邮箱: ${user.email}`);
          resolve(user);
        } else {
          console.log('❌ Token 验证失败');
          console.log(`   状态码: ${res.statusCode}`);
          console.log(`   响应: ${data}`);
          reject(new Error('Token invalid'));
        }
      });
    });

    req.on('error', reject);
    req.end();
  });
}

// 获取团队信息
function getTeams() {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'api.vercel.com',
      path: '/v2/teams',
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${VERCEL_TOKEN}`,
        'Content-Type': 'application/json'
      }
    };

    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => data += chunk);
      res.on('end', () => {
        if (res.statusCode === 200) {
          const response = JSON.parse(data);
          console.log('\n📋 可用团队:');
          response.teams.forEach(team => {
            console.log(`   - ${team.name} (ID: ${team.id})`);
            if (team.id === VERCEL_ORG_ID) {
              console.log('     ✅ 匹配当前配置');
            }
          });
          resolve(response.teams);
        } else {
          console.log('❌ 获取团队信息失败');
          console.log(`   状态码: ${res.statusCode}`);
          console.log(`   响应: ${data}`);
          reject(new Error('Failed to get teams'));
        }
      });
    });

    req.on('error', reject);
    req.end();
  });
}

// 获取项目信息
function getProjects() {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'api.vercel.com',
      path: `/v9/projects?teamId=${VERCEL_ORG_ID}`,
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${VERCEL_TOKEN}`,
        'Content-Type': 'application/json'
      }
    };

    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => data += chunk);
      res.on('end', () => {
        if (res.statusCode === 200) {
          const response = JSON.parse(data);
          console.log('\n📁 可用项目:');
          response.projects.forEach(project => {
            console.log(`   - ${project.name} (ID: ${project.id})`);
            if (project.id === VERCEL_PROJECT_ID) {
              console.log('     ✅ 匹配当前配置');
            }
          });
          resolve(response.projects);
        } else {
          console.log('❌ 获取项目信息失败');
          console.log(`   状态码: ${res.statusCode}`);
          console.log(`   响应: ${data}`);
          reject(new Error('Failed to get projects'));
        }
      });
    });

    req.on('error', reject);
    req.end();
  });
}

// 主函数
async function main() {
  try {
    console.log('当前配置:');
    console.log(`  Token: ${VERCEL_TOKEN.substring(0, 8)}...`);
    console.log(`  Org ID: ${VERCEL_ORG_ID}`);
    console.log(`  Project ID: ${VERCEL_PROJECT_ID}\n`);

    await verifyToken();
    await getTeams();
    await getProjects();

    console.log('\n🎉 验证完成！');
  } catch (error) {
    console.error('\n💥 验证失败:', error.message);
    process.exit(1);
  }
}

main();
