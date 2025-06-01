/**
 * Supabase 数据库设置脚本
 * 
 * 该脚本用于创建和设置 Supabase 数据库表和函数。
 * 运行方式：node scripts/setup-supabase.js
 */

require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

// Supabase 客户端
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('错误: 缺少 Supabase 配置。请确保 .env 文件中包含 NEXT_PUBLIC_SUPABASE_URL 和 SUPABASE_SERVICE_ROLE_KEY。');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

/**
 * 创建用户表
 */
async function createUsersTable() {
  console.log('创建用户表...');
  
  try {
    const { error } = await supabase.rpc('create_users_table', {});
    
    if (error) {
      console.error('创建用户表失败:', error);
      return false;
    }
    
    console.log('用户表创建成功');
    return true;
  } catch (err) {
    console.error('创建用户表时出错:', err);
    return false;
  }
}

/**
 * 创建多签钱包交易表
 */
async function createMultisigTransactionsTable() {
  console.log('创建多签钱包交易表...');
  
  try {
    const { error } = await supabase
      .from('multisig_transactions')
      .select('*')
      .limit(1);
    
    if (error && error.code === '42P01') {
      // 表不存在，创建表
      const { error: createError } = await supabase.rpc('create_multisig_transactions_table', {});
      
      if (createError) {
        console.error('创建多签钱包交易表失败:', createError);
        return false;
      }
      
      console.log('多签钱包交易表创建成功');
      return true;
    } else if (error) {
      console.error('检查多签钱包交易表失败:', error);
      return false;
    }
    
    console.log('多签钱包交易表已存在');
    return true;
  } catch (err) {
    console.error('创建多签钱包交易表时出错:', err);
    return false;
  }
}

/**
 * 创建小红花兑换表
 */
async function createXiaohonghuaExchangeTable() {
  console.log('创建小红花兑换表...');
  
  try {
    const { error } = await supabase
      .from('xiaohonghua_exchanges')
      .select('*')
      .limit(1);
    
    if (error && error.code === '42P01') {
      // 表不存在，创建表
      const { error: createError } = await supabase.rpc('create_xiaohonghua_exchanges_table', {});
      
      if (createError) {
        console.error('创建小红花兑换表失败:', createError);
        return false;
      }
      
      console.log('小红花兑换表创建成功');
      return true;
    } else if (error) {
      console.error('检查小红花兑换表失败:', error);
      return false;
    }
    
    console.log('小红花兑换表已存在');
    return true;
  } catch (err) {
    console.error('创建小红花兑换表时出错:', err);
    return false;
  }
}

/**
 * 创建错误日志表
 */
async function createErrorLogsTable() {
  console.log('创建错误日志表...');
  
  try {
    const { error } = await supabase
      .from('error_logs')
      .select('*')
      .limit(1);
    
    if (error && error.code === '42P01') {
      // 表不存在，创建表
      const { error: createError } = await supabase.rpc('create_error_logs_table', {});
      
      if (createError) {
        console.error('创建错误日志表失败:', createError);
        return false;
      }
      
      console.log('错误日志表创建成功');
      return true;
    } else if (error) {
      console.error('检查错误日志表失败:', error);
      return false;
    }
    
    console.log('错误日志表已存在');
    return true;
  } catch (err) {
    console.error('创建错误日志表时出错:', err);
    return false;
  }
}

/**
 * 创建应用日志表
 */
async function createApplicationLogsTable() {
  console.log('创建应用日志表...');
  
  try {
    const { error } = await supabase
      .from('application_logs')
      .select('*')
      .limit(1);
    
    if (error && error.code === '42P01') {
      // 表不存在，创建表
      const { error: createError } = await supabase.rpc('create_application_logs_table', {});
      
      if (createError) {
        console.error('创建应用日志表失败:', createError);
        return false;
      }
      
      console.log('应用日志表创建成功');
      return true;
    } else if (error) {
      console.error('检查应用日志表失败:', error);
      return false;
    }
    
    console.log('应用日志表已存在');
    return true;
  } catch (err) {
    console.error('创建应用日志表时出错:', err);
    return false;
  }
}

/**
 * 创建区块链事件表
 */
