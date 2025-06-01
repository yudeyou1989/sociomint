import React, { useState, useEffect } from 'react';
import { Card, Box, Typography, Button, Chip, LinearProgress, Tooltip } from '@mui/material';
import { supabase } from '../lib/supabase';
import { useAuth } from '../hooks/useAuth';
import LockOpenIcon from '@mui/icons-material/LockOpen';
import LockIcon from '@mui/icons-material/Lock';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import { FaGift, FaLock, FaShare } from 'react-icons/fa';
import SocialShare from './SocialShare';

const TreasureBoxCard = ({ boxId, onBoxOpened }) => {
  const [box, setBox] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [openLoading, setOpenLoading] = useState(false);
  const { user } = useAuth();
  const [isOpeningBox, setIsOpeningBox] = useState(false);
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  
  // 获取宝箱详情
  useEffect(() => {
    async function fetchBoxDetails() {
      try {
        setLoading(true);
        
        // 从Supabase获取宝箱数据
        const { data, error } = await supabase
          .from('treasure_boxes')
          .select(`
            *,
            tier:box_tiers(*),
            rewards:box_rewards(*)
          `)
          .eq('id', boxId)
          .single();
        
        if (error) throw error;
        
        setBox(data);
      } catch (error) {
        console.error('Error fetching treasure box:', error);
        setError(error.message);
      } finally {
        setLoading(false);
      }
    }
    
    if (boxId) {
      fetchBoxDetails();
    }
  }, [boxId]);
  
  // 打开宝箱
  const handleOpenBox = async () => {
    if (!user || !box || box.is_opened) return;
    
    try {
      setOpenLoading(true);
      
      // 更新宝箱状态为已打开
      const { error } = await supabase
        .from('treasure_boxes')
        .update({ 
          is_opened: true,
          opened_at: new Date().toISOString(),
          status: 'opened'
        })
        .eq('id', boxId);
      
      if (error) throw error;
      
      // 如果有回调函数，通知父组件宝箱已打开
      if (onBoxOpened) {
        onBoxOpened(boxId);
      }
      
      // 重新获取宝箱信息
      const { data: updatedBox, error: fetchError } = await supabase
        .from('treasure_boxes')
        .select(`
          *,
          tier:box_tiers(*),
          rewards:box_rewards(*)
        `)
        .eq('id', boxId)
        .single();
      
      if (fetchError) throw fetchError;
      
      setBox(updatedBox);
    } catch (error) {
      console.error('Error opening treasure box:', error);
      setError(error.message);
    } finally {
      setOpenLoading(false);
    }
  };
  
  // 获取宝箱状态背景色
  const getStatusColor = () => {
    if (!box) return 'default';
    
    switch (box.status) {
      case 'active':
        return 'success';
      case 'opened':
        return 'primary';
      case 'expired':
        return 'error';
      case 'burned':
        return 'warning';
      default:
        return 'default';
    }
  };
  
  // 处理分享事件
  const handleShare = (platform) => {
    console.log(`通过${platform}分享宝箱`);
    // 这里可以添加分享事件跟踪代码
  };
  
  // 渲染加载状态
  if (loading) {
    return (
      <Card sx={{ minWidth: 300, p: 2, height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center' }}>
        <Typography variant="body2" color="text.secondary" gutterBottom>
          加载宝箱中...
        </Typography>
        <LinearProgress sx={{ width: '100%', mt: 1 }} />
      </Card>
    );
  }
  
  // 渲染错误状态
  if (error) {
    return (
      <Card sx={{ minWidth: 300, p: 2, height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center' }}>
        <Typography variant="body2" color="error" gutterBottom>
          无法加载宝箱: {error}
        </Typography>
      </Card>
    );
  }
  
  // 渲染宝箱不存在状态
  if (!box) {
    return (
      <Card sx={{ minWidth: 300, p: 2, height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center' }}>
        <Typography variant="body2" color="text.secondary" gutterBottom>
          宝箱不存在或已被移除
        </Typography>
      </Card>
    );
  }
  
  return (
    <Card sx={{ minWidth: 300, p: 2, height: '100%', display: 'flex', flexDirection: 'column' }}>
      {/* 宝箱标题和状态 */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Typography variant="h6" component="div">
          {box.name}
        </Typography>
        <Chip 
          label={box.status.toUpperCase()} 
          color={getStatusColor()}
          size="small"
        />
      </Box>
      
      {/* 宝箱层级 */}
      {box.tier && (
        <Tooltip title={`${box.tier.description}`}>
          <Chip 
            label={box.tier.name} 
            color="secondary"
            size="small"
            sx={{ mb: 2, alignSelf: 'flex-start' }}
          />
        </Tooltip>
      )}
      
      {/* 宝箱描述 */}
      <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
        {box.description || '这个宝箱没有描述...'}
      </Typography>
      
      {/* 宝箱参与者信息 */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
        <Typography variant="body2" color="text.secondary">
          参与者: {box.current_applicants}/{box.max_applicants}
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ display: 'flex', alignItems: 'center' }}>
          <AccessTimeIcon fontSize="small" sx={{ mr: 0.5 }} />
          {box.is_opened 
            ? `已打开于 ${new Date(box.opened_at).toLocaleDateString()}`
            : `创建于 ${new Date(box.created_at).toLocaleDateString()}`
          }
        </Typography>
      </Box>
      
      {/* 打开宝箱按钮 */}
      <Box sx={{ mt: 'auto' }}>
        <Button
          variant="contained"
          color={box.is_opened ? "primary" : "success"}
          fullWidth
          startIcon={box.is_opened ? <LockOpenIcon /> : <LockIcon />}
          disabled={box.is_opened || openLoading || (user?.id !== box.user_id)}
          onClick={handleOpenBox}
        >
          {openLoading ? '处理中...' : (box.is_opened ? '宝箱已打开' : '打开宝箱')}
        </Button>
      </Box>
      
      {/* 分享按钮 */}
      <div className="flex justify-between items-center mt-4">
        <SocialShare 
          title={`快来看看我在SocioMint发现的${box.name || '神秘宝箱'}！`}
          description={box.description || '加入SocioMint，探索更多神秘宝箱和奖励！'}
          imageUrl={box.image || '/images/treasure-box-default.png'}
          hashtags={['SocioMint', 'Crypto', 'NFT', 'TreasureBox']}
          dropdown={true}
          platforms={['twitter', 'telegram', 'facebook']}
          onShare={handleShare}
        />
      </div>
    </Card>
  );
};

export default TreasureBoxCard; 