# Supabase 集成指南

这个文档提供了关于 SocioMint 项目中 Supabase 集成的全面指南，包括设置说明、数据库结构和常见操作的指导。

## 目录

1. [基础设置](#基础设置)
2. [数据库结构](#数据库结构)
3. [认证系统](#认证系统)
4. [区块链同步](#区块链同步)
5. [权限和安全策略](#权限和安全策略)
6. [客户端API使用](#客户端API使用)
7. [常见问题和故障排除](#常见问题和故障排除)

## 基础设置

### 环境变量

项目需要以下环境变量才能连接到 Supabase：

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```

这些变量应在项目根目录的 `.env.local` 文件中设置，并且可以从 Supabase 控制面板获取。

### Supabase 客户端设置

Supabase 客户端在 `src/lib/supabase.ts` 文件中设置。使用示例：

```typescript
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
```

### 安装和初始化

要使用 Supabase CLI 进行本地开发：

1. 安装 Supabase CLI:
```bash
npm install -g supabase
```

2. 登录:
```bash
supabase login
```

3. 初始化:
```bash
supabase init
```

4. 链接到远程项目:
```bash
supabase link --project-ref your-project-id
```

## 数据库结构

SocioMint 的数据库包含以下主要表：

### 用户系统

**profiles**
```sql
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  username text unique,
  full_name text,
  avatar_url text,
  bio text,
  website text,
  email text,
  updated_at timestamp with time zone default now()
);
```

**wallet_connections**
```sql
create table if not exists public.wallet_connections (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  address text not null,
  chain text not null default 'ethereum',
  created_at timestamp with time zone default now(),
  unique(user_id, address, chain)
);
```

**social_connections**
```sql
create table if not exists public.social_connections (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  provider text not null,
  provider_id text not null,
  username text,
  created_at timestamp with time zone default now(),
  unique(user_id, provider, provider_id)
);
```

### 任务系统

**tasks**
```sql
create table if not exists public.tasks (
  id uuid primary key default uuid_generate_v4(),
  creator_id uuid references public.profiles(id),
  title text not null,
  description text,
  reward_amount numeric(78,0),
  reward_token text,
  max_participants integer,
  deadline timestamp with time zone,
  status text default 'open',
  requirements jsonb,
  chain_id text,
  contract_address text,
  task_id integer,
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);
```

**task_submissions**
```sql
create table if not exists public.task_submissions (
  id uuid primary key default uuid_generate_v4(),
  task_id uuid references public.tasks(id) on delete cascade,
  user_id uuid references public.profiles(id) on delete cascade,
  content text,
  status text default 'pending',
  feedback text,
  submitted_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);
```

### 区块链同步

**blockchain_events**
```sql
create table if not exists public.blockchain_events (
  id uuid primary key default uuid_generate_v4(),
  contract_address text not null,
  event_name text not null,
  transaction_hash text not null,
  block_number integer not null,
  log_index integer not null,
  chain_id text not null,
  payload jsonb not null,
  processed boolean default false,
  created_at timestamp with time zone default now(),
  unique(transaction_hash, log_index, chain_id)
);
```

**sync_status**
```sql
create table if not exists public.sync_status (
  id uuid primary key default uuid_generate_v4(),
  contract_address text not null,
  chain_id text not null,
  last_block_number integer not null,
  updated_at timestamp with time zone default now(),
  unique(contract_address, chain_id)
);
```

## 认证系统

SocioMint 支持以下认证方法：

1. **邮箱/密码登录**：使用 Supabase 内置的认证系统。
2. **钱包登录**：通过以太坊钱包签名进行验证。
3. **社交账号连接**：支持 Twitter、Discord 等社交账号连接。

### 用户注册触发器

当新用户注册时，系统会自动创建用户的 profile：

```sql
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, email)
  values (new.id, new.email);
  return new;
end;
$$ language plpgsql security definer;

create or replace trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();
```

### 钱包验证

验证用户钱包签名的流程：

1. 前端生成随机消息，发送给用户钱包签名
2. 用户使用钱包签名消息
3. 前端将签名和原始消息发送到后端
4. 后端验证签名，确认钱包所有权
5. 如果验证成功，将钱包地址关联到用户账户

## 区块链同步

区块链同步服务 (`blockchainSyncService.ts`) 负责：

1. 监听区块链上的智能合约事件
2. 将事件数据存储到 Supabase 数据库
3. 处理各种事件类型，如宝箱创建、任务分配等
4. 跟踪同步状态，避免重复处理

### 主要事件类型

- **BoxCreated**: 当新宝箱被创建时触发
- **BoxOpened**: 当宝箱被打开时触发
- **TaskCreated**: 当新任务被创建时触发
- **TaskCompleted**: 当任务被完成时触发

## 权限和安全策略

Supabase 使用行级安全 (RLS) 政策来保护数据。以下是主要的 RLS 策略：

### 个人资料表

```sql
-- 允许已认证用户查看所有个人资料
alter table public.profiles
  enable row level security;

create policy "Allow individuals to view all profiles"
  on profiles for select
  to authenticated
  using (true);

-- 仅允许用户更新自己的个人资料
create policy "Allow individuals to update their own profile"
  on profiles for update
  to authenticated
  using (auth.uid() = id);
```

### 钱包连接表

```sql
-- 允许已认证用户查看所有钱包连接
alter table public.wallet_connections
  enable row level security;

create policy "Allow authenticated users to view all wallet connections"
  on wallet_connections for select
  to authenticated
  using (true);

-- 仅允许用户管理自己的钱包连接
create policy "Allow users to manage their own wallet connections"
  on wallet_connections for all
  to authenticated
  using (auth.uid() = user_id);
```

### 任务表

```sql
-- 允许所有人查看任务
alter table public.tasks
  enable row level security;

create policy "Tasks are viewable by everyone"
  on tasks for select
  using (true);

-- 只有创建者可以更新任务
create policy "Tasks can only be updated by creator"
  on tasks for update
  to authenticated
  using (auth.uid() = creator_id);
```

## 客户端API使用

### 获取用户资料

```typescript
import { supabase } from '@/lib/supabase';

const getProfile = async (userId: string) => {
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .single();
  
  if (error) throw error;
  return data;
};
```

### 更新用户资料

```typescript
import { supabase } from '@/lib/supabase';

const updateProfile = async (userId: string, updates: any) => {
  const { data, error } = await supabase
    .from('profiles')
    .update(updates)
    .eq('id', userId);
  
  if (error) throw error;
  return data;
};
```

### 获取任务列表

```typescript
import { supabase } from '@/lib/supabase';

const getTasks = async () => {
  const { data, error } = await supabase
    .from('tasks')
    .select('*')
    .order('created_at', { ascending: false });
  
  if (error) throw error;
  return data;
};
```

### 提交任务

```typescript
import { supabase } from '@/lib/supabase';

const submitTask = async (taskId: string, userId: string, content: string) => {
  const { data, error } = await supabase
    .from('task_submissions')
    .insert({
      task_id: taskId,
      user_id: userId,
      content,
      status: 'pending'
    });
  
  if (error) throw error;
  return data;
};
```

## 常见问题和故障排除

### 问题: 无法连接到 Supabase

**解决方案:**
1. 检查环境变量是否正确设置
2. 确认项目 URL 和 Anon Key 是否正确
3. 检查网络连接

### 问题: RLS 策略阻止数据访问

**解决方案:**
1. 检查用户认证状态
2. 验证 RLS 策略配置
3. 使用 Supabase 控制台的 SQL 编辑器临时禁用 RLS 进行测试:
```sql
alter table [table_name] disable row level security;
```

### 问题: 迁移文件未被应用

**解决方案:**
1. 确认迁移文件位置正确
2. 手动应用迁移文件:
   - 通过 Supabase 控制台 SQL 编辑器执行 SQL 代码
   - 或修复 `supabase db push` 命令问题

### 问题: 区块链同步服务没有捕获事件

**解决方案:**
1. 确认合约 ABI 定义正确
2. 检查同步起始块号设置
3. 验证网络连接和 RPC 端点状态 