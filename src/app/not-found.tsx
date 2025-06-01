import React from 'react';
import Link from 'next/link';
import { Container, Typography, Button, Box, Paper } from '@mui/material';
import { FaHome, FaSearch } from 'react-icons/fa';

/**
 * 全局 404 页面
 * 
 * 当访问不存在的路径时显示此页面
 * 在 Next.js App Router 中，这个文件必须命名为 not-found.tsx
 */
export default function NotFound() {
  return (
    <Container maxWidth="md" sx={{ py: 8 }}>
      <Paper 
        elevation={3} 
        sx={{ 
          p: 4, 
          borderRadius: 2,
          textAlign: 'center'
        }}
      >
        <Typography 
          variant="h1" 
          component="h1" 
          sx={{ 
            fontSize: { xs: '6rem', md: '8rem' },
            fontWeight: 'bold',
            color: 'primary.main',
            mb: 2
          }}
        >
          404
        </Typography>
        
        <Typography 
          variant="h4" 
          component="h2" 
          gutterBottom
          sx={{ mb: 3 }}
        >
          页面未找到
        </Typography>
        
        <Typography 
          variant="body1" 
          color="text.secondary"
          sx={{ mb: 4, maxWidth: '600px', mx: 'auto' }}
        >
          您访问的页面不存在或已被移除。请检查URL是否正确，或使用下面的按钮返回首页。
        </Typography>
        
        <Box sx={{ display: 'flex', justifyContent: 'center', gap: 2, flexWrap: 'wrap' }}>
          <Button 
            variant="contained" 
            color="primary" 
            size="large"
            component={Link}
            href="/"
            startIcon={<FaHome />}
          >
            返回首页
          </Button>
          
          <Button 
            variant="outlined" 
            color="primary" 
            size="large"
            component={Link}
            href="/search"
            startIcon={<FaSearch />}
          >
            搜索内容
          </Button>
        </Box>
      </Paper>
    </Container>
  );
}
