-- 区块链数据同步系统表结构定义
-- 创建于: 2025-04-21
-- 描述: 用于跟踪和同步区块链事件的数据表结构

-- 创建事件处理记录表
CREATE TABLE IF NOT EXISTS blockchain_events (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  chain_id INTEGER NOT NULL,
  contract_address TEXT NOT NULL,
  event_name TEXT NOT NULL,
  transaction_hash TEXT NOT NULL,
  block_number BIGINT NOT NULL,
  log_index INTEGER NOT NULL,
  event_data JSONB,
  processed BOOLEAN DEFAULT false,
  processed_at TIMESTAMP WITH TIME ZONE,
  error TEXT,
  retry_count INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  
  -- 添加唯一约束，防止重复处理同一事件
  UNIQUE(chain_id, transaction_hash, log_index)
);

-- 添加索引以加速查询
CREATE INDEX IF NOT EXISTS blockchain_events_contract_idx 
ON blockchain_events(contract_address, event_name);

CREATE INDEX IF NOT EXISTS blockchain_events_block_idx 
ON blockchain_events(chain_id, block_number);

CREATE INDEX IF NOT EXISTS blockchain_events_processed_idx 
ON blockchain_events(processed);

-- 创建同步状态表，记录每个合约的同步状态
CREATE TABLE IF NOT EXISTS sync_status (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  chain_id INTEGER NOT NULL,
  contract_address TEXT NOT NULL,
  event_name TEXT NOT NULL,
  last_block BIGINT DEFAULT 0,
  last_sync_time TIMESTAMP WITH TIME ZONE DEFAULT now(),
  status TEXT DEFAULT 'active', -- active, paused, error
  error TEXT,
  sync_interval INTEGER DEFAULT 60, -- 同步间隔，单位秒
  
  -- 添加唯一约束
  UNIQUE(chain_id, contract_address, event_name)
);

-- 为blockchain_events表启用RLS
ALTER TABLE blockchain_events ENABLE ROW LEVEL SECURITY;

-- RLS策略：只有服务账户可以查看和修改事件
CREATE POLICY "blockchain_events_service_select" ON blockchain_events
  FOR SELECT USING (
    -- 仅服务账户可查看，在实际应用中需要补充服务账户验证逻辑
    current_user = 'service_role' OR
    current_user = 'postgres'
  );

CREATE POLICY "blockchain_events_service_insert" ON blockchain_events
  FOR INSERT WITH CHECK (
    -- 仅服务账户可插入，在实际应用中需要补充服务账户验证逻辑
    current_user = 'service_role' OR
    current_user = 'postgres'
  );

CREATE POLICY "blockchain_events_service_update" ON blockchain_events
  FOR UPDATE USING (
    -- 仅服务账户可更新，在实际应用中需要补充服务账户验证逻辑
    current_user = 'service_role' OR
    current_user = 'postgres'
  );

-- 为sync_status表启用RLS
ALTER TABLE sync_status ENABLE ROW LEVEL SECURITY;

-- RLS策略：只有服务账户可以查看和修改同步状态
CREATE POLICY "sync_status_service_select" ON sync_status
  FOR SELECT USING (
    -- 仅服务账户可查看，在实际应用中需要补充服务账户验证逻辑
    current_user = 'service_role' OR
    current_user = 'postgres'
  );

CREATE POLICY "sync_status_service_insert" ON sync_status
  FOR INSERT WITH CHECK (
    -- 仅服务账户可插入，在实际应用中需要补充服务账户验证逻辑
    current_user = 'service_role' OR
    current_user = 'postgres'
  );

CREATE POLICY "sync_status_service_update" ON sync_status
  FOR UPDATE USING (
    -- 仅服务账户可更新，在实际应用中需要补充服务账户验证逻辑
    current_user = 'service_role' OR
    current_user = 'postgres'
  );

-- 创建仅可查询视图，供前端使用的事件统计信息
CREATE OR REPLACE VIEW event_statistics AS
SELECT
  chain_id,
  contract_address,
  event_name,
  COUNT(*) AS total_events,
  SUM(CASE WHEN processed THEN 1 ELSE 0 END) AS processed_events,
  SUM(CASE WHEN NOT processed AND error IS NULL THEN 1 ELSE 0 END) AS pending_events,
  SUM(CASE WHEN error IS NOT NULL THEN 1 ELSE 0 END) AS error_events,
  MAX(block_number) AS latest_block,
  MAX(created_at) AS latest_event_time
FROM blockchain_events
GROUP BY chain_id, contract_address, event_name;

-- 用于验证钱包地址的函数
CREATE OR REPLACE FUNCTION validate_wallet_address(address TEXT)
RETURNS BOOLEAN AS $$
BEGIN
  -- 简单验证地址格式（以太坊地址示例）
  RETURN address ~ '^0x[a-fA-F0-9]{40}$';
END;
$$ LANGUAGE plpgsql; 