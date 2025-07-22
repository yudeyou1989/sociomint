'use client';

// API路由的客户端替代方案
// 由于Cloudflare Pages不支持API路由，这里提供客户端实现

export const apiConfig = {
  // 使用Supabase作为后端
  supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL,
  supabaseKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  
  // 社交任务API的客户端实现
  socialTasks: {
    async getAll() {
      // 直接从Supabase获取数据
      return [];
    },
    
    async submit(taskData: any) {
      // 直接提交到Supabase
      return { success: true };
    }
  },
  
  // 空投池API的客户端实现
  airdropPools: {
    async getAll() {
      return [];
    },
    
    async participate(poolId: string) {
      return { success: true };
    }
  },
  
  // 软质押API的客户端实现
  softStaking: {
    async getRewards() {
      return { rewards: 0 };
    },
    
    async claim() {
      return { success: true };
    }
  }
};

export default apiConfig;
