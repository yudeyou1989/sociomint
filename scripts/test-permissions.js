#!/usr/bin/env node

/**
 * 权限测试脚本
 * 
 * 此脚本测试不同用户角色对 Supabase 表的权限。
 * 它将创建测试用户，并验证 RLS 策略是否按预期工作。
 * 
 * 使用方法：
 *   NODE_ENV=development node scripts/test-permissions.js
 */

const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');
const chalk = require('chalk');
const { v4: uuidv4 } = require('uuid');
const faker = require('faker');

// 加载环境变量
if (process.env.NODE_ENV === 'production') {
  dotenv.config({ path: '.env.production' });
} else {
  dotenv.config({ path: '.env.development' });
}

// Supabase 客户端配置
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('错误: 缺少 Supabase URL 或 Service Key 环境变量');
  process.exit(1);
}

// 创建管理员客户端（使用 service role）
const adminClient = createClient(supabaseUrl, supabaseServiceKey);

// 测试数据
const testUsers = {
  admin: {
    email: `admin-${uuidv4().substring(0, 8)}@test.com`,
    password: 'StrongP@ssw0rd1',
    role: 'admin',
  },
  normal: {
    email: `user-${uuidv4().substring(0, 8)}@test.com`,
    password: 'StrongP@ssw0rd2',
    role: 'user',
  },
  anonymous: {
    // 匿名用户使用匿名令牌
  }
};

// 测试规范
const permissionTests = [
  // 用户资料权限测试
  {
    table: 'profiles',
    tests: [
      { role: 'admin', action: 'select', expectedResult: true, description: '管理员可以查看所有用户资料' },
      { role: 'admin', action: 'insert', expectedResult: true, description: '管理员可以创建用户资料' },
      { role: 'admin', action: 'update', expectedResult: true, description: '管理员可以更新任何用户资料' },
      { role: 'admin', action: 'delete', expectedResult: true, description: '管理员可以删除用户资料' },
      
      { role: 'normal', action: 'select', expectedResult: true, description: '普通用户可以查看资料' },
      { role: 'normal', action: 'insert', expectedResult: false, description: '普通用户不能直接创建资料' },
      { role: 'normal', action: 'update', expectedResult: 'own', description: '普通用户只能更新自己的资料' },
      { role: 'normal', action: 'delete', expectedResult: false, description: '普通用户不能删除资料' },
      
      { role: 'anonymous', action: 'select', expectedResult: true, description: '匿名用户可以查看公开资料' },
      { role: 'anonymous', action: 'insert', expectedResult: false, description: '匿名用户不能创建资料' },
      { role: 'anonymous', action: 'update', expectedResult: false, description: '匿名用户不能更新资料' },
      { role: 'anonymous', action: 'delete', expectedResult: false, description: '匿名用户不能删除资料' },
    ]
  },
  
  // 任务系统权限测试
  {
    table: 'tasks',
    tests: [
      { role: 'admin', action: 'select', expectedResult: true, description: '管理员可以查看所有任务' },
      { role: 'admin', action: 'insert', expectedResult: true, description: '管理员可以创建任务' },
      { role: 'admin', action: 'update', expectedResult: true, description: '管理员可以更新任何任务' },
      { role: 'admin', action: 'delete', expectedResult: true, description: '管理员可以删除任务' },
      
      { role: 'normal', action: 'select', expectedResult: true, description: '普通用户可以查看公开任务' },
      { role: 'normal', action: 'insert', expectedResult: true, description: '普通用户可以创建任务' },
      { role: 'normal', action: 'update', expectedResult: 'own', description: '普通用户只能更新自己创建的任务' },
      { role: 'normal', action: 'delete', expectedResult: 'own', description: '普通用户只能删除自己创建的任务' },
      
      { role: 'anonymous', action: 'select', expectedResult: 'public', description: '匿名用户只能查看公开任务' },
      { role: 'anonymous', action: 'insert', expectedResult: false, description: '匿名用户不能创建任务' },
      { role: 'anonymous', action: 'update', expectedResult: false, description: '匿名用户不能更新任务' },
      { role: 'anonymous', action: 'delete', expectedResult: false, description: '匿名用户不能删除任务' },
    ]
  },
  
  // 宝箱系统权限测试
  {
    table: 'treasure_boxes',
    tests: [
      { role: 'admin', action: 'select', expectedResult: true, description: '管理员可以查看所有宝箱' },
      { role: 'admin', action: 'insert', expectedResult: true, description: '管理员可以创建宝箱' },
      { role: 'admin', action: 'update', expectedResult: true, description: '管理员可以更新任何宝箱' },
      { role: 'admin', action: 'delete', expectedResult: true, description: '管理员可以删除宝箱' },
      
      { role: 'normal', action: 'select', expectedResult: true, description: '普通用户可以查看可用的宝箱' },
      { role: 'normal', action: 'insert', expectedResult: false, description: '普通用户不能创建宝箱' },
      { role: 'normal', action: 'update', expectedResult: 'claim', description: '普通用户只能认领宝箱' },
      { role: 'normal', action: 'delete', expectedResult: false, description: '普通用户不能删除宝箱' },
      
      { role: 'anonymous', action: 'select', expectedResult: true, description: '匿名用户可以查看宝箱信息' },
      { role: 'anonymous', action: 'insert', expectedResult: false, description: '匿名用户不能创建宝箱' },
      { role: 'anonymous', action: 'update', expectedResult: false, description: '匿名用户不能更新宝箱' },
      { role: 'anonymous', action: 'delete', expectedResult: false, description: '匿名用户不能删除宝箱' },
    ]
  }
];

