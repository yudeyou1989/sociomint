'use client';

import { useAccount, useReadContract, useWriteContract, useWaitForTransactionReceipt } from 'wagmi';
import { CONTRACT_ADDRESSES, SM_TOKEN_ABI } from '@/config/contracts';
import { keccak256, toBytes } from 'viem';

export function useSMToken() {
  const { address, isConnected } = useAccount();

  // 安全地计算角色哈希，避免硬编码
  const MINTER_ROLE = keccak256(toBytes('MINTER_ROLE'));

  // 获取代币信息
  const { data: tokenName } = useReadContract({
    address: CONTRACT_ADDRESSES.token as `0x${string}`,
    abi: SM_TOKEN_ABI,
    functionName: 'name',
    query: { enabled: isConnected },
  });

  const { data: tokenSymbol } = useReadContract({
    address: CONTRACT_ADDRESSES.token as `0x${string}`,
    abi: SM_TOKEN_ABI,
    functionName: 'symbol',
    query: { enabled: isConnected },
  });

  // 获取用户余额
  const { data: balance, refetch: refetchBalance } = useReadContract({
    address: CONTRACT_ADDRESSES.token as `0x${string}`,
    abi: SM_TOKEN_ABI,
    functionName: 'balanceOf',
    args: address ? [address] : undefined,
    query: { enabled: isConnected && !!address },
  });

  // 检查用户角色
  const { data: hasMinterRole } = useReadContract({
    address: CONTRACT_ADDRESSES.token as `0x${string}`,
    abi: SM_TOKEN_ABI,
    functionName: 'hasRole',
    args: address ? [MINTER_ROLE, address] : undefined,
    query: { enabled: isConnected && !!address },
  });

  // 安排铸币函数
  const {
    data: scheduleMintData,
    writeContract: scheduleMint,
    isPending: isSchedulingMint,
    isSuccess: isScheduleMintSuccess,
    error: scheduleMintError
  } = useWriteContract();

  // 等待铸币交易确认
  const {
    isLoading: isScheduleMintPending,
    isSuccess: isScheduleMintConfirmed
  } = useWaitForTransactionReceipt({
    hash: scheduleMintData,
  });

  // 执行铸币函数
  const {
    data: executeMintData,
    writeContract: executeMint,
    isPending: isExecutingMint,
    isSuccess: isExecuteMintSuccess,
    error: executeMintError
  } = useWriteContract();

  // 等待执行铸币交易确认
  const {
    isLoading: isExecuteMintPending,
    isSuccess: isExecuteMintConfirmed
  } = useWaitForTransactionReceipt({
    hash: executeMintData,
  });

  return {
    // 代币信息
    tokenName,
    tokenSymbol,
    balance,
    refetchBalance,

    // 用户角色
    hasMinterRole,

    // 铸币功能
    scheduleMint,
    isSchedulingMint: isSchedulingMint || isScheduleMintPending,
    isScheduleMintSuccess: isScheduleMintSuccess && isScheduleMintConfirmed,
    scheduleMintError,
    scheduleMintTxHash: scheduleMintData,

    executeMint,
    isExecutingMint: isExecutingMint || isExecuteMintPending,
    isExecuteMintSuccess: isExecuteMintSuccess && isExecuteMintConfirmed,
    executeMintError,
    executeMintTxHash: executeMintData,

    // 连接状态
    isConnected,
    address
  };
}
