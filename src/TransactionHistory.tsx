'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { ethers, formatEther, parseEther } from 'ethers';
import { CONTRACT_ADDRESSES } from './constants/contracts';
import { useAccount } from 'wagmi';
import { hasEthereum } from './services/walletService';

// 交易事件 ABI
const EXCHANGE_EVENT_ABI = [
  "event TokensExchanged(address indexed user, uint256 bnbAmount, uint256 tokenAmount, uint256 timestamp, uint256 round, uint256 price)"
];

interface Transaction {
  hash: string;
  bnbAmount: string;
  tokenAmount: string;
  timestamp: number;
  round: number;
  price: string;
}

interface TransactionHistoryProps {
  className?: string;
  maxItems?: number;
}

interface TransactionHistoryState {
  transactions: Transaction[];
  loading: boolean;
  error: string | null;
}

const initialState: TransactionHistoryState = {
  transactions: [],
  loading: true,
  error: null
};

// 工具函数
const formatTimestamp = (timestamp: number): string => {
  const date = new Date(timestamp * 1000);
  return date.toLocaleString();
};

const truncateHash = (hash: string): string => {
  return `${hash.slice(0, 6)}...${hash.slice(-4)}`;
};

const TransactionHistory: React.FC<TransactionHistoryProps> = ({
  className,
  maxItems = 5
}) => {
  const { address, isConnected } = useAccount();
  const [state, setState] = useState<TransactionHistoryState>(initialState);
  const { transactions, loading, error } = state;

  useEffect(() => {
    const fetchTransactionHistory = async () => {
      if (!isConnected || !address || !hasEthereum()) {
        setState(prev => ({ ...prev, loading: false }));
        return;
      }

      try {
        setState(prev => ({ ...prev, loading: true, error: null }));

        // 连接到以太坊网络
        const provider = new ethers.BrowserProvider(window.ethereum);

        // 创建合约实例
        const exchangeContract = new ethers.Contract(
          CONTRACT_ADDRESSES.exchange,
          EXCHANGE_EVENT_ABI,
          provider
        );

        // 创建过滤器，只获取当前用户的交易
        const filter = exchangeContract.filters.TokensExchanged(address);

        // 获取过去的事件（最近1000个区块）
        const events = await exchangeContract.queryFilter(filter, -1000);

        // 处理事件数据
        const txHistory = events.map((event) => {
          const { transactionHash, args } = event;

          return {
            hash: transactionHash,
            bnbAmount: formatEther(args?.bnbAmount || 0),
            tokenAmount: formatEther(args?.tokenAmount || 0),
            timestamp: Number(args?.timestamp || 0),
            round: Number(args?.round || 0),
            price: formatEther(args?.price || 0)
          };
        });

        // 按时间戳排序，最新的在前面
        const sortedHistory = txHistory.sort((a, b) => b.timestamp - a.timestamp);

        // 限制显示的条目数
        setState({
          transactions: sortedHistory.slice(0, maxItems),
          loading: false,
          error: null
        });
      } catch (err) {
        console.error('获取交易历史失败:', err);
        setState({
          transactions: [],
          loading: false,
          error: '获取交易历史失败，请稍后再试'
        });
      }
    };

    fetchTransactionHistory();
  }, [address, isConnected, maxItems]);

  // 渲染表格行
  const renderTableRows = useMemo(() => {
    return transactions.map((tx, index) => (
      <tr key={tx.hash} className={index % 2 === 0 ? 'bg-gray-900' : 'bg-gray-800'}>
        <td className="px-4 py-2 whitespace-nowrap text-sm text-blue-400">
          <a
            href={`https://testnet.bscscan.com/tx/${tx.hash}`}
            target="_blank"
            rel="noopener noreferrer"
          >
            {truncateHash(tx.hash)}
          </a>
        </td>
        <td className="px-4 py-2 whitespace-nowrap text-sm text-white">{parseFloat(tx.bnbAmount).toFixed(4)}</td>
        <td className="px-4 py-2 whitespace-nowrap text-sm text-white">{parseFloat(tx.tokenAmount).toFixed(2)}</td>
        <td className="px-4 py-2 whitespace-nowrap text-sm text-white">{formatTimestamp(tx.timestamp)}</td>
        <td className="px-4 py-2 whitespace-nowrap text-sm text-white">{tx.round}</td>
        <td className="px-4 py-2 whitespace-nowrap text-sm text-white">{parseFloat(tx.price).toFixed(12)}</td>
      </tr>
    ));
  }, [transactions]);

  // 渲染内容
  const renderContent = () => {
    if (!isConnected) {
      return <p className="text-center text-gray-400">请连接钱包查看您的交易历史</p>;
    }

    if (loading) {
      return <p className="text-center text-gray-400">加载中...</p>;
    }

    if (error) {
      return <p className="text-center text-red-500">{error}</p>;
    }

    if (transactions.length === 0) {
      return (
        <>
          <h2 className="text-xl font-bold mb-4 text-white">交易历史</h2>
          <p className="text-center text-gray-400">暂无交易记录</p>
        </>
      );
    }

    return (
      <>
        <h2 className="text-xl font-bold mb-4 text-white">交易历史</h2>

        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-700">
            <thead>
              <tr>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">交易哈希</th>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">BNB 数量</th>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">SM 数量</th>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">时间</th>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">轮次</th>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">价格</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-700">
              {renderTableRows}
            </tbody>
          </table>
        </div>
      </>
    );
  };

  return (
    <div className={`p-4 rounded-lg bg-gray-800 ${className}`}>
      {renderContent()}
    </div>
  );
};

export default TransactionHistory;
