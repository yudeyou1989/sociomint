# SocioMint 智能合约接口调用示例

*文档版本: v1.0.0 - 2025年5月*

本文档提供了SocioMint智能合约系统各主要功能的接口调用示例，帮助开发者理解如何与合约交互。

## 1. SMToken 接口示例

### 1.1 基本代币操作

**代币余额查询**

```javascript
// 使用ethers.js
const { ethers } = require('ethers');
const provider = new ethers.providers.Web3Provider(window.ethereum);
const signer = provider.getSigner();

// 合约地址和ABI
const smTokenAddress = '0x1234...'; // 实际部署的合约地址
const smTokenABI = [...]; // SMToken合约ABI

// 创建合约实例
const smToken = new ethers.Contract(smTokenAddress, smTokenABI, signer);

// 查询余额
async function getBalance(address) {
  try {
    const balance = await smToken.balanceOf(address);
    console.log(`余额: ${ethers.utils.formatUnits(balance, 18)} SM`);
    return balance;
  } catch (error) {
    console.error('查询余额失败:', error);
    throw error;
  }
}
```

**代币转账**

```javascript
// 转账SM代币
async function transferTokens(recipient, amount) {
  try {
    // 金额转换为wei (假设18位小数)
    const amountWei = ethers.utils.parseUnits(amount.toString(), 18);
    
    // 发送交易
    const tx = await smToken.transfer(recipient, amountWei);
    console.log('交易已提交:', tx.hash);
    
    // 等待交易确认
    const receipt = await tx.wait();
    console.log('交易已确认:', receipt);
    
    return receipt;
  } catch (error) {
    console.error('转账失败:', error);
    throw error;
  }
}
```

### 1.2 授权与代扣

**授权代扣**

```javascript
// 授权CoreSystem合约代扣用户的SM代币
async function approveTokens(spender, amount) {
  try {
    const amountWei = ethers.utils.parseUnits(amount.toString(), 18);
    const tx = await smToken.approve(spender, amountWei);
    console.log('授权交易已提交:', tx.hash);
    
    const receipt = await tx.wait();
    console.log('授权已确认:', receipt);
    
    return receipt;
  } catch (error) {
    console.error('授权失败:', error);
    throw error;
  }
}
```

**查询授权额度**

```javascript
// 查询已授权的代扣额度
async function getAllowance(owner, spender) {
  try {
    const allowance = await smToken.allowance(owner, spender);
    console.log(`授权额度: ${ethers.utils.formatUnits(allowance, 18)} SM`);
    return allowance;
  } catch (error) {
    console.error('查询授权额度失败:', error);
    throw error;
  }
}
```

## 2. CoreSystem 接口示例

### 2.1 质押与解除质押

**质押SM代币**

```javascript
// 质押SM代币到CoreSystem合约
async function stakeTokens(amount) {
  try {
    // 首先确保已授权CoreSystem合约
    const coreSystemAddress = '0xabcd...'; // 实际部署的合约地址
    const coreSystemABI = [...]; // CoreSystem合约ABI
    const coreSystem = new ethers.Contract(coreSystemAddress, coreSystemABI, signer);
    
    // 转换金额
    const amountWei = ethers.utils.parseUnits(amount.toString(), 18);
    
    // 调用质押函数
    const tx = await coreSystem.stake(amountWei);
    console.log('质押交易已提交:', tx.hash);
    
    const receipt = await tx.wait();
    console.log('质押已确认:', receipt);
    
    return receipt;
  } catch (error) {
    console.error('质押失败:', error);
    throw error;
  }
}
```

**解除质押**

```javascript
// 解除质押的SM代币
async function unstakeTokens(amount) {
  try {
    const coreSystemAddress = '0xabcd...';
    const coreSystemABI = [...];
    const coreSystem = new ethers.Contract(coreSystemAddress, coreSystemABI, signer);
    
    const amountWei = ethers.utils.parseUnits(amount.toString(), 18);
    
    // 调用解除质押函数
    const tx = await coreSystem.unstake(amountWei);
    console.log('解除质押交易已提交:', tx.hash);
    
    const receipt = await tx.wait();
    console.log('解除质押已确认:', receipt);
    
    return receipt;
  } catch (error) {
    console.error('解除质押失败:', error);
    throw error;
  }
}
```

