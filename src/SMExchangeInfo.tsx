'use client';

import React, { useState, useEffect } from 'react';
import { ethers, formatEther } from 'ethers';

// 为window.ethereum添加类型
declare global {
  interface Window {
    ethereum?: any;
  }
}

// SMTokenExchange 合约 ABI (包含所需的函数)
const exchangeAbi = [
  {
    "inputs": [],
    "name": "getExchangeStats",
    "outputs": [
      {
        "components": [
          { "name": "totalTokens", "type": "uint256" },
          { "name": "remaining", "type": "uint256" },
          { "name": "currentPriceScaled", "type": "uint256" },
          { "name": "nextPriceScaled", "type": "uint256" },
          { "name": "currentRound", "type": "uint256" },
          { "name": "paused", "type": "bool" }
        ],
        "name": "stats",
        "type": "tuple"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "getCurrentSmPerBnb",
    "outputs": [{ "name": "", "type": "uint256" }],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "getNextBnbPerSmPriceScaled",
    "outputs": [{ "name": "", "type": "uint256" }],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "getRemainingTokens",
    "outputs": [{ "name": "", "type": "uint256" }],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [{ "name": "", "type": "address" }],
    "name": "purchases",
    "outputs": [{ "name": "", "type": "uint256" }],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [{ "name": "", "type": "address" }],
    "name": "isVerified",
    "outputs": [{ "name": "", "type": "bool" }],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "exchangeTokens",
    "outputs": [],
    "stateMutability": "payable",
    "type": "function"
  },
  {
    "inputs": [{"name": "amount", "type": "uint256"}],
    "name": "getTokenAmountForBnb",
    "outputs": [{"name": "", "type": "uint256"}],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "getMinPurchaseAmount",
    "outputs": [{"name": "", "type": "uint256"}],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "getMaxPurchaseAmount",
    "outputs": [{"name": "", "type": "uint256"}],
    "stateMutability": "view",
    "type": "function"
  }
];

// 合约地址 - 使用已部署的测试网地址
const EXCHANGE_CONTRACT_ADDRESS = '0xF0c4729f07d7B2F03E2E2F2feED36386Dc8bFb8E';
const TOKEN_CONTRACT_ADDRESS = '0xa1f5Fba244B0030bbc6fD115E0351a731521DfD9'; // 使用测试代币

// 交易状态类型
type TransactionStatus = 'none' | 'waiting' | 'pending' | 'success' | 'failed';

interface ExchangeStats {
  totalTokens: bigint;
  remaining: bigint;
  currentPriceScaled: bigint;
  nextPriceScaled: bigint;
  currentRound: bigint;
  paused: boolean;
}

const SMExchangeInfo: React.FC = () => {
  // 钱包连接状态
  const [account, setAccount] = useState<string | null>(null);
  const [provider, setProvider] = useState<ethers.BrowserProvider | null>(null);
  const [contract, setContract] = useState<ethers.Contract | null>(null);
  const [signer, setSigner] = useState<ethers.Signer | null>(null);

  // 合约数据
  const [exchangeStats, setExchangeStats] = useState<ExchangeStats | null>(null);
  const [smPerBnb, setSmPerBnb] = useState<bigint | null>(null);
  const [nextPrice, setNextPrice] = useState<bigint | null>(null);
  const [remainingTokens, setRemainingTokens] = useState<bigint | null>(null);
  const [userPurchases, setUserPurchases] = useState<bigint | null>(null);
  const [userVerified, setUserVerified] = useState<boolean | null>(null);
  const [minPurchaseAmount, setMinPurchaseAmount] = useState<bigint | null>(null);
  const [maxPurchaseAmount, setMaxPurchaseAmount] = useState<bigint | null>(null);

  // 购买状态
  const [bnbAmount, setBnbAmount] = useState<string>('0.1');
  const [estimatedTokens, setEstimatedTokens] = useState<bigint | null>(null);
  const [txStatus, setTxStatus] = useState<TransactionStatus>('none');
  const [txHash, setTxHash] = useState<string | null>(null);

  // 加载状态
  const [isLoading, setIsLoading] = useState(true);

  // 连接钱包
  const connectWallet = async () => {
    if (window.ethereum) {
      try {
        // 请求账户访问
        const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
        const account = accounts[0];

        // 创建provider和contract
        const provider = new ethers.BrowserProvider(window.ethereum);
        const signer = await provider.getSigner();
        const contract = new ethers.Contract(EXCHANGE_CONTRACT_ADDRESS, exchangeAbi, signer);

        setAccount(account);
        setProvider(provider);
        setContract(contract);
        setSigner(signer);

        // 获取合约数据
        fetchContractData(contract, account);

        // 监听账户变化
        window.ethereum.on('accountsChanged', handleAccountsChanged);

        // 监听网络变化
        window.ethereum.on('chainChanged', () => window.location.reload());
      } catch (error) {
        console.error("连接钱包失败:", error);
      }
    } else {
      alert("请安装MetaMask钱包!");
    }
  };

  // 处理账户变化
  const handleAccountsChanged = (accounts: string[]) => {
    if (accounts.length === 0) {
      // 用户断开了所有账户
      disconnectWallet();
    } else if (accounts[0] !== account) {
      // 用户切换了账户
      setAccount(accounts[0]);
      if (contract) {
        fetchContractData(contract, accounts[0]);
      }
    }
  };

  // 断开钱包连接
  const disconnectWallet = () => {
    // 移除事件监听
    if (window.ethereum) {
      window.ethereum.removeListener('accountsChanged', handleAccountsChanged);
    }

    setAccount(null);
    setProvider(null);
    setContract(null);
    setSigner(null);
    setUserPurchases(null);
    setUserVerified(null);
  };

  // 获取合约数据
  const fetchContractData = async (contractInstance: ethers.Contract, userAddress?: string) => {
    setIsLoading(true);

    try {
      // 获取所有数据
      const stats = await contractInstance.getExchangeStats();
      const smPerBnbValue = await contractInstance.getCurrentSmPerBnb();
      const nextPriceValue = await contractInstance.getNextBnbPerSmPriceScaled();
      const remainingTokensValue = await contractInstance.getRemainingTokens();

      // 获取最小/最大购买限额
      const minPurchase = await contractInstance.getMinPurchaseAmount();
      const maxPurchase = await contractInstance.getMaxPurchaseAmount();

      setExchangeStats(stats);
      setSmPerBnb(smPerBnbValue);
      setNextPrice(nextPriceValue);
      setRemainingTokens(remainingTokensValue);
      setMinPurchaseAmount(minPurchase);
      setMaxPurchaseAmount(maxPurchase);

      // 如果用户已连接，获取用户特定数据
      if (userAddress) {
        const purchases = await contractInstance.purchases(userAddress);
        const isVerified = await contractInstance.isVerified(userAddress);

        setUserPurchases(purchases);
        setUserVerified(isVerified);
      }

      // 更新预估代币数量
      updateEstimatedTokens(bnbAmount, contractInstance);
    } catch (error) {
      console.error("获取合约数据失败:", error);
    } finally {
      setIsLoading(false);
    }
  };

  // 更新预估获得的代币数量
  const updateEstimatedTokens = async (amount: string, contractInstance: ethers.Contract) => {
    if (!amount || parseFloat(amount) <= 0 || !contractInstance) return;

    try {
      const bnbWei = ethers.parseEther(amount);
      const tokens = await contractInstance.getTokenAmountForBnb(bnbWei);
      setEstimatedTokens(tokens);
    } catch (error) {
      console.error("计算预估代币数量失败:", error);
      setEstimatedTokens(null);
    }
  };

  // 处理BNB数量输入变化
  const handleBnbAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setBnbAmount(value);

    if (contract) {
      updateEstimatedTokens(value, contract);
    }
  };

  // 购买代币
  const purchaseTokens = async () => {
    if (!contract || !signer || !account || !bnbAmount || parseFloat(bnbAmount) <= 0) return;

    try {
      setTxStatus('waiting');

      // 检查最小/最大购买限额
      const bnbWei = ethers.parseEther(bnbAmount);

      if (minPurchaseAmount && bnbWei < minPurchaseAmount) {
        alert(`购买金额不能小于 ${formatEther(minPurchaseAmount)} BNB`);
        setTxStatus('none');
        return;
      }

      if (maxPurchaseAmount && bnbWei > maxPurchaseAmount) {
        alert(`购买金额不能大于 ${formatEther(maxPurchaseAmount)} BNB`);
        setTxStatus('none');
        return;
      }

      // 检查用户是否已验证
      if (userVerified !== true) {
        alert('您的账户尚未通过验证，无法购买代币');
        setTxStatus('none');
        return;
      }

      // 发送交易
      const tx = await contract.exchangeTokens({
        value: bnbWei,
        gasLimit: 500000 // 设置足够的gasLimit
      });

      setTxHash(tx.hash);
      setTxStatus('pending');

      // 等待交易确认
      const receipt = await tx.wait();

      if (receipt.status === 1) {
        setTxStatus('success');
        // 刷新数据
        fetchContractData(contract, account);
      } else {
        setTxStatus('failed');
      }
    } catch (error) {
      console.error("购买代币失败:", error);
      setTxStatus('failed');
    }
  };

  // 自动刷新数据
  useEffect(() => {
    // 如果已连接合约，每30秒刷新一次数据
    if (contract && account) {
      const interval = setInterval(() => {
        fetchContractData(contract, account);
      }, 30000);

      return () => clearInterval(interval);
    }
  }, [contract, account]);

  // 初始加载时尝试获取全局数据
  useEffect(() => {
    const loadGlobalData = async () => {
      // 不需要钱包连接也可以获取全局数据
      try {
        // 使用BSC测试网RPC URL
        const provider = new ethers.JsonRpcProvider('https://data-seed-prebsc-1-s1.binance.org:8545/');
        const contract = new ethers.Contract(EXCHANGE_CONTRACT_ADDRESS, exchangeAbi, provider);

        // 设置合约以获取全局数据
        setContract(contract);
        fetchContractData(contract);
      } catch (error) {
        console.error("获取全局数据失败:", error);
        setIsLoading(false);
      }
    };

    loadGlobalData();
  }, []);

  // 格式化显示的价格
  const formatScaledPrice = (scaled: bigint | null) => {
    if (!scaled) return 'N/A';
    return (Number(ethers.formatUnits(scaled, 6)) / 1e6).toFixed(12);
  };

  // 格式化代币数量
  const formatTokenAmount = (amount: bigint | null) => {
    if (!amount) return 'N/A';
    return parseFloat(formatEther(amount)).toLocaleString('zh-CN', {
      maximumFractionDigits: 2
    });
  };

  // 获取交易状态文本
  const getTransactionStatusText = () => {
    switch (txStatus) {
      case 'waiting':
        return '准备中...';
      case 'pending':
        return '交易进行中...';
      case 'success':
        return '交易成功！';
      case 'failed':
        return '交易失败，请重试';
      default:
        return '';
    }
  };

  // 获取交易状态类名
  const getTransactionStatusClass = () => {
    switch (txStatus) {
      case 'waiting':
      case 'pending':
        return 'tx-pending';
      case 'success':
        return 'tx-success';
      case 'failed':
        return 'tx-failed';
      default:
        return '';
    }
  };

  return (
    <div className="sm-exchange-info">
      <div className="exchange-header">
        <h2>SocioMint 代币兑换</h2>

        {!account ? (
          <button
            className="connect-button"
            onClick={connectWallet}
          >
            连接钱包
          </button>
        ) : (
          <button
            className="disconnect-button"
            onClick={disconnectWallet}
          >
            断开连接 ({account?.slice(0, 6)}...{account?.slice(-4)})
          </button>
        )}
      </div>

      {isLoading ? (
        <div className="loading-container">
          <div className="loading-spinner"></div>
          <p>加载中...</p>
        </div>
      ) : (
        <>
          <div className="exchange-data">
            <div className="data-row">
              <div className="data-label">当前轮次:</div>
              <div className="data-value">
                {exchangeStats?.currentRound ? exchangeStats.currentRound.toString() : 'N/A'}
              </div>
            </div>

            <div className="data-row">
              <div className="data-label">每 BNB 可得 SM:</div>
              <div className="data-value">
                {formatTokenAmount(smPerBnb)} SM
              </div>
            </div>

            <div className="data-row">
              <div className="data-label">下一轮兑换价格:</div>
              <div className="data-value">
                {formatScaledPrice(nextPrice)} BNB/SM
              </div>
            </div>

            <div className="data-row">
              <div className="data-label">剩余可兑换总量:</div>
              <div className="data-value">
                {formatTokenAmount(remainingTokens)} SM
              </div>
            </div>

            {account && (
              <div className="user-info">
                <h3>用户信息</h3>

                <div className="data-row">
                  <div className="data-label">钱包地址:</div>
                  <div className="data-value address">
                    {account}
                  </div>
                </div>

                <div className="data-row">
                  <div className="data-label">已花费 BNB:</div>
                  <div className="data-value">
                    {userPurchases ? formatEther(userPurchases) : '0'} BNB
                  </div>
                </div>

                <div className="data-row">
                  <div className="data-label">认证状态:</div>
                  <div className={`data-value ${userVerified ? 'verified' : 'not-verified'}`}>
                    {userVerified ? '已认证 ✓' : '未认证 ✗'}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* 购买区块 */}
          {account && (
            <div className="purchase-section">
              <h3>购买 SM 代币</h3>

              <div className="purchase-form">
                <div className="input-group">
                  <label htmlFor="bnb-amount">BNB 数量:</label>
                  <input
                    id="bnb-amount"
                    type="number"
                    min="0.0001"
                    step="0.01"
                    value={bnbAmount}
                    onChange={handleBnbAmountChange}
                    disabled={txStatus === 'waiting' || txStatus === 'pending'}
                  />
                </div>

                <div className="estimated-tokens">
                  <span>预计获得:</span>
                  <strong>{formatTokenAmount(estimatedTokens)} SM</strong>
                </div>

                <div className="purchase-limits">
                  {minPurchaseAmount && (
                    <div className="min-limit">
                      最低购买: {String(formatEther(minPurchaseAmount))} BNB
                    </div>
                  )}
                  {maxPurchaseAmount && (
                    <div className="max-limit">
                      最高购买: {String(formatEther(maxPurchaseAmount))} BNB
                    </div>
                  )}
                </div>

                <button
                  className="purchase-button"
                  onClick={purchaseTokens}
                  disabled={
                    !account ||
                    txStatus === 'waiting' ||
                    txStatus === 'pending' ||
                    !userVerified ||
                    parseFloat(bnbAmount) <= 0 ||
                    exchangeStats?.paused
                  }
                >
                  {txStatus === 'waiting' || txStatus === 'pending' ? (
                    <span className="button-spinner"></span>
                  ) : (
                    '购买 SM 代币'
                  )}
                </button>

                {/* 交易状态显示 */}
                {txStatus !== 'none' && (
                  <div className={`transaction-status ${getTransactionStatusClass()}`}>
                    <p>{getTransactionStatusText()}</p>
                    {txHash && (txStatus === 'pending' || txStatus === 'success') && (
                      <a
                        href={`https://testnet.bscscan.com/tx/${txHash}`}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        查看交易详情
                      </a>
                    )}
                  </div>
                )}
              </div>
            </div>
          )}
        </>
      )}

      <style>
        {`
        .sm-exchange-info {
          background: #f8f9fa;
          border-radius: 12px;
          box-shadow: 0 4px 16px rgba(0, 0, 0, 0.1);
          padding: 24px;
          width: 100%;
          max-width: 500px;
          margin: 0 auto;
          font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
        }

        .exchange-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 24px;
          padding-bottom: 16px;
          border-bottom: 1px solid #dee2e6;
        }

        .exchange-header h2 {
          margin: 0;
          font-size: 1.25rem;
          font-weight: 600;
          color: #212529;
        }

        .connect-button, .disconnect-button {
          padding: 8px 16px;
          border-radius: 8px;
          font-weight: 500;
          font-size: 0.875rem;
          cursor: pointer;
          transition: all 0.2s;
          border: none;
        }

        .connect-button {
          background-color: #339af0;
          color: white;
        }

        .connect-button:hover {
          background-color: #1c7ed6;
        }

        .disconnect-button {
          background-color: #e9ecef;
          color: #495057;
        }

        .disconnect-button:hover {
          background-color: #dee2e6;
        }

        .loading-container {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          padding: 32px 0;
        }

        .loading-spinner, .button-spinner {
          border: 3px solid #f3f3f3;
          border-top: 3px solid #339af0;
          border-radius: 50%;
          width: 24px;
          height: 24px;
          animation: spin 1s linear infinite;
          margin-bottom: 16px;
        }

        .button-spinner {
          width: 16px;
          height: 16px;
          margin: 0;
          display: inline-block;
          vertical-align: middle;
        }

        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }

        .exchange-data {
          display: flex;
          flex-direction: column;
          gap: 16px;
        }

        .data-row {
          display: flex;
          justify-content: space-between;
          padding: 8px 0;
        }

        .data-label {
          font-weight: 500;
          color: #495057;
          font-size: 0.875rem;
        }

        .data-value {
          font-weight: 600;
          color: #212529;
          font-size: 0.875rem;
        }

        .user-info {
          margin-top: 16px;
          padding-top: 16px;
          border-top: 1px dashed #dee2e6;
        }

        .user-info h3 {
          margin: 0 0 16px 0;
          font-size: 1rem;
          color: #212529;
          font-weight: 600;
        }

        .address {
          font-family: monospace;
          font-size: 0.8125rem;
          word-break: break-all;
        }

        .verified {
          color: #2b8a3e;
        }

        .not-verified {
          color: #e03131;
        }

        /* 购买区块样式 */
        .purchase-section {
          margin-top: 24px;
          padding-top: 24px;
          border-top: 1px solid #dee2e6;
        }

        .purchase-section h3 {
          margin: 0 0 16px 0;
          font-size: 1rem;
          color: #212529;
          font-weight: 600;
        }

        .purchase-form {
          display: flex;
          flex-direction: column;
          gap: 16px;
        }

        .input-group {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }

        .input-group label {
          font-size: 0.875rem;
          font-weight: 500;
          color: #495057;
        }

        .input-group input {
          padding: 10px 12px;
          border: 1px solid #ced4da;
          border-radius: 6px;
          font-size: 1rem;
          transition: border-color 0.2s;
        }

        .input-group input:focus {
          border-color: #339af0;
          outline: none;
        }

        .estimated-tokens {
          background-color: #e9ecef;
          padding: 12px;
          border-radius: 6px;
          display: flex;
          justify-content: space-between;
          align-items: center;
          font-size: 0.875rem;
        }

        .estimated-tokens strong {
          font-size: 1rem;
          color: #2b8a3e;
        }

        .purchase-limits {
          display: flex;
          justify-content: space-between;
          font-size: 0.75rem;
          color: #868e96;
          padding: 0 4px;
        }

        .purchase-button {
          background-color: #339af0;
          color: white;
          border: none;
          border-radius: 6px;
          padding: 12px 16px;
          font-size: 1rem;
          font-weight: 500;
          cursor: pointer;
          transition: background-color 0.2s;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .purchase-button:hover:not(:disabled) {
          background-color: #1c7ed6;
        }

        .purchase-button:disabled {
          background-color: #adb5bd;
          cursor: not-allowed;
        }

        /* 交易状态样式 */
        .transaction-status {
          padding: 12px;
          border-radius: 6px;
          margin-top: 16px;
          text-align: center;
        }

        .transaction-status p {
          margin: 0 0 8px 0;
          font-weight: 500;
        }

        .transaction-status a {
          color: #1c7ed6;
          text-decoration: none;
          font-size: 0.875rem;
        }

        .transaction-status a:hover {
          text-decoration: underline;
        }

        .tx-pending {
          background-color: #fff9db;
          border: 1px solid #ffe066;
          color: #e67700;
        }

        .tx-success {
          background-color: #ebfbee;
          border: 1px solid #8ce99a;
          color: #2b8a3e;
        }

        .tx-failed {
          background-color: #fff5f5;
          border: 1px solid #ffc9c9;
          color: #e03131;
        }
        `}
      </style>
    </div>
  );
};

export default SMExchangeInfo;