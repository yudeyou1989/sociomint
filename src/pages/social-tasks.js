import React, { useState } from 'react';
import { useAccount } from 'wagmi';
import { 
  Box, 
  Container, 
  Typography, 
  Tabs, 
  Tab, 
  Paper, 
  Alert, 
  Button,
  Grid
} from '@mui/material';
import {
  Task as TaskIcon,
  EmojiEvents as RewardIcon,
  People as ReferralIcon
} from '@mui/icons-material';
import Layout from '../components/Layout';
import SocialTaskList from '../components/social/SocialTaskList';
import WeeklyRewardStatus from '../components/social/WeeklyRewardStatus';
import ReferralSystem from '../components/social/ReferralSystem';
import { useAuth } from '../hooks/useAuth';

/**
 * 社交任务页面
 * 集成社交任务、周奖励和推荐系统
 */
const SocialTasksPage = () => {
  const { address, isConnected } = useAccount();
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('tasks');

  // 处理标签切换
  const handleTabChange = (event, newValue) => {
    setActiveTab(newValue);
  };

  // 渲染未登录状态
  if (!user) {
    return (
      <Layout title="社交任务 | SocioMint">
        <Container maxWidth="lg" sx={{ py: 4 }}>
          <Paper sx={{ p: 4, textAlign: 'center' }}>
            <Typography variant="h5" component="h1" gutterBottom>
              社交任务系统
            </Typography>
            <Typography variant="body1" paragraph>
              完成社交任务，消耗小红花，获取SM代币奖励！
            </Typography>
            <Alert severity="info" sx={{ mb: 3 }}>
              请先登录以访问社交任务系统。
            </Alert>
            <Button 
              variant="contained" 
              color="primary" 
              href="/login"
            >
              登录
            </Button>
          </Paper>
        </Container>
      </Layout>
    );
  }

  // 渲染未连接钱包状态
  if (!isConnected) {
    return (
      <Layout title="社交任务 | SocioMint">
        <Container maxWidth="lg" sx={{ py: 4 }}>
          <Paper sx={{ p: 4, textAlign: 'center' }}>
            <Typography variant="h5" component="h1" gutterBottom>
              社交任务系统
            </Typography>
            <Typography variant="body1" paragraph>
              完成社交任务，消耗小红花，获取SM代币奖励！
            </Typography>
            <Alert severity="warning" sx={{ mb: 3 }}>
              请先连接钱包以访问社交任务系统。
            </Alert>
            <Button 
              variant="contained" 
              color="primary" 
              onClick={() => document.getElementById('connect-wallet-button').click()}
            >
              连接钱包
            </Button>
          </Paper>
        </Container>
      </Layout>
    );
  }

  return (
    <Layout title="社交任务 | SocioMint">
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Typography variant="h4" component="h1" gutterBottom>
          社交任务系统
        </Typography>
        
        <Typography variant="body1" paragraph color="text.secondary">
          完成社交任务，消耗小红花，获取SM代币奖励！每周结算一次，根据您的小红花消耗量和社交影响力分配SM代币。
        </Typography>
        
        <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
          <Tabs 
            value={activeTab} 
            onChange={handleTabChange} 
            aria-label="社交任务标签"
            variant="fullWidth"
          >
            <Tab 
              label="社交任务" 
              value="tasks" 
              icon={<TaskIcon />} 
              iconPosition="start" 
            />
            <Tab 
              label="周奖励" 
              value="rewards" 
              icon={<RewardIcon />} 
              iconPosition="start" 
            />
            <Tab 
              label="推荐系统" 
              value="referrals" 
              icon={<ReferralIcon />} 
              iconPosition="start" 
            />
          </Tabs>
        </Box>
        
        {activeTab === 'tasks' && (
          <SocialTaskList />
        )}
        
        {activeTab === 'rewards' && (
          <WeeklyRewardStatus />
        )}
        
        {activeTab === 'referrals' && (
          <ReferralSystem />
        )}
        
        {activeTab === 'tasks' && (
          <Box sx={{ mt: 4 }}>
            <Grid container spacing={3}>
              <Grid item xs={12} md={6}>
                <Paper sx={{ p: 3 }}>
                  <Typography variant="h6" gutterBottom>
                    如何获取小红花？
                  </Typography>
                  <Typography variant="body2">
                    1. 绑定社交账号：每个平台首次绑定奖励10朵小红花<br />
                    2. 每日签到：每天登录获得5朵小红花<br />
                    3. 完成新手任务：新用户任务奖励20朵小红花<br />
                    4. 通过推荐系统：成功推荐一位新用户获得15朵小红花
                  </Typography>
                </Paper>
              </Grid>
              <Grid item xs={12} md={6}>
                <Paper sx={{ p: 3 }}>
                  <Typography variant="h6" gutterBottom>
                    小红花消耗规则
                  </Typography>
                  <Typography variant="body2">
                    1. 每个社交任务需要消耗一定数量的小红花<br />
                    2. 每周消耗的小红花越多，获得的SM代币奖励越多<br />
                    3. 社交影响力越高，同等消耗下获得的奖励越多<br />
                    4. 小红花余额每周不会重置，可以累积使用
                  </Typography>
                </Paper>
              </Grid>
            </Grid>
          </Box>
        )}
      </Container>
    </Layout>
  );
};

export default SocialTasksPage;