// 创建测试用户
async function createTestUsers() {
  console.log(chalk.blue('创建测试用户...'));
  
  const users = {};
  
  // 创建管理员用户
  const { data: adminData, error: adminError } = await adminClient.auth.admin.createUser({
    email: testUsers.admin.email,
    password: testUsers.admin.password,
    user_metadata: { role: 'admin' },
    email_confirm: true
  });
  
  if (adminError) {
    console.error(chalk.red('创建管理员用户失败:'), adminError);
    process.exit(1);
  }
  
  users.admin = {
    id: adminData.user.id,
    email: adminData.user.email
  };
  
  // 创建普通用户
  const { data: normalData, error: normalError } = await adminClient.auth.admin.createUser({
    email: testUsers.normal.email,
    password: testUsers.normal.password,
    user_metadata: { role: 'user' },
    email_confirm: true
  });
  
  if (normalError) {
    console.error(chalk.red('创建普通用户失败:'), normalError);
    process.exit(1);
  }
  
  users.normal = {
    id: normalData.user.id,
    email: normalData.user.email
  };
  
  console.log(chalk.green('测试用户创建成功:'));
  console.log(`管理员: ${users.admin.email} (${users.admin.id})`);
  console.log(`普通用户: ${users.normal.email} (${users.normal.id})`);
  
  return users;
}

// 创建用户资料
async function createProfiles(users) {
  console.log(chalk.blue('创建用户资料...'));
  
  // 管理员资料
  const { error: adminProfileError } = await adminClient.from('profiles').insert({
    id: users.admin.id,
    username: 'admin_test',
    avatar_url: 'https://example.com/avatar1.png',
    bio: '管理员测试账户'
  });
  
  if (adminProfileError) {
    console.error(chalk.red('创建管理员资料失败:'), adminProfileError);
  }
  
  // 普通用户资料
  const { error: normalProfileError } = await adminClient.from('profiles').insert({
    id: users.normal.id,
    username: 'user_test',
    avatar_url: 'https://example.com/avatar2.png',
    bio: '普通用户测试账户'
  });
  
  if (normalProfileError) {
    console.error(chalk.red('创建普通用户资料失败:'), normalProfileError);
  }
  
  console.log(chalk.green('用户资料创建成功'));
}

// 创建测试数据
async function createTestData(users) {
  console.log(chalk.blue('创建测试数据...'));
  
  // 创建任务
  const { error: adminTaskError } = await adminClient.from('tasks').insert({
    title: 'Admin Test Task',
    description: '管理员创建的测试任务',
    creator_id: users.admin.id,
    status: 'open',
    reward_amount: 100,
    is_public: true
  });
  
  if (adminTaskError) {
    console.error(chalk.red('创建管理员任务失败:'), adminTaskError);
  }
  
  const { error: normalTaskError } = await adminClient.from('tasks').insert({
    title: 'User Test Task',
    description: '普通用户创建的测试任务',
    creator_id: users.normal.id,
    status: 'open',
    reward_amount: 50,
    is_public: true
  });
  
  if (normalTaskError) {
    console.error(chalk.red('创建普通用户任务失败:'), normalTaskError);
  }
  
  // 创建宝箱
  const { error: boxError } = await adminClient.from('treasure_boxes').insert({
    name: 'Test Box',
    description: '测试宝箱',
    creator_id: users.admin.id,
    tier_id: 1,
    status: 'active',
    is_public: true
  });
  
  if (boxError) {
    console.error(chalk.red('创建测试宝箱失败:'), boxError);
  }
  
  console.log(chalk.green('测试数据创建成功'));
}