### 2.2 奖励管理

**查询待领取奖励**

```javascript
// 查询用户可领取的奖励
async function getPendingRewards(userAddress) {
  try {
    const coreSystemAddress = '0xabcd...';
    const coreSystemABI = [...];
    const coreSystem = new ethers.Contract(coreSystemAddress, coreSystemABI, signer);
    
    const rewards = await coreSystem.getPendingRewards(userAddress);
    console.log(`待领取奖励: ${ethers.utils.formatUnits(rewards, 18)} SM`);
    
    return rewards;
  } catch (error) {
    console.error('查询奖励失败:', error);
    throw error;
  }
}
```

**领取奖励**

```javascript
// 领取奖励
async function claimRewards() {
  try {
    const coreSystemAddress = '0xabcd...';
    const coreSystemABI = [...];
    const coreSystem = new ethers.Contract(coreSystemAddress, coreSystemABI, signer);
    
    const tx = await coreSystem.claimRewards();
    console.log('领取奖励交易已提交:', tx.hash);
    
    const receipt = await tx.wait();
    console.log('奖励已领取:', receipt);
    
    return receipt;
  } catch (error) {
    console.error('领取奖励失败:', error);
    throw error;
  }
}
```

## 3. TeamUnlockerV2 接口示例

### 3.1 团队代币解锁

**请求解锁团队代币**

```javascript
// 请求解锁团队代币
async function requestTeamTokenUnlock(amount) {
  try {
    const teamUnlockerAddress = '0xefgh...'; // 实际部署的合约地址
    const teamUnlockerABI = [...]; // TeamUnlockerV2合约ABI
    const teamUnlocker = new ethers.Contract(teamUnlockerAddress, teamUnlockerABI, signer);
    
    const amountWei = ethers.utils.parseUnits(amount.toString(), 18);
    
    // 调用请求解锁函数
    const tx = await teamUnlocker.requestUnlock(amountWei);
    console.log('请求解锁交易已提交:', tx.hash);
    
    const receipt = await tx.wait();
    console.log('请求解锁已提交:', receipt);
    
    // 从事件中获取解锁请求ID
    const unlockEvent = receipt.events.find(e => e.event === 'UnlockRequested');
    const unlockId = unlockEvent.args.unlockId;
    console.log(`解锁请求ID: ${unlockId}`);
    
    return { receipt, unlockId };
  } catch (error) {
    console.error('请求解锁失败:', error);
    throw error;
  }
}
```

**执行代币解锁**

```javascript
// 执行代币解锁 (需要管理员权限)
async function executeUnlock(unlockId) {
  try {
    const teamUnlockerAddress = '0xefgh...';
    const teamUnlockerABI = [...];
    const teamUnlocker = new ethers.Contract(teamUnlockerAddress, teamUnlockerABI, signer);
    
    // 执行解锁
    const tx = await teamUnlocker.executeUnlock(unlockId);
    console.log('执行解锁交易已提交:', tx.hash);
    
    const receipt = await tx.wait();
    console.log('解锁已执行:', receipt);
    
    return receipt;
  } catch (error) {
    console.error('执行解锁失败:', error);
    throw error;
  }
}
```

### 3.2 紧急模式管理

**请求进入紧急模式**

```javascript
// 请求进入紧急模式 (需要管理员权限)
async function requestEmergencyMode(reason) {
  try {
    const teamUnlockerAddress = '0xefgh...';
    const teamUnlockerABI = [...];
    const teamUnlocker = new ethers.Contract(teamUnlockerAddress, teamUnlockerABI, signer);
    
    // 请求进入紧急模式
    const tx = await teamUnlocker.requestEmergencyMode(reason);
    console.log('请求紧急模式交易已提交:', tx.hash);
    
    const receipt = await tx.wait();
    console.log('紧急模式请求已提交:', receipt);
    
    return receipt;
  } catch (error) {
    console.error('请求紧急模式失败:', error);
    throw error;
  }
}
```

