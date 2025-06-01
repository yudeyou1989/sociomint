# SM Token 和 SM Token Exchange 集成指南

本文档说明了如何设置和使用前端与 `SMToken` 和 `SMTokenExchange` 合约交互的基础功能。

## 已实现的功能

1. **ABI 文件**
   - `sociomint/src/abis/SMToken.json` - SMToken 合约的 ABI
   - `sociomint/src/abis/SMTokenExchange.json` - SMTokenExchange 合约的 ABI

2. **配置文件**
   - `sociomint/src/config/contracts.ts` - 包含链配置、合约地址和 ABI 引用

3. **Web3 Provider**
   - `sociomint/src/providers/Web3Provider.tsx` - 设置 Wagmi 和 React Query

4. **自定义 Hooks**
   - `sociomint/src/hooks/useSMToken.ts` - 用于获取用户的 SMToken 余额
   - `sociomint/src/hooks/useSMTokenExchange.ts` - 用于与交易所合约交互

5. **示例页面**
   - `sociomint/src/app/exchange/page.tsx` - 实现了 SMToken 兑换功能

## 环境变量设置

在 `.env.local` 文件中添加以下环境变量：

```
NEXT_PUBLIC_CHAIN_ID=97  # BSC Testnet 的链 ID
NEXT_PUBLIC_BSC_TESTNET_RPC_URL=https://data-seed-prebsc-1-s1.binance.org:8545/
NEXT_PUBLIC_BSC_MAINNET_RPC_URL=https://bsc-dataseed.binance.org/
NEXT_PUBLIC_SM_TOKEN_ADDRESS=0x你的SMToken合约地址
NEXT_PUBLIC_SM_TOKEN_EXCHANGE_ADDRESS=0x你的SMTokenExchange合约地址
```

## 依赖项更新

需要安装以下依赖项：

```bash
npm install wagmi@^1.4.7 viem@^1.19.9 @tanstack/react-query@^5.72.0
```

## 类型问题解决方案

如果在使用过程中出现类型错误，可能是由于 wagmi 版本不匹配。我们已经在代码中添加了 `// @ts-ignore` 注释以绕过类型检查。如果需要完全兼容，请确保安装与代码相匹配的版本依赖。

## 使用说明

### 1. 读取用户的 SMToken 余额

```typescript
import { useSMToken } from '@/hooks/useSMToken';

function YourComponent() {
  const { formattedBalance, isLoading } = useSMToken();
  
  return (
    <div>
      {isLoading ? '加载中...' : `余额: ${formattedBalance} SM`}
    </div>
  );
}
```

### 2. 与 SMTokenExchange 交互

```typescript
import { useSMTokenExchange } from '@/hooks/useSMTokenExchange';

function YourComponent() {
  const { exchangeStats, exchangeTokens, isExchanging } = useSMTokenExchange();
  
  const handleExchange = async () => {
    try {
      await exchangeTokens('0.1'); // 发送 0.1 BNB 兑换 SM 代币
    } catch (error) {
      console.error('兑换失败:', error);
    }
  };
  
  return (
    <div>
      <button onClick={handleExchange} disabled={isExchanging}>
        {isExchanging ? '处理中...' : '兑换代币'}
      </button>
      
      {exchangeStats && (
        <div>
          <p>当前价格: {exchangeStats.formattedCurrentPrice} BNB</p>
          <p>已售代币: {exchangeStats.formattedTokensSold} SM</p>
          <p>剩余代币: {exchangeStats.formattedTokensRemaining} SM</p>
        </div>
      )}
    </div>
  );
}
```

## 注意事项

1. 该实现使用的是 Wagmi v1 版本，而不是最新的 v2 版本，以确保与项目中的其他部分兼容。
2. 如果您的项目使用 Wagmi v2，需要更新这些文件中的钩子使用方式。
3. 目前的实现使用了 InjectedConnector 来连接钱包，可以根据需要替换为其他连接器。
4. 如果遇到类型错误，请参考上方的"类型问题解决方案"章节。 