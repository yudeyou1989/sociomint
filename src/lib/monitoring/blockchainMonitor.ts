/**
 * 区块链监控模块
 * 监控智能合约事件和交易状态
 */

import { ethers } from 'ethers';
import { createClient } from '@supabase/supabase-js';
import { sendWebhookMessage } from '@/lib/social/discordAPI';
import { reportError, trackTransaction, addBreadcrumb } from './sentryConfig';
import type { Database } from '@/types/supabase';

// 环境变量
const RPC_URL = process.env.NEXT_PUBLIC_RPC_URL!;
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const DISCORD_WEBHOOK_URL = process.env.DISCORD_WEBHOOK_URL;
const AIRDROP_POOL_ADDRESS = process.env.NEXT_PUBLIC_AIRDROP_POOL_ADDRESS!;
const SM_TOKEN_ADDRESS = process.env.NEXT_PUBLIC_SM_TOKEN_ADDRESS!;

// 初始化客户端
const provider = new ethers.JsonRpcProvider(RPC_URL);
const supabase = createClient<Database>(SUPABASE_URL, SUPABASE_SERVICE_KEY);

// 合约 ABI（简化版）
const AIRDROP_POOL_ABI = [
  'event FlowersDeposited(address indexed user, uint256 amount, uint256 roundId)',
  'event RewardClaimed(address indexed user, uint256 amount, uint256 roundId)',
  'event RoundStarted(uint256 indexed roundId, uint256 startTime, uint256 endTime)',
  'event RoundEnded(uint256 indexed roundId, uint256 totalDeposits, uint256 participantCount)',
  'event RewardsDistributed(uint256 indexed roundId, uint256 totalRewards)',
  'event EmergencyWithdraw(address indexed user, uint256 amount)'
];

const SM_TOKEN_ABI = [
  'event Transfer(address indexed from, address indexed to, uint256 value)',
  'event Approval(address indexed owner, address indexed spender, uint256 value)'
];

// 合约实例
const airdropPoolContract = new ethers.Contract(AIRDROP_POOL_ADDRESS, AIRDROP_POOL_ABI, provider);
const smTokenContract = new ethers.Contract(SM_TOKEN_ADDRESS, SM_TOKEN_ABI, provider);

// 监控状态
interface MonitorState {
  isRunning: boolean;
  lastBlockNumber: number;
  errorCount: number;
  startTime: Date;
}

let monitorState: MonitorState = {
  isRunning: false,
  lastBlockNumber: 0,
  errorCount: 0,
  startTime: new Date()
};

// 事件处理器类型
type EventHandler = (event: ethers.Log, parsedEvent: ethers.LogDescription) => Promise<void>;

/**
 * 启动区块链监控
 */
export async function startBlockchainMonitor(): Promise<void> {
  if (monitorState.isRunning) {
    console.log('⚠️ Blockchain monitor is already running');
    return;
  }

  try {
    monitorState.isRunning = true;
    monitorState.startTime = new Date();
    monitorState.errorCount = 0;

    // 获取当前区块号
    monitorState.lastBlockNumber = await provider.getBlockNumber();
    
    console.log('🚀 Starting blockchain monitor...');
    console.log(`📊 Current block: ${monitorState.lastBlockNumber}`);

    // 设置事件监听器
    setupEventListeners();

    // 启动定期检查
    startPeriodicChecks();

    // 发送启动通知
    await sendNotification('🚀 区块链监控已启动', 'success');

    addBreadcrumb('Blockchain monitor started', 'monitor', {
      blockNumber: monitorState.lastBlockNumber
    });

  } catch (error: any) {
    console.error('❌ Failed to start blockchain monitor:', error);
    reportError(error, { component: 'blockchainMonitor', action: 'start' });
    monitorState.isRunning = false;
    throw error;
  }
}

/**
 * 停止区块链监控
 */
export async function stopBlockchainMonitor(): Promise<void> {
  if (!monitorState.isRunning) {
    console.log('⚠️ Blockchain monitor is not running');
    return;
  }

  try {
    monitorState.isRunning = false;

    // 移除所有事件监听器
    airdropPoolContract.removeAllListeners();
    smTokenContract.removeAllListeners();

    console.log('🛑 Blockchain monitor stopped');
    
    // 发送停止通知
    await sendNotification('🛑 区块链监控已停止', 'warning');

    addBreadcrumb('Blockchain monitor stopped', 'monitor');

  } catch (error: any) {
    console.error('❌ Failed to stop blockchain monitor:', error);
    reportError(error, { component: 'blockchainMonitor', action: 'stop' });
  }
}

/**
 * 设置事件监听器
 */
function setupEventListeners(): void {
  // 空投池事件监听
  airdropPoolContract.on('FlowersDeposited', handleFlowersDeposited);
  airdropPoolContract.on('RewardClaimed', handleRewardClaimed);
  airdropPoolContract.on('RoundStarted', handleRoundStarted);
  airdropPoolContract.on('RoundEnded', handleRoundEnded);
  airdropPoolContract.on('RewardsDistributed', handleRewardsDistributed);
  airdropPoolContract.on('EmergencyWithdraw', handleEmergencyWithdraw);

  // SM 代币事件监听（仅监控与空投池相关的转账）
  smTokenContract.on('Transfer', handleTokenTransfer);

  console.log('👂 Event listeners set up');
}

