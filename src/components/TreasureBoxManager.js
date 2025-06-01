import React, { useState, useEffect } from 'react';
import { 
  Box, 
  Typography, 
  Button, 
  TextField, 
  Select, 
  MenuItem, 
  FormControl, 
  InputLabel, 
  Grid, 
  Paper, 
  Switch, 
  FormControlLabel,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Tooltip,
  Alert,
  CircularProgress
} from '@mui/material';
import { Edit, Delete, Add, Refresh, Info } from '@mui/icons-material';
import { supabase } from '../lib/supabase';
import { useAuth } from '../hooks/useAuth';

const TreasureBoxManager = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [boxes, setBoxes] = useState([]);
  const [tiers, setTiers] = useState([]);
  const [isAdmin, setIsAdmin] = useState(false);
  const [openDialog, setOpenDialog] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [selectedBox, setSelectedBox] = useState(null);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  
  // 表单数据
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    tier_id: '',
    min_applicants: 1,
    max_applicants: 1,
    is_public: true
  });

  // 检查用户是否为管理员
  useEffect(() => {
    const checkAdmin = async () => {
      if (!user) return;
      
      try {
        const { data, error } = await supabase
          .from('profiles')
          .select('is_admin')
          .eq('user_id', user.id)
          .single();
        
        if (error) throw error;
        setIsAdmin(data?.is_admin || false);
      } catch (error) {
        console.error('验证管理员身份失败:', error);
        setIsAdmin(false);
      }
    };
    
    checkAdmin();
  }, [user]);

  // 加载宝箱数据
  useEffect(() => {
    if (!isAdmin) return;
    
    fetchBoxes();
    fetchTiers();
  }, [isAdmin]);

  // 获取所有宝箱
  const fetchBoxes = async () => {
    try {
      setLoading(true);
      
      const { data, error } = await supabase
        .from('treasure_boxes')
        .select(`
          *,
          tier:box_tiers(id, name)
        `)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      
      setBoxes(data || []);
    } catch (error) {
      console.error('获取宝箱列表失败:', error);
      setError('获取宝箱列表失败');
    } finally {
      setLoading(false);
    }
  };

  // 获取所有宝箱层级
  const fetchTiers = async () => {
    try {
      const { data, error } = await supabase
        .from('box_tiers')
        .select('*')
        .order('probability', { ascending: false });
      
      if (error) throw error;
      
      setTiers(data || []);
    } catch (error) {
      console.error('获取宝箱层级失败:', error);
    }
  };

  // 打开创建/编辑对话框
  const handleOpenDialog = (box = null) => {
    if (box) {
      // 编辑模式
      setFormData({
        name: box.name,
        description: box.description || '',
        tier_id: box.tier_id,
        min_applicants: box.min_applicants,
        max_applicants: box.max_applicants,
        is_public: box.is_public
      });
      setSelectedBox(box);
      setEditMode(true);
    } else {
      // 创建模式
      setFormData({
        name: '',
        description: '',
        tier_id: '',
        min_applicants: 1,
        max_applicants: 1,
        is_public: true
      });
      setSelectedBox(null);
      setEditMode(false);
    }
    
    setOpenDialog(true);
  };

  // 关闭对话框
  const handleCloseDialog = () => {
    setOpenDialog(false);
    setError('');
    setSuccess('');
  };

  // 处理表单输入变化
  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData({
      ...formData,
      [name]: type === 'checkbox' ? checked : value
    });
  };

  // 保存宝箱
  const handleSaveBox = async () => {
    try {
      setError('');
      setSuccess('');
      
      // 验证表单
      if (!formData.name || !formData.tier_id) {
        setError('名称和层级为必填项');
        return;
      }
      
      if (formData.min_applicants < 1 || formData.max_applicants < formData.min_applicants) {
        setError('参与者数量设置无效');
        return;
      }
      
      if (editMode && selectedBox) {
        // 更新宝箱
        const { error } = await supabase
          .from('treasure_boxes')
          .update({
            name: formData.name,
            description: formData.description,
            tier_id: formData.tier_id,
            min_applicants: formData.min_applicants,
            max_applicants: formData.max_applicants,
            is_public: formData.is_public,
            updated_at: new Date().toISOString()
          })
          .eq('id', selectedBox.id);
        
        if (error) throw error;
        
        setSuccess('宝箱更新成功');
      } else {
        // 创建新宝箱
        const { error } = await supabase
          .from('treasure_boxes')
          .insert([{
            name: formData.name,
            description: formData.description,
            tier_id: formData.tier_id,
            min_applicants: formData.min_applicants,
            max_applicants: formData.max_applicants,
            is_public: formData.is_public,
            user_id: user.id,
            creator_id: user.id,
            status: 'active'
          }]);
        
        if (error) throw error;
        
        setSuccess('宝箱创建成功');
      }
      
      // 重新加载宝箱列表
      fetchBoxes();
      
      // 3秒后关闭对话框
      setTimeout(() => {
        handleCloseDialog();
      }, 3000);
      
    } catch (error) {
      console.error('保存宝箱失败:', error);
      setError('保存宝箱失败: ' + error.message);
    }
  };

  // 删除宝箱
  const handleDeleteBox = async (box) => {
    if (!window.confirm(`确定要删除宝箱 "${box.name}" 吗？此操作不可撤销。`)) {
      return;
    }
    
    try {
      const { error } = await supabase
        .from('treasure_boxes')
        .delete()
        .eq('id', box.id);
      
      if (error) throw error;
      
      // 重新加载宝箱列表
      fetchBoxes();
      
    } catch (error) {
      console.error('删除宝箱失败:', error);
      alert('删除宝箱失败: ' + error.message);
    }
  };

  // 如果不是管理员，显示提示信息
  if (!isAdmin) {
    return (
      <Box sx={{ p: 3 }}>
        <Alert severity="warning">
          只有管理员可以访问此页面。如需管理宝箱，请联系管理员提升您的权限。
        </Alert>
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      <Paper sx={{ p: 3, mb: 3 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
          <Typography variant="h5" component="h1">
            宝箱管理
          </Typography>
          <Box>
            <Button 
              variant="outlined" 
              startIcon={<Refresh />} 
              onClick={fetchBoxes}
              sx={{ mr: 2 }}
            >
              刷新
            </Button>
            <Button 
              variant="contained" 
              color="primary" 
              startIcon={<Add />} 
              onClick={() => handleOpenDialog()}
            >
              创建宝箱
            </Button>
          </Box>
        </Box>

        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
            <CircularProgress />
          </Box>
        ) : (
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>ID</TableCell>
                  <TableCell>名称</TableCell>
                  <TableCell>层级</TableCell>
                  <TableCell>状态</TableCell>
                  <TableCell>已开启</TableCell>
                  <TableCell>参与者</TableCell>
                  <TableCell>创建时间</TableCell>
                  <TableCell>操作</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {boxes.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} align="center">
                      暂无宝箱数据
                    </TableCell>
                  </TableRow>
                ) : (
                  boxes.map((box) => (
                    <TableRow key={box.id}>
                      <TableCell>{box.id.substring(0, 8)}...</TableCell>
                      <TableCell>{box.name}</TableCell>
                      <TableCell>{box.tier?.name || '未知'}</TableCell>
                      <TableCell>{box.status}</TableCell>
                      <TableCell>{box.is_opened ? '是' : '否'}</TableCell>
                      <TableCell>{box.current_applicants}/{box.max_applicants}</TableCell>
                      <TableCell>{new Date(box.created_at).toLocaleString()}</TableCell>
                      <TableCell>
                        <Tooltip title="编辑宝箱">
                          <IconButton 
                            color="primary" 
                            onClick={() => handleOpenDialog(box)}
                            disabled={box.is_opened}
                          >
                            <Edit />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="删除宝箱">
                          <IconButton 
                            color="error" 
                            onClick={() => handleDeleteBox(box)}
                            disabled={box.is_opened}
                          >
                            <Delete />
                          </IconButton>
                        </Tooltip>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </TableContainer>
        )}
      </Paper>
      
      {/* 创建/编辑宝箱对话框 */}
      <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="md" fullWidth>
        <DialogTitle>
          {editMode ? '编辑宝箱' : '创建新宝箱'}
        </DialogTitle>
        <DialogContent>
          {error && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {error}
            </Alert>
          )}
          {success && (
            <Alert severity="success" sx={{ mb: 2 }}>
              {success}
            </Alert>
          )}
          
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12}>
              <TextField
                label="宝箱名称"
                name="name"
                value={formData.name}
                onChange={handleInputChange}
                fullWidth
                required
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                label="宝箱描述"
                name="description"
                value={formData.description}
                onChange={handleInputChange}
                fullWidth
                multiline
                rows={3}
              />
            </Grid>
            <Grid item xs={12}>
              <FormControl fullWidth required>
                <InputLabel>宝箱层级</InputLabel>
                <Select
                  name="tier_id"
                  value={formData.tier_id}
                  onChange={handleInputChange}
                  label="宝箱层级"
                >
                  {tiers.map((tier) => (
                    <MenuItem key={tier.id} value={tier.id}>
                      {tier.name} - {(tier.probability * 100).toFixed(2)}% 概率
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={6}>
              <TextField
                label="最小参与者"
                name="min_applicants"
                type="number"
                value={formData.min_applicants}
                onChange={handleInputChange}
                fullWidth
                InputProps={{ inputProps: { min: 1 } }}
              />
            </Grid>
            <Grid item xs={6}>
              <TextField
                label="最大参与者"
                name="max_applicants"
                type="number"
                value={formData.max_applicants}
                onChange={handleInputChange}
                fullWidth
                InputProps={{ inputProps: { min: formData.min_applicants } }}
              />
            </Grid>
            <Grid item xs={12}>
              <FormControlLabel
                control={
                  <Switch
                    name="is_public"
                    checked={formData.is_public}
                    onChange={handleInputChange}
                    color="primary"
                  />
                }
                label="公开宝箱（所有用户可见）"
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>取消</Button>
          <Button onClick={handleSaveBox} variant="contained" color="primary">
            保存
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default TreasureBoxManager; 