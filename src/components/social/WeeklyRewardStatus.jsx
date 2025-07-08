import React, { useState, useEffect } from 'react';
import { useAccount, useContractWrite, useWaitForTransactionReceipt } from 'wagmi';
import { createClient } from '@supabase/supabase-js';
import { ethers } from 'ethers';
import { 
  Box, 
  Card, 
  CardContent, 
  Typography, 
  Button, 
  CircularProgress,
  Divider,
  Alert,
  LinearProgress,
  Grid,
  Chip,
  Tooltip,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow
} from '@mui/material';
import {
  EmojiEvents as TrophyIcon,
  LocalFlorist as FlowerIcon,
  AccessTime as TimeIcon,
  People as PeopleIcon,
  Leaderboard as LeaderboardIcon,
  TokenOutlined as TokenIcon
} from '@mui/icons-material';

// 创建Supabase客户端
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseAnonKey);

// 合约地址和ABI
const REWARD_DISTRIBUTOR_ADDRESS = process.env.NEXT_PUBLIC_REWARD_DISTRIBUTOR_ADDRESS;
const REWARD_DISTRIBUTOR_ABI = [
  'function claimReward(uint256 _year, uint256 _weekNumber, uint256 _amount, bytes32[] calldata _merkleProof) external',
  'function claimedRewards(uint256 _year, uint256 _weekNumber, address _user) external view returns (uint256)'
];

/**
 * 周奖励状态组件
 */