**确认紧急模式**

```javascript
// 确认紧急模式 (需要管理员权限)
async function confirmEmergencyMode() {
  try {
    const teamUnlockerAddress = '0xefgh...';
    const teamUnlockerABI = [...];
    const teamUnlocker = new ethers.Contract(teamUnlockerAddress, teamUnlockerABI, signer);
    
    // 确认紧急模式
    const tx = await teamUnlocker.confirmEmergencyMode();
    console.log('确认紧急模式交易已提交:', tx.hash);
    
    const receipt = await tx.wait();
    console.log('紧急模式已确认:', receipt);
    
    return receipt;
  } catch (error) {
    console.error('确认紧急模式失败:', error);
    throw error;
  }
}
```

## 4. MerchantManager 接口示例

### 4.1 商户注册与管理

**注册商户**

```javascript
// 注册成为商户
async function registerAsMerchant(merchantData) {
  try {
    const merchantManagerAddress = '0xijkl...'; // 实际部署的合约地址
    const merchantManagerABI = [...]; // MerchantManager合约ABI
    const merchantManager = new ethers.Contract(merchantManagerAddress, merchantManagerABI, signer);
    
    // 准备商户数据
    const { name, description, url, contactInfo } = merchantData;
    
    // 注册商户
    const tx = await merchantManager.registerMerchant(name, description, url, contactInfo);
    console.log('商户注册交易已提交:', tx.hash);
    
    const receipt = await tx.wait();
    console.log('商户已注册:', receipt);
    
    // 从事件中获取商户ID
    const registerEvent = receipt.events.find(e => e.event === 'MerchantRegistered');
    const merchantId = registerEvent.args.merchantId;
    console.log(`商户ID: ${merchantId}`);
    
    return { receipt, merchantId };
  } catch (error) {
    console.error('商户注册失败:', error);
    throw error;
  }
}
```

**更新商户信息**

```javascript
// 更新商户信息
async function updateMerchantInfo(merchantId, newData) {
  try {
    const merchantManagerAddress = '0xijkl...';
    const merchantManagerABI = [...];
    const merchantManager = new ethers.Contract(merchantManagerAddress, merchantManagerABI, signer);
    
    // 准备更新数据
    const { name, description, url, contactInfo } = newData;
    
    // 更新商户信息
    const tx = await merchantManager.updateMerchantInfo(merchantId, name, description, url, contactInfo);
    console.log('更新商户信息交易已提交:', tx.hash);
    
    const receipt = await tx.wait();
    console.log('商户信息已更新:', receipt);
    
    return receipt;
  } catch (error) {
    console.error('更新商户信息失败:', error);
    throw error;
  }
}
```

### 4.2 商户质押管理

**商户质押代币**

```javascript
// 商户质押SM代币
async function stakeMerchantTokens(merchantId, amount) {
  try {
    const merchantManagerAddress = '0xijkl...';
    const merchantManagerABI = [...];
    const merchantManager = new ethers.Contract(merchantManagerAddress, merchantManagerABI, signer);
    
    // 确保已授权MerchantManager合约
    const smTokenAddress = '0x1234...';
    const smTokenABI = [...];
    const smToken = new ethers.Contract(smTokenAddress, smTokenABI, signer);
    
    const amountWei = ethers.utils.parseUnits(amount.toString(), 18);
    
    // 授权代扣
    const approveTx = await smToken.approve(merchantManagerAddress, amountWei);
    await approveTx.wait();
    console.log('授权已完成');
    
    // 质押代币
    const tx = await merchantManager.stake(merchantId, amountWei);
    console.log('商户质押交易已提交:', tx.hash);
    
    const receipt = await tx.wait();
    console.log('商户质押已完成:', receipt);
    
    return receipt;
  } catch (error) {
    console.error('商户质押失败:', error);
    throw error;
  }
}
```