// 获取用户客户端
async function getUserClients(users) {
  const clients = {
    admin: null,
    normal: null,
    anonymous: createClient(supabaseUrl, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY)
  };
  
  // 登录管理员
  const { data: adminData, error: adminError } = await adminClient.auth.admin.signInWithEmail({
    email: testUsers.admin.email,
    password: testUsers.admin.password
  });
  
  if (adminError) {
    console.error(chalk.red('管理员登录失败:'), adminError);
  } else {
    clients.admin = createClient(supabaseUrl, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY, {
      global: {
        headers: {
          Authorization: `Bearer ${adminData.session.access_token}`
        }
      }
    });
  }
  
  // 登录普通用户
  const { data: normalData, error: normalError } = await adminClient.auth.admin.signInWithEmail({
    email: testUsers.normal.email,
    password: testUsers.normal.password
  });
  
  if (normalError) {
    console.error(chalk.red('普通用户登录失败:'), normalError);
  } else {
    clients.normal = createClient(supabaseUrl, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY, {
      global: {
        headers: {
          Authorization: `Bearer ${normalData.session.access_token}`
        }
      }
    });
  }
  
  return clients;
}

// 运行权限测试
async function runPermissionTests(clients, users) {
  console.log(chalk.blue('开始权限测试...'));
  let totalTests = 0;
  let passedTests = 0;
  
  for (const tableTest of permissionTests) {
    console.log(chalk.yellow(`\n测试表: ${tableTest.table}`));
    
    for (const test of tableTest.tests) {
      totalTests++;
      let result = false;
      let error = null;
      
      try {
        switch (test.action) {
          case 'select':
            const { data, error: selectError } = await clients[test.role]
              .from(tableTest.table)
              .select('*')
              .limit(1);
            
            result = data && data.length > 0;
            error = selectError;
            break;
            
          case 'insert':
            let insertData;
            
            // 根据不同表生成不同的插入数据
            if (tableTest.table === 'profiles') {
              insertData = {
                id: faker.string.uuid(),
                name: faker.person.fullName(),
                avatar_url: faker.image.avatar(),
                user_id: test.role === 'admin' ? users.admin.id : test.role === 'normal' ? users.normal.id : null,
              };
            } else if (tableTest.table === 'tasks') {
              insertData = {
                id: faker.string.uuid(),
                title: faker.commerce.productName(),
                description: faker.commerce.productDescription(),
                status: 'pending',
                user_id: test.role === 'admin' ? users.admin.id : test.role === 'normal' ? users.normal.id : null,
              };
            } else if (tableTest.table === 'treasure_boxes') {
              insertData = {
                id: faker.string.uuid(),
                name: faker.commerce.productName(),
                description: faker.commerce.productDescription(),
                status: 'active',
                creator_id: test.role === 'admin' ? users.admin.id : test.role === 'normal' ? users.normal.id : null,
              };
            }
            
            const { data: insertResult, error: insertError } = await clients[test.role]
              .from(tableTest.table)
              .insert(insertData)
              .select();
              
            result = insertResult && insertResult.length > 0;
            error = insertError;
            break;
            
          case 'update':
            let updateData = {};
            let recordId;
            
            if (tableTest.table === 'profiles') {
              recordId = tableTest.data.id;
              updateData = { bio: '更新的测试资料' };
            } else if (tableTest.table === 'tasks') {
              recordId = tableTest.data.id;
              updateData = { description: '更新的测试任务' };
            } else if (tableTest.table === 'treasure_boxes') {
              recordId = tableTest.data.id;
              updateData = { description: '更新的测试宝箱' };
            }
            
            const { data: updateResult, error: updateError } = await clients[test.role]
              .from(tableTest.table)
              .update(updateData)
              .eq('id', recordId)
              .select();
              
            result = updateResult && updateResult.length > 0;
            error = updateError;
            break;
            
          case 'delete':
            if (test.expectedResult === 'own') {
              // 创建一个临时记录给用户删除
              const { data: tempData } = await adminClient
                .from(tableTest.table)
                .insert({
                  title: 'Temp Task',
                  description: '临时任务',
                  creator_id: users[test.role].id,
                  status: 'open',
                  reward_amount: 5,
                  is_public: true
                })
                .select();
                
              if (tempData && tempData.length > 0) {
                const { data: deleteData, error: deleteError } = await clients[test.role]
                  .from(tableTest.table)
                  .delete()
                  .eq('id', tempData[0].id)
                  .select();
                  
                result = deleteData && deleteData.length > 0;
                error = deleteError;
              }
            } else {
              const { data: deleteData, error: deleteError } = await clients[test.role]
                .from(tableTest.table)
                .delete()
                .limit(1)
                .select();
                
              result = deleteData && deleteData.length > 0;
              error = deleteError;
            }
            break;
        }
      } catch (e) {
        error = e;
        result = false;
      }
      
      // 判断测试结果
      let expectedResult = test.expectedResult;
      let passed = false;
      
      if (expectedResult === true) {
        passed = result === true;
      } else if (expectedResult === false) {
        passed = result === false;
      } else if (expectedResult === 'own' || expectedResult === 'claim' || expectedResult === 'public') {
        passed = result === true;
      }
      
      if (passed) {
        passedTests++;
        console.log(chalk.green(`✓ ${test.role} ${test.action} - ${test.description}`));
      } else {
        console.log(chalk.red(`✗ ${test.role} ${test.action} - ${test.description}`));
        if (error) {
          console.log(chalk.gray(`  错误信息: ${error.message || error}`));
        }
      }
    }
  }
  
  return { totalTests, passedTests };
}

