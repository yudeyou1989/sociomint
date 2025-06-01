'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { ethers } from 'ethers';
import {
  Box, Button, Typography, TextField, Card, CardContent,
  CircularProgress, Divider, Alert, Dialog, DialogTitle,
  DialogContent, DialogActions, Snackbar, Tabs, Tab,
  useTheme, useMediaQuery, IconButton
} from '@mui/material';
import { Line } from 'react-chartjs-2';
import {
  Chart as ChartJS, CategoryScale, LinearScale, PointElement,
  LineElement, Title, Tooltip, Legend
} from 'chart.js';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import LaunchIcon from '@mui/icons-material/Launch';
import RefreshIcon from '@mui/icons-material/Refresh';
import TranslateIcon from '@mui/icons-material/Translate';
import { useWallet } from '@/contexts/WalletContext';
import contractService, { ExchangeStats } from '@/services/contractService';
import toast from 'react-hot-toast';
// BSC测试网合约地址
const EXCHANGE_CONTRACT_ADDRESS = '0x1B03DD8dCeD4c7D38ABA907671e5e1064D10F8A8';

// 注册Chart.js组件
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
);

// 交易历史记录项类型
interface TransactionHistoryItem {
  txHash: string;
  date: Date;
  bnbAmount: ethers.BigNumber;
  tokenAmount: ethers.BigNumber;
  round: number;
}

// 价格历史数据类型
interface PriceData {
  round: number;
  price: number;
  timestamp: number;
}

// 多语言文本
const translations = {
  en: {
    pageTitle: 'SM Token Exchange',
    connectWallet: 'Connect Wallet',
    walletConnected: 'Connected: ',
    buyTokens: 'Buy Tokens',
    enterAmount: 'Enter BNB amount',
    estimatedTokens: 'Estimated tokens to receive: ',
    transactionHistory: 'Transaction History',
    countdown: 'Next round starts in: ',
    priceChart: 'Price Chart',
    loading: 'Loading...',
    confirm: 'Confirm',
    cancel: 'Cancel',
    walletRequired: 'Wallet Connection Required',
    walletRequiredMsg: 'Please connect your wallet to proceed with the purchase.',
    confirmPurchase: 'Confirm Purchase',
    confirmPurchaseMsg: 'Are you sure you want to purchase tokens with ',
    transactionSubmitted: 'Transaction submitted',
    transactionPending: 'Transaction pending',
    transactionSuccess: 'Transaction successful',
    transactionFailed: 'Transaction failed',
    viewOnExplorer: 'View on Explorer',
    date: 'Date',
    amount: 'Amount (BNB)',
    tokensReceived: 'Tokens Received',
    txHash: 'Transaction',
    hours: 'hours',
    minutes: 'minutes',
    seconds: 'seconds',
    days: 'days',
    round: 'Round',
    price: 'Price',
    noHistory: 'No transaction history found',
    insufficientBalance: 'Insufficient balance',
    invalidAmount: 'Invalid amount',
    copy: 'Copy',
    copied: 'Copied!',
    remaining: 'Remaining',
    nextPrice: 'Next Price',
    exchangeStats: 'Exchange Statistics',
    walletInfo: 'Wallet Information',
    soldTokens: 'Sold Tokens',
    remainingTokens: 'Remaining Tokens',
    raisedBnb: 'Raised BNB',
    currentPrice: 'Current Price',
    nextRoundPrice: 'Next Round Price',
    currentRound: 'Current Round',
    status: 'Status',
    active: 'Active',
    inactive: 'Inactive',
    walletAddress: 'Wallet Address',
    bnbBalance: 'BNB Balance',
    smBalance: 'SM Token Balance',
    refreshData: 'Refresh Data'
  },
  zh: {
    pageTitle: 'SM代币交易所',
    connectWallet: '连接钱包',
    walletConnected: '已连接: ',
    buyTokens: '购买代币',
    enterAmount: '输入BNB金额',
    estimatedTokens: '预计获得代币: ',
    transactionHistory: '交易历史',
    countdown: '下一轮开始倒计时: ',
    priceChart: '价格图表',
    loading: '加载中...',
    confirm: '确认',
    cancel: '取消',
    walletRequired: '需要连接钱包',
    walletRequiredMsg: '请连接您的钱包以继续购买。',
    confirmPurchase: '确认购买',
    confirmPurchaseMsg: '您确定要使用 ',
    transactionSubmitted: '交易已提交',
    transactionPending: '交易处理中',
    transactionSuccess: '交易成功',
    transactionFailed: '交易失败',
    viewOnExplorer: '在区块浏览器中查看',
    date: '日期',
    amount: '金额 (BNB)',
    tokensReceived: '获得代币',
    txHash: '交易哈希',
    hours: '小时',
    minutes: '分钟',
    seconds: '秒',
    days: '天',
    round: '轮次',
    price: '价格',
    noHistory: '未找到交易历史',
    insufficientBalance: '余额不足',
    invalidAmount: '无效金额',
    copy: '复制',
    copied: '已复制!',
    remaining: '剩余',
    nextPrice: '下一轮价格',
    exchangeStats: '交易所统计',
    walletInfo: '钱包信息',
    soldTokens: '已售代币',
    remainingTokens: '剩余代币',
    raisedBnb: '已筹集BNB',
    currentPrice: '当前价格',
    nextRoundPrice: '下一轮价格',
    currentRound: '当前轮次',
    status: '交易状态',
    active: '激活',
    inactive: '未激活',
    walletAddress: '钱包地址',
    bnbBalance: 'BNB余额',
    smBalance: 'SM代币余额',
    refreshData: '刷新数据'
  }
};

