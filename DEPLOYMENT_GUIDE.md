# SocioMint 部署指南

本指南详细说明如何部署 SMToken 和 SMTokenExchange 合约到测试网和主网。

## 准备工作

1. 确保你的开发环境已安装以下工具：
   - Node.js (推荐 v16+)
   - npm 或 yarn

2. 安装项目依赖：
   ```bash
   npm install
   # 或
   yarn
   ```

3. 安装必要的 Hardhat 插件：
   ```bash
   npm install --save-dev @openzeppelin/hardhat-upgrades @nomicfoundation/hardhat-toolbox dotenv
   ```

4. 创建 `.env` 文件并设置以下变量：
   ```
   # 部署账户私钥（不要使用包含真实资金的账户的私钥！）
   PRIVATE_KEY=your_private_key_here

   # RPC 端点
   BSC_TESTNET_RPC_URL=https://data-seed-prebsc-1-s1.binance.org:8545/
   BSC_MAINNET_RPC_URL=https://bsc-dataseed.binance.org/

   # BSCScan API 密钥（用于合约验证）
   BSCSCAN_API_KEY=your_bscscan_api_key_here

   # 资金接收地址（团队钱包或 DAO 多签地址）
   FUND_RECEIVER_ADDRESS=your_fund_receiver_address_here
   ```

5. 修改 `scripts/deploy.ts` 文件中的 `fundReceiverAddress` 为实际的资金接收地址：
   ```typescript
   // 修改这一行
   const fundReceiverAddress = process.env.FUND_RECEIVER_ADDRESS || "0xYourFundReceiverAddressHere";
   ```

## 编译合约

```bash
npx hardhat compile
```

## 部署到测试网

1. 确保你的部署账户有足够的 BNB (在 BSC 测试网上)

2. 运行部署脚本：
   ```bash
   npx hardhat run scripts/deploy.ts --network bscTestnet
   ```

3. 验证合约（可选）：
   ```bash
   # 替换为实际部署的合约地址
   npx hardhat verify --network bscTestnet SMTOKEN_ADDRESS
   npx hardhat verify --network bscTestnet SMTOKENEXCHANGE_ADDRESS
   ```

## 部署到主网

1. 确保你的部署账户有足够的 BNB (在 BSC 主网上)

2. 仔细检查所有参数，特别是：
   - `initialBnbPerSmPriceScaled` - 初始价格 (默认 833000，对应 0.000000833 BNB/SM)
   - `priceIncrementBnbPerSmScaled` - 价格增量 (默认 141900，对应每轮增加 0.0000001419 BNB/SM)
   - `fundReceiverAddress` - 资金接收地址

3. 运行部署脚本：
   ```bash
   npx hardhat run scripts/deploy.ts --network bsc
   ```

4. 验证合约（强烈建议）：
   ```bash
   # 替换为实际部署的合约地址
   npx hardhat verify --network bsc SMTOKEN_ADDRESS
   npx hardhat verify --network bsc SMTOKENEXCHANGE_ADDRESS
   ```

## 部署后的操作

1. **转移所有权**：将 SMToken 的所有权和 SMTokenExchange 的管理员角色转移给多签钱包或 DAO
   ```javascript
   // 转移 SMToken 所有权
   await smToken.transferOwnership("MULTISIG_ADDRESS");
   
   // 为 SMTokenExchange 授予角色
   await smTokenExchange.grantRole(await smTokenExchange.ADMIN_ROLE(), "MULTISIG_ADDRESS");
   await smTokenExchange.grantRole(await smTokenExchange.VERIFIER_ROLE(), "MULTISIG_ADDRESS");
   await smTokenExchange.grantRole(await smTokenExchange.PAUSER_ROLE(), "MULTISIG_ADDRESS");
   
   // 撤销部署者的角色
   await smTokenExchange.revokeRole(await smTokenExchange.ADMIN_ROLE(), deployerAddress);
   await smTokenExchange.revokeRole(await smTokenExchange.VERIFIER_ROLE(), deployerAddress);
   await smTokenExchange.revokeRole(await smTokenExchange.PAUSER_ROLE(), deployerAddress);
   ```

2. **验证用户**：通过 SMTokenExchange 合约的 verifyUser 或 batchVerifyUsers 函数验证用户

3. **设置购买限制**：根据需要调整最小和最大购买限额
   ```javascript
   // 设置最小购买额为 0.05 BNB
   await smTokenExchange.setMinPurchaseAmount(ethers.utils.parseEther("0.05"));
   
   // 设置每用户最大购买额为 10 BNB
   await smTokenExchange.setMaxPurchaseAmount(ethers.utils.parseEther("10"));
   ```

4. **激活交易**：确保合约未暂停（如果在部署后被默认暂停）
   ```javascript
   // 如果合约被暂停，解除暂停
   if (await smTokenExchange.paused()) {
     await smTokenExchange.unpause();
   }
   ```

## 升级合约 (如果将来需要)

1. 创建新的合约实现，遵循 OpenZeppelin UUPS 升级模式

2. 部署升级：
   ```bash
   # 示例升级命令
   npx hardhat run scripts/upgrade.ts --network bsc
   ```

## 安全提醒

- **多签钱包**：所有管理操作应通过多签钱包执行，以增强安全性
- **测试**：在部署到主网前，彻底测试所有功能
- **审计**：考虑进行专业的安全审计
- **权限管理**：定期检查合约权限，确保只有授权实体拥有管理权限

## 部署参数参考

### SMToken
- 名称: SocioMint
- 符号: SM
- 总供应量: 10亿 (1,000,000,000)
- 小数位: 18

### SMTokenExchange
- 初始价格: 0.000000833 BNB/SM (833000 scaled)
- 价格增量: 0.0000001419 BNB/SM (141900 scaled)
- 每轮代币数量: 1,000,000 SM
- 总轮次: 100
- 交易所总代币数量: 1亿 SM 