**商户解除质押**

```javascript
// 商户解除质押
async function unstakeMerchantTokens(merchantId, amount) {
  try {
    const merchantManagerAddress = '0xijkl...';
    const merchantManagerABI = [...];
    const merchantManager = new ethers.Contract(merchantManagerAddress, merchantManagerABI, signer);
    
    const amountWei = ethers.utils.parseUnits(amount.toString(), 18);
    
    // 解除质押
    const tx = await merchantManager.unstake(merchantId, amountWei);
    console.log('解除质押交易已提交:', tx.hash);
    
    const receipt = await tx.wait();
    console.log('解除质押已完成:', receipt);
    
    return receipt;
  } catch (error) {
    console.error('解除质押失败:', error);
    throw error;
  }
}
```

## 5. 事件监听示例

### 5.1 代币转账事件监听

```javascript
// 监听SM代币转账事件
function listenToTransferEvents() {
  const smTokenAddress = '0x1234...';
  const smTokenABI = [...];
  const smToken = new ethers.Contract(smTokenAddress, smTokenABI, provider);
  
  // 监听Transfer事件
  smToken.on('Transfer', (from, to, value, event) => {
    console.log(`转账事件:`);
    console.log(`- 从: ${from}`);
    console.log(`- 到: ${to}`);
    console.log(`- 金额: ${ethers.utils.formatUnits(value, 18)} SM`);
    console.log(`- 区块号: ${event.blockNumber}`);
    console.log(`- 交易哈希: ${event.transactionHash}`);
  });
  
  console.log('正在监听转账事件...');
}
```

### 5.2 质押事件监听

```javascript
// 监听质押和解除质押事件
function listenToStakingEvents() {
  const coreSystemAddress = '0xabcd...';
  const coreSystemABI = [...];
  const coreSystem = new ethers.Contract(coreSystemAddress, coreSystemABI, provider);
  
  // 监听Staked事件
  coreSystem.on('Staked', (user, amount, event) => {
    console.log(`质押事件:`);
    console.log(`- 用户: ${user}`);
    console.log(`- 金额: ${ethers.utils.formatUnits(amount, 18)} SM`);
    console.log(`- 区块号: ${event.blockNumber}`);
  });
  
  // 监听Unstaked事件
  coreSystem.on('Unstaked', (user, amount, event) => {
    console.log(`解除质押事件:`);
    console.log(`- 用户: ${user}`);
    console.log(`- 金额: ${ethers.utils.formatUnits(amount, 18)} SM`);
    console.log(`- 区块号: ${event.blockNumber}`);
  });
  
  console.log('正在监听质押事件...');
}
```

## 6. Web3钱包集成示例

### 6.1 连接钱包

```javascript
// 连接MetaMask钱包
async function connectWallet() {
  try {
    // 检查是否安装了MetaMask
    if (typeof window.ethereum === 'undefined') {
      alert('请安装MetaMask钱包插件');
      return;
    }
    
    // 请求用户授权
    const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
    const account = accounts[0];
    console.log('已连接钱包:', account);
    
    // 监听账户切换
    window.ethereum.on('accountsChanged', (accounts) => {
      console.log('钱包账户已切换:', accounts[0]);
      // 处理账户切换逻辑
    });
    
    // 监听链ID切换
    window.ethereum.on('chainChanged', (chainId) => {
      console.log('网络已切换:', chainId);
      // 处理网络切换逻辑
      window.location.reload();
    });
    
    return account;
  } catch (error) {
    console.error('连接钱包失败:', error);
    throw error;
  }
}
```

### 6.2 切换网络

