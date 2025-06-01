-- 任务系统表结构定义
-- 创建于: 2025-04-21
-- 描述: 任务系统相关的数据表结构，包括任务配置、任务提交记录等

-- 任务状态枚举
CREATE TYPE IF NOT EXISTS task_status AS ENUM (
  'draft',      -- 草稿
  'open',       -- 公开可接受
  'assigned',   -- 已分配
  'in_progress', -- 进行中
  'submitted',  -- 已提交
  'completed',  -- 已完成
  'cancelled',  -- 已取消
  'dispute'     -- 有争议
);

-- 如果存在旧的任务表，先删除其外键约束以避免冲突
ALTER TABLE IF EXISTS task_submissions DROP CONSTRAINT IF EXISTS task_submissions_task_id_fkey;

-- 创建/调整任务表
CREATE TABLE IF NOT EXISTS tasks (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title TEXT NOT NULL,
  description TEXT,
  creator_id UUID REFERENCES auth.users(id),
  worker_id UUID REFERENCES auth.users(id),
  status task_status DEFAULT 'open',
  reward_amount NUMERIC,
  reward_token TEXT, -- 代币合约地址
  deadline TIMESTAMP WITH TIME ZONE,
  category TEXT,
  tags TEXT[],
  requirements TEXT,
  visibility TEXT DEFAULT 'public', -- public, private, invite_only
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  external_id TEXT, -- 链上任务ID
  chain_id INTEGER, -- 链ID
  metadata JSONB -- 存储任务的额外信息
);

-- 创建任务提交记录表
CREATE TABLE IF NOT EXISTS task_submissions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  task_id UUID REFERENCES tasks(id),
  submitter_id UUID REFERENCES auth.users(id) NOT NULL,
  content TEXT,
  attachments TEXT[],
  status TEXT DEFAULT 'pending', -- pending, approved, rejected
  feedback TEXT,
  rating INTEGER,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  transaction_hash TEXT, -- 链上交易哈希
  metadata JSONB -- 存储提交的额外信息
);

-- 创建任务应用表（记录用户申请接任务的信息）
CREATE TABLE IF NOT EXISTS task_applications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  task_id UUID REFERENCES tasks(id) NOT NULL,
  applicant_id UUID REFERENCES auth.users(id) NOT NULL,
  proposal TEXT,
  status TEXT DEFAULT 'pending', -- pending, accepted, rejected
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  
  -- 确保一个用户只能对一个任务提交一次申请
  UNIQUE(task_id, applicant_id)
);

-- 为tasks表启用RLS
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;

-- RLS策略：公开任务可以被任何人查看
CREATE POLICY "tasks_public_view" ON tasks
  FOR SELECT USING (visibility = 'public');

-- RLS策略：私有任务只能被创建者和工作者查看
CREATE POLICY "tasks_private_view" ON tasks
  FOR SELECT USING (
    visibility = 'private' AND
    (auth.uid() = creator_id OR auth.uid() = worker_id)
  );

-- RLS策略：已认证用户可以创建任务
CREATE POLICY "tasks_authenticated_insert" ON tasks
  FOR INSERT WITH CHECK (auth.uid() = creator_id);

-- RLS策略：任务创建者可以修改任务
CREATE POLICY "tasks_creator_update" ON tasks
  FOR UPDATE USING (auth.uid() = creator_id);

-- RLS策略：任务创建者可以删除任务
CREATE POLICY "tasks_creator_delete" ON tasks
  FOR DELETE USING (auth.uid() = creator_id);

-- 为task_submissions表启用RLS
ALTER TABLE task_submissions ENABLE ROW LEVEL SECURITY;

-- RLS策略：任务创建者和提交者可以查看提交记录
CREATE POLICY "task_submissions_view" ON task_submissions
  FOR SELECT USING (
    auth.uid() IN (
      SELECT creator_id FROM tasks WHERE id = task_id
      UNION
      SELECT submitter_id FROM task_submissions WHERE id = task_submissions.id
    )
  );

-- RLS策略：已认证用户可以为自己的任务提交记录
CREATE POLICY "task_submissions_insert" ON task_submissions
  FOR INSERT WITH CHECK (auth.uid() = submitter_id);

-- RLS策略：提交者可以更新自己的提交
CREATE POLICY "task_submissions_submitter_update" ON task_submissions
  FOR UPDATE USING (auth.uid() = submitter_id);

-- RLS策略：任务创建者可以更新提交状态
CREATE POLICY "task_submissions_creator_update" ON task_submissions
  FOR UPDATE USING (
    auth.uid() IN (
      SELECT creator_id FROM tasks WHERE id = task_id
    )
  );

-- 为task_applications表启用RLS
ALTER TABLE task_applications ENABLE ROW LEVEL SECURITY;

-- RLS策略：任务创建者可以查看所有申请
CREATE POLICY "task_applications_creator_view" ON task_applications
  FOR SELECT USING (
    auth.uid() IN (
      SELECT creator_id FROM tasks WHERE id = task_id
    )
  );

-- RLS策略：申请者可以查看自己的申请
CREATE POLICY "task_applications_applicant_view" ON task_applications
  FOR SELECT USING (auth.uid() = applicant_id);

-- RLS策略：已认证用户可以为任务申请
CREATE POLICY "task_applications_insert" ON task_applications
  FOR INSERT WITH CHECK (auth.uid() = applicant_id);

-- RLS策略：申请者可以更新自己的申请
CREATE POLICY "task_applications_applicant_update" ON task_applications
  FOR UPDATE USING (auth.uid() = applicant_id);

-- RLS策略：任务创建者可以更新申请状态
CREATE POLICY "task_applications_creator_update" ON task_applications
  FOR UPDATE USING (
    auth.uid() IN (
      SELECT creator_id FROM tasks WHERE id = task_id
    )
  );

-- 为表添加索引以提高查询性能
CREATE INDEX IF NOT EXISTS tasks_creator_id_idx ON tasks(creator_id);
CREATE INDEX IF NOT EXISTS tasks_worker_id_idx ON tasks(worker_id);
CREATE INDEX IF NOT EXISTS tasks_status_idx ON tasks(status);
CREATE INDEX IF NOT EXISTS tasks_created_at_idx ON tasks(created_at);
CREATE INDEX IF NOT EXISTS tasks_category_idx ON tasks(category);
CREATE INDEX IF NOT EXISTS tasks_visibility_idx ON tasks(visibility);

CREATE INDEX IF NOT EXISTS task_submissions_task_id_idx ON task_submissions(task_id);
CREATE INDEX IF NOT EXISTS task_submissions_submitter_id_idx ON task_submissions(submitter_id);
CREATE INDEX IF NOT EXISTS task_submissions_status_idx ON task_submissions(status);

CREATE INDEX IF NOT EXISTS task_applications_task_id_idx ON task_applications(task_id);
CREATE INDEX IF NOT EXISTS task_applications_applicant_id_idx ON task_applications(applicant_id);
CREATE INDEX IF NOT EXISTS task_applications_status_idx ON task_applications(status); 