import React from 'react';
import { Box, CircularProgress, Typography } from '@mui/material';

/**
 * 全局加载状态组件
 * 
 * 在页面加载过程中显示此组件
 * 在 Next.js App Router 中，这个文件必须命名为 loading.tsx
 */
export default function Loading() {
  return (
    <Box 
      sx={{ 
        display: 'flex', 
        flexDirection: 'column',
        justifyContent: 'center', 
        alignItems: 'center',
        minHeight: '50vh',
        py: 8
      }}
    >
      <CircularProgress size={60} thickness={4} sx={{ mb: 3 }} />
      <Typography variant="h6" color="text.secondary">
        加载中...
      </Typography>
    </Box>
  );
}