/**
 * 处理小红花投入事件
 */
const handleFlowersDeposited: EventHandler = async (event, parsedEvent) => {
  try {
    const { user, amount, roundId } = parsedEvent.args;
    const amountFormatted = ethers.formatEther(amount);

    console.log(`🌸 Flowers deposited: ${amountFormatted} by ${user} in round ${roundId}`);

    // 记录到数据库
    await supabase
      .from('airdrop_events')
      .insert({
        event_type: 'deposit',
        user_id: user,
        round_id: Number(roundId),
        amount: amountFormatted,
        tx_hash: event.transactionHash,
        block_number: event.blockNumber,
        event_data: {
          user,
          amount: amount.toString(),
          roundId: roundId.toString()
        }
      });

    // 发送通知
    await sendNotification(
      `🌸 新的小红花投入\n用户: ${user.slice(0, 6)}...${user.slice(-4)}\n数量: ${amountFormatted}\n轮次: ${roundId}`,
      'info'
    );

    trackTransaction(event.transactionHash, 'flowers_deposit', amountFormatted);

  } catch (error: any) {
    console.error('❌ Error handling FlowersDeposited event:', error);
    reportError(error, { event: 'FlowersDeposited', txHash: event.transactionHash });
  }
};

/**
 * 处理奖励领取事件
 */
const handleRewardClaimed: EventHandler = async (event, parsedEvent) => {
  try {
    const { user, amount, roundId } = parsedEvent.args;
    const amountFormatted = ethers.formatEther(amount);

    console.log(`🏆 Reward claimed: ${amountFormatted} SM by ${user} from round ${roundId}`);

    // 记录到数据库
    await supabase
      .from('airdrop_events')
      .insert({
        event_type: 'claim',
        user_id: user,
        round_id: Number(roundId),
        amount: amountFormatted,
        tx_hash: event.transactionHash,
        block_number: event.blockNumber,
        event_data: {
          user,
          amount: amount.toString(),
          roundId: roundId.toString()
        }
      });

    // 发送通知
    await sendNotification(
      `🏆 奖励已领取\n用户: ${user.slice(0, 6)}...${user.slice(-4)}\n数量: ${amountFormatted} SM\n轮次: ${roundId}`,
      'success'
    );

    trackTransaction(event.transactionHash, 'reward_claim', amountFormatted);

  } catch (error: any) {
    console.error('❌ Error handling RewardClaimed event:', error);
    reportError(error, { event: 'RewardClaimed', txHash: event.transactionHash });
  }
};

/**
 * 处理轮次开始事件
 */
const handleRoundStarted: EventHandler = async (event, parsedEvent) => {
  try {
    const { roundId, startTime, endTime } = parsedEvent.args;

    console.log(`🚀 Round started: ${roundId}`);

    // 记录到数据库
    await supabase
      .from('airdrop_events')
      .insert({
        event_type: 'round_start',
        round_id: Number(roundId),
        tx_hash: event.transactionHash,
        block_number: event.blockNumber,
        event_data: {
          roundId: roundId.toString(),
          startTime: startTime.toString(),
          endTime: endTime.toString()
        }
      });

    // 发送通知
    const startDate = new Date(Number(startTime) * 1000);
    const endDate = new Date(Number(endTime) * 1000);
    
    await sendNotification(
      `🚀 新轮次开始\n轮次: ${roundId}\n开始时间: ${startDate.toLocaleString()}\n结束时间: ${endDate.toLocaleString()}`,
      'info'
    );

  } catch (error: any) {
    console.error('❌ Error handling RoundStarted event:', error);
    reportError(error, { event: 'RoundStarted', txHash: event.transactionHash });
  }
};

/**
 * 处理轮次结束事件
 */
const handleRoundEnded: EventHandler = async (event, parsedEvent) => {
  try {
    const { roundId, totalDeposits, participantCount } = parsedEvent.args;
    const totalDepositsFormatted = ethers.formatEther(totalDeposits);

    console.log(`🏁 Round ended: ${roundId}, Total deposits: ${totalDepositsFormatted}`);

    // 发送通知
    await sendNotification(
      `🏁 轮次结束\n轮次: ${roundId}\n总投入: ${totalDepositsFormatted} 小红花\n参与人数: ${participantCount}`,
      'warning'
    );

  } catch (error: any) {
    console.error('❌ Error handling RoundEnded event:', error);
    reportError(error, { event: 'RoundEnded', txHash: event.transactionHash });
  }
};

/**
 * 处理奖励分配事件
 */
