import React, { useState, useEffect } from 'react';
import { useAccount } from 'wagmi';
import { createClient } from '@supabase/supabase-js';
import type { SocialTask, TaskSubmission } from '@/types/global';
import { 
  Box, 
  Card, 
  CardContent, 
  Typography, 
  Button, 
  Chip, 
  Grid, 
  CircularProgress,
  Tabs,
  Tab,
  Divider,
  Alert,
  IconButton,
  Tooltip
} from '@mui/material';
import {
  Refresh as RefreshIcon,
  CheckCircle as CheckCircleIcon,
  AccessTime as AccessTimeIcon,
  LocalFlorist as FlowerIcon
} from '@mui/icons-material';
import { FaTwitter, FaTelegram, FaDiscord } from 'react-icons/fa';

// 创建Supabase客户端
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseAnonKey);

// 平台图标映射
const platformIcons = {
  twitter: <FaTwitter className="text-blue-400" />,
  telegram: <FaTelegram className="text-cyan-400" />,
  discord: <FaDiscord className="text-purple-400" />
};

// 任务类型映射
const taskTypeLabels = {
  twitter_follow: '关注',
  twitter_like: '点赞',
  twitter_retweet: '转发',
  twitter_comment: '评论',
  telegram_join: '加入频道',
  telegram_message: '发送消息',
  discord_join: '加入服务器',
  discord_message: '发送消息'
};

interface SocialTaskListProps {
  className?: string;
}

/**
 * 社交任务列表组件
 */