```javascript
// 切换到BSC网络
async function switchToBSCNetwork() {
  try {
    // BSC主网参数
    const bscMainnet = {
      chainId: '0x38', // 十六进制的56
      chainName: 'Binance Smart Chain',
      nativeCurrency: {
        name: 'BNB',
        symbol: 'BNB',
        decimals: 18,
      },
      rpcUrls: ['https://bsc-dataseed.binance.org/'],
      blockExplorerUrls: ['https://bscscan.com/'],
    };
    
    // BSC测试网参数
    const bscTestnet = {
      chainId: '0x61', // 十六进制的97
      chainName: 'BSC Testnet',
      nativeCurrency: {
        name: 'BNB',
        symbol: 'BNB',
        decimals: 18,
      },
      rpcUrls: ['https://data-seed-prebsc-1-s1.binance.org:8545/'],
      blockExplorerUrls: ['https://testnet.bscscan.com/'],
    };
    
    // 选择网络
    const network = process.env.NETWORK === 'mainnet' ? bscMainnet : bscTestnet;
    
    try {
      // 尝试切换到已有的BSC网络
      await window.ethereum.request({
        method: 'wallet_switchEthereumChain',
        params: [{ chainId: network.chainId }],
      });
    } catch (switchError) {
      // 如果网络不存在，则添加网络
      if (switchError.code === 4902) {
        await window.ethereum.request({
          method: 'wallet_addEthereumChain',
          params: [network],
        });
      } else {
        throw switchError;
      }
    }
    
    console.log(`已切换到${process.env.NETWORK === 'mainnet' ? 'BSC主网' : 'BSC测试网'}`);
  } catch (error) {
    console.error('切换网络失败:', error);
    throw error;
  }
}
```

## 7. 完整的前端整合示例

