import React, { useState, useEffect } from 'react';
import { 
  Box, 
  Paper, 
  Typography, 
  Grid, 
  Card, 
  CardContent, 
  Divider,
  CircularProgress,
  Alert,
  Chip
} from '@mui/material';
import {
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  ResponsiveContainer
} from 'recharts';
import { supabase } from '../lib/supabase';

const TIER_COLORS = {
  'Common': '#8884d8',
  'Uncommon': '#82ca9d',
  'Rare': '#ffc658',
  'Epic': '#ff7300',
  'Legendary': '#ff0000'
};

const STATUS_COLORS = {
  'active': '#4caf50',
  'opened': '#2196f3',
  'burned': '#f44336',
  'expired': '#ff9800'
};

const TreasureBoxStats = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [stats, setStats] = useState({
    totalBoxes: 0,
    activeBoxes: 0,
    openedBoxes: 0,
    uniqueUsers: 0,
    avgHoursToOpen: 0
  });
  const [tierDistribution, setTierDistribution] = useState([]);
  const [statusDistribution, setStatusDistribution] = useState([]);
  const [monthlyCreation, setMonthlyCreation] = useState([]);
  const [topUsers, setTopUsers] = useState([]);

  useEffect(() => {
    fetchStatistics();
  }, []);

  // 获取所有统计数据
  const fetchStatistics = async () => {
    try {
      setLoading(true);
      
      // 获取基本统计信息
      const { data: statsData, error: statsError } = await supabase
        .from('box_statistics')
        .select('*')
        .single();
      
      if (statsError) throw statsError;
      
      // 获取层级分布
      const { data: tierData, error: tierError } = await supabase
        .from('treasure_boxes')
        .select('tier:box_tiers(name)')
        .not('tier', 'is', null);
      
      if (tierError) throw tierError;
      
      // 获取状态分布
      const { data: statusData, error: statusError } = await supabase
        .from('treasure_boxes')
        .select('status');
      
      if (statusError) throw statusError;
      
      // 获取每月创建统计
      const { data: monthlyData, error: monthlyError } = await supabase
        .rpc('get_monthly_box_creation');
      
      if (monthlyError && monthlyError.message !== 'function get_monthly_box_creation does not exist') {
        throw monthlyError;
      }
      
      // 获取每月数据的替代方案（如果RPC不存在）
      let altMonthlyData = [];
      if (!monthlyData) {
        const { data: altData, error: altError } = await supabase
          .from('treasure_boxes')
          .select('created_at');
        
        if (altError) throw altError;
        
        // 手动处理日期统计
        if (altData) {
          const monthCounts = {};
          altData.forEach(box => {
            const date = new Date(box.created_at);
            const yearMonth = `${date.getFullYear()}-${(date.getMonth() + 1).toString().padStart(2, '0')}`;
            monthCounts[yearMonth] = (monthCounts[yearMonth] || 0) + 1;
          });
          
          altMonthlyData = Object.entries(monthCounts).map(([month, count]) => ({
            month,
            count
          }));
        }
      }
      
      // 获取排名前5的用户
      const { data: userData, error: userError } = await supabase
        .from('user_box_statistics')
        .select(`
          user_id,
          total_boxes,
          opened_boxes,
          profiles:user_id(username)
        `)
        .order('total_boxes', { ascending: false })
        .limit(5);
      
      if (userError) throw userError;
      
      // 处理层级分布数据
      const tierCounts = {};
      tierData.forEach(box => {
        const tierName = box.tier.name;
        tierCounts[tierName] = (tierCounts[tierName] || 0) + 1;
      });
      
      const formattedTierData = Object.entries(tierCounts).map(([name, value]) => ({
        name,
        value
      }));
      
      // 处理状态分布数据
      const statusCounts = {};
      statusData.forEach(box => {
        statusCounts[box.status] = (statusCounts[box.status] || 0) + 1;
      });
      
      const formattedStatusData = Object.entries(statusCounts).map(([name, value]) => ({
        name,
        value
      }));
      
      // 更新状态
      setStats({
        totalBoxes: statsData.total_boxes || 0,
        activeBoxes: statsData.active_boxes || 0,
        openedBoxes: statsData.opened_boxes || 0,
        uniqueUsers: statsData.unique_users || 0,
        avgHoursToOpen: statsData.avg_hours_to_open || 0
      });
      
      setTierDistribution(formattedTierData);
      setStatusDistribution(formattedStatusData);
      setMonthlyCreation(monthlyData || altMonthlyData);
      setTopUsers(userData || []);
      
    } catch (error) {
      console.error('获取统计数据失败:', error);
      setError('获取统计数据失败: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '300px' }}>
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Alert severity="error" sx={{ mb: 2 }}>
        {error}
      </Alert>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h5" component="h1" gutterBottom>
        宝箱系统统计
      </Typography>
      
      {/* 基本统计卡片 */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ height: '100%' }}>
            <CardContent>
              <Typography variant="h6" component="div" color="primary" gutterBottom>
                总宝箱数
              </Typography>
              <Typography variant="h4" component="div">
                {stats.totalBoxes}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ height: '100%' }}>
            <CardContent>
              <Typography variant="h6" component="div" color="success.main" gutterBottom>
                活跃宝箱
              </Typography>
              <Typography variant="h4" component="div">
                {stats.activeBoxes}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ height: '100%' }}>
            <CardContent>
              <Typography variant="h6" component="div" color="info.main" gutterBottom>
                已开启宝箱
              </Typography>
              <Typography variant="h4" component="div">
                {stats.openedBoxes}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ height: '100%' }}>
            <CardContent>
              <Typography variant="h6" component="div" color="warning.main" gutterBottom>
                参与用户
              </Typography>
              <Typography variant="h4" component="div">
                {stats.uniqueUsers}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
      
      {/* 图表区域 */}
      <Grid container spacing={3}>
        {/* 层级分布饼图 */}
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 3, height: '100%' }}>
            <Typography variant="h6" gutterBottom>
              宝箱层级分布
            </Typography>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={tierDistribution}
                  cx="50%"
                  cy="50%"
                  labelLine={true}
                  label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {tierDistribution.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={TIER_COLORS[entry.name] || `#${Math.floor(Math.random()*16777215).toString(16)}`} />
                  ))}
                </Pie>
                <Tooltip formatter={(value) => [`${value} 个宝箱`, '数量']} />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </Paper>
        </Grid>
        
        {/* 状态分布饼图 */}
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 3, height: '100%' }}>
            <Typography variant="h6" gutterBottom>
              宝箱状态分布
            </Typography>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={statusDistribution}
                  cx="50%"
                  cy="50%"
                  labelLine={true}
                  label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {statusDistribution.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={STATUS_COLORS[entry.name] || `#${Math.floor(Math.random()*16777215).toString(16)}`} />
                  ))}
                </Pie>
                <Tooltip formatter={(value) => [`${value} 个宝箱`, '数量']} />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </Paper>
        </Grid>
        
        {/* 月度创建趋势 */}
        <Grid item xs={12}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              月度宝箱创建趋势
            </Typography>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart
                data={monthlyCreation}
                margin={{
                  top: 5,
                  right: 30,
                  left: 20,
                  bottom: 5,
                }}
              >
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip formatter={(value) => [`${value} 个宝箱`, '创建数量']} />
                <Legend />
                <Bar dataKey="count" name="宝箱数量" fill="#8884d8" />
              </BarChart>
            </ResponsiveContainer>
          </Paper>
        </Grid>
        
        {/* 排名前5的用户 */}
        <Grid item xs={12}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              宝箱拥有者排行
            </Typography>
            <Box sx={{ mt: 2 }}>
              {topUsers.length === 0 ? (
                <Typography variant="body2" color="text.secondary">
                  暂无用户数据
                </Typography>
              ) : (
                <>
                  {topUsers.map((user, index) => (
                    <Box key={user.user_id} sx={{ mb: 2 }}>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                        <Box sx={{ display: 'flex', alignItems: 'center' }}>
                          <Chip 
                            label={index + 1} 
                            color={index === 0 ? "primary" : index === 1 ? "secondary" : "default"} 
                            size="small" 
                            sx={{ mr: 2 }}
                          />
                          <Typography variant="body1">
                            {user.profiles?.username || `用户 ${user.user_id.substring(0, 8)}`}
                          </Typography>
                        </Box>
                        <Typography variant="body2">
                          总宝箱: {user.total_boxes} | 已开启: {user.opened_boxes}
                        </Typography>
                      </Box>
                      <Divider />
                    </Box>
                  ))}
                </>
              )}
            </Box>
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
};

export default TreasureBoxStats; 