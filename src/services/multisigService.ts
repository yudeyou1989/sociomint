'use client';

/**
 * 多签钱包服务
 * 
 * 该服务提供与多签钱包交互的功能，包括查询多签钱包信息、提交交易和查询交易状态等。
 */

import { ethers } from 'ethers';
import Logger from './logger';
import { createClient } from '@supabase/supabase-js';

// 创建日志记录器
const logger = Logger.createContextLogger({ component: 'MultisigService' });

// 多签钱包ABI - 简化版，仅包含我们需要的函数
const MULTISIG_ABI = [
  // 查询所有者
  'function getOwners() view returns (address[])',
  // 查询确认数
  'function getConfirmationCount(uint256 transactionId) view returns (uint256)',
  // 查询所需确认数
  'function required() view returns (uint256)',
  // 查询交易数量
  'function transactionCount() view returns (uint256)',
  // 查询交易
  'function transactions(uint256 transactionId) view returns (address destination, uint256 value, bytes data, bool executed)',
  // 查询确认状态
  'function isConfirmed(uint256 transactionId) view returns (bool)',
  // 提交交易
  'function submitTransaction(address destination, uint256 value, bytes data) returns (uint256 transactionId)',
  // 确认交易
  'function confirmTransaction(uint256 transactionId)',
  // 撤销确认
  'function revokeConfirmation(uint256 transactionId)',
  // 执行交易
  'function executeTransaction(uint256 transactionId)',
  // 事件
  'event Submission(uint256 indexed transactionId)',
  'event Confirmation(address indexed sender, uint256 indexed transactionId)',
  'event Execution(uint256 indexed transactionId)',
  'event ExecutionFailure(uint256 indexed transactionId)',
];

// 多签钱包地址
const MULTISIG_ADDRESS = process.env.NEXT_PUBLIC_MULTISIG_WALLET_ADDRESS as string;

// Supabase客户端
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl || '', supabaseAnonKey || '');

// 交易类型
export enum MultisigTransactionType {
  TRANSFER_FUNDS = 'transfer_funds',
  UPGRADE_CONTRACT = 'upgrade_contract',
  CHANGE_PARAMETER = 'change_parameter',
  ADD_OWNER = 'add_owner',
  REMOVE_OWNER = 'remove_owner',
  CHANGE_REQUIREMENT = 'change_requirement',
  OTHER = 'other',
}

// 交易状态
export enum MultisigTransactionStatus {
  PENDING = 'pending',
  CONFIRMED = 'confirmed',
  EXECUTED = 'executed',
  FAILED = 'failed',
}

// 交易信息接口
export interface MultisigTransaction {
  id: number;
  destination: string;
  value: string;
  data: string;
  executed: boolean;
  confirmations: number;
  requiredConfirmations: number;
  type: MultisigTransactionType;
  status: MultisigTransactionStatus;
  description?: string;
  createdAt: number;
}

/**
 * 获取多签钱包合约实例
 */
const getMultisigContract = (provider: ethers.providers.Provider) => {
  return new ethers.Contract(MULTISIG_ADDRESS, MULTISIG_ABI, provider);
};

/**
 * 获取多签钱包信息
 */
export const getMultisigInfo = async (provider: ethers.providers.Provider) => {
  try {
    const contract = getMultisigContract(provider);
    
    // 获取所有者
    const owners = await contract.getOwners();
    
    // 获取所需确认数
    const requiredConfirmations = await contract.required();
    
    // 获取交易数量
    const transactionCount = await contract.transactionCount();
    
    // 获取钱包余额
    const balance = await provider.getBalance(MULTISIG_ADDRESS);
    
    return {
      address: MULTISIG_ADDRESS,
      owners,
      requiredConfirmations: requiredConfirmations.toNumber(),
      transactionCount: transactionCount.toNumber(),
      balance: ethers.utils.formatEther(balance),
    };
  } catch (error) {
    logger.error('获取多签钱包信息失败', {
      action: 'getMultisigInfo',
      additionalData: { error },
    });
    throw error;
  }
};

/**
 * 获取交易信息
 */
export const getTransaction = async (
  provider: ethers.providers.Provider,
  transactionId: number
): Promise<MultisigTransaction> => {
  try {
    const contract = getMultisigContract(provider);
    
    // 获取交易信息
    const [destination, value, data, executed] = await contract.transactions(transactionId);
    
    // 获取确认数
    const confirmations = await contract.getConfirmationCount(transactionId);
    
    // 获取所需确认数
    const requiredConfirmations = await contract.required();
    
    // 确定交易状态
    let status: MultisigTransactionStatus;
    if (executed) {
      status = MultisigTransactionStatus.EXECUTED;
    } else if (confirmations.toNumber() >= requiredConfirmations.toNumber()) {
      status = MultisigTransactionStatus.CONFIRMED;
    } else {
      status = MultisigTransactionStatus.PENDING;
    }
    
    // 从数据库获取交易描述和类型
    const { data: txData, error } = await supabase
      .from('multisig_transactions')
      .select('description, type, created_at')
      .eq('transaction_id', transactionId)
      .single();
    
    // 确定交易类型
    let type = MultisigTransactionType.OTHER;
    let description = '';
    let createdAt = Math.floor(Date.now() / 1000);
    
    if (txData) {
      type = txData.type || MultisigTransactionType.OTHER;
      description = txData.description || '';
      createdAt = new Date(txData.created_at).getTime() / 1000;
    } else {
      // 尝试从交易数据推断类型
      if (destination === MULTISIG_ADDRESS && data.startsWith('0x')) {
        // 可能是更改所有者或要求的交易
        if (data.includes('addOwner')) {
          type = MultisigTransactionType.ADD_OWNER;
        } else if (data.includes('removeOwner')) {
          type = MultisigTransactionType.REMOVE_OWNER;
        } else if (data.includes('changeRequirement')) {
          type = MultisigTransactionType.CHANGE_REQUIREMENT;
        }
      } else if (value.gt(0) && data === '0x') {
        // 简单的资金转移
        type = MultisigTransactionType.TRANSFER_FUNDS;
      }
    }
    
    return {
      id: transactionId,
      destination,
      value: ethers.utils.formatEther(value),
      data,
      executed,
      confirmations: confirmations.toNumber(),
      requiredConfirmations: requiredConfirmations.toNumber(),
      type,
      status,
      description,
      createdAt,
    };
  } catch (error) {
    logger.error('获取交易信息失败', {
      action: 'getTransaction',
      additionalData: { error, transactionId },
    });
    throw error;
  }
};

