/**
 * 区块链事件监控服务
 * 
 * 该服务负责监控智能合约事件，并将事件记录到日志系统中。
 * 它支持监控SMToken和SMTokenExchange合约的各种事件。
 */

import { createPublicClient, http, parseAbiItem } from 'viem';
import { bsc, bscTestnet } from 'viem/chains';
import Logger from './logger';
import { createClient } from '@supabase/supabase-js';

// 环境变量
const ENVIRONMENT = process.env.NEXT_PUBLIC_APP_ENV || 'development';
const CHAIN_ID = parseInt(process.env.NEXT_PUBLIC_CHAIN_ID || '97');
const SM_TOKEN_ADDRESS = process.env.NEXT_PUBLIC_SM_TOKEN_ADDRESS || '';
const SM_TOKEN_EXCHANGE_ADDRESS = process.env.NEXT_PUBLIC_SM_TOKEN_EXCHANGE_ADDRESS || '';
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

// 创建Supabase客户端
const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// 创建日志记录器
const logger = Logger.createContextLogger({ component: 'BlockchainMonitor' });

// 选择链
const chain = CHAIN_ID === 56 ? bsc : bscTestnet;

// 创建公共客户端
const publicClient = createPublicClient({
  chain,
  transport: http(),
});

// 事件ABI
const eventAbis = {
  // SMToken事件
  TimelockActionEvent: parseAbiItem('event TimelockActionEvent(bytes32 indexed actionHash, uint8 actionType, uint64 scheduledTime)'),
  TokenOperation: parseAbiItem('event TokenOperation(address indexed account, uint256 amount, uint8 operationType)'),
  Transfer: parseAbiItem('event Transfer(address indexed from, address indexed to, uint256 value)'),
  
  // SMTokenExchange事件
  ExchangeAction: parseAbiItem('event ExchangeAction(uint8 actionType, uint8 round, uint256 amount)'),
  UserAction: parseAbiItem('event UserAction(address indexed user, uint8 actionType, uint256 amount)'),
};

// 事件类型
export enum EventType {
  TOKEN_TRANSFER = 'token_transfer',
  TOKEN_MINT = 'token_mint',
  TOKEN_BURN = 'token_burn',
  EXCHANGE_PURCHASE = 'exchange_purchase',
  EXCHANGE_ROUND_CHANGE = 'exchange_round_change',
  EXCHANGE_CONFIG_CHANGE = 'exchange_config_change',
}

// 事件数据接口
export interface EventData {
  eventType: EventType;
  transactionHash: string;
  blockNumber: number;
  timestamp: number;
  contractAddress: string;
  eventName: string;
  eventData: Record<string, any>;
}

/**
 * 将事件数据保存到数据库
 */
const saveEventToDatabase = async (eventData: EventData): Promise<void> => {
  try {
    await supabase.from('blockchain_events').insert([eventData]);
  } catch (error) {
    logger.error('Failed to save event to database', {
      action: 'saveEventToDatabase',
      additionalData: { error, eventData },
    });
  }
};

/**
 * 处理SMToken的Transfer事件
 */
const handleTransferEvent = async (
  event: any,
  blockNumber: number,
  timestamp: number
): Promise<void> => {
  const { from, to, value } = event.args;
  
  // 确定事件类型
  let eventType = EventType.TOKEN_TRANSFER;
  if (from === '0x0000000000000000000000000000000000000000') {
    eventType = EventType.TOKEN_MINT;
  } else if (to === '0x0000000000000000000000000000000000000000') {
    eventType = EventType.TOKEN_BURN;
  }
  
  // 创建事件数据
  const eventData: EventData = {
    eventType,
    transactionHash: event.transactionHash,
    blockNumber,
    timestamp,
    contractAddress: SM_TOKEN_ADDRESS,
    eventName: 'Transfer',
    eventData: {
      from,
      to,
      value: value.toString(),
    },
  };
  
  // 记录日志
  logger.info(`Token ${eventType}: ${from} -> ${to}, ${value.toString()}`, {
    action: 'handleTransferEvent',
    additionalData: eventData,
  });
  
  // 保存到数据库
  await saveEventToDatabase(eventData);
};

/**
 * 处理SMTokenExchange的UserAction事件
 */