const WeeklyRewardStatus = () => {
  const { address, isConnected } = useAccount();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [userSession, setUserSession] = useState(null);
  const [weeklyData, setWeeklyData] = useState(null);
  const [userReward, setUserReward] = useState(null);
  const [topUsers, setTopUsers] = useState([]);
  const [claimingReward, setClaimingReward] = useState(false);

  // 合约写入函数
  const { 
    data: claimData,
    isLoading: isClaimLoading,
    isSuccess: isClaimStarted,
    write: claimReward
  } = useContractWrite({
    address: REWARD_DISTRIBUTOR_ADDRESS,
    abi: REWARD_DISTRIBUTOR_ABI,
    functionName: 'claimReward',
  });

  // 等待交易确认
  const { 
    isLoading: isClaimPending,
    isSuccess: isClaimSuccess
  } = useWaitForTransactionReceipt({
    hash: claimData?.hash,
  });

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

  // 加载周奖励数据
  useEffect(() => {
    if (userSession && address) {
      fetchWeeklyRewardData();
    }
  }, [userSession, address, isClaimSuccess]);

  // 获取周奖励数据
  const fetchWeeklyRewardData = async () => {
    if (!userSession || !address) return;

    setLoading(true);
    setError(null);

    try {
      // 获取当前周奖励数据
      const response = await fetch(`${supabaseUrl}/functions/v1/social-tasks/rewards/weekly`, {
        headers: {
          'Authorization': `Bearer ${userSession.access_token}`
        }
      });

      if (!response.ok) {
        throw new Error('获取周奖励数据失败');
      }

      const result = await response.json();
      
      if (result.success) {
        setWeeklyData(result.data.weeklyPool || null);
        setUserReward(result.data.userReward || null);
        setTopUsers(result.data.topUsers || []);
      } else {
        throw new Error(result.message || '获取周奖励数据失败');
      }
    } catch (err) {
      console.error('获取周奖励数据错误:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // 处理领取奖励
  const handleClaimReward = async () => {
    if (!userSession || !isConnected || !userReward || !weeklyData) {
      alert('无法领取奖励');
      return;
    }

    if (userReward.claimed) {
      alert('您已经领取过本周奖励');
      return;
    }

    setClaimingReward(true);

    try {
      // 获取Merkle证明
      const response = await fetch(`${supabaseUrl}/functions/v1/social-tasks/rewards/claim`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${userSession.access_token}`
        },
        body: JSON.stringify({
          week_number: weeklyData.week_number,
          year: weeklyData.year
        })
      });

      const result = await response.json();
      
      if (!result.success) {
        throw new Error(result.message || '获取Merkle证明失败');
      }

      const { proof, amount } = result.data;
      
      // 调用合约领取奖励
      claimReward({
        args: [
          weeklyData.year,
          weeklyData.week_number,
          amount,
          proof
        ]
      });
    } catch (err) {
      console.error('领取奖励失败:', err);
      alert(`领取奖励失败: ${err.message}`);
      setClaimingReward(false);
    }
  };

  // 计算周进度
  const calculateWeekProgress = () => {
    const now = new Date();
    const dayOfWeek = now.getDay(); // 0 = 周日, 1 = 周一, ..., 6 = 周六
    const adjustedDay = dayOfWeek === 0 ? 7 : dayOfWeek; // 调整为 1 = 周一, ..., 7 = 周日
    return Math.min(Math.round((adjustedDay / 7) * 100), 100);
  };

  // 格式化日期
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('zh-CN', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  // 渲染加载状态
  if (loading) {
    return (
      <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', my: 4 }}>
        <CircularProgress sx={{ mb: 2 }} />
        <Typography>加载周奖励数据...</Typography>
      </Box>
    );
  }

  // 渲染错误状态
  if (error) {
    return (
      <Alert severity="error" sx={{ mb: 2 }}>
        {error}
      </Alert>
    );
  }

  // 渲染无奖励池状态
  if (!weeklyData) {
    return (
      <Card>
        <CardContent>
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
            <TrophyIcon sx={{ mr: 1 }} color="primary" />
            <Typography variant="h6">周奖励</Typography>
          </Box>
          <Alert severity="info">
            当前没有活跃的奖励池。请完成社交任务，消耗小红花来参与下一轮奖励分配。
          </Alert>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardContent>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <TrophyIcon sx={{ mr: 1 }} color="primary" />
            <Typography variant="h6">周奖励</Typography>
          </Box>
          <Chip 
            icon={<TimeIcon />} 
            label={`第${weeklyData.week_number}周 / ${weeklyData.year}年`} 
            color="primary" 
            variant="outlined" 
          />
        </Box>

        <Box sx={{ mb: 3 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
            <Typography variant="body2" color="text.secondary">本周进度</Typography>
            <Typography variant="body2">{calculateWeekProgress()}%</Typography>
          </Box>
          <LinearProgress variant="determinate" value={calculateWeekProgress()} sx={{ height: 8, borderRadius: 4 }} />
        </Box>

        <Grid container spacing={2} sx={{ mb: 3 }}>
          <Grid item xs={6}>
            <Paper elevation={0} sx={{ p: 2, bgcolor: 'background.default', borderRadius: 2 }}>
              <Typography variant="body2" color="text.secondary" gutterBottom>总奖励池</Typography>
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <TokenIcon color="primary" sx={{ mr: 1 }} />
                <Typography variant="h6">{weeklyData.total_sm_amount} SM</Typography>
              </Box>
            </Paper>
          </Grid>
          <Grid item xs={6}>
            <Paper elevation={0} sx={{ p: 2, bgcolor: 'background.default', borderRadius: 2 }}>
              <Typography variant="body2" color="text.secondary" gutterBottom>参与用户</Typography>
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <PeopleIcon color="primary" sx={{ mr: 1 }} />
                <Typography variant="h6">{topUsers.length}</Typography>
              </Box>
            </Paper>
          </Grid>
        </Grid>

        {userReward ? (
          <Box sx={{ mb: 3, p: 2, bgcolor: 'background.default', borderRadius: 2 }}>
            <Typography variant="subtitle1" gutterBottom>您的奖励</Typography>
            
            <Grid container spacing={2} sx={{ mb: 2 }}>
              <Grid item xs={6}>
                <Box>
                  <Typography variant="body2" color="text.secondary">消耗小红花</Typography>
                  <Box sx={{ display: 'flex', alignItems: 'center' }}>
                    <FlowerIcon color="error" fontSize="small" sx={{ mr: 0.5 }} />
                    <Typography>{userReward.flower_spent}</Typography>
                  </Box>
                </Box>
              </Grid>
              <Grid item xs={6}>
                <Box>
                  <Typography variant="body2" color="text.secondary">影响力得分</Typography>
                  <Typography>{userReward.influence_score.toFixed(2)}</Typography>
                </Box>
              </Grid>
            </Grid>
            
            <Divider sx={{ my: 2 }} />
            
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Box>
                <Typography variant="body2" color="text.secondary">您的SM奖励</Typography>
                <Typography variant="h6" color="primary">{userReward.sm_amount} SM</Typography>
              </Box>
              
              {userReward.claimed ? (
                <Chip 
                  label="已领取" 
                  color="success" 
                  variant="outlined" 
                />
              ) : weeklyData.distributed ? (
                <Button 
                  variant="contained" 
                  color="primary"
                  onClick={handleClaimReward}
                  disabled={isClaimLoading || isClaimPending || claimingReward}
                >
                  {(isClaimLoading || isClaimPending || claimingReward) ? (
                    <>
                      <CircularProgress size={20} sx={{ mr: 1 }} />
                      处理中...
                    </>
                  ) : '领取奖励'}
                </Button>
              ) : (
                <Tooltip title="奖励池尚未分配，请等待">
                  <span>
                    <Button 
                      variant="contained" 
                      color="primary"
                      disabled
                    >
                      等待分配
                    </Button>
                  </span>
                </Tooltip>
              )}
            </Box>
          </Box>
        ) : (
          <Alert severity="info" sx={{ mb: 3 }}>
            您尚未参与本周奖励。请完成社交任务，消耗小红花来获得SM代币奖励。
          </Alert>
        )}

        <Box>
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
            <LeaderboardIcon sx={{ mr: 1 }} />
            <Typography variant="subtitle1">本周排行榜</Typography>
          </Box>
          
          <TableContainer component={Paper} variant="outlined">
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>排名</TableCell>
                  <TableCell>用户</TableCell>
                  <TableCell align="right">消耗小红花</TableCell>
                  <TableCell align="right">影响力</TableCell>
                  <TableCell align="right">SM奖励</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {topUsers.slice(0, 10).map((user, index) => (
                  <TableRow key={user.user_id} sx={{ bgcolor: user.user_id === userSession?.user?.id ? 'action.selected' : 'inherit' }}>
                    <TableCell>{index + 1}</TableCell>
                    <TableCell>
                      {user.wallet_address.slice(0, 6)}...{user.wallet_address.slice(-4)}
                    </TableCell>
                    <TableCell align="right">{user.flower_spent}</TableCell>
                    <TableCell align="right">{user.influence_score.toFixed(2)}</TableCell>
                    <TableCell align="right">{user.sm_amount}</TableCell>
                  </TableRow>
                ))}
                {topUsers.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={5} align="center">暂无数据</TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </TableContainer>
        </Box>
      </CardContent>
    </Card>
  );
};

export default WeeklyRewardStatus;
