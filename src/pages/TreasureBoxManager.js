import React, { useState } from 'react';
import { Box, Tabs, Tab, Typography, Container, Paper } from '@mui/material';
import TreasureBoxManager from '../components/TreasureBoxManager';
import TreasureBoxStats from '../components/TreasureBoxStats';
import { useAuth } from '../hooks/useAuth';

function TabPanel(props) {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`box-tabpanel-${index}`}
      aria-labelledby={`box-tab-${index}`}
      {...other}
    >
      {value === index && (
        <Box sx={{ py: 3 }}>
          {children}
        </Box>
      )}
    </div>
  );
}

function a11yProps(index) {
  return {
    id: `box-tab-${index}`,
    'aria-controls': `box-tabpanel-${index}`,
  };
}

const TreasureBoxManagerPage = () => {
  const [tabValue, setTabValue] = useState(0);
  const { user, isLoading } = useAuth();

  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
  };

  // 如果正在加载用户信息，显示加载状态
  if (isLoading) {
    return (
      <Container maxWidth="lg" sx={{ mt: 4 }}>
        <Paper sx={{ p: 3, textAlign: 'center' }}>
          <Typography>正在加载...</Typography>
        </Paper>
      </Container>
    );
  }

  // 如果用户未登录，显示提示信息
  if (!user) {
    return (
      <Container maxWidth="lg" sx={{ mt: 4 }}>
        <Paper sx={{ p: 3, textAlign: 'center' }}>
          <Typography variant="h5" color="error">
            请先登录
          </Typography>
          <Typography sx={{ mt: 2 }}>
            您需要登录才能访问宝箱管理页面。
          </Typography>
        </Paper>
      </Container>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Paper sx={{ p: 3 }}>
        <Typography variant="h4" component="h1" gutterBottom>
          宝箱系统管理
        </Typography>
        <Typography variant="body1" color="text.secondary" paragraph>
          在此页面您可以管理宝箱系统的各项功能，包括创建和编辑宝箱，以及查看系统统计数据。
        </Typography>

        <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
          <Tabs
            value={tabValue}
            onChange={handleTabChange}
            aria-label="宝箱管理选项卡"
          >
            <Tab label="宝箱管理" {...a11yProps(0)} />
            <Tab label="统计数据" {...a11yProps(1)} />
          </Tabs>
        </Box>

        <TabPanel value={tabValue} index={0}>
          <TreasureBoxManager />
        </TabPanel>

        <TabPanel value={tabValue} index={1}>
          <TreasureBoxStats />
        </TabPanel>
      </Paper>
    </Container>
  );
};

export default TreasureBoxManagerPage; 