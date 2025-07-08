'use client';

import { useState, Suspense } from 'react';
import { useAccount, useConnect, useDisconnect } from 'wagmi';
import { injected } from '@wagmi/connectors';
import { useSMToken } from '../../hooks/useSMToken';
import { useSMTokenExchange } from '../../hooks/useSMTokenExchange';
import { LazyTokenExchange } from '@/components/common/LazyComponents';

export default function ExchangePage() {
  const { address, isConnected } = useAccount();
  const { connect } = useConnect({
    connector: injected(),
  });
  const { disconnect } = useDisconnect();
  
  const { balance, formattedBalance, isLoading: isLoadingBalance } = useSMToken();
  const { 
    exchangeStats, 
    exchangeTokens, 
    isLoadingStats, 
    isExchanging,
    txHash,
    error,
  } = useSMTokenExchange();

  const [bnbAmount, setBnbAmount] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  const handleExchange = async () => {
    if (!bnbAmount || parseFloat(bnbAmount) <= 0) {
      return;
    }

    try {
      setSuccessMessage('');
      const hash = await exchangeTokens(bnbAmount);
      if (hash) {
        setSuccessMessage('兑换成功！');
        setBnbAmount('');
      }
    } catch (error) {
      console.error('兑换失败:', error);
    }
  };
  
  // 自定义的钱包连接按钮
  const ConnectButton = () => {
    if (isConnected && address) {
      return (
        <div className="flex flex-col items-center">
          <div className="py-2 px-4 bg-gray-100 rounded-lg mb-2 text-sm font-medium break-all">
            {address}
          </div>
          <button 
            onClick={() => disconnect()}
            className="py-2 px-4 bg-red-100 text-red-700 rounded-md hover:bg-red-200 transition-colors"
          >
            断开连接
          </button>
        </div>
      );
    }
    
    return (
      <button 
        onClick={() => connect()}
        className="py-2 px-6 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
      >
        连接钱包
      </button>
    );
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-4 bg-gray-100">
      <div className="w-full max-w-md p-6 bg-white rounded-lg shadow-md">
        <h1 className="mb-6 text-2xl font-bold text-center">SocioMint 代币兑换</h1>
        
        <div className="mb-6 flex justify-center">
          <ConnectButton />
        </div>

        {isConnected && (
          <>
            <div className="p-4 mb-4 bg-gray-100 rounded-md">
              <h2 className="mb-2 text-lg font-medium">您的 SM 代币余额</h2>
              {isLoadingBalance ? (
                <p>加载中...</p>
              ) : (
                <p className="text-xl font-bold">{formattedBalance} SM</p>
              )}
            </div>

            <div className="p-4 mb-6 bg-gray-100 rounded-md">
              <h2 className="mb-4 text-lg font-medium">兑换信息</h2>
              {isLoadingStats ? (
                <p>加载中...</p>
              ) : exchangeStats ? (
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span>当前轮次:</span>
                    <span className="font-medium">{exchangeStats.currentRound}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>已售代币:</span>
                    <span className="font-medium">{exchangeStats.formattedTokensSold} SM</span>
                  </div>
                  <div className="flex justify-between">
                    <span>剩余代币:</span>
                    <span className="font-medium">{exchangeStats.formattedTokensRemaining} SM</span>
                  </div>
                  <div className="flex justify-between">
                    <span>已募集 BNB:</span>
                    <span className="font-medium">{exchangeStats.formattedBnbRaised} BNB</span>
                  </div>
                  <div className="flex justify-between">
                    <span>当前价格:</span>
                    <span className="font-medium">{exchangeStats.formattedCurrentPrice} BNB</span>
                  </div>
                  <div className="flex justify-between">
                    <span>下一轮价格:</span>
                    <span className="font-medium">{exchangeStats.formattedNextRoundPrice} BNB</span>
                  </div>
                  <div className="flex justify-between">
                    <span>兑换状态:</span>
                    <span className={`font-medium ${exchangeStats.isActive ? 'text-green-500' : 'text-red-500'}`}>
                      {exchangeStats.isActive ? '开放' : '关闭'}
                    </span>
                  </div>
                </div>
              ) : (
                <p>无法获取兑换信息</p>
              )}
            </div>

            <div className="mb-4">
              <label className="block mb-2 text-sm font-medium">
                输入 BNB 数量
              </label>
              <input
                type="number"
                placeholder="0.1"
                value={bnbAmount}
                onChange={(e) => setBnbAmount(e.target.value)}
                className="w-full p-2 border border-gray-300 rounded-md"
                disabled={isExchanging || !exchangeStats?.isActive}
                min="0"
                step="0.001"
              />
            </div>

            <button
              onClick={handleExchange}
              disabled={isExchanging || !bnbAmount || !exchangeStats?.isActive}
              className={`w-full p-2 text-white rounded-md ${
                isExchanging || !bnbAmount || !exchangeStats?.isActive
                  ? 'bg-gray-400 cursor-not-allowed'
                  : 'bg-blue-500 hover:bg-blue-600'
              }`}
            >
              {isExchanging ? '处理中...' : '兑换代币'}
            </button>

            {txHash && (
              <div className="mt-4 p-2 bg-green-100 text-green-700 rounded-md">
                <p>交易哈希: </p>
                <a
                  href={`https://testnet.bscscan.com/tx/${txHash}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="break-all text-blue-500 hover:underline"
                >
                  {txHash}
                </a>
              </div>
            )}

            {error && (
              <div className="mt-4 p-2 bg-red-100 text-red-700 rounded-md">
                {error.message}
              </div>
            )}

            {successMessage && (
              <div className="mt-4 p-2 bg-green-100 text-green-700 rounded-md">
                {successMessage}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