const handleRewardsDistributed: EventHandler = async (event, parsedEvent) => {
  try {
    const { roundId, totalRewards } = parsedEvent.args;
    const totalRewardsFormatted = ethers.formatEther(totalRewards);

    console.log(`💰 Rewards distributed: ${totalRewardsFormatted} SM for round ${roundId}`);

    // 发送通知
    await sendNotification(
      `💰 奖励已分配\n轮次: ${roundId}\n总奖励: ${totalRewardsFormatted} SM\n用户现在可以领取奖励！`,
      'success'
    );

  } catch (error: any) {
    console.error('❌ Error handling RewardsDistributed event:', error);
    reportError(error, { event: 'RewardsDistributed', txHash: event.transactionHash });
  }
};

/**
 * 处理紧急提取事件
 */
const handleEmergencyWithdraw: EventHandler = async (event, parsedEvent) => {
  try {
    const { user, amount } = parsedEvent.args;
    const amountFormatted = ethers.formatEther(amount);

    console.log(`🚨 Emergency withdraw: ${amountFormatted} by ${user}`);

    // 发送紧急通知
    await sendNotification(
      `🚨 紧急提取警告\n用户: ${user}\n数量: ${amountFormatted}\n交易: ${event.transactionHash}`,
      'error'
    );

    reportError(new Error('Emergency withdraw detected'), {
      user,
      amount: amountFormatted,
      txHash: event.transactionHash
    });

  } catch (error: any) {
    console.error('❌ Error handling EmergencyWithdraw event:', error);
    reportError(error, { event: 'EmergencyWithdraw', txHash: event.transactionHash });
  }
};

/**
 * 处理代币转账事件
 */
const handleTokenTransfer: EventHandler = async (event, parsedEvent) => {
  try {
    const { from, to, value } = parsedEvent.args;
    
    // 只监控与空投池相关的转账
    if (from === AIRDROP_POOL_ADDRESS || to === AIRDROP_POOL_ADDRESS) {
      const amountFormatted = ethers.formatEther(value);
      
      console.log(`💸 SM Token transfer: ${amountFormatted} from ${from} to ${to}`);
      
      trackTransaction(event.transactionHash, 'token_transfer', amountFormatted);
    }

  } catch (error: any) {
    console.error('❌ Error handling Transfer event:', error);
    reportError(error, { event: 'Transfer', txHash: event.transactionHash });
  }
};

/**
 * 启动定期检查
 */
function startPeriodicChecks(): void {
  setInterval(async () => {
    if (!monitorState.isRunning) return;

    try {
      // 检查网络连接
      const currentBlock = await provider.getBlockNumber();
      
      if (currentBlock > monitorState.lastBlockNumber) {
        monitorState.lastBlockNumber = currentBlock;
        console.log(`📊 Current block: ${currentBlock}`);
      }

      // 重置错误计数
      monitorState.errorCount = 0;

    } catch (error: any) {
      monitorState.errorCount++;
      console.error(`❌ Periodic check failed (${monitorState.errorCount}):`, error);

      if (monitorState.errorCount >= 5) {
        await sendNotification(
          `🚨 区块链监控连续失败 ${monitorState.errorCount} 次\n可能存在网络问题`,
          'error'
        );
        
        reportError(error, { 
          component: 'blockchainMonitor', 
          action: 'periodicCheck',
          errorCount: monitorState.errorCount 
        });
      }
    }
  }, 30000); // 每30秒检查一次
}

/**
 * 发送通知到 Discord
 */
async function sendNotification(message: string, type: 'info' | 'success' | 'warning' | 'error'): Promise<void> {
  if (!DISCORD_WEBHOOK_URL) return;

  try {
    const colors = {
      info: 0x3498db,
      success: 0x2ecc71,
      warning: 0xf39c12,
      error: 0xe74c3c
    };

    const embed = {
      title: 'SocioMint 区块链监控',
      description: message,
      color: colors[type],
      timestamp: new Date().toISOString(),
      footer: {
        text: 'SocioMint Blockchain Monitor'
      }
    };

    await sendWebhookMessage(DISCORD_WEBHOOK_URL, '', [embed]);

  } catch (error: any) {
    console.error('❌ Failed to send Discord notification:', error);
  }
}

/**
 * 获取监控状态
 */
export function getMonitorStatus(): MonitorState & { uptime: number } {
  return {
    ...monitorState,
    uptime: monitorState.isRunning ? Date.now() - monitorState.startTime.getTime() : 0
  };
}

/**
 * 手动触发健康检查
 */
export async function healthCheck(): Promise<{
  healthy: boolean;
  blockNumber: number;
  networkId: number;
  gasPrice: string;
  error?: string;
}> {
  try {
    const [blockNumber, network, gasPrice] = await Promise.all([
      provider.getBlockNumber(),
      provider.getNetwork(),
      provider.getFeeData()
    ]);

    return {
      healthy: true,
      blockNumber,
      networkId: Number(network.chainId),
      gasPrice: gasPrice.gasPrice ? ethers.formatUnits(gasPrice.gasPrice, 'gwei') : '0'
    };

  } catch (error: any) {
    return {
      healthy: false,
      blockNumber: 0,
      networkId: 0,
      gasPrice: '0',
      error: error.message
    };
  }
}
