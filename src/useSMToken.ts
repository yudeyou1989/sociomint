'use client';

import { useAccount, useContractRead, useContractWrite, useWaitForTransaction } from 'wagmi';
import { CONTRACT_ADDRESSES, SM_TOKEN_ABI } from '@/constants/contracts';
import { keccak256, toBytes } from 'viem';

export function useSMToken() {
  const { address, isConnected } = useAccount();

  // 安全地计算角色哈希，避免硬编码
  const MINTER_ROLE = keccak256(toBytes('MINTER_ROLE'));

  // 获取代币信息
  const { data: tokenName } = useContractRead({
    address: CONTRACT_ADDRESSES.token as `0x${string}`,
    abi: SM_TOKEN_ABI,
    functionName: 'name',
    enabled: isConnected,
  });

  const { data: tokenSymbol } = useContractRead({
    address: CONTRACT_ADDRESSES.token as `0x${string}`,
    abi: SM_TOKEN_ABI,
    functionName: 'symbol',
    enabled: isConnected,
  });

  // 获取用户余额
  const { data: balance, refetch: refetchBalance } = useContractRead({
    address: CONTRACT_ADDRESSES.token as `0x${string}`,
    abi: SM_TOKEN_ABI,
    functionName: 'balanceOf',
    args: address ? [address] : undefined,
    enabled: isConnected && !!address,
  });

  // 检查用户角色
  const { data: hasMinterRole } = useContractRead({
    address: CONTRACT_ADDRESSES.token as `0x${string}`,
    abi: SM_TOKEN_ABI,
    functionName: 'hasRole',
    args: address ? [MINTER_ROLE, address] : undefined,
    enabled: isConnected && !!address,
  });

  // 安排铸币函数
  const {
    data: scheduleMintData,
    write: scheduleMint,
    isLoading: isSchedulingMint,
    isSuccess: isScheduleMintSuccess,
    error: scheduleMintError
  } = useContractWrite({
    address: CONTRACT_ADDRESSES.token as `0x${string}`,
    abi: SM_TOKEN_ABI,
    functionName: 'scheduleMint',
  });

  // 等待铸币交易确认
  const {
    isLoading: isScheduleMintPending,
    isSuccess: isScheduleMintConfirmed
  } = useWaitForTransaction({
    hash: scheduleMintData?.hash,
  });

  // 执行铸币函数
  const {
    data: executeMintData,
    write: executeMint,
    isLoading: isExecutingMint,
    isSuccess: isExecuteMintSuccess,
    error: executeMintError
  } = useContractWrite({
    address: CONTRACT_ADDRESSES.token as `0x${string}`,
    abi: SM_TOKEN_ABI,
    functionName: 'executeMint',
  });

  // 等待执行铸币交易确认
  const {
    isLoading: isExecuteMintPending,
    isSuccess: isExecuteMintConfirmed
  } = useWaitForTransaction({
    hash: executeMintData?.hash,
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
    scheduleMintTxHash: scheduleMintData?.hash,

    executeMint,
    isExecutingMint: isExecutingMint || isExecuteMintPending,
    isExecuteMintSuccess: isExecuteMintSuccess && isExecuteMintConfirmed,
    executeMintError,
    executeMintTxHash: executeMintData?.hash,

    // 连接状态
    isConnected,
    address
  };
}
