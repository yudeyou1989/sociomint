"use client";

import { useState, useEffect, createContext, useContext } from 'react';
import { supabase } from '../lib/supabase';

// 创建身份验证上下文
const AuthContext = createContext({
  user: null,
  profile: null,
  isLoading: false,
  isAdmin: false,
  signInWithPassword: async () => ({ success: false }),
  signInWithProvider: async () => ({ success: false }),
  signUp: async () => ({ success: false }),
  signOut: async () => ({ success: false }),
  updateProfile: async () => ({ success: false }),
});

// 身份验证提供者组件
export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    // 获取当前用户会话
    const getSession = async () => {
      try {
        setIsLoading(true);

        // 检查当前会话
        const { data: { session }, error } = await supabase.auth.getSession();

        if (error) {
          throw error;
        }

        if (session?.user) {
          setUser(session.user);
          await fetchUserProfile(session.user.id);
        } else {
          setUser(null);
          setProfile(null);
          setIsAdmin(false);
        }
      } catch (error) {
        console.error('检查会话时出错:', error);
        setUser(null);
        setProfile(null);
        setIsAdmin(false);
      } finally {
        setIsLoading(false);
      }
    };

    getSession();

    // 设置监听用户状态变化
    const { data: authListener } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log(`认证状态变化: ${event}`);
      
      if (session?.user) {
        setUser(session.user);
        await fetchUserProfile(session.user.id);
      } else {
        setUser(null);
        setProfile(null);
        setIsAdmin(false);
      }

      setIsLoading(false);
    });

    return () => {
      if (authListener && typeof authListener.unsubscribe === 'function') {
        authListener.unsubscribe();
      }
    };
  }, []);

  // 获取用户资料
  const fetchUserProfile = async (userId) => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', userId)
        .single();

      if (error) {
        throw error;
      }

      setProfile(data);
      setIsAdmin(data?.is_admin || false);
    } catch (error) {
      console.error('获取用户资料时出错:', error);
      setProfile(null);
      setIsAdmin(false);
    }
  };

  // 使用邮箱密码登录
  const signInWithPassword = async (email, password) => {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        throw error;
      }

      return { success: true, data };
    } catch (error) {
      console.error('登录失败:', error);
      return { success: false, error: error.message };
    }
  };

  // 使用第三方提供商登录
  const signInWithProvider = async (provider) => {
    try {
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider,
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
        },
      });

      if (error) {
        throw error;
      }

      return { success: true, data };
    } catch (error) {
      console.error(`使用${provider}登录失败:`, error);
      return { success: false, error: error.message };
    }
  };

  // 用户注册
  const signUp = async (email, password, metadata = {}) => {
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: metadata,
        },
      });

      if (error) {
        throw error;
      }

      return { success: true, data };
    } catch (error) {
      console.error('注册失败:', error);
      return { success: false, error: error.message };
    }
  };

  // 退出登录
  const signOut = async () => {
    try {
      const { error } = await supabase.auth.signOut();

      if (error) {
        throw error;
      }

      // 清除用户状态
      setUser(null);
      setProfile(null);
      setIsAdmin(false);

      return { success: true };
    } catch (error) {
      console.error('退出登录失败:', error);
      return { success: false, error: error.message };
    }
  };

  // 更新用户资料
  const updateProfile = async (updates) => {
    try {
      // 确保用户已登录
      if (!user) {
        throw new Error('用户未登录');
      }

      // 更新资料
      const { data, error } = await supabase
        .from('profiles')
        .update(updates)
        .eq('user_id', user.id)
        .select()
        .single();

      if (error) {
        throw error;
      }

      // 更新本地状态
      setProfile(data);

      return { success: true, data };
    } catch (error) {
      console.error('更新资料失败:', error);
      return { success: false, error: error.message };
    }
  };

  // 提供的上下文值
  const value = {
    user,
    profile,
    isLoading,
    isAdmin,
    signInWithPassword,
    signInWithProvider,
    signUp,
    signOut,
    updateProfile,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

// 自定义钩子
export const useAuth = () => {
  return useContext(AuthContext);
}; 