const SocialTaskList: React.FC<SocialTaskListProps> = ({ className }) => {
  const { address, isConnected } = useAccount();
  const [tasks, setTasks] = useState<SocialTask[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<string>('all');
  const [selectedPlatform, setSelectedPlatform] = useState<string>('all');
  const [userSession, setUserSession] = useState<any>(null);
  const [userFlowerBalance, setUserFlowerBalance] = useState<number>(0);
  const [completingTask, setCompletingTask] = useState<string | null>(null);

  // 获取用户会话
  useEffect(() => {
    const getSession = async () => {
      const { data, error } = await supabase.auth.getSession();
      if (data.session) {
        setUserSession(data.session);
      }
    };

    getSession();
  }, []);

  // 获取用户小红花余额
  useEffect(() => {
    const fetchUserBalance = async () => {
      if (!userSession) return;

      try {
        const { data, error } = await supabase
          .from('users')
          .select('xiaohonghua_balance')
          .eq('id', userSession.user.id)
          .single();

        if (error) throw error;
        setUserFlowerBalance(data?.xiaohonghua_balance || 0);
      } catch (err) {
        console.error('获取小红花余额失败:', err);
      }
    };

    fetchUserBalance();
  }, [userSession]);

  // 加载任务列表
  useEffect(() => {
    fetchTasks();
  }, [activeTab, selectedPlatform, userSession]);

  // 获取任务列表
  const fetchTasks = async () => {
    if (!userSession) return;

    setLoading(true);
    setError(null);

    try {
      // 构建API URL
      let url = `${supabaseUrl}/functions/v1/social-tasks/tasks/list?`;
      
      // 添加平台筛选
      if (selectedPlatform !== 'all') {
        url += `platform=${selectedPlatform}&`;
      }
      
      // 添加状态筛选
      if (activeTab === 'completed') {
        url += 'status=completed&';
      } else {
        url += 'status=active&';
      }
      
      // 发送请求
      const response = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${userSession.access_token}`
        }
      });

      if (!response.ok) {
        throw new Error('获取任务列表失败');
      }

      const result = await response.json();
      
      if (result.success) {
        setTasks(result.data || []);
      } else {
        throw new Error(result.message || '获取任务列表失败');
      }
    } catch (err) {
      console.error('获取任务列表错误:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // 处理任务完成
  const handleCompleteTask = async (taskId) => {
    if (!userSession || !isConnected) {
      alert('请先登录并连接钱包');
      return;
    }

    // 获取任务详情
    const task = tasks.find(t => t.id === taskId);
    if (!task) return;

    // 检查小红花余额
    if (userFlowerBalance < task.flower_cost) {
      alert(`小红花余额不足！需要 ${task.flower_cost} 朵小红花，但您只有 ${userFlowerBalance} 朵。`);
      return;
    }

    setCompletingTask(taskId);

    try {
      // 根据平台类型处理不同的验证流程
      let platformUserId, platformUsername, proofUrl, proofData;

      if (task.platform === 'twitter') {
        // 打开Twitter授权窗口
        const authWindow = window.open(`${window.location.origin}/auth/twitter?task=${taskId}`, 'twitter-auth', 'width=600,height=600');
        
        // 等待授权完成
        const authResult = await new Promise((resolve) => {
          window.addEventListener('message', (event) => {
            if (event.data.type === 'twitter-auth-complete') {
              resolve(event.data);
            }
          });
        });
        
        if (!authResult.success) {
          throw new Error(authResult.message || 'Twitter授权失败');
        }
        
        platformUserId = authResult.userId;
        platformUsername = authResult.username;
        proofUrl = authResult.proofUrl;
        proofData = { tweetId: authResult.tweetId };
      } else if (task.platform === 'telegram') {
        // 打开Telegram授权窗口
        const authWindow = window.open(`${window.location.origin}/auth/telegram?task=${taskId}`, 'telegram-auth', 'width=600,height=600');
        
        // 等待授权完成
        const authResult = await new Promise((resolve) => {
          window.addEventListener('message', (event) => {
            if (event.data.type === 'telegram-auth-complete') {
              resolve(event.data);
            }
          });
        });
        
        if (!authResult.success) {
          throw new Error(authResult.message || 'Telegram授权失败');
        }
        
        platformUserId = authResult.userId;
        platformUsername = authResult.username;
        proofUrl = authResult.proofUrl;
        proofData = { messageId: authResult.messageId };
      } else if (task.platform === 'discord') {
        // 打开Discord授权窗口
        const authWindow = window.open(`${window.location.origin}/auth/discord?task=${taskId}`, 'discord-auth', 'width=600,height=600');
        
        // 等待授权完成
        const authResult = await new Promise((resolve) => {
          window.addEventListener('message', (event) => {
            if (event.data.type === 'discord-auth-complete') {
              resolve(event.data);
            }
          });
        });
        
        if (!authResult.success) {
          throw new Error(authResult.message || 'Discord授权失败');
        }
        
        platformUserId = authResult.userId;
        platformUsername = authResult.username;
        proofUrl = authResult.proofUrl;
        proofData = { messageId: authResult.messageId };
      } else {
        throw new Error('不支持的平台类型');
      }

      // 提交任务完成
      const response = await fetch(`${supabaseUrl}/functions/v1/social-tasks/tasks/complete`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${userSession.access_token}`
        },
        body: JSON.stringify({
          task_id: taskId,
          platform_user_id: platformUserId,
          platform_username: platformUsername,
          proof_url: proofUrl,
          proof_data: proofData
        })
      });

      const result = await response.json();

      if (!result.success) {
        throw new Error(result.message || '提交任务失败');
      }

      // 更新小红花余额
      setUserFlowerBalance(prev => prev - task.flower_cost + task.flower_reward);
      
      // 刷新任务列表
      fetchTasks();
      
      alert(result.message || '任务完成成功！');
    } catch (err) {
      console.error('完成任务失败:', err);
      alert(`完成任务失败: ${err.message}`);
    } finally {
      setCompletingTask(null);
    }
  };

  // 处理标签切换
  const handleTabChange = (event, newValue) => {
    setActiveTab(newValue);
  };

  // 处理平台筛选
  const handlePlatformChange = (platform) => {
    setSelectedPlatform(platform);
  };

  // 渲染平台筛选器
  const renderPlatformFilter = () => (
    <Box sx={{ display: 'flex', gap: 1, mb: 2 }}>
      <Chip 
        label="全部" 
        color={selectedPlatform === 'all' ? 'primary' : 'default'} 
        onClick={() => handlePlatformChange('all')} 
      />
      <Chip
        icon={<FaTwitter />}
        label="Twitter"
        color={selectedPlatform === 'twitter' ? 'primary' : 'default'}
        onClick={() => handlePlatformChange('twitter')}
      />
      <Chip
        icon={<FaTelegram />}
        label="Telegram"
        color={selectedPlatform === 'telegram' ? 'primary' : 'default'}
        onClick={() => handlePlatformChange('telegram')}
      />
      <Chip
        icon={<FaDiscord />}
        label="Discord"
        color={selectedPlatform === 'discord' ? 'primary' : 'default'}
        onClick={() => handlePlatformChange('discord')}
      />
    </Box>
  );

  // 渲染任务卡片
  const renderTaskCard = (task) => (
    <Card key={task.id} sx={{ mb: 2, position: 'relative' }}>
      <CardContent>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
          <Typography variant="h6" component="div">
            {task.title}
          </Typography>
          <Chip 
            icon={platformIcons[task.platform]} 
            label={task.platform.charAt(0).toUpperCase() + task.platform.slice(1)} 
            size="small" 
            color="primary" 
            variant="outlined" 
          />
        </Box>
        
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          {task.description}
        </Typography>
        
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
          <Chip 
            label={taskTypeLabels[task.task_type] || task.task_type} 
            size="small" 
            sx={{ mr: 1 }} 
          />
          <Tooltip title="每日可完成次数">
            <Chip 
              icon={<AccessTimeIcon fontSize="small" />}
              label={`每日限制: ${task.daily_limit}次`} 
              size="small" 
              variant="outlined" 
              sx={{ mr: 1 }} 
            />
          </Tooltip>
        </Box>
        
        <Divider sx={{ my: 1 }} />
        
        <Grid container spacing={2} sx={{ mt: 1 }}>
          <Grid item xs={6}>
            <Box sx={{ display: 'flex', alignItems: 'center' }}>
              <FlowerIcon color="error" fontSize="small" sx={{ mr: 0.5 }} />
              <Typography variant="body2" color="error">
                消耗: {task.flower_cost} 小红花
              </Typography>
            </Box>
          </Grid>
          <Grid item xs={6}>
            <Box sx={{ display: 'flex', alignItems: 'center' }}>
              <FlowerIcon color="success" fontSize="small" sx={{ mr: 0.5 }} />
              <Typography variant="body2" color="success">
                奖励: {task.flower_reward} 小红花
              </Typography>
            </Box>
          </Grid>
        </Grid>
        
        <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 2 }}>
          {task.isCompleted ? (
            <Button 
              variant="contained" 
              color="success" 
              startIcon={<CheckCircleIcon />}
              disabled
            >
              已完成
            </Button>
          ) : (
            <Button 
              variant="contained" 
              color="primary"
              onClick={() => handleCompleteTask(task.id)}
              disabled={completingTask === task.id}
            >
              {completingTask === task.id ? (
                <>
                  <CircularProgress size={20} sx={{ mr: 1 }} />
                  处理中...
                </>
              ) : '完成任务'}
            </Button>
          )}
        </Box>
      </CardContent>
    </Card>
  );

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h5" component="h2">
          社交任务
        </Typography>
        <Box sx={{ display: 'flex', alignItems: 'center' }}>
          <Chip 
            icon={<FlowerIcon />} 
            label={`${userFlowerBalance} 小红花`} 
            color="primary" 
            sx={{ mr: 2 }} 
          />
          <IconButton onClick={fetchTasks} disabled={loading}>
            <RefreshIcon />
          </IconButton>
        </Box>
      </Box>

      <Tabs value={activeTab} onChange={handleTabChange} sx={{ mb: 2 }}>
        <Tab label="可用任务" value="all" />
        <Tab label="已完成" value="completed" />
      </Tabs>

      {renderPlatformFilter()}

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', my: 4 }}>
          <CircularProgress />
        </Box>
      ) : tasks.length > 0 ? (
        tasks.map(renderTaskCard)
      ) : (
        <Alert severity="info">
          {activeTab === 'completed' ? '您还没有完成任何任务' : '当前没有可用的任务'}
        </Alert>
      )}
    </Box>
  );
};

export default SocialTaskList;