/**
 * 获取所有交易
 */
export const getAllTransactions = async (
  provider: ethers.providers.Provider
): Promise<MultisigTransaction[]> => {
  try {
    const contract = getMultisigContract(provider);
    
    // 获取交易数量
    const transactionCount = await contract.transactionCount();
    
    // 获取所有交易
    const transactions: MultisigTransaction[] = [];
    for (let i = 0; i < transactionCount.toNumber(); i++) {
      const transaction = await getTransaction(provider, i);
      transactions.push(transaction);
    }
    
    // 按ID降序排序（最新的交易在前面）
    return transactions.sort((a, b) => b.id - a.id);
  } catch (error) {
    logger.error('获取所有交易失败', {
      action: 'getAllTransactions',
      additionalData: { error },
    });
    throw error;
  }
};

/**
 * 提交交易
 */
export const submitTransaction = async (
  signer: ethers.Signer,
  destination: string,
  value: string,
  data: string,
  type: MultisigTransactionType,
  description: string
): Promise<number> => {
  try {
    const contract = getMultisigContract(signer);
    
    // 转换值为Wei
    const valueInWei = ethers.utils.parseEther(value);
    
    // 提交交易
    const tx = await contract.submitTransaction(destination, valueInWei, data);
    const receipt = await tx.wait();
    
    // 从事件中获取交易ID
    const submissionEvent = receipt.events?.find(e => e.event === 'Submission');
    const transactionId = submissionEvent?.args?.transactionId.toNumber();
    
    if (!transactionId && transactionId !== 0) {
      throw new Error('无法获取交易ID');
    }
    
    // 将交易信息保存到数据库
    await supabase.from('multisig_transactions').insert({
      transaction_id: transactionId,
      destination,
      value,
      data,
      type,
      description,
      status: MultisigTransactionStatus.PENDING,
      created_at: new Date().toISOString(),
    });
    
    logger.info('交易已提交', {
      action: 'submitTransaction',
      additionalData: { transactionId, destination, value, type },
    });
    
    return transactionId;
  } catch (error) {
    logger.error('提交交易失败', {
      action: 'submitTransaction',
      additionalData: { error, destination, value, data },
    });
    throw error;
  }
};

/**
 * 确认交易
 */
export const confirmTransaction = async (
  signer: ethers.Signer,
  transactionId: number
): Promise<boolean> => {
  try {
    const contract = getMultisigContract(signer);
    
    // 确认交易
    const tx = await contract.confirmTransaction(transactionId);
    await tx.wait();
    
    logger.info('交易已确认', {
      action: 'confirmTransaction',
      additionalData: { transactionId },
    });
    
    return true;
  } catch (error) {
    logger.error('确认交易失败', {
      action: 'confirmTransaction',
      additionalData: { error, transactionId },
    });
    throw error;
  }
};

/**
 * 撤销确认
 */
export const revokeConfirmation = async (
  signer: ethers.Signer,
  transactionId: number
): Promise<boolean> => {
  try {
    const contract = getMultisigContract(signer);
    
    // 撤销确认
    const tx = await contract.revokeConfirmation(transactionId);
    await tx.wait();
    
    logger.info('确认已撤销', {
      action: 'revokeConfirmation',
      additionalData: { transactionId },
    });
    
    return true;
  } catch (error) {
    logger.error('撤销确认失败', {
      action: 'revokeConfirmation',
      additionalData: { error, transactionId },
    });
    throw error;
  }
};

/**
 * 执行交易
 */
export const executeTransaction = async (
  signer: ethers.Signer,
  transactionId: number
): Promise<boolean> => {
  try {
    const contract = getMultisigContract(signer);
    
    // 执行交易
    const tx = await contract.executeTransaction(transactionId);
    const receipt = await tx.wait();
    
    // 检查是否执行成功
    const executionEvent = receipt.events?.find(e => e.event === 'Execution');
    const executionFailureEvent = receipt.events?.find(e => e.event === 'ExecutionFailure');
    
    const success = !!executionEvent && !executionFailureEvent;
    
    // 更新数据库中的交易状态
    await supabase.from('multisig_transactions').update({
      status: success ? MultisigTransactionStatus.EXECUTED : MultisigTransactionStatus.FAILED,
    }).eq('transaction_id', transactionId);
    
    logger.info(success ? '交易已执行' : '交易执行失败', {
      action: 'executeTransaction',
      additionalData: { transactionId, success },
    });
    
    return success;
  } catch (error) {
    logger.error('执行交易失败', {
      action: 'executeTransaction',
      additionalData: { error, transactionId },
    });
    throw error;
  }
};

/**
 * 多签钱包服务
 */
const MultisigService = {
  getMultisigInfo,
  getTransaction,
  getAllTransactions,
  submitTransaction,
  confirmTransaction,
  revokeConfirmation,
  executeTransaction,
};

export default MultisigService;
