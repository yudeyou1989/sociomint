'use client';

import React, { useState, useEffect } from 'react';
import { ethers, formatEther } from 'ethers';

// 为window.ethereum添加类型
declare global {
  interface Window {
    ethereum?: any;
  }
}

// SMTokenExchange 合约 ABI (管理员功能)
const exchangeAbi = [
  {
    "inputs": [{"name": "user", "type": "address"}],
    "name": "verifyUser",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [{"name": "user", "type": "address"}],
    "name": "revokeUserVerification",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "pause",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "unpause",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "getExchangeStats",
    "outputs": [
      {
        "components": [
          {"name": "totalTokens", "type": "uint256"},
          {"name": "remaining", "type": "uint256"},
          {"name": "currentPriceScaled", "type": "uint256"},
          {"name": "nextPriceScaled", "type": "uint256"},
          {"name": "currentRound", "type": "uint256"},
          {"name": "paused", "type": "bool"}
        ],
        "name": "stats",
        "type": "tuple"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [{"name": "", "type": "address"}],
    "name": "isAdmin",
    "outputs": [{"name": "", "type": "bool"}],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [{"name": "", "type": "address"}],
    "name": "isVerified",
    "outputs": [{"name": "", "type": "bool"}],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [{"name": "amount", "type": "uint256"}],
    "name": "setMinPurchaseAmount",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [{"name": "amount", "type": "uint256"}],
    "name": "setMaxPurchaseAmount",
    "outputs": [],
    "stateMutability": "nonpayable",
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

// 合约地址 - 请替换为实际部署的地址
const EXCHANGE_CONTRACT_ADDRESS = '0xYourSmTokenExchangeContractAddress';

// 交易状态类型
type TransactionStatus = 'none' | 'waiting' | 'pending' | 'success' | 'failed';

// 管理面板操作类型
type AdminAction = 'verify' | 'revoke' | 'pause' | 'unpause' | 'setMin' | 'setMax';

interface AdminPanelProps {
  onSuccess?: () => void;
}

interface ExchangeStats {
  totalTokens: ethers.BigNumber;
  remaining: ethers.BigNumber;
  currentPriceScaled: ethers.BigNumber;
  nextPriceScaled: ethers.BigNumber;
  currentRound: ethers.BigNumber;
  paused: boolean;
}

const AdminPanel: React.FC<AdminPanelProps> = ({ onSuccess }) => {
  // 钱包连接状态
  const [account, setAccount] = useState<string | null>(null);
  const [contract, setContract] = useState<ethers.Contract | null>(null);
  const [isAdmin, setIsAdmin] = useState<boolean>(false);
  const [txStatus, setTxStatus] = useState<TransactionStatus>('none');
  const [txHash, setTxHash] = useState<string | null>(null);
  const [currentAction, setCurrentAction] = useState<AdminAction | null>(null);

  // 合约状态
  const [exchangeStats, setExchangeStats] = useState<ExchangeStats | null>(null);
  const [minPurchaseAmount, setMinPurchaseAmount] = useState<ethers.BigNumber | null>(null);
  const [maxPurchaseAmount, setMaxPurchaseAmount] = useState<ethers.BigNumber | null>(null);

  // 表单状态
  const [userAddress, setUserAddress] = useState<string>('');
  const [newMinAmount, setNewMinAmount] = useState<string>('0.01');
  const [newMaxAmount, setNewMaxAmount] = useState<string>('10');
  const [userVerified, setUserVerified] = useState<boolean | null>(null);

  // 加载状态
  const [isLoading, setIsLoading] = useState<boolean>(true);

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
        setContract(contract);

        // 检查管理员权限
        const adminStatus = await contract.isAdmin(account);
        setIsAdmin(adminStatus);

        // 获取合约数据
        await fetchContractData(contract);

        // 监听账户变化
        window.ethereum.on('accountsChanged', handleAccountsChanged);
      } catch (error) {
        console.error("连接钱包失败:", error);
      }
    } else {
      alert("请安装MetaMask钱包!");
    }
  };

  // 处理账户变化
  const handleAccountsChanged = async (accounts: string[]) => {
    if (accounts.length === 0) {
      // 用户断开了所有账户
      disconnectWallet();
    } else if (accounts[0] !== account) {
      // 用户切换了账户
      setAccount(accounts[0]);
      if (contract) {
        // 检查新账户的管理员权限
        const adminStatus = await contract.isAdmin(accounts[0]);
        setIsAdmin(adminStatus);

        // 刷新合约数据
        fetchContractData(contract);
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
    setContract(null);
    setIsAdmin(false);
  };

  // 获取合约数据
  const fetchContractData = async (contractInstance: ethers.Contract) => {
    setIsLoading(true);

    try {
      // 获取交易所状态
      const stats = await contractInstance.getExchangeStats();
      setExchangeStats(stats);

      // 获取最小/最大购买限额
      const minAmount = await contractInstance.getMinPurchaseAmount();
      const maxAmount = await contractInstance.getMaxPurchaseAmount();
      setMinPurchaseAmount(minAmount);
      setMaxPurchaseAmount(maxAmount);

      // 如果有输入的用户地址，检查其验证状态
      if (ethers.utils.isAddress(userAddress)) {
        const verified = await contractInstance.isVerified(userAddress);
        setUserVerified(verified);
      } else {
        setUserVerified(null);
      }
    } catch (error) {
      console.error("获取合约数据失败:", error);
    } finally {
      setIsLoading(false);
    }
  };

  // 初始加载
  useEffect(() => {
    const loadData = async () => {
      if (window.ethereum) {
        try {
          // 检查是否已连接
          const accounts = await window.ethereum.request({ method: 'eth_accounts' });
          if (accounts.length > 0) {
            // 已经连接，获取数据
            connectWallet();
          } else {
            setIsLoading(false);
          }
        } catch (error) {
          console.error("检查钱包连接状态失败:", error);
          setIsLoading(false);
        }
      } else {
        setIsLoading(false);
      }
    };

    loadData();
  }, []);

  // 处理用户地址变化
  const handleUserAddressChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const address = e.target.value;
    setUserAddress(address);

    // 如果是有效地址且合约已连接，检查验证状态
    if (ethers.utils.isAddress(address) && contract) {
      try {
        const verified = await contract.isVerified(address);
        setUserVerified(verified);
      } catch (error) {
        console.error("检查用户验证状态失败:", error);
        setUserVerified(null);
      }
    } else {
      setUserVerified(null);
    }
  };

  // 验证用户
  const verifyUser = async () => {
    if (!contract || !userAddress || !ethers.utils.isAddress(userAddress)) {
      alert("请输入有效的钱包地址");
      return;
    }

    setCurrentAction('verify');
    setTxStatus('waiting');

    try {
      const tx = await contract.verifyUser(userAddress);
      setTxHash(tx.hash);
      setTxStatus('pending');

      // 等待交易确认
      const receipt = await tx.wait();

      if (receipt.status === 1) {
        setTxStatus('success');
        setUserVerified(true);

        // 回调通知
        if (onSuccess) onSuccess();
      } else {
        setTxStatus('failed');
      }
    } catch (error) {
      console.error("验证用户失败:", error);
      setTxStatus('failed');
    }
  };

  // 撤销用户验证
  const revokeUserVerification = async () => {
    if (!contract || !userAddress || !ethers.utils.isAddress(userAddress)) {
      alert("请输入有效的钱包地址");
      return;
    }

    setCurrentAction('revoke');
    setTxStatus('waiting');

    try {
      const tx = await contract.revokeUserVerification(userAddress);
      setTxHash(tx.hash);
      setTxStatus('pending');

      // 等待交易确认
      const receipt = await tx.wait();

      if (receipt.status === 1) {
        setTxStatus('success');
        setUserVerified(false);

        // 回调通知
        if (onSuccess) onSuccess();
      } else {
        setTxStatus('failed');
      }
    } catch (error) {
      console.error("撤销用户验证失败:", error);
      setTxStatus('failed');
    }
  };

  // 暂停交易
  const pauseExchange = async () => {
    if (!contract) return;

    setCurrentAction('pause');
    setTxStatus('waiting');

    try {
      const tx = await contract.pause();
      setTxHash(tx.hash);
      setTxStatus('pending');

      // 等待交易确认
      const receipt = await tx.wait();

      if (receipt.status === 1) {
        setTxStatus('success');

        // 刷新合约状态
        await fetchContractData(contract);

        // 回调通知
        if (onSuccess) onSuccess();
      } else {
        setTxStatus('failed');
      }
    } catch (error) {
      console.error("暂停交易失败:", error);
      setTxStatus('failed');
    }
  };

  // 恢复交易
  const unpauseExchange = async () => {
    if (!contract) return;

    setCurrentAction('unpause');
    setTxStatus('waiting');

    try {
      const tx = await contract.unpause();
      setTxHash(tx.hash);
      setTxStatus('pending');

      // 等待交易确认
      const receipt = await tx.wait();

      if (receipt.status === 1) {
        setTxStatus('success');

        // 刷新合约状态
        await fetchContractData(contract);

        // 回调通知
        if (onSuccess) onSuccess();
      } else {
        setTxStatus('failed');
      }
    } catch (error) {
      console.error("恢复交易失败:", error);
      setTxStatus('failed');
    }
  };

  // 设置最小购买金额
  const setMinimumPurchaseAmount = async () => {
    if (!contract || !newMinAmount) return;

    setCurrentAction('setMin');
    setTxStatus('waiting');

    try {
      const amountWei = ethers.utils.parseEther(newMinAmount);
      const tx = await contract.setMinPurchaseAmount(amountWei);
      setTxHash(tx.hash);
      setTxStatus('pending');

      // 等待交易确认
      const receipt = await tx.wait();

      if (receipt.status === 1) {
        setTxStatus('success');
        setMinPurchaseAmount(amountWei);

        // 回调通知
        if (onSuccess) onSuccess();
      } else {
        setTxStatus('failed');
      }
    } catch (error) {
      console.error("设置最小购买金额失败:", error);
      setTxStatus('failed');
    }
  };

  // 设置最大购买金额
  const setMaximumPurchaseAmount = async () => {
    if (!contract || !newMaxAmount) return;

    setCurrentAction('setMax');
    setTxStatus('waiting');

    try {
      const amountWei = ethers.utils.parseEther(newMaxAmount);
      const tx = await contract.setMaxPurchaseAmount(amountWei);
      setTxHash(tx.hash);
      setTxStatus('pending');

      // 等待交易确认
      const receipt = await tx.wait();

      if (receipt.status === 1) {
        setTxStatus('success');
        setMaxPurchaseAmount(amountWei);

        // 回调通知
        if (onSuccess) onSuccess();
      } else {
        setTxStatus('failed');
      }
    } catch (error) {
      console.error("设置最大购买金额失败:", error);
      setTxStatus('failed');
    }
  };

  // 获取操作名称
  const getActionName = () => {
    switch (currentAction) {
      case 'verify':
        return '验证用户';
      case 'revoke':
        return '撤销验证';
      case 'pause':
        return '暂停交易';
      case 'unpause':
        return '恢复交易';
      case 'setMin':
        return '设置最小购买金额';
      case 'setMax':
        return '设置最大购买金额';
      default:
        return '操作';
    }
  };

  // 获取交易状态文本
  const getTransactionStatusText = () => {
    const actionName = getActionName();

    switch (txStatus) {
      case 'waiting':
        return `${actionName}准备中...`;
      case 'pending':
        return `${actionName}交易进行中...`;
      case 'success':
        return `${actionName}成功!`;
      case 'failed':
        return `${actionName}失败，请重试`;
      default:
        return '';
    }
  };

  return (
    <div className="admin-panel">
      <div className="panel-header">
        <h2>管理员控制面板</h2>

        {!account ? (
          <button
            className="connect-button"
            onClick={connectWallet}
          >
            连接钱包
          </button>
        ) : (
          <div className="account-info">
            <span className={`admin-status ${isAdmin ? 'is-admin' : 'not-admin'}`}>
              {isAdmin ? '管理员' : '非管理员'}
            </span>
            <button
              className="disconnect-button"
              onClick={disconnectWallet}
            >
              断开连接 ({account?.slice(0, 6)}...{account?.slice(-4)})
            </button>
          </div>
        )}
      </div>

      {isLoading ? (
        <div className="loading-container">
          <div className="loading-spinner"></div>
          <p>加载中...</p>
        </div>
      ) : (
        account && isAdmin ? (
          <div className="admin-sections">
            {/* 用户验证管理 */}
            <div className="admin-section">
              <h3>用户验证管理</h3>

              <div className="input-group">
                <label htmlFor="user-address">用户钱包地址:</label>
                <input
                  id="user-address"
                  type="text"
                  placeholder="0x..."
                  value={userAddress}
                  onChange={handleUserAddressChange}
                  disabled={txStatus === 'waiting' || txStatus === 'pending'}
                />
              </div>

              {userVerified !== null && (
                <div className={`verification-status ${userVerified ? 'verified' : 'not-verified'}`}>
                  此用户当前{userVerified ? '已验证' : '未验证'}
                </div>
              )}

              <div className="button-group">
                <button
                  className="action-button verify-button"
                  onClick={verifyUser}
                  disabled={
                    txStatus === 'waiting' ||
                    txStatus === 'pending' ||
                    userVerified === true ||
                    !ethers.utils.isAddress(userAddress)
                  }
                >
                  验证用户
                </button>

                <button
                  className="action-button revoke-button"
                  onClick={revokeUserVerification}
                  disabled={
                    txStatus === 'waiting' ||
                    txStatus === 'pending' ||
                    userVerified === false ||
                    !ethers.utils.isAddress(userAddress)
                  }
                >
                  撤销验证
                </button>
              </div>
            </div>

            {/* 交易控制 */}
            <div className="admin-section">
              <h3>交易状态控制</h3>

              <div className="exchange-status">
                当前状态:
                <span className={exchangeStats?.paused ? 'paused-status' : 'active-status'}>
                  {exchangeStats?.paused ? '已暂停' : '进行中'}
                </span>
              </div>

              <div className="button-group">
                <button
                  className="action-button pause-button"
                  onClick={pauseExchange}
                  disabled={
                    txStatus === 'waiting' ||
                    txStatus === 'pending' ||
                    exchangeStats?.paused === true
                  }
                >
                  暂停交易
                </button>

                <button
                  className="action-button unpause-button"
                  onClick={unpauseExchange}
                  disabled={
                    txStatus === 'waiting' ||
                    txStatus === 'pending' ||
                    exchangeStats?.paused === false
                  }
                >
                  恢复交易
                </button>
              </div>
            </div>

            {/* 购买金额限制 */}
            <div className="admin-section">
              <h3>购买金额限制</h3>

              <div className="limit-info">
                <div className="limit-row">
                  <span>当前最小购买金额:</span>
                  <strong>{minPurchaseAmount ? ethers.utils.formatEther(minPurchaseAmount) : '0'} BNB</strong>
                </div>
                <div className="limit-row">
                  <span>当前最大购买金额:</span>
                  <strong>{maxPurchaseAmount ? ethers.utils.formatEther(maxPurchaseAmount) : '0'} BNB</strong>
                </div>
              </div>

              <div className="limits-form">
                <div className="input-group">
                  <label htmlFor="min-amount">新的最小购买金额 (BNB):</label>
                  <input
                    id="min-amount"
                    type="number"
                    min="0"
                    step="0.01"
                    value={newMinAmount}
                    onChange={(e) => setNewMinAmount(e.target.value)}
                    disabled={txStatus === 'waiting' || txStatus === 'pending'}
                  />
                  <button
                    className="action-button"
                    onClick={setMinimumPurchaseAmount}
                    disabled={txStatus === 'waiting' || txStatus === 'pending'}
                  >
                    设置
                  </button>
                </div>

                <div className="input-group">
                  <label htmlFor="max-amount">新的最大购买金额 (BNB):</label>
                  <input
                    id="max-amount"
                    type="number"
                    min="0"
                    step="0.1"
                    value={newMaxAmount}
                    onChange={(e) => setNewMaxAmount(e.target.value)}
                    disabled={txStatus === 'waiting' || txStatus === 'pending'}
                  />
                  <button
                    className="action-button"
                    onClick={setMaximumPurchaseAmount}
                    disabled={txStatus === 'waiting' || txStatus === 'pending'}
                  >
                    设置
                  </button>
                </div>
              </div>
            </div>

            {/* 交易状态显示 */}
            {txStatus !== 'none' && (
              <div className={`transaction-status ${
                txStatus === 'success' ? 'tx-success' :
                txStatus === 'failed' ? 'tx-failed' :
                'tx-pending'
              }`}>
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
        ) : account ? (
          <div className="not-admin-message">
            <p>您的账户没有管理员权限，无法访问管理面板。</p>
            <p>请使用管理员账户登录，或联系合约所有者添加您为管理员。</p>
          </div>
        ) : (
          <div className="connect-prompt">
            <p>请连接您的钱包以访问管理员面板</p>
          </div>
        )
      )}

      <style>
        {`
        .admin-panel {
          background: #f8f9fa;
          border-radius: 12px;
          box-shadow: 0 4px 16px rgba(0, 0, 0, 0.1);
          padding: 24px;
          width: 100%;
          max-width: 700px;
          margin: 0 auto 24px;
          font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
        }

        .panel-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 24px;
          padding-bottom: 16px;
          border-bottom: 1px solid #dee2e6;
        }

        .panel-header h2 {
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

        .account-info {
          display: flex;
          align-items: center;
          gap: 12px;
        }

        .admin-status {
          padding: 4px 8px;
          border-radius: 4px;
          font-size: 0.75rem;
          font-weight: 600;
        }

        .is-admin {
          background-color: #ebfbee;
          color: #2b8a3e;
        }

        .not-admin {
          background-color: #fff5f5;
          color: #e03131;
        }

        .loading-container {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          padding: 48px 0;
        }

        .loading-spinner {
          border: 3px solid #f3f3f3;
          border-top: 3px solid #339af0;
          border-radius: 50%;
          width: 24px;
          height: 24px;
          animation: spin 1s linear infinite;
          margin-bottom: 16px;
        }

        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }

        .admin-sections {
          display: flex;
          flex-direction: column;
          gap: 24px;
        }

        .admin-section {
          background-color: white;
          border-radius: 8px;
          padding: 16px;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
        }

        .admin-section h3 {
          margin: 0 0 16px 0;
          font-size: 1rem;
          color: #212529;
          font-weight: 600;
          padding-bottom: 8px;
          border-bottom: 1px solid #e9ecef;
        }

        .input-group {
          display: flex;
          flex-direction: column;
          gap: 8px;
          margin-bottom: 16px;
        }

        .limits-form .input-group {
          flex-direction: row;
          align-items: center;
          gap: 12px;
        }

        .limits-form .input-group label {
          flex: 1;
          white-space: nowrap;
        }

        .limits-form .input-group input {
          flex: 1;
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
          font-size: 0.875rem;
          transition: border-color 0.2s;
        }

        .input-group input:focus {
          border-color: #339af0;
          outline: none;
        }

        .verification-status {
          margin-bottom: 16px;
          padding: 8px 12px;
          border-radius: 6px;
          font-size: 0.875rem;
          font-weight: 500;
        }

        .verified {
          background-color: #ebfbee;
          color: #2b8a3e;
        }

        .not-verified {
          background-color: #fff5f5;
          color: #e03131;
        }

        .button-group {
          display: flex;
          gap: 12px;
        }

        .action-button {
          flex: 1;
          padding: 10px 16px;
          border: none;
          border-radius: 6px;
          font-size: 0.875rem;
          font-weight: 500;
          cursor: pointer;
          transition: all 0.2s;
          background-color: #339af0;
          color: white;
        }

        .action-button:hover:not(:disabled) {
          background-color: #1c7ed6;
        }

        .action-button:disabled {
          background-color: #adb5bd;
          cursor: not-allowed;
          opacity: 0.7;
        }

        .verify-button {
          background-color: #40c057;
        }

        .verify-button:hover:not(:disabled) {
          background-color: #2b8a3e;
        }

        .revoke-button {
          background-color: #fa5252;
        }

        .revoke-button:hover:not(:disabled) {
          background-color: #e03131;
        }

        .pause-button {
          background-color: #fd7e14;
        }

        .pause-button:hover:not(:disabled) {
          background-color: #e67700;
        }

        .unpause-button {
          background-color: #20c997;
        }

        .unpause-button:hover:not(:disabled) {
          background-color: #0ca678;
        }

        .exchange-status {
          margin-bottom: 16px;
          font-size: 0.875rem;
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .active-status {
          color: #2b8a3e;
          font-weight: 600;
        }

        .paused-status {
          color: #e03131;
          font-weight: 600;
        }

        .limit-info {
          margin-bottom: 16px;
          background-color: #f1f3f5;
          border-radius: 6px;
          padding: 12px;
        }

        .limit-row {
          display: flex;
          justify-content: space-between;
          padding: 4px 0;
          font-size: 0.875rem;
        }

        .limit-row strong {
          color: #495057;
        }

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

        .not-admin-message, .connect-prompt {
          text-align: center;
          padding: 48px 24px;
          color: #495057;
        }

        .not-admin-message p, .connect-prompt p {
          margin: 8px 0;
        }
        `}
      </style>
    </div>
  );
};

export default AdminPanel;