const handleUserActionEvent = async (
  event: any,
  blockNumber: number,
  timestamp: number
): Promise<void> => {
  const { user, actionType, amount } = event.args;
  
  // 确定事件类型
  let eventType = EventType.EXCHANGE_CONFIG_CHANGE;
  if (actionType === 1) {
    eventType = EventType.EXCHANGE_PURCHASE;
  }
  
  // 创建事件数据
  const eventData: EventData = {
    eventType,
    transactionHash: event.transactionHash,
    blockNumber,
    timestamp,
    contractAddress: SM_TOKEN_EXCHANGE_ADDRESS,
    eventName: 'UserAction',
    eventData: {
      user,
      actionType: actionType.toString(),
      amount: amount.toString(),
    },
  };
  
  // 记录日志
  logger.info(`Exchange UserAction: ${user}, type=${actionType}, amount=${amount.toString()}`, {
    action: 'handleUserActionEvent',
    additionalData: eventData,
  });
  
  // 保存到数据库
  await saveEventToDatabase(eventData);
};

/**
 * 处理SMTokenExchange的ExchangeAction事件
 */
const handleExchangeActionEvent = async (
  event: any,
  blockNumber: number,
  timestamp: number
): Promise<void> => {
  const { actionType, round, amount } = event.args;
  
  // 确定事件类型
  let eventType = EventType.EXCHANGE_CONFIG_CHANGE;
  if (actionType === 6) {
    eventType = EventType.EXCHANGE_ROUND_CHANGE;
  }
  
  // 创建事件数据
  const eventData: EventData = {
    eventType,
    transactionHash: event.transactionHash,
    blockNumber,
    timestamp,
    contractAddress: SM_TOKEN_EXCHANGE_ADDRESS,
    eventName: 'ExchangeAction',
    eventData: {
      actionType: actionType.toString(),
      round: round.toString(),
      amount: amount.toString(),
    },
  };
  
  // 记录日志
  logger.info(`Exchange Action: type=${actionType}, round=${round}, amount=${amount.toString()}`, {
    action: 'handleExchangeActionEvent',
    additionalData: eventData,
  });
  
  // 保存到数据库
  await saveEventToDatabase(eventData);
};

/**
 * 监控SMToken合约事件
 */
export const monitorTokenEvents = async (): Promise<void> => {
  if (!SM_TOKEN_ADDRESS) {
    logger.warn('SMToken address not configured, skipping event monitoring');
    return;
  }
  
  logger.info('Starting SMToken event monitoring', {
    action: 'monitorTokenEvents',
    additionalData: { address: SM_TOKEN_ADDRESS },
  });
  
  // 监控Transfer事件
  const unwatch = publicClient.watchContractEvent({
    address: SM_TOKEN_ADDRESS as `0x${string}`,
    abi: [eventAbis.Transfer],
    eventName: 'Transfer',
    onLogs: async (logs) => {
      for (const log of logs) {
        const block = await publicClient.getBlock({
          blockNumber: log.blockNumber,
        });
        
        await handleTransferEvent(log, Number(log.blockNumber), Number(block.timestamp));
      }
    },
  });
  
  return unwatch;
};

/**
 * 监控SMTokenExchange合约事件
 */
export const monitorExchangeEvents = async (): Promise<void> => {
  if (!SM_TOKEN_EXCHANGE_ADDRESS) {
    logger.warn('SMTokenExchange address not configured, skipping event monitoring');
    return;
  }
  
  logger.info('Starting SMTokenExchange event monitoring', {
    action: 'monitorExchangeEvents',
    additionalData: { address: SM_TOKEN_EXCHANGE_ADDRESS },
  });
  
  // 监控UserAction事件
  const unwatchUserAction = publicClient.watchContractEvent({
    address: SM_TOKEN_EXCHANGE_ADDRESS as `0x${string}`,
    abi: [eventAbis.UserAction],
    eventName: 'UserAction',
    onLogs: async (logs) => {
      for (const log of logs) {
        const block = await publicClient.getBlock({
          blockNumber: log.blockNumber,
        });
        
        await handleUserActionEvent(log, Number(log.blockNumber), Number(block.timestamp));
      }
    },
  });
  
  // 监控ExchangeAction事件
  const unwatchExchangeAction = publicClient.watchContractEvent({
    address: SM_TOKEN_EXCHANGE_ADDRESS as `0x${string}`,
    abi: [eventAbis.ExchangeAction],
    eventName: 'ExchangeAction',
    onLogs: async (logs) => {
      for (const log of logs) {
        const block = await publicClient.getBlock({
          blockNumber: log.blockNumber,
        });
        
        await handleExchangeActionEvent(log, Number(log.blockNumber), Number(block.timestamp));
      }
    },
  });
  
  return () => {
    unwatchUserAction();
    unwatchExchangeAction();
  };
};

/**
 * 区块链监控服务
 */
const BlockchainMonitor = {
  monitorTokenEvents,
  monitorExchangeEvents,
  EventType,
};

export default BlockchainMonitor;
