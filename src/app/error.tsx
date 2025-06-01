'use client';

import React, { useEffect } from 'react';
import { Button, Container, Typography, Box, Paper } from '@mui/material';
import ErrorMonitoring from '@/services/errorMonitoring';

/**
 * 全局错误处理组件
 * 
 * 这个组件会捕获并显示应用程序中的错误
 * 在 Next.js App Router 中，这个文件必须命名为 error.tsx
 */
export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // 记录错误
    ErrorMonitoring.captureError(error, ErrorMonitoring.ErrorSeverity.HIGH, {
      component: 'GlobalError',
      path: window.location.pathname,
    });
  }, [error]);

  return (
    <Container maxWidth="md" sx={{ py: 8 }}>
      <Paper 
        elevation={3} 
        sx={{ 
          p: 4, 
          borderRadius: 2,
          border: '1px solid',
          borderColor: 'error.light',
          bgcolor: 'error.lighter'
        }}
      >
        <Box sx={{ textAlign: 'center', mb: 4 }}>
          <Typography variant="h4" component="h1" color="error" gutterBottom>
            出现了一些问题
          </Typography>
          <Typography variant="body1" color="text.secondary">
            应用程序遇到了错误。我们已记录此问题并将尽快修复。
          </Typography>
        </Box>

        <Box sx={{ mb: 4 }}>
          <Typography variant="subtitle1" fontWeight="bold" gutterBottom>
            错误详情:
          </Typography>
          <Paper 
            variant="outlined" 
            sx={{ 
              p: 2, 
              bgcolor: 'background.paper',
              overflowX: 'auto'
            }}
          >
            <Typography variant="body2" component="pre" sx={{ fontFamily: 'monospace' }}>
              {error.message}
              {error.stack && (
                <>
                  <br />
                  <br />
                  {error.stack}
                </>
              )}
            </Typography>
          </Paper>
        </Box>

        <Box sx={{ textAlign: 'center' }}>
          <Button 
            variant="contained" 
            color="primary" 
            onClick={reset}
            size="large"
          >
            重试
          </Button>
          <Button 
            variant="outlined" 
            color="primary" 
            onClick={() => window.location.href = '/'}
            size="large"
            sx={{ ml: 2 }}
          >
            返回首页
          </Button>
        </Box>
      </Paper>
    </Container>
  );
}
