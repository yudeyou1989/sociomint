import React, { useState, useEffect } from 'react';
import { ethers, formatEther, formatUnits } from 'ethers';
import { Box, Typography, TextField, Button, Card, CardContent, CircularProgress } from '@mui/material';
import { useWallet } from '@/contexts/WalletContext';
import contractService, { ContractService } from '@/services/contractService';
import toast from 'react-hot-toast';

// BSC测试网合约地址
const EXCHANGE_PROXY_ADDRESS = '0x1B03DD8dCeD4c7D38ABA907671e5e1064D10F8A8';

// 交易状态类型
type TransactionStatus = 'none' | 'waiting' | 'pending' | 'success' | 'failed';

const SMExchangeInfo: React.FC = () => {
  const { wallet, connect, updateBalances } = useWallet();
  
  // 购买状态
  const [amount, setAmount] = useState<string>('0.1');
  const [estimatedTokens, setEstimatedTokens] = useState<string>('0');
  const [txStatus, setTxStatus] = useState<TransactionStatus>('none');
  const [txHash, setTxHash] = useState<string | null>(null);
  
  // 加载状态
  const [isLoading, setIsLoading] = useState(true);
  const [exchangeStats, setExchangeStats] = useState<any>(null);
  
  // 初始加载和自动刷新
  useEffect(() => {
    fetchExchangeStats();

    // 设置定时刷新
    const interval = setInterval(() => {
      if (wallet.isConnected) {
        fetchExchangeStats();
        updateBalances();
      }
    }, 30000); // 30秒刷新一次

    return () => clearInterval(interval as unknown as number);
  }, [wallet.isConnected]);
  
  // 获取交易所统计数据
  const fetchExchangeStats = async () => {
    setIsLoading(true);
    try {
      if (wallet.isConnected) {
        const stats = await contractService.getExchangeStats();
        setExchangeStats(stats);
      } else {
        // 如果钱包未连接，使用只读provider获取数据
        const provider = ContractService.getReadOnlyProvider();
        const contract = new ethers.Contract(EXCHANGE_PROXY_ADDRESS, contractService.getExchangeABI(), provider);
        const stats = await contract.getExchangeStats();
        
        setExchangeStats({
          totalTokensSold: formatEther(stats.totalTokensSold),
          totalTokensRemaining: formatEther(stats.totalTokensRemaining),
          totalBnbRaised: formatEther(stats.totalBnbRaised),
          currentPrice: formatUnits(stats.currentPrice, 'gwei'),
          nextRoundPrice: formatUnits(stats.nextRoundPrice, 'gwei'),
          isActive: !stats.paused,
          currentRound: stats.currentRound
        });
      }
    } catch (error) {
      console.error('获取交易所统计数据失败:', error);
      toast.error('无法获取交易所统计数据');
    } finally {
      setIsLoading(false);
    }
  };
  
  // 计算预估代币数量
  const calculateEstimatedTokens = () => {
    if (!exchangeStats || !amount || parseFloat(amount) <= 0) {
      setEstimatedTokens('0');
      return;
    }
    
    try {
      // 使用当前价格计算
      const currentPrice = parseFloat(exchangeStats.currentPrice) / 1e9;
      const bnbAmount = parseFloat(amount);
      const tokens = bnbAmount / currentPrice;
      
      setEstimatedTokens(tokens.toFixed(6));
    } catch (error) {
      console.error('计算预估代币数量失败:', error);
      setEstimatedTokens('0');
    }
  };
  
  // 购买代币
  const handlePurchase = async () => {
    if (!wallet.isConnected) {
      toast.error('请先连接钱包');
      return;
    }
    
    if (!amount || parseFloat(amount) <= 0) {
      toast.error('请输入有效的BNB金额');
      return;
    }
    
    setTxStatus('waiting');
    try {
      const tx = await contractService.exchangeTokens(amount);

      // 处理不同类型的交易响应
      const txHash = typeof tx === 'string' ? tx : (tx as any)?.hash || '';
      setTxHash(txHash);
      setTxStatus('pending');

      toast.loading('交易确认中...');

      // 如果tx是字符串（hash），则无需等待；如果是交易对象，则等待确认
      if (typeof tx !== 'string' && (tx as any)?.wait) {
        const receipt = await (tx as any).wait();
        if (receipt && receipt.status === 1) {
          toast.success('购买成功！');
          setTxStatus('success');
          // 刷新数据
          fetchExchangeStats();
          updateBalances();
        } else {
          toast.error('交易失败');
          setTxStatus('failed');
        }
      } else {
        // 如果是字符串hash，直接认为成功
        toast.success('交易已提交！');
        setTxStatus('success');
        fetchExchangeStats();
        updateBalances();
      }
    } catch (error) {
      console.error('购买代币失败:', error);
      toast.error('交易失败: ' + (error instanceof Error ? error.message : '未知错误'));
      setTxStatus('failed');
    }
  };
  
  // 格式化显示的价格
  const formatPrice = (price: string | null | undefined) => {
    if (!price) return 'N/A';
    return (parseFloat(price) / 1e9).toFixed(12);
  };
  
  // 连接钱包
  const handleConnectWallet = async () => {
    if (!wallet.isConnected) {
      try {
        await connect();
        fetchExchangeStats();
      } catch (error) {
        console.error('连接钱包失败:', error);
      }
    }
  };
  
  useEffect(() => {
    if (exchangeStats && amount) {
      calculateEstimatedTokens();
    }
  }, [exchangeStats, amount]);
  
  return (
    <Box sx={{ maxWidth: 800, mx: 'auto', p: 3 }}>
      <Typography variant="h4" component="h1" gutterBottom align="center">
        SM 代币兑换
      </Typography>
      
      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' }, gap: 4 }}>
        <Box>
          <Card sx={{ mb: 4, height: '100%' }}>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                交易统计
              </Typography>
              
              {isLoading ? (
                <Box sx={{ display: 'flex', justifyContent: 'center', my: 4 }}>
                  <CircularProgress />
                </Box>
              ) : exchangeStats ? (
                <Box>
                  <Typography variant="body2" sx={{ mb: 1 }}>
                    <strong>当前轮次:</strong> {exchangeStats.currentRound?.toString() || 'N/A'}
                  </Typography>
                  <Typography variant="body2" sx={{ mb: 1 }}>
                    <strong>已售代币:</strong> {parseFloat(exchangeStats.totalTokensSold || '0').toLocaleString()} SM
                  </Typography>
                  <Typography variant="body2" sx={{ mb: 1 }}>
                    <strong>剩余代币:</strong> {parseFloat(exchangeStats.totalTokensRemaining || '0').toLocaleString()} SM
                  </Typography>
                  <Typography variant="body2" sx={{ mb: 1 }}>
                    <strong>已筹集:</strong> {parseFloat(exchangeStats.totalBnbRaised || '0').toLocaleString()} BNB
                  </Typography>
                  <Typography variant="body2" sx={{ mb: 1 }}>
                    <strong>当前价格:</strong> {formatPrice(exchangeStats.currentPrice)} BNB/SM
                  </Typography>
                  <Typography variant="body2" sx={{ mb: 1 }}>
                    <strong>下一轮价格:</strong> {formatPrice(exchangeStats.nextRoundPrice)} BNB/SM
                  </Typography>
                  <Typography variant="body2" sx={{ mb: 1 }}>
                    <strong>交易状态:</strong> {exchangeStats.isActive ? '启用' : '暂停'}
                  </Typography>
                  
                  {wallet.address && (
                    <Box sx={{ mt: 3, pt: 2, borderTop: '1px solid #eee' }}>
                      <Typography variant="subtitle2" gutterBottom>
                        钱包信息
                      </Typography>
                      <Typography variant="body2" sx={{ wordBreak: 'break-all', mb: 1 }}>
                        <strong>地址:</strong> {wallet.address}
                      </Typography>
                      <Typography variant="body2" sx={{ mb: 1 }}>
                        <strong>BNB 余额:</strong> {parseFloat(wallet.balance?.bnb || '0').toFixed(4)} BNB
                      </Typography>
                      <Typography variant="body2" sx={{ mb: 1 }}>
                        <strong>SM 余额:</strong> {parseFloat(wallet.balance?.sm || '0').toFixed(4)} SM
                      </Typography>
                    </Box>
                  )}
                </Box>
              ) : (
                <Typography>无法获取交易统计数据</Typography>
              )}
            </CardContent>
          </Card>
        </Box>
        
        <Box>
          <Card sx={{ height: '100%' }}>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                购买代币
              </Typography>
              
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
                  <Typography variant="body2" sx={{ mt: 2 }}>
                    连接钱包以购买 SM 代币
                  </Typography>
                </Box>
              ) : (
                <Box>
                  <TextField
                    fullWidth
                    label="BNB 数量"
                    type="number"
                    slotProps={{
                      htmlInput: { min: 0.001, step: 0.01 }
                    }}
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    sx={{ mb: 3 }}
                    disabled={txStatus === 'waiting' || txStatus === 'pending'}
                  />
                  
                  <Box sx={{ 
                    bgcolor: '#f5f5f5', 
                    p: 2, 
                    borderRadius: 1, 
                    mb: 3, 
                    display: 'flex', 
                    justifyContent: 'space-between'
                  }}>
                    <Typography variant="body2">预计获得:</Typography>
                    <Typography variant="body1" fontWeight="bold">
                      {estimatedTokens} SM
                    </Typography>
                  </Box>
                  
                  <Button
                    variant="contained"
                    color="primary"
                    fullWidth
                    size="large"
                    onClick={handlePurchase}
                    disabled={
                      txStatus === 'waiting' || 
                      txStatus === 'pending' || 
                      !exchangeStats?.isActive ||
                      !amount || 
                      parseFloat(amount) <= 0
                    }
                  >
                    {txStatus === 'waiting' || txStatus === 'pending' ? (
                      <CircularProgress size={24} color="inherit" />
                    ) : (
                      '购买代币'
                    )}
                  </Button>
                  
                  {txStatus !== 'none' && (
                    <Box sx={{
                      mt: 2,
                      p: 2,
                      borderRadius: 1,
                      bgcolor: 
                        txStatus === 'waiting' || txStatus === 'pending' ? '#fff9db' :
                        txStatus === 'success' ? '#ebfbee' :
                        '#fff5f5',
                      border: 
                        txStatus === 'waiting' || txStatus === 'pending' ? '1px solid #ffe066' :
                        txStatus === 'success' ? '1px solid #8ce99a' :
                        '1px solid #ffc9c9',
                    }}>
                      <Typography variant="body2" sx={{
                        color: 
                          txStatus === 'waiting' || txStatus === 'pending' ? '#e67700' :
                          txStatus === 'success' ? '#2b8a3e' :
                          '#e03131',
                        fontWeight: 500,
                        mb: txHash ? 1 : 0,
                      }}>
                        {txStatus === 'waiting' ? '准备中...' :
                         txStatus === 'pending' ? '交易进行中...' :
                         txStatus === 'success' ? '交易成功！' :
                         '交易失败，请重试'}
                      </Typography>
                      
                      {txHash && (txStatus === 'pending' || txStatus === 'success') && (
                        <Typography variant="body2">
                          <a 
                            href={`https://testnet.bscscan.com/tx/${txHash}`} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            style={{
                              color: '#1c7ed6',
                              textDecoration: 'none',
                            }}
                          >
                            查看交易详情
                          </a>
                        </Typography>
                      )}
                    </Box>
                  )}
                </Box>
              )}
            </CardContent>
          </Card>
        </Box>
      </Box>
      
      <Box sx={{ mt: 3, textAlign: 'center' }}>
        <Button
          variant="outlined"
          color="primary"
          onClick={fetchExchangeStats}
          startIcon={isLoading && <CircularProgress size={16} />}
          disabled={isLoading}
        >
          刷新数据
        </Button>
      </Box>
    </Box>
  );
};

export default SMExchangeInfo;
