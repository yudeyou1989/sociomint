import React, { useState, useEffect } from 'react';
import { useAccount } from 'wagmi';
import { createClient } from '@supabase/supabase-js';
import { 
  Box, 
  Card, 
  CardContent, 
  Typography, 
  Button, 
  TextField,
  CircularProgress,
  Divider,
  Alert,
  Grid,
  Chip,
  IconButton,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Tooltip,
  Snackbar
} from '@mui/material';
import {
  Share as ShareIcon,
  ContentCopy as CopyIcon,
  People as PeopleIcon,
  Bolt as BoltIcon,
  EmojiEvents as TrophyIcon,
  LocalFlorist as FlowerIcon,
  TokenOutlined as TokenIcon,
  Close as CloseIcon,
  Refresh as RefreshIcon
} from '@mui/icons-material';

// 创建Supabase客户端
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseAnonKey);

/**
 * 推荐系统组件
 */
const ReferralSystem = () => {
  const { address, isConnected } = useAccount();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [userSession, setUserSession] = useState(null);
  const [referralCode, setReferralCode] = useState('');
  const [referralStats, setReferralStats] = useState(null);
  const [referrals, setReferrals] = useState([]);
  const [rewards, setRewards] = useState([]);
  const [showApplyDialog, setShowApplyDialog] = useState(false);
  const [applyCode, setApplyCode] = useState('');
  const [applyLoading, setApplyLoading] = useState(false);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });

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

  // 加载推荐数据
  useEffect(() => {
    if (userSession) {
      fetchReferralData();
    }
  }, [userSession]);

  // 获取推荐数据
  const fetchReferralData = async () => {
    if (!userSession) return;

    setLoading(true);
    setError(null);

    try {
      // 并行请求数据
      const [codeResponse, statsResponse] = await Promise.all([
        fetch(`${supabaseUrl}/functions/v1/social-tasks/referrals/code`, {
          headers: {
            'Authorization': `Bearer ${userSession.access_token}`
          }
        }),
        fetch(`${supabaseUrl}/functions/v1/social-tasks/referrals/stats`, {
          headers: {
            'Authorization': `Bearer ${userSession.access_token}`
          }
        })
      ]);

      if (!codeResponse.ok || !statsResponse.ok) {
        throw new Error('获取推荐数据失败');
      }

      const codeResult = await codeResponse.json();
      const statsResult = await statsResponse.json();
      
      if (codeResult.success && statsResult.success) {
        setReferralCode(codeResult.data.code || '');
        setReferralStats(statsResult.data.stats || null);
        setReferrals(statsResult.data.referrals || []);
        setRewards(statsResult.data.rewards || []);
      } else {
        throw new Error('获取推荐数据失败');
      }
    } catch (err) {
      console.error('获取推荐数据错误:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // 复制推荐链接
  const copyReferralLink = () => {
    const link = `${window.location.origin}/register?ref=${referralCode}`;
    navigator.clipboard.writeText(link);
    setSnackbar({ open: true, message: '推荐链接已复制到剪贴板', severity: 'success' });
  };

  // 分享推荐链接
  const shareReferralLink = () => {
    const link = `${window.location.origin}/register?ref=${referralCode}`;
    const text = `加入SocioMint，完成社交任务赚取SM代币！使用我的推荐码 ${referralCode} 注册，我们都能获得奖励！`;
    
    if (navigator.share) {
      navigator.share({
        title: 'SocioMint推荐',
        text: text,
        url: link
      }).catch(err => console.error('分享失败:', err));
    } else {
      window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(link)}`, '_blank');
    }
  };

  // 应用推荐码
  const handleApplyCode = async () => {
    if (!userSession || !applyCode) return;

    setApplyLoading(true);

    try {
      const response = await fetch(`${supabaseUrl}/functions/v1/social-tasks/referrals/apply`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${userSession.access_token}`
        },
        body: JSON.stringify({ code: applyCode })
      });

      const result = await response.json();
      
      if (result.success) {
        setSnackbar({ open: true, message: result.message || '推荐码应用成功', severity: 'success' });
        setShowApplyDialog(false);
        fetchReferralData(); // 刷新数据
      } else {
        throw new Error(result.message || '应用推荐码失败');
      }
    } catch (err) {
      console.error('应用推荐码失败:', err);
      setSnackbar({ open: true, message: err.message, severity: 'error' });
    } finally {
      setApplyLoading(false);
    }
  };

  // 关闭提示
  const handleCloseSnackbar = () => {
    setSnackbar({ ...snackbar, open: false });
  };

  // 渲染加载状态
  if (loading) {
    return (
      <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', my: 4 }}>
        <CircularProgress sx={{ mb: 2 }} />
        <Typography>加载推荐系统数据...</Typography>
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

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h5" component="h2">
          病毒式推荐系统
        </Typography>
        <IconButton onClick={fetchReferralData} disabled={loading}>
          <RefreshIcon />
        </IconButton>
      </Box>

      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
            <BoltIcon sx={{ mr: 1 }} color="primary" />
            <Typography variant="h6">您的推荐码</Typography>
          </Box>

          {referralCode ? (
            <Box>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
                <TextField
                  fullWidth
                  variant="outlined"
                  value={referralCode}
                  InputProps={{
                    readOnly: true,
                    endAdornment: (
                      <IconButton onClick={copyReferralLink} size="small">
                        <CopyIcon />
                      </IconButton>
                    )
                  }}
                  sx={{ mr: 2 }}
                />
                <Button
                  variant="contained"
                  color="primary"
                  startIcon={<ShareIcon />}
                  onClick={shareReferralLink}
                >
                  分享
                </Button>
              </Box>

              <Alert severity="info" sx={{ mb: 2 }}>
                分享您的推荐码，当新用户使用它注册时，您和被推荐人都将获得奖励！
              </Alert>

              <Typography variant="body2" color="text.secondary">
                推荐链接: {window.location.origin}/register?ref={referralCode}
              </Typography>
            </Box>
          ) : (
            <Alert severity="warning">
              您还没有推荐码。请联系客服获取。
            </Alert>
          )}
        </CardContent>
      </Card>

      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12} md={6}>
          <Card sx={{ height: '100%' }}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <PeopleIcon sx={{ mr: 1 }} color="primary" />
                <Typography variant="h6">推荐统计</Typography>
              </Box>

              {referralStats ? (
                <Grid container spacing={2}>
                  <Grid item xs={6}>
                    <Paper elevation={0} sx={{ p: 2, bgcolor: 'background.default', borderRadius: 2 }}>
                      <Typography variant="body2" color="text.secondary" gutterBottom>直接推荐</Typography>
                      <Typography variant="h6">{referralStats.direct_count}</Typography>
                    </Paper>
                  </Grid>
                  <Grid item xs={6}>
                    <Paper elevation={0} sx={{ p: 2, bgcolor: 'background.default', borderRadius: 2 }}>
                      <Typography variant="body2" color="text.secondary" gutterBottom>活跃推荐</Typography>
                      <Typography variant="h6">{referralStats.active_count}</Typography>
                    </Paper>
                  </Grid>
                  <Grid item xs={6}>
                    <Paper elevation={0} sx={{ p: 2, bgcolor: 'background.default', borderRadius: 2 }}>
                      <Typography variant="body2" color="text.secondary" gutterBottom>总奖励(小红花)</Typography>
                      <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        <FlowerIcon color="error" fontSize="small" sx={{ mr: 0.5 }} />
                        <Typography variant="h6">{referralStats.total_flower_rewards}</Typography>
                      </Box>
                    </Paper>
                  </Grid>
                  <Grid item xs={6}>
                    <Paper elevation={0} sx={{ p: 2, bgcolor: 'background.default', borderRadius: 2 }}>
                      <Typography variant="body2" color="text.secondary" gutterBottom>总奖励(SM)</Typography>
                      <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        <TokenIcon color="primary" fontSize="small" sx={{ mr: 0.5 }} />
                        <Typography variant="h6">{referralStats.total_sm_rewards}</Typography>
                      </Box>
                    </Paper>
                  </Grid>
                </Grid>
              ) : (
                <Alert severity="info">
                  您还没有推荐数据。分享您的推荐码，邀请朋友加入！
                </Alert>
              )}
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={6}>
          <Card sx={{ height: '100%' }}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <BoltIcon sx={{ mr: 1 }} color="primary" />
                <Typography variant="h6">推荐收益倍数</Typography>
              </Box>

              {referralStats ? (
                <Box>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                    <Typography variant="body1">当前倍数</Typography>
                    <Chip 
                      label={`${referralStats.multiplier.toFixed(2)}x`} 
                      color="primary" 
                      variant="outlined" 
                    />
                  </Box>

                  <Box sx={{ mb: 3 }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                      <Typography variant="body2" color="text.secondary">
                        下一级所需: {referralStats.next_level_required} 活跃推荐
                      </Typography>
                      <Typography variant="body2">
                        {referralStats.progress.toFixed(0)}%
                      </Typography>
                    </Box>
                    <LinearProgress 
                      variant="determinate" 
                      value={referralStats.progress} 
                      sx={{ height: 8, borderRadius: 4 }} 
                    />
                  </Box>

                  <Alert severity="info">
                    推荐更多活跃用户，提高您的推荐收益倍数！每增加5个活跃推荐，倍数提升0.5x。
                  </Alert>
                </Box>
              ) : (
                <Alert severity="info">
                  开始推荐用户，获取推荐收益倍数！
                </Alert>
              )}
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      <Grid container spacing={3}>
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <PeopleIcon sx={{ mr: 1 }} color="primary" />
                <Typography variant="h6">我的推荐</Typography>
              </Box>

              <TableContainer component={Paper} variant="outlined">
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell>用户</TableCell>
                      <TableCell>注册时间</TableCell>
                      <TableCell align="center">状态</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {referrals.map((referral) => (
                      <TableRow key={referral.id}>
                        <TableCell>
                          {referral.wallet_address 
                            ? `${referral.wallet_address.slice(0, 6)}...${referral.wallet_address.slice(-4)}`
                            : '未绑定钱包'}
                        </TableCell>
                        <TableCell>
                          {new Date(referral.created_at).toLocaleDateString()}
                        </TableCell>
                        <TableCell align="center">
                          <Chip 
                            label={referral.status === 'active' ? '活跃' : '未激活'} 
                            color={referral.status === 'active' ? 'success' : 'default'} 
                            size="small"
                          />
                        </TableCell>
                      </TableRow>
                    ))}
                    {referrals.length === 0 && (
                      <TableRow>
                        <TableCell colSpan={3} align="center">暂无推荐记录</TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </TableContainer>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <TrophyIcon sx={{ mr: 1 }} color="primary" />
                <Typography variant="h6">推荐奖励</Typography>
              </Box>

              <TableContainer component={Paper} variant="outlined">
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell>时间</TableCell>
                      <TableCell>类型</TableCell>
                      <TableCell align="right">数量</TableCell>
                      <TableCell>原因</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {rewards.map((reward) => (
                      <TableRow key={reward.id}>
                        <TableCell>
                          {new Date(reward.created_at).toLocaleDateString()}
                        </TableCell>
                        <TableCell>
                          <Chip 
                            icon={reward.reward_type === 'flower' ? <FlowerIcon /> : <TokenIcon />}
                            label={reward.reward_type === 'flower' ? '小红花' : 'SM代币'} 
                            color={reward.reward_type === 'flower' ? 'error' : 'primary'} 
                            size="small"
                            variant="outlined"
                          />
                        </TableCell>
                        <TableCell align="right">{reward.amount}</TableCell>
                        <TableCell>{reward.reason}</TableCell>
                      </TableRow>
                    ))}
                    {rewards.length === 0 && (
                      <TableRow>
                        <TableCell colSpan={4} align="center">暂无奖励记录</TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </TableContainer>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      <Box sx={{ display: 'flex', justifyContent: 'center', mt: 3 }}>
        <Button 
          variant="outlined" 
          color="primary"
          onClick={() => setShowApplyDialog(true)}
        >
          应用推荐码
        </Button>
      </Box>

      {/* 应用推荐码对话框 */}
      <Dialog open={showApplyDialog} onClose={() => setShowApplyDialog(false)}>
        <DialogTitle>应用推荐码</DialogTitle>
        <DialogContent>
          <Typography variant="body2" paragraph>
            如果您是通过朋友推荐注册的，请输入他们的推荐码以获得奖励。
          </Typography>
          <TextField
            autoFocus
            margin="dense"
            label="推荐码"
            fullWidth
            variant="outlined"
            value={applyCode}
            onChange={(e) => setApplyCode(e.target.value)}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowApplyDialog(false)}>取消</Button>
          <Button 
            onClick={handleApplyCode} 
            color="primary"
            disabled={!applyCode || applyLoading}
          >
            {applyLoading ? <CircularProgress size={24} /> : '应用'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* 提示消息 */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={handleCloseSnackbar}
        message={snackbar.message}
        action={
          <IconButton size="small" color="inherit" onClick={handleCloseSnackbar}>
            <CloseIcon fontSize="small" />
          </IconButton>
        }
      />
    </Box>
  );
};

export default ReferralSystem;