async function createBlockchainEventsTable() {
  console.log('创建区块链事件表...');
  
  try {
    const { error } = await supabase
      .from('blockchain_events')
      .select('*')
      .limit(1);
    
    if (error && error.code === '42P01') {
      // 表不存在，创建表
      const { error: createError } = await supabase.rpc('create_blockchain_events_table', {});
      
      if (createError) {
        console.error('创建区块链事件表失败:', createError);
        return false;
      }
      
      console.log('区块链事件表创建成功');
      return true;
    } else if (error) {
      console.error('检查区块链事件表失败:', error);
      return false;
    }
    
    console.log('区块链事件表已存在');
    return true;
  } catch (err) {
    console.error('创建区块链事件表时出错:', err);
    return false;
  }
}

/**
 * 创建任务表
 */
async function createTasksTable() {
  console.log('创建任务表...');
  
  try {
    const { error } = await supabase
      .from('tasks')
      .select('*')
      .limit(1);
    
    if (error && error.code === '42P01') {
      // 表不存在，创建表
      const { error: createError } = await supabase.rpc('create_tasks_table', {});
      
      if (createError) {
        console.error('创建任务表失败:', createError);
        return false;
      }
      
      console.log('任务表创建成功');
      return true;
    } else if (error) {
      console.error('检查任务表失败:', error);
      return false;
    }
    
    console.log('任务表已存在');
    return true;
  } catch (err) {
    console.error('创建任务表时出错:', err);
    return false;
  }
}

/**
 * 创建存储过程
 */