// 清理测试数据
async function cleanupTestData(users) {
  console.log(chalk.blue('\n清理测试数据...'));
  
  // 删除创建的宝箱
  await adminClient
    .from('treasure_boxes')
    .delete()
    .eq('creator_id', users.admin.id);
    
  // 删除创建的任务
  await adminClient
    .from('tasks')
    .delete()
    .in('creator_id', [users.admin.id, users.normal.id]);
    
  // 删除用户资料
  await adminClient
    .from('profiles')
    .delete()
    .in('id', [users.admin.id, users.normal.id]);
    
  // 删除测试用户
  await adminClient.auth.admin.deleteUser(users.admin.id);
  await adminClient.auth.admin.deleteUser(users.normal.id);
  
  console.log(chalk.green('测试数据清理完成'));
}

// 主函数
async function main() {
  console.log(chalk.blue.bold('开始 Supabase 权限测试'));
  console.log(chalk.gray(`使用环境: ${process.env.NODE_ENV || 'development'}`));
  console.log(chalk.gray(`Supabase URL: ${supabaseUrl}`));
  
  try {
    // 创建测试用户
    const users = await createTestUsers();
    
    // 创建用户资料
    await createProfiles(users);
    
    // 创建测试数据
    await createTestData(users);
    
    // 获取用户客户端
    const clients = await getUserClients(users);
    
    // 运行权限测试
    const { totalTests, passedTests } = await runPermissionTests(clients, users);
    
    // 清理测试数据
    await cleanupTestData(users);
    
    // 测试结果统计
    console.log(chalk.blue.bold('\n测试结果摘要:'));
    console.log(`总测试数: ${totalTests}`);
    console.log(chalk.green(`通过测试: ${passedTests}`));
    console.log(chalk.red(`失败测试: ${totalTests - passedTests}`));
    
    const passRate = Math.round((passedTests / totalTests) * 100);
    console.log(`通过率: ${passRate}%`);
    
    if (passedTests === totalTests) {
      console.log(chalk.green.bold('\n所有权限测试通过！'));
    } else {
      console.log(chalk.yellow.bold('\n部分测试失败，请检查失败原因。'));
    }
    
  } catch (error) {
    console.error(chalk.red('测试过程中发生错误:'), error);
    process.exit(1);
  }
}

main(); 