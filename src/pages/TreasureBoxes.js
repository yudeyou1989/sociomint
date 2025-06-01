import React, { useState, useEffect } from 'react';
import { Container, Grid, Typography, Button, Box, TextField, MenuItem, CircularProgress } from '@mui/material';
import { supabase } from '../lib/supabase';
import { useAuth } from '../hooks/useAuth';
import TreasureBoxCard from '../components/TreasureBoxCard';
import AddIcon from '@mui/icons-material/Add';
import FilterListIcon from '@mui/icons-material/FilterList';

const TreasureBoxes = () => {
  const [boxes, setBoxes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filter, setFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const { user } = useAuth();
  
  // 获取宝箱列表
  useEffect(() => {
    fetchTreasureBoxes();
  }, [filter]);
  
  // 获取宝箱列表的函数
  const fetchTreasureBoxes = async () => {
    try {
      setLoading(true);
      
      // 构建基本查询
      let query = supabase
        .from('treasure_boxes')
        .select(`
          *,
          tier:box_tiers(*)
        `);
      
      // 根据筛选条件调整查询
      switch (filter) {
        case 'my':
          query = query.eq('user_id', user?.id);
          break;
        case 'created':
          query = query.eq('creator_id', user?.id);
          break;
        case 'active':
          query = query.eq('status', 'active');
          break;
        case 'opened':
          query = query.eq('status', 'opened');
          break;
        default:
          // 默认显示所有公开宝箱和用户自己的宝箱
          if (user) {
            query = query.or(`is_public.eq.true,user_id.eq.${user.id}`);
          } else {
            query = query.eq('is_public', true);
          }
      }
      
      // 添加排序
      query = query.order('created_at', { ascending: false });
      
      const { data, error } = await query;
      
      if (error) throw error;
      
      setBoxes(data || []);
    } catch (error) {
      console.error('Error fetching treasure boxes:', error);
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };
  
  // 处理宝箱打开的回调
  const handleBoxOpened = (boxId) => {
    // 刷新宝箱列表
    fetchTreasureBoxes();
  };
  
  // 应用搜索过滤
  const filteredBoxes = boxes.filter(box => 
    box.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (box.description && box.description.toLowerCase().includes(searchTerm.toLowerCase()))
  );
  
  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
        <Typography variant="h4" component="h1" gutterBottom>
          宝箱系统
        </Typography>
        
        {user && (
          <Button
            variant="contained"
            color="primary"
            startIcon={<AddIcon />}
            href="/create-treasure-box"
          >
            创建宝箱
          </Button>
        )}
      </Box>
      
      {/* 筛选和搜索工具栏 */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Box sx={{ display: 'flex', alignItems: 'center' }}>
          <FilterListIcon sx={{ mr: 1, color: 'text.secondary' }} />
          <TextField
            select
            variant="outlined"
            size="small"
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            sx={{ minWidth: 150 }}
          >
            <MenuItem value="all">所有宝箱</MenuItem>
            {user && <MenuItem value="my">我的宝箱</MenuItem>}
            {user && <MenuItem value="created">我创建的</MenuItem>}
            <MenuItem value="active">未打开的</MenuItem>
            <MenuItem value="opened">已打开的</MenuItem>
          </TextField>
        </Box>
        
        <TextField
          variant="outlined"
          size="small"
          placeholder="搜索宝箱..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          sx={{ width: 250 }}
        />
      </Box>
      
      {/* 宝箱列表 */}
      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
          <CircularProgress />
        </Box>
      ) : error ? (
        <Typography color="error" align="center" sx={{ mt: 4 }}>
          加载宝箱时出错: {error}
        </Typography>
      ) : filteredBoxes.length === 0 ? (
        <Typography align="center" color="text.secondary" sx={{ mt: 4 }}>
          没有找到符合条件的宝箱
        </Typography>
      ) : (
        <Grid container spacing={3}>
          {filteredBoxes.map((box) => (
            <Grid item xs={12} sm={6} md={4} key={box.id}>
              <TreasureBoxCard 
                boxId={box.id} 
                onBoxOpened={handleBoxOpened}
              />
            </Grid>
          ))}
        </Grid>
      )}
    </Container>
  );
};

export default TreasureBoxes; 