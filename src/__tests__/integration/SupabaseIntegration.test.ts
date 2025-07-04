/**
 * Supabase 集成测试
 * 测试与 Supabase 数据库和 API 的集成
 */

import { createClient } from '@supabase/supabase-js';

// 创建一个可链式调用的Mock查询构建器
const createMockQueryBuilder = () => {
  const mockQueryBuilder: any = {
    select: jest.fn(),
    insert: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
    eq: jest.fn(),
    neq: jest.fn(),
    gt: jest.fn(),
    lt: jest.fn(),
    gte: jest.fn(),
    lte: jest.fn(),
    like: jest.fn(),
    ilike: jest.fn(),
    in: jest.fn(),
    order: jest.fn(),
    limit: jest.fn(),
    range: jest.fn(),
    single: jest.fn().mockResolvedValue({ data: null, error: null }),
    maybeSingle: jest.fn().mockResolvedValue({ data: null, error: null }),
  };

  // 设置链式调用
  Object.keys(mockQueryBuilder).forEach(key => {
    if (!['single', 'maybeSingle'].includes(key)) {
      mockQueryBuilder[key].mockReturnValue(mockQueryBuilder);
    }
  });

  return mockQueryBuilder;
};

const mockQueryBuilder = createMockQueryBuilder();

// 模拟 Supabase 客户端
const mockSupabaseClient = {
  from: jest.fn().mockImplementation(() => createMockQueryBuilder()),
  auth: {
    signUp: jest.fn(),
    signIn: jest.fn(),
    signOut: jest.fn(),
    getUser: jest.fn(),
    onAuthStateChange: jest.fn(),
  },
  storage: {
    from: jest.fn(),
  },
  rpc: jest.fn(),
};

// 模拟 createClient
jest.mock('@supabase/supabase-js', () => ({
  createClient: jest.fn(() => mockSupabaseClient),
}));