```jsx
// React组件示例 - 质押功能
import { useState, useEffect } from 'react';
import { ethers } from 'ethers';

// 合约ABI
import smTokenABI from '../abis/SMToken.json';
import coreSystemABI from '../abis/CoreSystem.json';

// 合约地址
const SM_TOKEN_ADDRESS = process.env.NEXT_PUBLIC_SM_TOKEN_ADDRESS;
const CORE_SYSTEM_ADDRESS = process.env.NEXT_PUBLIC_CORE_SYSTEM_ADDRESS;

export default function StakingComponent() {
  const [account, setAccount] = useState('');
  const [balance, setBalance] = useState('0');
  const [stakedAmount, setStakedAmount] = useState('0');
  const [stakeInput, setStakeInput] = useState('');
  const [unstakeInput, setUnstakeInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  
  // 初始化
  useEffect(() => {
    const init = async () => {
      try {
        if (typeof window.ethereum !== 'undefined') {
          // 监听账户变化
          window.ethereum.on('accountsChanged', (accounts) => {
            setAccount(accounts[0] || '');
            loadBalances(accounts[0]);
          });
          
          // 获取当前账户
          const accounts = await window.ethereum.request({ method: 'eth_accounts' });
          if (accounts.length > 0) {
            setAccount(accounts[0]);
            loadBalances(accounts[0]);
          }
        }
      } catch (err) {
        console.error('初始化错误:', err);
        setError('初始化失败，请刷新页面重试');
      }
    };
    
    init();
  }, []);
  
  // 加载余额和质押信息
  const loadBalances = async (address) => {
    if (!address) return;
    
    try {
      const provider = new ethers.providers.Web3Provider(window.ethereum);
      
      // 获取SM代币余额
      const smToken = new ethers.Contract(SM_TOKEN_ADDRESS, smTokenABI, provider);
      const balanceWei = await smToken.balanceOf(address);
      setBalance(ethers.utils.formatUnits(balanceWei, 18));
      
      // 获取已质押金额
      const coreSystem = new ethers.Contract(CORE_SYSTEM_ADDRESS, coreSystemABI, provider);
      const stakedWei = await coreSystem.getStakedAmount(address);
      setStakedAmount(ethers.utils.formatUnits(stakedWei, 18));
    } catch (err) {
      console.error('加载余额错误:', err);
      setError('无法加载余额信息');
    }
  };
  
  // 连接钱包
  const connectWallet = async () => {
    try {
      const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
      setAccount(accounts[0]);
      loadBalances(accounts[0]);
    } catch (err) {
      console.error('连接钱包错误:', err);
      setError('连接钱包失败，请重试');
    }
  };
  
  // 质押代币
  const stakeTokens = async () => {
    if (!stakeInput || parseFloat(stakeInput) <= 0) {
      setError('请输入有效的质押金额');
      return;
    }
    
    setIsLoading(true);
    setError('');
    
    try {
      const provider = new ethers.providers.Web3Provider(window.ethereum);
      const signer = provider.getSigner();
      
      // 获取合约实例
      const smToken = new ethers.Contract(SM_TOKEN_ADDRESS, smTokenABI, signer);
      const coreSystem = new ethers.Contract(CORE_SYSTEM_ADDRESS, coreSystemABI, signer);
      
      // 计算质押金额
      const amountWei = ethers.utils.parseUnits(stakeInput, 18);
      
      // 授权代扣
      const approveTx = await smToken.approve(CORE_SYSTEM_ADDRESS, amountWei);
      await approveTx.wait();
      
      // 执行质押
      const stakeTx = await coreSystem.stake(amountWei);
      await stakeTx.wait();
      
      // 刷新数据
      setStakeInput('');
      loadBalances(account);
      
      alert('质押成功!');
    } catch (err) {
      console.error('质押错误:', err);
      setError('质押失败，请检查余额或网络连接');
    } finally {
      setIsLoading(false);
    }
  };
  
  // 解除质押
  const unstakeTokens = async () => {
    if (!unstakeInput || parseFloat(unstakeInput) <= 0) {
      setError('请输入有效的解除质押金额');
      return;
    }
    
    setIsLoading(true);
    setError('');
    
    try {
      const provider = new ethers.providers.Web3Provider(window.ethereum);
      const signer = provider.getSigner();
      
      // 获取合约实例
      const coreSystem = new ethers.Contract(CORE_SYSTEM_ADDRESS, coreSystemABI, signer);
      
      // 计算解除质押金额
      const amountWei = ethers.utils.parseUnits(unstakeInput, 18);
      
      // 执行解除质押
      const unstakeTx = await coreSystem.unstake(amountWei);
      await unstakeTx.wait();
      
      // 刷新数据
      setUnstakeInput('');
      loadBalances(account);
      
      alert('解除质押成功!');
    } catch (err) {
      console.error('解除质押错误:', err);
      setError('解除质押失败，请检查质押余额或网络连接');
    } finally {
      setIsLoading(false);
    }
  };
  
  return (
    <div className="staking-container">
      <h2>SM代币质押系统</h2>
      
      {!account ? (
        <button onClick={connectWallet} disabled={isLoading}>
          连接钱包
        </button>
      ) : (
        <>
          <div className="account-info">
            <p>账户: {account.substring(0, 6)}...{account.substring(account.length - 4)}</p>
            <p>可用余额: {parseFloat(balance).toFixed(2)} SM</p>
            <p>已质押: {parseFloat(stakedAmount).toFixed(2)} SM</p>
          </div>
          
          <div className="staking-actions">
            <div className="stake-form">
              <h3>质押代币</h3>
              <input
                type="number"
                value={stakeInput}
                onChange={(e) => setStakeInput(e.target.value)}
                placeholder="输入质押金额"
                disabled={isLoading}
              />
              <button onClick={stakeTokens} disabled={isLoading}>
                {isLoading ? '处理中...' : '质押'}
              </button>
            </div>
            
            <div className="unstake-form">
              <h3>解除质押</h3>
              <input
                type="number"
                value={unstakeInput}
                onChange={(e) => setUnstakeInput(e.target.value)}
                placeholder="输入解除质押金额"
                disabled={isLoading}
              />
              <button onClick={unstakeTokens} disabled={isLoading}>
                {isLoading ? '处理中...' : '解除质押'}
              </button>
            </div>
          </div>
          
          {error && <p className="error-message">{error}</p>}
        </>
      )}
    </div>
  );
} 