async function createStoredProcedures() {
  console.log('创建存储过程...');
  
  try {
    // 创建UUID扩展
    const { error: error1 } = await supabase.rpc('create_extension', { extension_name: 'uuid-ossp' });
    if (error1 && !error1.message.includes('already exists')) {
      console.error('创建UUID扩展失败:', error1);
    }
    
    // 创建用户表存储过程
    const createUsersTableSQL = `
    CREATE OR REPLACE FUNCTION create_users_table()
    RETURNS void AS $$
    BEGIN
      CREATE TABLE IF NOT EXISTS public.users (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        user_id TEXT UNIQUE NOT NULL,
        wallet_address TEXT,
        xiaohonghua_balance INTEGER DEFAULT 0,
        sm_balance_offchain NUMERIC DEFAULT 0,
        is_wallet_verified BOOLEAN DEFAULT FALSE,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );
      
      -- 创建更新时间触发器
      CREATE OR REPLACE FUNCTION update_updated_at_column()
      RETURNS TRIGGER AS $$
      BEGIN
        NEW.updated_at = NOW();
        RETURN NEW;
      END;
      $$ LANGUAGE plpgsql;
      
      DROP TRIGGER IF EXISTS update_users_updated_at ON public.users;
      CREATE TRIGGER update_users_updated_at
      BEFORE UPDATE ON public.users
      FOR EACH ROW
      EXECUTE FUNCTION update_updated_at_column();
    END;
    $$ LANGUAGE plpgsql;
    `;
    
    // 创建多签钱包交易表存储过程
    const createMultisigTransactionsTableSQL = `
    CREATE OR REPLACE FUNCTION create_multisig_transactions_table()
    RETURNS void AS $$
    BEGIN
      CREATE TABLE IF NOT EXISTS public.multisig_transactions (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        transaction_id INTEGER NOT NULL,
        destination TEXT NOT NULL,
        value TEXT NOT NULL,
        data TEXT NOT NULL,
        type TEXT NOT NULL,
        status TEXT NOT NULL,
        description TEXT,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );
      
      -- 创建更新时间触发器
      DROP TRIGGER IF EXISTS update_multisig_transactions_updated_at ON public.multisig_transactions;
      CREATE TRIGGER update_multisig_transactions_updated_at
      BEFORE UPDATE ON public.multisig_transactions
      FOR EACH ROW
      EXECUTE FUNCTION update_updated_at_column();
    END;
    $$ LANGUAGE plpgsql;
    `;
    
    // 创建小红花兑换表存储过程
    const createXiaohonghuaExchangesTableSQL = `
    CREATE OR REPLACE FUNCTION create_xiaohonghua_exchanges_table()
    RETURNS void AS $$
    BEGIN
      CREATE TABLE IF NOT EXISTS public.xiaohonghua_exchanges (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        user_id TEXT NOT NULL,
        xiaohonghua_amount INTEGER NOT NULL,
        sm_amount NUMERIC NOT NULL,
        exchange_rate NUMERIC NOT NULL,
        status TEXT NOT NULL,
        tx_hash TEXT,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );
      
      -- 创建更新时间触发器
      DROP TRIGGER IF EXISTS update_xiaohonghua_exchanges_updated_at ON public.xiaohonghua_exchanges;
      CREATE TRIGGER update_xiaohonghua_exchanges_updated_at
      BEFORE UPDATE ON public.xiaohonghua_exchanges
      FOR EACH ROW
      EXECUTE FUNCTION update_updated_at_column();
    END;
    $$ LANGUAGE plpgsql;
    `;
    
    // 创建错误日志表存储过程
    const createErrorLogsTableSQL = `
    CREATE OR REPLACE FUNCTION create_error_logs_table()
    RETURNS void AS $$
    BEGIN
      CREATE TABLE IF NOT EXISTS public.error_logs (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        message TEXT NOT NULL,
        stack TEXT,
        severity TEXT NOT NULL,
        context JSONB,
        error_id TEXT NOT NULL,
        environment TEXT NOT NULL,
        user_agent TEXT,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );
      
      -- 创建索引
      CREATE INDEX IF NOT EXISTS error_logs_severity_idx ON public.error_logs (severity);
      CREATE INDEX IF NOT EXISTS error_logs_error_id_idx ON public.error_logs (error_id);
      CREATE INDEX IF NOT EXISTS error_logs_created_at_idx ON public.error_logs (created_at);
    END;
    $$ LANGUAGE plpgsql;
    `;
    
    // 创建应用日志表存储过程
    const createApplicationLogsTableSQL = `
    CREATE OR REPLACE FUNCTION create_application_logs_table()
    RETURNS void AS $$
    BEGIN
      CREATE TABLE IF NOT EXISTS public.application_logs (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        level TEXT NOT NULL,
        message TEXT NOT NULL,
        context JSONB,
        environment TEXT NOT NULL,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );
      
      -- 创建索引
      CREATE INDEX IF NOT EXISTS application_logs_level_idx ON public.application_logs (level);
      CREATE INDEX IF NOT EXISTS application_logs_created_at_idx ON public.application_logs (created_at);
    END;
    $$ LANGUAGE plpgsql;
    `;
    
    // 创建区块链事件表存储过程
    const createBlockchainEventsTableSQL = `
    CREATE OR REPLACE FUNCTION create_blockchain_events_table()
    RETURNS void AS $$
    BEGIN
      CREATE TABLE IF NOT EXISTS public.blockchain_events (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        event_type TEXT NOT NULL,
        transaction_hash TEXT NOT NULL,
        block_number INTEGER NOT NULL,
        timestamp INTEGER NOT NULL,
        contract_address TEXT NOT NULL,
        event_name TEXT NOT NULL,
        event_data JSONB NOT NULL,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );
      
      -- 创建索引
      CREATE INDEX IF NOT EXISTS blockchain_events_event_type_idx ON public.blockchain_events (event_type);
      CREATE INDEX IF NOT EXISTS blockchain_events_transaction_hash_idx ON public.blockchain_events (transaction_hash);
      CREATE INDEX IF NOT EXISTS blockchain_events_contract_address_idx ON public.blockchain_events (contract_address);
      CREATE INDEX IF NOT EXISTS blockchain_events_created_at_idx ON public.blockchain_events (created_at);
    END;
    $$ LANGUAGE plpgsql;
    `;
    
    // 创建任务表存储过程
    const createTasksTableSQL = `
    CREATE OR REPLACE FUNCTION create_tasks_table()
    RETURNS void AS $$
    BEGIN
      CREATE TABLE IF NOT EXISTS public.tasks (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        title TEXT NOT NULL,
        description TEXT,
        platform TEXT NOT NULL,
        action TEXT NOT NULL,
        reward INTEGER NOT NULL,
        total INTEGER NOT NULL,
        creator_id TEXT NOT NULL,
        is_active BOOLEAN DEFAULT TRUE,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );
      
      -- 创建任务完成表
      CREATE TABLE IF NOT EXISTS public.task_completions (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        task_id UUID REFERENCES public.tasks(id),
        user_id TEXT NOT NULL,
        proof TEXT,
        status TEXT NOT NULL,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );
      
      -- 创建更新时间触发器
      DROP TRIGGER IF EXISTS update_tasks_updated_at ON public.tasks;
      CREATE TRIGGER update_tasks_updated_at
      BEFORE UPDATE ON public.tasks
      FOR EACH ROW
      EXECUTE FUNCTION update_updated_at_column();
      
      DROP TRIGGER IF EXISTS update_task_completions_updated_at ON public.task_completions;
      CREATE TRIGGER update_task_completions_updated_at
      BEFORE UPDATE ON public.task_completions
      FOR EACH ROW
      EXECUTE FUNCTION update_updated_at_column();
      
      -- 创建索引
      CREATE INDEX IF NOT EXISTS tasks_platform_idx ON public.tasks (platform);
      CREATE INDEX IF NOT EXISTS tasks_action_idx ON public.tasks (action);
      CREATE INDEX IF NOT EXISTS tasks_creator_id_idx ON public.tasks (creator_id);
      CREATE INDEX IF NOT EXISTS task_completions_task_id_idx ON public.task_completions (task_id);
      CREATE INDEX IF NOT EXISTS task_completions_user_id_idx ON public.task_completions (user_id);
      CREATE INDEX IF NOT EXISTS task_completions_status_idx ON public.task_completions (status);
    END;
    $$ LANGUAGE plpgsql;
    `;
    
    // 创建SQL执行函数
    const createExecSqlFunction = `
    CREATE OR REPLACE FUNCTION exec_sql(sql text) RETURNS void AS $$
    BEGIN
      EXECUTE sql;
    END;
    $$ LANGUAGE plpgsql SECURITY DEFINER;
    `;
    
    // 创建扩展函数
    const createExtensionFunction = `
    CREATE OR REPLACE FUNCTION create_extension(extension_name text) RETURNS void AS $$
    BEGIN
      EXECUTE 'CREATE EXTENSION IF NOT EXISTS ' || quote_ident(extension_name);
    END;
    $$ LANGUAGE plpgsql SECURITY DEFINER;
    `;
    
    // 执行SQL
    const { error: error2 } = await supabase.rpc('exec_sql', { sql: createExecSqlFunction });
    if (error2) {
      // 如果函数不存在，先创建它
      await supabase.sql(`
        CREATE OR REPLACE FUNCTION exec_sql(sql text) RETURNS void AS $$
        BEGIN
          EXECUTE sql;
        END;
        $$ LANGUAGE plpgsql SECURITY DEFINER;
      `);
    }
    
    const { error: error3 } = await supabase.rpc('exec_sql', { sql: createExtensionFunction });
    if (error3) {
      await supabase.sql(`
        CREATE OR REPLACE FUNCTION create_extension(extension_name text) RETURNS void AS $$
        BEGIN
          EXECUTE 'CREATE EXTENSION IF NOT EXISTS ' || quote_ident(extension_name);
        END;
        $$ LANGUAGE plpgsql SECURITY DEFINER;
      `);
    }
    
    // 创建UUID扩展
    await supabase.rpc('create_extension', { extension_name: 'uuid-ossp' });
    
    // 执行存储过程创建
    await supabase.rpc('exec_sql', { sql: createUsersTableSQL });
    await supabase.rpc('exec_sql', { sql: createMultisigTransactionsTableSQL });
    await supabase.rpc('exec_sql', { sql: createXiaohonghuaExchangesTableSQL });
    await supabase.rpc('exec_sql', { sql: createErrorLogsTableSQL });
    await supabase.rpc('exec_sql', { sql: createApplicationLogsTableSQL });
    await supabase.rpc('exec_sql', { sql: createBlockchainEventsTableSQL });
    await supabase.rpc('exec_sql', { sql: createTasksTableSQL });
    
    console.log('存储过程创建成功');
    return true;
  } catch (err) {
    console.error('创建存储过程时出错:', err);
    return false;
  }
}

/**
 * 主函数
 */
async function main() {
  console.log('开始设置 Supabase 数据库...');
  
  try {
    // 创建存储过程
    await createStoredProcedures();
    
    // 创建表
    await createUsersTable();
    await createMultisigTransactionsTable();
    await createXiaohonghuaExchangeTable();
    await createErrorLogsTable();
    await createApplicationLogsTable();
    await createBlockchainEventsTable();
    await createTasksTable();
    
    console.log('Supabase 数据库设置完成');
  } catch (error) {
    console.error('设置 Supabase 数据库时出错:', error);
    process.exit(1);
  }
}

// 执行主函数
main();