const Exchange = () => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const { wallet, connect, updateBalances } = useWallet();

  // 基础状态
  const [amount, setAmount] = useState<string>('0.1');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isPurchasing, setIsPurchasing] = useState<boolean>(false);
  const [exchangeStats, setExchangeStats] = useState<ExchangeStats | null>(null);
  const [estimatedTokens, setEstimatedTokens] = useState<string>('0');
  const [txHash, setTxHash] = useState<string | null>(null);

  // 新增状态
  const [language, setLanguage] = useState<'en' | 'zh'>('zh'); // 默认中文
  const [t, setT] = useState(translations.zh); // 翻译函数
  const [openWalletDialog, setOpenWalletDialog] = useState<boolean>(false);
  const [openConfirmDialog, setOpenConfirmDialog] = useState<boolean>(false);
  const [snackbarOpen, setSnackbarOpen] = useState<boolean>(false);
  const [snackbarMessage, setSnackbarMessage] = useState<string>('');
  const [snackbarSeverity, setSnackbarSeverity] = useState<'success' | 'error' | 'info'>('info');
  const [transactionHistory, setTransactionHistory] = useState<TransactionHistoryItem[]>([]);
  const [countdown, setCountdown] = useState<{ days: number, hours: number, minutes: number, seconds: number } | null>(null);
  const [tabValue, setTabValue] = useState<number>(0);
  const [priceHistory, setPriceHistory] = useState<PriceData[]>([]);
  const [currentRound, setCurrentRound] = useState<number>(1);
  const [nextRoundTimestamp, setNextRoundTimestamp] = useState<number | null>(null);
  const [copied, setCopied] = useState<boolean>(false);
  const [txStatus, setTxStatus] = useState<'none' | 'submitted' | 'pending' | 'success' | 'failed'>('none');

  const countdownInterval = useRef<NodeJS.Timeout | null>(null);

  // 切换语言
  const toggleLanguage = () => {
    const newLang = language === 'en' ? 'zh' : 'en';
    setLanguage(newLang);
    setT(translations[newLang]);
  };

  // 显示通知
  const showSnackbar = (message: string, severity: 'success' | 'error' | 'info') => {
    setSnackbarMessage(message);
    setSnackbarSeverity(severity);
    setSnackbarOpen(true);
  };

  // 关闭通知
  const handleSnackbarClose = () => {
    setSnackbarOpen(false);
  };

  // 复制交易哈希
  const copyTxHash = () => {
    if (txHash) {
      navigator.clipboard.writeText(txHash);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
      showSnackbar(t.copied, 'success');
    }
  };

  // 查看交易哈希
  const viewTxOnExplorer = () => {
    if (txHash) {
      // BSC测试网
      window.open(`https://testnet.bscscan.com/tx/${txHash}`, '_blank');
    }
  };

  // 处理Tab切换
  const handleTabChange = (_event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  // 初始加载时获取交易所统计数据
  useEffect(() => {
    fetchExchangeStats();

    // 设置定时刷新
    const interval = setInterval(() => {
      if (wallet.isConnected) {
        fetchExchangeStats();
        updateBalances();
      }
    }, 30000); // 30秒刷新一次

    return () => clearInterval(interval);
  }, [wallet.isConnected]);

  // 每当输入金额变化时更新估算代币数量
  useEffect(() => {
    calculateEstimatedTokens();
  }, [amount, exchangeStats]);

  // 加载价格历史和设置倒计时
  useEffect(() => {
    if (exchangeStats) {
      loadPriceHistory();
    }
  }, [exchangeStats]);

  // 更新倒计时
  useEffect(() => {
    if (nextRoundTimestamp) {
      updateCountdown();
      countdownInterval.current = setInterval(updateCountdown, 1000);
    }

    return () => {
      if (countdownInterval.current) {
        clearInterval(countdownInterval.current);
      }
    };
  }, [nextRoundTimestamp]);

  // 初始连接钱包检查
  useEffect(() => {
    // 如果已有provider但没有contract，可能是因为刷新页面
    if (window.ethereum && wallet.isConnected) {
      loadTransactionHistory();
    }
  }, [wallet.isConnected]);

  // 获取交易所统计数据
  const fetchExchangeStats = async () => {
    setIsLoading(true);
    try {
      const stats = await contractService.getExchangeStats();
      setExchangeStats(stats);

      // 获取当前轮次
      if (stats.currentRound) {
        setCurrentRound(stats.currentRound);
      }
    } catch (error) {
      console.error('获取交易所统计数据失败:', error);
      toast.error('无法获取交易所统计数据');
    } finally {
      setIsLoading(false);
    }
  };

  // 加载交易历史
  const loadTransactionHistory = async () => {
    if (!wallet.isConnected || !wallet.address) return;

    try {
      setIsLoading(true);

      // 创建provider和合约实例
      const provider = new ethers.BrowserProvider(window.ethereum as any);
      const exchangeAbi = await contractService.getExchangeABI();
      const contract = new ethers.Contract(EXCHANGE_CONTRACT_ADDRESS, exchangeAbi, provider);

      // 获取TokensPurchased事件
      const filter = contract.filters.TokensPurchased(wallet.address);
      const events = await contract.queryFilter(filter, -10000); // 获取最近10000个区块的事件

      const history: TransactionHistoryItem[] = await Promise.all(events.map(async (event: any) => {
        const block = await event.getBlock();
        // 使用事件参数
        return {
          txHash: event.transactionHash,
          date: new Date(block.timestamp * 1000),
          bnbAmount: event.args.bnbAmount,
          tokenAmount: event.args.tokenAmount,
          round: event.args.round || currentRound, // 如果事件中没有轮次信息，使用当前轮次
        };
      }));

      // 按日期排序，最新的在前
      history.sort((a, b) => b.date.getTime() - a.date.getTime());

      setTransactionHistory(history);
    } catch (error) {
      console.error('加载交易历史失败:', error);
      toast.error('无法加载交易历史');
    } finally {
      setIsLoading(false);
    }
  };

  // 加载价格历史
  const loadPriceHistory = async () => {
    if (!wallet.isConnected || !exchangeStats) return;

    try {
      // 创建provider和合约实例
      const provider = new ethers.BrowserProvider(window.ethereum as any);
      const exchangeAbi = await contractService.getExchangeABI();
      const contract = new ethers.Contract(EXCHANGE_CONTRACT_ADDRESS, exchangeAbi, provider);

      // 获取RoundAdvanced事件
      const filter = contract.filters.RoundAdvanced();
      const events = await contract.queryFilter(filter, -10000);

      const history: PriceData[] = await Promise.all(events.map(async (event: any) => {
        const block = await event.getBlock();
        return {
          round: Number(event.args.newRound),
          price: parseFloat(ethers.formatEther(event.args.newPrice)),
          timestamp: block.timestamp,
        };
      }));

      // 获取当前轮次和价格
      const currentRound = exchangeStats.currentRound;
      const currentPrice = parseFloat(exchangeStats.currentPrice) / 1e9; // 转换gwei到主单位

      // 如果历史中没有当前轮次，添加它
      if (!history.some(item => item.round === currentRound)) {
        const currentBlock = await provider.getBlock('latest');
        history.push({
          round: currentRound,
          price: currentPrice,
          timestamp: currentBlock.timestamp,
        });
      }

      // 按轮次排序
      history.sort((a, b) => a.round - b.round);

      setPriceHistory(history);

      // 设置下一轮开始时间（假设每轮持续时间为7天）
      // 注意：这里假设轮次持续时间是固定的，实际可能需要从合约获取
      const latestTimestamp = Math.max(...history.map(item => item.timestamp));
      const roundDuration = 7 * 24 * 60 * 60; // 7天，单位秒
      setNextRoundTimestamp(latestTimestamp + roundDuration);

    } catch (error) {
      console.error('加载价格历史失败:', error);
    }
  };

  // 更新倒计时
  const updateCountdown = useCallback(() => {
    if (!nextRoundTimestamp) return;

    const now = Math.floor(Date.now() / 1000);
    const diff = Math.max(0, nextRoundTimestamp - now);

    if (diff > 0) {
      const days = Math.floor(diff / (24 * 60 * 60));
      const hours = Math.floor((diff % (24 * 60 * 60)) / (60 * 60));
      const minutes = Math.floor((diff % (60 * 60)) / 60);
      const seconds = Math.floor(diff % 60);

      setCountdown({ days, hours, minutes, seconds });
    } else {
      setCountdown({ days: 0, hours: 0, minutes: 0, seconds: 0 });
      // 如果倒计时结束，重新加载价格历史和当前轮次信息
      fetchExchangeStats();
      loadPriceHistory();
    }
  }, [nextRoundTimestamp]);

  // 计算预估获得的代币数量
  const calculateEstimatedTokens = useCallback(() => {
    if (!exchangeStats || !amount || parseFloat(amount) <= 0) {
      setEstimatedTokens('0');
      return;
    }

    try {
      // 使用当前价格计算
      // 当前价格单位是 BNB/代币 (gwei格式)
      const currentPrice = parseFloat(exchangeStats.currentPrice) / 1e9;
      const bnbAmount = parseFloat(amount);
      const tokens = bnbAmount / currentPrice;

      setEstimatedTokens(tokens.toFixed(6));
    } catch (error) {
      console.error('计算预估代币数量失败:', error);
      setEstimatedTokens('0');
    }
  }, [exchangeStats, amount]);

  // 处理购买按钮点击
  const handleBuyClick = () => {
    if (!wallet.isConnected) {
      setOpenWalletDialog(true);
    } else {
      setOpenConfirmDialog(true);
    }
  };

  // 处理确认对话框关闭
  const handleConfirmDialogClose = (confirmed: boolean) => {
    setOpenConfirmDialog(false);
    if (confirmed) {
      buyTokens();
    }
  };

  // 处理钱包对话框关闭
  const handleWalletDialogClose = (doConnect: boolean) => {
    setOpenWalletDialog(false);
    if (doConnect) {
      connect(); // 调用WalletContext中的connect函数
    }
  };

  // 设置价格图表数据
  const getChartData = () => {
    return {
      labels: priceHistory.map(data => `${t.round} ${data.round}`),
      datasets: [
        {
          label: t.price,
          data: priceHistory.map(data => data.price),
          borderColor: theme.palette.primary.main,
          backgroundColor: 'rgba(75, 192, 192, 0.2)',
          tension: 0.1,
        },
      ],
    };
  };

  // 购买代币
  const buyTokens = async () => {
    if (!wallet.isConnected) {
      showSnackbar(t.walletRequired, 'error');
      return;
    }

    if (!amount || parseFloat(amount) <= 0) {
      showSnackbar(t.invalidAmount, 'error');
      return;
    }

    // 检查余额
    if (wallet.balance && wallet.balance.bnb) {
      const bnbWei = ethers.utils.parseEther(amount);
      const balanceWei = ethers.utils.parseEther(wallet.balance.bnb);

      if (bnbWei.gt(balanceWei)) {
        showSnackbar(t.insufficientBalance, 'error');
        return;
      }
    }

    setIsPurchasing(true);
    setTxStatus('submitted');

    try {
      // 调用合约方法购买代币
      const tx = await contractService.exchangeTokens(amount);

      setTxHash(tx.hash);
      setTxStatus('pending');
      showSnackbar(t.transactionSubmitted, 'info');

      // 等待交易确认
      const receipt = await tx.wait();

      if (receipt.status === 1) {
        setTxStatus('success');
        showSnackbar(t.transactionSuccess, 'success');

        // 刷新数据
        await fetchExchangeStats();
        await updateBalances();

        // 更新交易历史
        loadTransactionHistory();
      } else {
        setTxStatus('failed');
        showSnackbar(t.transactionFailed, 'error');
      }
    } catch (error) {
      console.error('交易错误:', error);
      setTxStatus('failed');
      showSnackbar(t.transactionFailed, 'error');
    } finally {
      setIsPurchasing(false);
    }
  };

  // 连接钱包按钮事件
  const handleConnectWallet = async () => {
    if (!wallet.isConnected) {
      await connect();
      fetchExchangeStats();
    }
  };

  return (
    <Box sx={{ p: 4, maxWidth: 1200, mx: 'auto' }}>
      <Box sx={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '20px'
      }}>
        <Typography variant="h4" component="h1">
          {t.pageTitle}
        </Typography>

        <Button
          variant="outlined"
          startIcon={<TranslateIcon />}
          onClick={toggleLanguage}
          sx={{ borderRadius: '20px' }}
        >
          {language === 'en' ? '中文' : 'English'}
        </Button>
      </Box>

      {!wallet.isConnected ? (
        <Box sx={{ textAlign: 'center', my: 4 }}>
          <Button
            variant="contained"
            color="primary"
            size="large"
            onClick={handleConnectWallet}
          >
            连接钱包
          </Button>
          <Typography variant="body1" sx={{ mt: 2 }}>
            连接钱包以访问交易功能
          </Typography>
        </Box>
      ) : (
        <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' }, gap: 4 }}>
          {/* 左侧: 代币交易表单 */}
          <Box>
            <Card sx={{ height: '100%' }}>
              <CardContent>
                <Typography variant="h6" component="h2" gutterBottom>
                  购买SM代币
                </Typography>

                <TextField
                  fullWidth
                  type="number"
                  label="BNB金额"
                  variant="outlined"
                  margin="normal"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  disabled={!exchangeStats?.isActive || isPurchasing}
                />

                <Box sx={{ my: 2 }}>
                  <Typography variant="subtitle2">
                    预计获得 SM代币: <strong>{estimatedTokens}</strong>
                  </Typography>
                  <Typography variant="subtitle2">
                    当前汇率: 1 BNB = {exchangeStats ? (1 / (parseFloat(exchangeStats.currentPrice) / 1e9)).toFixed(2) : '0'} SM
                  </Typography>
                </Box>

                <Button
                  fullWidth
                  variant="contained"
                  color="primary"
                  size="large"
                  onClick={handleBuyClick}
                  disabled={!exchangeStats?.isActive || isPurchasing || !amount || parseFloat(amount) <= 0}
                  sx={{ mt: 2 }}
                >
                  {isPurchasing ? <CircularProgress size={24} color="inherit" /> : '购买代币'}
                </Button>

                {!exchangeStats?.isActive && (
                  <Alert severity="warning" sx={{ mt: 2 }}>
                    交易所当前未激活，无法进行交易。
                  </Alert>
                )}

                {/* 交易状态和哈希 */}
                {txStatus !== 'none' && (
                  <Box sx={{
                    marginTop: '20px',
                    padding: '15px',
                    backgroundColor: '#f0f8ff',
                    borderRadius: '8px',
                    border: '1px solid #d0e8ff'
                  }}>
                    <Typography variant="body2" sx={{ marginBottom: '8px' }}>
                      {txStatus === 'submitted' && t.transactionSubmitted}
                      {txStatus === 'pending' && t.transactionPending}
                      {txStatus === 'success' && t.transactionSuccess}
                      {txStatus === 'failed' && t.transactionFailed}
                    </Typography>

                    {txHash && (
                      <Box sx={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: '10px' }}>
                        <Typography variant="caption" sx={{
                          maxWidth: '200px',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap'
                        }}>
                          {txHash}
                        </Typography>

                        <Button
                          size="small"
                          variant="outlined"
                          onClick={copyTxHash}
                          sx={{ minWidth: '60px', height: '30px' }}
                        >
                          {copied ? t.copied : t.copy}
                        </Button>

                        <Button
                          size="small"
                          variant="outlined"
                          onClick={viewTxOnExplorer}
                          sx={{ minWidth: '60px', height: '30px' }}
                        >
                          {t.viewOnExplorer}
                        </Button>
                      </Box>
                    )}
                  </Box>
                )}
              </CardContent>
            </Card>
          </Box>

          {/* 右侧: 统计数据和钱包信息 */}
          <Box>
            <Card sx={{ height: '100%' }}>
              <CardContent>
                <Typography variant="h6" component="h2" gutterBottom>
                  交易所统计
                </Typography>

                {isLoading ? (
                  <Box sx={{ display: 'flex', justifyContent: 'center', my: 4 }}>
                    <CircularProgress />
                  </Box>
                ) : (
                  <Box>
                    <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2 }}>
                      <Typography variant="subtitle2">已售代币:</Typography>
                      <Typography variant="body2">{exchangeStats?.totalTokensSold || '0'}</Typography>

                      <Typography variant="subtitle2">剩余代币:</Typography>
                      <Typography variant="body2">{exchangeStats?.totalTokensRemaining || '0'}</Typography>

                      <Typography variant="subtitle2">已筹集BNB:</Typography>
                      <Typography variant="body2">{exchangeStats?.totalBnbRaised || '0'}</Typography>

                      <Typography variant="subtitle2">当前价格:</Typography>
                      <Typography variant="body2">{exchangeStats?.currentPrice || '0'} gwei</Typography>

                      <Typography variant="subtitle2">下一轮价格:</Typography>
                      <Typography variant="body2">{exchangeStats?.nextRoundPrice || '0'} gwei</Typography>

                      <Typography variant="subtitle2">当前轮次:</Typography>
                      <Typography variant="body2">{exchangeStats?.currentRound || '0'}</Typography>

                      <Typography variant="subtitle2">交易状态:</Typography>
                      <Typography variant="body2">{exchangeStats?.isActive ? '激活' : '未激活'}</Typography>
                    </Box>

                    <Divider sx={{ my: 2 }} />

                    <Typography variant="h6" component="h2" gutterBottom>
                      钱包信息
                    </Typography>

                    <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2 }}>
                      <Typography variant="subtitle2">钱包地址:</Typography>
                      <Typography variant="caption" sx={{ wordBreak: 'break-all' }}>
                        {wallet.address || '-'}
                      </Typography>

                      <Typography variant="subtitle2">BNB余额:</Typography>
                      <Typography variant="body2">
                        {wallet.balance?.bnb ? parseFloat(wallet.balance.bnb).toFixed(4) : '0'} BNB
                      </Typography>

                      <Typography variant="subtitle2">SM代币余额:</Typography>
                      <Typography variant="body2">
                        {wallet.balance?.sm ? parseFloat(wallet.balance.sm).toFixed(4) : '0'} SM
                      </Typography>
                    </Box>

                    <Button
                      fullWidth
                      variant="outlined"
                      onClick={fetchExchangeStats}
                      sx={{ mt: 2 }}
                    >
                      刷新数据
                    </Button>
                  </Box>
                )}
              </CardContent>
            </Card>
          </Box>
        </Box>
      )}

      {/* 钱包连接对话框 */}
      <Dialog open={openWalletDialog} onClose={() => handleWalletDialogClose(false)}>
        <DialogTitle>{t.walletRequired}</DialogTitle>
        <DialogContent>
          <Typography>{t.walletRequiredMsg}</Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => handleWalletDialogClose(false)}>{t.cancel}</Button>
          <Button onClick={() => handleWalletDialogClose(true)} variant="contained">
            {t.connectWallet}
          </Button>
        </DialogActions>
      </Dialog>

      {/* 购买确认对话框 */}
      <Dialog open={openConfirmDialog} onClose={() => handleConfirmDialogClose(false)}>
        <DialogTitle>{t.confirmPurchase}</DialogTitle>
        <DialogContent>
          <Typography>
            {t.confirmPurchaseMsg} <strong>{amount} BNB</strong>?
          </Typography>
          {estimatedTokens && (
            <Typography sx={{ marginTop: '10px' }}>
              {t.estimatedTokens} <strong>{estimatedTokens}</strong>
            </Typography>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => handleConfirmDialogClose(false)}>{t.cancel}</Button>
          <Button onClick={() => handleConfirmDialogClose(true)} variant="contained">
            {t.confirm}
          </Button>
        </DialogActions>
      </Dialog>

      {/* 通知消息 */}
      <Snackbar
        open={snackbarOpen}
        autoHideDuration={6000}
        onClose={handleSnackbarClose}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert onClose={handleSnackbarClose} severity={snackbarSeverity} sx={{ width: '100%' }}>
          {snackbarMessage}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default Exchange;