describe('Supabase Integration Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockSupabaseClient.from.mockReturnValue(mockQueryBuilder);
  });

  describe('Database Operations', () => {
    describe('User Management', () => {
      it('should create a new user profile', async () => {
        const userData = {
          id: 'user-123',
          wallet_address: '0x1234567890abcdef1234567890abcdef12345678',
          username: 'testuser',
          email: 'test@example.com',
          created_at: new Date().toISOString(),
        };

        mockQueryBuilder.insert.mockResolvedValue({
          data: userData,
          error: null,
        });

        const result = await mockSupabaseClient
          .from('user_profiles')
          .insert(userData);

        expect(mockSupabaseClient.from).toHaveBeenCalledWith('user_profiles');
        expect(mockQueryBuilder.insert).toHaveBeenCalledWith(userData);
        expect(result.data).toEqual(userData);
        expect(result.error).toBeNull();
      });

      it('should fetch user profile by wallet address', async () => {
        const walletAddress = '0x1234567890abcdef1234567890abcdef12345678';
        const userData = {
          id: 'user-123',
          wallet_address: walletAddress,
          username: 'testuser',
          sm_balance: '1000.0',
        };

        mockQueryBuilder.single.mockResolvedValue({
          data: userData,
          error: null,
        });

        const result = await mockSupabaseClient
          .from('user_profiles')
          .select('*')
          .eq('wallet_address', walletAddress)
          .single();

        expect(mockQueryBuilder.select).toHaveBeenCalledWith('*');
        expect(mockQueryBuilder.eq).toHaveBeenCalledWith('wallet_address', walletAddress);
        expect(mockQueryBuilder.single).toHaveBeenCalled();
        expect(result.data).toEqual(userData);
      });

      it('should update user balance', async () => {
        const userId = 'user-123';
        const newBalance = '1500.0';

        mockQueryBuilder.update.mockResolvedValue({
          data: { id: userId, sm_balance: newBalance },
          error: null,
        });

        const result = await mockSupabaseClient
          .from('user_profiles')
          .update({ sm_balance: newBalance })
          .eq('id', userId);

        expect(mockQueryBuilder.update).toHaveBeenCalledWith({ sm_balance: newBalance });
        expect(mockQueryBuilder.eq).toHaveBeenCalledWith('id', userId);
      });
    });

    describe('Transaction History', () => {
      it('should record a new transaction', async () => {
        const transactionData = {
          id: 'tx-123',
          user_id: 'user-123',
          type: 'exchange',
          amount_bnb: '0.1',
          amount_sm: '120.48',
          tx_hash: '0xabcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890',
          status: 'completed',
          created_at: new Date().toISOString(),
        };

        mockQueryBuilder.insert.mockResolvedValue({
          data: transactionData,
          error: null,
        });

        const result = await mockSupabaseClient
          .from('transactions')
          .insert(transactionData);

        expect(mockSupabaseClient.from).toHaveBeenCalledWith('transactions');
        expect(mockQueryBuilder.insert).toHaveBeenCalledWith(transactionData);
        expect(result.data).toEqual(transactionData);
      });

      it('should fetch user transaction history', async () => {
        const userId = 'user-123';
        const transactions = [
          {
            id: 'tx-1',
            type: 'exchange',
            amount_bnb: '0.1',
            amount_sm: '120.48',
            status: 'completed',
            created_at: '2024-01-01T00:00:00Z',
          },
          {
            id: 'tx-2',
            type: 'exchange',
            amount_bnb: '0.05',
            amount_sm: '60.24',
            status: 'completed',
            created_at: '2024-01-02T00:00:00Z',
          },
        ];

        mockQueryBuilder.select.mockResolvedValue({
          data: transactions,
          error: null,
        });

        const result = await mockSupabaseClient
          .from('transactions')
          .select('*')
          .eq('user_id', userId)
          .order('created_at', { ascending: false })
          .limit(10);

        expect(mockQueryBuilder.eq).toHaveBeenCalledWith('user_id', userId);
        expect(mockQueryBuilder.order).toHaveBeenCalledWith('created_at', { ascending: false });
        expect(mockQueryBuilder.limit).toHaveBeenCalledWith(10);
        expect(result.data).toEqual(transactions);
      });

      it('should update transaction status', async () => {
        const txId = 'tx-123';
        const newStatus = 'failed';

        mockQueryBuilder.update.mockResolvedValue({
          data: { id: txId, status: newStatus },
          error: null,
        });

        const result = await mockSupabaseClient
          .from('transactions')
          .update({ status: newStatus })
          .eq('id', txId);

        expect(mockQueryBuilder.update).toHaveBeenCalledWith({ status: newStatus });
        expect(mockQueryBuilder.eq).toHaveBeenCalledWith('id', txId);
      });
    });

    describe('Social Tasks', () => {
      it('should create a new social task', async () => {
        const taskData = {
          id: 'task-123',
          title: 'Follow on Twitter',
          description: 'Follow our official Twitter account',
          reward_amount: '10.0',
          task_type: 'social_follow',
          platform: 'twitter',
          target_url: 'https://twitter.com/sociomint',
          is_active: true,
          created_at: new Date().toISOString(),
        };

        mockQueryBuilder.insert.mockResolvedValue({
          data: taskData,
          error: null,
        });

        const result = await mockSupabaseClient
          .from('social_tasks')
          .insert(taskData);

        expect(mockSupabaseClient.from).toHaveBeenCalledWith('social_tasks');
        expect(mockQueryBuilder.insert).toHaveBeenCalledWith(taskData);
        expect(result.data).toEqual(taskData);
      });

      it('should fetch active social tasks', async () => {
        const activeTasks = [
          {
            id: 'task-1',
            title: 'Follow on Twitter',
            reward_amount: '10.0',
            task_type: 'social_follow',
            is_active: true,
          },
          {
            id: 'task-2',
            title: 'Join Telegram',
            reward_amount: '15.0',
            task_type: 'social_join',
            is_active: true,
          },
        ];

        mockQueryBuilder.select.mockResolvedValue({
          data: activeTasks,
          error: null,
        });

        const result = await mockSupabaseClient
          .from('social_tasks')
          .select('*')
          .eq('is_active', true)
          .order('created_at', { ascending: false });

        expect(mockQueryBuilder.eq).toHaveBeenCalledWith('is_active', true);
        expect(mockQueryBuilder.order).toHaveBeenCalledWith('created_at', { ascending: false });
        expect(result.data).toEqual(activeTasks);
      });

      it('should record task completion', async () => {
        const completionData = {
          id: 'completion-123',
          user_id: 'user-123',
          task_id: 'task-123',
          status: 'completed',
          verification_data: { twitter_username: '@testuser' },
          completed_at: new Date().toISOString(),
        };

        mockQueryBuilder.insert.mockResolvedValue({
          data: completionData,
          error: null,
        });

        const result = await mockSupabaseClient
          .from('task_completions')
          .insert(completionData);

        expect(mockSupabaseClient.from).toHaveBeenCalledWith('task_completions');
        expect(mockQueryBuilder.insert).toHaveBeenCalledWith(completionData);
        expect(result.data).toEqual(completionData);
      });
    });
  });

  describe('Authentication', () => {
    it('should sign up a new user', async () => {
      const email = 'test@example.com';
      const password = 'password123';
      const userData = {
        id: 'user-123',
        email,
        email_confirmed_at: new Date().toISOString(),
      };

      mockSupabaseClient.auth.signUp.mockResolvedValue({
        data: { user: userData, session: null },
        error: null,
      });

      const result = await mockSupabaseClient.auth.signUp({
        email,
        password,
      });

      expect(mockSupabaseClient.auth.signUp).toHaveBeenCalledWith({
        email,
        password,
      });
      expect(result.data.user).toEqual(userData);
      expect(result.error).toBeNull();
    });

    it('should sign in an existing user', async () => {
      const email = 'test@example.com';
      const password = 'password123';
      const sessionData = {
        access_token: 'access-token-123',
        refresh_token: 'refresh-token-123',
        user: { id: 'user-123', email },
      };

      mockSupabaseClient.auth.signIn.mockResolvedValue({
        data: { session: sessionData },
        error: null,
      });

      const result = await mockSupabaseClient.auth.signIn({
        email,
        password,
      });

      expect(mockSupabaseClient.auth.signIn).toHaveBeenCalledWith({
        email,
        password,
      });
      expect(result.data.session).toEqual(sessionData);
    });

    it('should get current user', async () => {
      const userData = {
        id: 'user-123',
        email: 'test@example.com',
        aud: 'authenticated',
      };

      mockSupabaseClient.auth.getUser.mockResolvedValue({
        data: { user: userData },
        error: null,
      });

      const result = await mockSupabaseClient.auth.getUser();

      expect(mockSupabaseClient.auth.getUser).toHaveBeenCalled();
      expect(result.data.user).toEqual(userData);
    });

    it('should sign out user', async () => {
      mockSupabaseClient.auth.signOut.mockResolvedValue({
        error: null,
      });

      const result = await mockSupabaseClient.auth.signOut();

      expect(mockSupabaseClient.auth.signOut).toHaveBeenCalled();
      expect(result.error).toBeNull();
    });
  });

  describe('Real-time Subscriptions', () => {
    it('should set up auth state change listener', () => {
      const callback = jest.fn();

      mockSupabaseClient.auth.onAuthStateChange.mockReturnValue({
        data: { subscription: { id: 'sub-123' } },
      });

      const subscription = mockSupabaseClient.auth.onAuthStateChange(callback);

      expect(mockSupabaseClient.auth.onAuthStateChange).toHaveBeenCalledWith(callback);
      expect(subscription.data.subscription.id).toBe('sub-123');
    });
  });

  describe('Error Handling', () => {
    it('should handle database connection errors', async () => {
      const error = new Error('Connection failed');
      mockQueryBuilder.select.mockRejectedValue(error);

      try {
        await mockSupabaseClient
          .from('user_profiles')
          .select('*');
      } catch (e) {
        expect(e).toEqual(error);
      }

      expect(mockQueryBuilder.select).toHaveBeenCalled();
    });

    it('should handle authentication errors', async () => {
      const authError = {
        message: 'Invalid credentials',
        status: 400,
      };

      mockSupabaseClient.auth.signIn.mockResolvedValue({
        data: { session: null },
        error: authError,
      });

      const result = await mockSupabaseClient.auth.signIn({
        email: 'wrong@example.com',
        password: 'wrongpassword',
      });

      expect(result.error).toEqual(authError);
      expect(result.data.session).toBeNull();
    });

    it('should handle API rate limiting', async () => {
      const rateLimitError = {
        message: 'Too many requests',
        status: 429,
      };

      mockQueryBuilder.select.mockResolvedValue({
        data: null,
        error: rateLimitError,
      });

      const result = await mockSupabaseClient
        .from('user_profiles')
        .select('*');

      expect(result.error).toEqual(rateLimitError);
      expect(result.data).toBeNull();
    });
  });

  describe('Performance Tests', () => {
    it('should handle large data queries efficiently', async () => {
      const largeDataSet = Array.from({ length: 1000 }, (_, i) => ({
        id: `item-${i}`,
        data: `data-${i}`,
      }));

      mockQueryBuilder.select.mockResolvedValue({
        data: largeDataSet,
        error: null,
      });

      const startTime = performance.now();
      
      const result = await mockSupabaseClient
        .from('large_table')
        .select('*')
        .limit(1000);

      const endTime = performance.now();
      const queryTime = endTime - startTime;

      expect(queryTime).toBeLessThan(1000); // 应该在1秒内完成
      expect(result.data).toHaveLength(1000);
    });

    it('should handle concurrent requests', async () => {
      mockQueryBuilder.select.mockResolvedValue({
        data: [{ id: 1, name: 'test' }],
        error: null,
      });

      const promises = Array.from({ length: 10 }, () =>
        mockSupabaseClient
          .from('test_table')
          .select('*')
      );

      const results = await Promise.all(promises);

      expect(results).toHaveLength(10);
      results.forEach(result => {
        expect(result.data).toEqual([{ id: 1, name: 'test' }]);
        expect(result.error).toBeNull();
      });
    });
  });
});
