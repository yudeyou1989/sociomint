# SocioMint - 社交与金融的融合平台

SocioMint是一个基于区块链的社交金融平台，旨在通过创新的激励机制和任务系统，将用户的社交活动与金融收益紧密结合。

## 技术架构

### 前端技术栈
- Next.js 13 (App Router)
- TypeScript
- Tailwind CSS
- DaisyUI
- ethers.js 6
- RainbowKit

### 后端技术栈
- Supabase (PostgreSQL数据库、认证、实时API)
- Next.js API Routes
- Solidity智能合约（BSC网络）

### 核心智能合约
- `SMToken`: 平台原生代币，用于奖励和治理
- `CoreSystem`: 核心系统合约，整合各个模块功能
- `TeamUnlockerV2`: 团队代币解锁机制，基于KPI和多重确认
- `MerchantManager`: 商户管理系统，处理商户注册和验证

## 项目功能模块

### 用户系统
- 多钱包支持 (MetaMask, WalletConnect, Coinbase等)
- 社交账号绑定 (Twitter, Discord等)
- 个人资产管理与展示

### 任务系统
- 社交任务创建与参与
- 任务验证与奖励发放 (链下处理)
- 任务排名与推荐

### 宝箱系统
- 宝箱奖励领取 (链下处理)
- 随机奖励分配算法
- 稀有度等级

### 商户系统
- 商户注册与认证
- 商户特权与服务

### 社区治理
- 提案创建与投票
- 社区基金管理
- 治理权重计算

## 数据库结构

Supabase数据库包含以下主要表格：

- `users`: 用户信息
- `social_connections`: 用户社交账号绑定信息
- `tasks`: 任务信息
- `task_submissions`: 任务提交记录
- `rewards`: 奖励记录
- `treasure_boxes`: 宝箱配置
- `box_claims`: 宝箱领取记录
- `merchants`: 商户信息

## 安装与配置

1. 克隆仓库
```bash
git clone https://github.com/yourusername/sociomint.git
cd sociomint
```

2. 安装依赖
```bash
npm install
```

3. 配置环境变量
复制`.env.example`到`.env.local`并填写必要配置。

4. 启动开发服务器
```bash
npm run dev
```

## 部署

### 前端部署
```bash
npm run build
npm run start
```

### 智能合约部署
```bash
cd contracts
npx hardhat run scripts/deploy.js --network bscTestnet
```

## 测试

### 前端测试
```bash
npm run test
```

### 智能合约测试
```bash
cd contracts
npx hardhat test
```

## 贡献指南

1. Fork本仓库
2. 创建功能分支 (`git checkout -b feature/amazing-feature`)
3. 提交更改 (`git commit -m 'Add some amazing feature'`)
4. 推送到分支 (`git push origin feature/amazing-feature`)
5. 创建Pull Request

## 安全和许可

- 所有智能合约已经过安全审计
- 代码遵循MIT许可证

## 项目概述

该项目是使用 Next.js 和 Tailwind CSS 构建的现代化前端应用程序，采用了科技感十足的暗色主题设计风格。

**初步理解**:
*   **平台**: SocioMint (Web3 社交任务平台)
*   **UI 风格**: 模仿 `https://nillion.com/`
*   **核心功能**: 钱包登录、社交认证 (X/TG/Discord) 并奖励平台积分 (小红花)、BNB<>SM 兑换、发布/完成社交曝光任务 (使用小红花)、发布/开启 X 话题宝箱 (使用小红花)、质押 SM 成为小红花市场商家、资产管理 (SM/小红花余额，小红花<>SM 兑换)。
*   **技术栈要求**: 前端 (React/Next.js 推荐)，后端/数据库 (Supabase)，Web3 (钱包连接，可能需要智能合约交互)。
*   **关键元素**: 小红花 (平台积分/道具)，SM (平台代币，可能上链)，动态兑换比例，用户支付 Gas。

**深入分析**:
1.  **架构**:
    *   **前端**: 处理 UI 展示、用户交互、钱包连接、调用 Supabase API、与智能合约交互。
    *   **Supabase**:
        *   **Auth**: 处理用户钱包登录后的身份验证和会话管理。
        *   **Database**: 存储用户信息 (认证状态、小红花余额、商家状态等)、任务信息 (曝光任务、宝箱任务)、市场订单等。
        *   **Functions**: 处理需要后端逻辑的操作，如：
            *   与社交平台 API 交互进行认证和任务验证。
            *   发放/扣除小红花。
            *   处理中心化的兑换逻辑（如果选择）。
            *   计算任务成本和手续费。
            *   市场订单撮合（如果中心化）。
    *   **智能合约 (可能需要)**:
        *   SM 代币合约 (ERC20 on BNB Chain)。
        *   质押合约 (质押 SM 成为商家)。
        *   兑换合约 (处理 BNB<>SM, 小红花<>SM 的去中心化兑换逻辑)。*注意：小红花作为平台积分，与 SM 的兑换更可能通过后端逻辑处理，除非小红花本身也设计为链上代币，但这会增加复杂度。MVP 阶段建议小红花为中心化积分。*
        *   **Web3 Provider**: ethers.js 或 viem 用于前端与钱包和智能合约交互。

2.  **数据模型 (Supabase 表)**:
    *   `users`: `id` (Supabase Auth user ID), `wallet_address` (unique), `sm_balance` (可能需要链上读取，这里可以缓存), `little_red_flower_balance`, `is_merchant`, `created_at`.
    *   `authentications`: `user_id`, `platform` (x, telegram, discord), `status` (pending, completed), `platform_user_id`.
    *   `exposure_tasks`: `id`, `creator_user_id`, `platform`, `target_link`, `reward_follow`, `reward_like`, `reward_retweet`, `reward_comment`, `required_users`, `current_users`, `total_cost_lrf`, `fee_sm`, `status` (active, completed), `created_at`.
    *   `task_completions`: `task_id`, `completer_user_id`, `action_type` (follow, like, etc.), `status` (pending_validation, completed), `created_at`.
    *   `treasure_box_tasks`: `id`, `creator_user_id`, `platform` ('x'), `topic_link`, `hashtag`, `total_boxes`, `reward_per_box_lrf`, `claimed_boxes`, `total_cost_lrf`, `fee_sm`, `status` (active, completed), `created_at`.
    *   `box_claims`: `box_task_id`, `claimer_user_id`, `claim_count`, `last_claim_at`.
    *   `market_orders`: `id`, `merchant_user_id`, `type` (buy_lrf, sell_lrf), `sm_price_per_lrf`, `lrf_amount`, `status` (open, filled, cancelled), `created_at`.
    *   `sm_stakes`: `user_id`, `amount`, `staked_at`.
    *   `dynamic_rates`: `pair` (bnb_sm, lrf_sm), `rate`, `last_updated`. (用于存储动态汇率，由后端更新)

3.  **挑战与决策**:
    *   **小红花**: 是链上代币还是中心化积分？MVP 建议中心化积分，存储在 Supabase，由 Functions 管理。
    *   **兑换**: BNB<>SM 通常需要 AMM (如 PancakeSwap) 或中心化交易所逻辑。小红花<>SM 更适合中心化处理。动态比例如何获取？(预言机/中心化 API/后台配置)。
    *   **X 话题宝箱**: 在 X 平台直接交互技术难度高，MVP 建议简化为在 SocioMint 平台内，用户完成 X 平台上的任务（如发布带特定 #话题 的推文）后，回来平台领取宝箱奖励。
    *   **社交平台 API**: 需要申请开发者权限，处理 Rate Limit，确保安全调用。
    *   **Gas 费**: 所有链上交易（兑换 SM、质押 SM）都需要用户支付 Gas。
    *   **手续费**: SM 手续费的收取和处理（销毁？国库？）。

**创造性思考**:
*   可以将 Particle Network 的 "Chain Abstraction" 概念化用到 SocioMint 的 "Social Abstraction"，即用户在一个平台完成多平台任务。
*   UI 风格借鉴 Particle，但内容和交互要围绕 SocioMint 的核心功能设计。

**方案生成**:
构建一个分阶段的提示词，指导 Cursor 生成代码。
1.  项目设置 (Next.js + Tailwind + Supabase + ethers/viem)。
2.  基础 UI 布局 (导航栏、页脚，模仿 Particle)。
3.  Supabase 数据库表结构创建指导。
4.  钱包登录功能。
5.  资产页面基础 (显示地址、Supabase 中的小红花)。
6.  社交认证模块 (UI + Supabase Function 框架)。
7.  BNB<>SM 和 小红花<>SM 兑换模块 (UI + 调用框架，汇率和兑换逻辑待定)。
8.  社交曝光任务发布模块 (UI + Supabase Function 框架)。
9.  任务列表和完成流程 (UI + Supabase Function 框架)。
10. X 话题宝箱发布模块 (UI + Supabase Function 框架，采用简化方案)。
11. 市场功能模块 (UI + 质押合约交互 + Supabase 订单)。
12. 完善各模块逻辑 (API 调用、余额更新、手续费处理等)。

**综合归纳**:
提示词需要清晰地传达项目目标、技术选型、核心功能、建议的架构和数据模型，并指出关键挑战和建议的简化方案。需要引导 Cursor 分步骤生成代码，并强调前后端（Supabase Functions）和智能合约的配合。

## 开发日志

### 2023-04-08: CSS变量修复与钱包连接

1. **修复样式问题**
   - 解决了Tailwind CSS自定义颜色变量问题
   - 将`hover:shadow-primary/10`替换为`hover:shadow-[#0de5ff]/10`
   - 将`shadow-primary/50`和`shadow-primary/20`替换为`shadow-[#0de5ff]/50`和`shadow-[#0de5ff]/20`
   - 将`bg-primary`和`text-primary`替换为`bg-[#0de5ff]`和`text-[#0de5ff]`
   - 将`animate-gradient`替换为直接的CSS动画

2. **README.md更新**
   - 添加了完成的功能模块列表
   - 优化了运行指南
   - 添加了常见问题排查部分
   - 编写了下一步开发计划

### 2023-04-09: 钱包连接集成与界面改进

1. **实现钱包连接**
   - 添加MetaMask和WalletConnect图标
   - 集成Reown Cloud钱包连接功能（项目ID: 5541f5ba86f0c4e795e40d94ba5eba7a）
   - 完善WalletContext支持直接传递地址和链ID

2. **界面与命名优化**
   - 将"Aureum Vault"更名为"钱库"，使界面更符合中文用户习惯
   - 更新相关组件和页面中的名称引用

### 2023-04-10: 优化钱包连接与环境配置

1. **改进钱包连接实现**
   - 重构ConnectWalletButton组件，从Reown Cloud迁移到原生WalletConnect
   - 添加账户变更和链变更事件监听
   - 优化连接状态管理和错误处理
   - 增加加载状态指示器

2. **完善环境配置系统**
   - 添加.env.example模板文件
   - 更新README.md，增加详细的环境配置指南
   - 新增Infura ID配置项，用于WalletConnect连接
   - 改进环境变量命名和注释说明

3. **错误处理优化**
   - 添加钱包连接故障排除指导
   - 优化连接失败时的错误提示
   - 改进断开连接的逻辑处理

### 2023-04-11: 重构钱包连接实现

1. **修复钱包连接界面问题**
   - 回滚到稳定的MetaMask直接连接方式
   - 优化连接弹窗样式和用户体验
   - 修复连接状态管理和显示不完整的问题
   - 改进钱包图标和视觉提示

2. **增强兼容性**
   - 添加对不同浏览器和设备的支持
   - 实现账户变更和链变更的事件监听
   - 完善错误处理和状态反馈

3. **改进文档**
   - 更新环境配置说明
   - 添加钱包连接故障排除指南
   - 简化开发环境设置流程

### 2023-04-12: 彻底重构钱包连接系统

1. **架构优化**
   - 创建独立的钱包服务层（walletService），将钱包连接逻辑与UI层完全分离
   - 使用最新的WalletConnect SDK (@walletconnect/ethereum-provider)
   - 为钱包连接创建统一的回调接口，易于扩展新的钱包类型

2. **多钱包支持**
   - 实现MetaMask和WalletConnect双钱包支持
   - 优化连接流程和状态管理
   - 增强会话保持功能

3. **UI/UX改进**
   - 提高模态框的z-index值，避免被其他元素遮挡
   - 增加背景半透明度和模糊效果，提升视觉体验
   - 添加无障碍属性，提高可访问性
   - 实现点击外部关闭模态框功能

4. **状态管理优化**
   - 改进钱包类型跟踪和状态恢复
   - 为每个钱包类型实现独立的加载状态
   - 优化会话断开处理逻辑

### 2023-04-13: 修复WalletConnect显示问题

1. **解决WalletConnect模态框显示不完整问题**
   - 发现主页与导航栏连接钱包按钮的实现不一致导致显示问题
   - 统一两处钱包连接入口的z-index值，提高到10000000
   - 添加更全面的CSS样式修复，包括`position`、`overflow`和边框样式等
   - 增强移动设备兼容性，优化WebView环境下的表现

2. **优化钱包连接流程**
   - 改进连接钱包的逻辑，统一所有入口的体验
   - 修复WalletConnect会话管理问题，确保正确清理旧会话
   - 添加防止滚动锁定的机制，优化用户体验

3. **修复边缘情况**
   - 处理连接过程中可能出现的类型错误
   - 添加对事件冒泡的控制，防止意外关闭
   - 修复在某些环境下QR码不居中显示的问题

4. **改进探索任务按钮体验**
   - 优化未连接钱包时的探索任务按钮，改为直接触发钱包连接
   - 连接成功后自动跳转到任务页面，无需二次点击
   - 增强视觉提示和交互反馈

### 2023-04-14: 多钱包支持与探索任务按钮优化

1. **多钱包系统实现**
   - 重构钱包服务，支持MetaMask、WalletConnect、Coinbase Wallet、Trust Wallet和TokenPocket
   - 创建钱包选择模态框，提供更专业的钱包连接体验
   - 优化钱包连接状态管理，提高连接可靠性
   - 添加断开连接和账户切换的事件处理

2. **统一钱包连接入口**
   - 移除首页冗余的钱包连接按钮，仅保留导航栏的连接入口
   - 将"连接钱包参与任务"按钮改为"探索任务"，点击时自动触发钱包连接
   - 简化用户操作流程，减少重复交互

3. **UI改进**
   - 添加钱包图标和加载状态指示
   - 优化模态框样式，增加高对比度和无障碍支持
   - 完善移动端适配，确保各设备显示一致
   - 提升模态框z-index，解决被其他元素遮挡的问题

4. **环境配置优化**
   - 更新环境变量配置，支持不同链和不同钱包类型
   - 改进项目文档，增加钱包配置说明
   - 优化RPC端点设置，支持多链切换

此更新大幅提升了钱包连接体验，支持更多主流钱包，同时简化了用户操作流程，使应用更符合Web3产品的专业标准。

### 2023-04-15: 完成智能合约开发

1. **完成核心智能合约开发**
   - 开发SMToken.sol：SM代币合约，基于ERC20，支持可升级、可暂停、可投票治理功能
   - 开发TeamVesting.sol：团队代币线性释放合约，实现基于用户增长的解锁机制
   - 开发BNBtoSMExchange.sol：BNB兑换SM代币合约，包含反女巫攻击和动态汇率
   - 开发TreasuryFund.sol：国库资金管理合约，支持多签名提案和链上投票
   - 开发MerchantStaking.sol：商户质押合约，限制50个商户名额，实现72小时解除质押期
   - 开发SMExchangeContract.sol：小红花兑换SM代币合约，支持Merkle证明验证用户资格
   - 开发AirdropVault.sol：空投奖励管理合约，支持活动创建和Merkle证明领取
   - 开发ExposureTask.sol：社交曝光任务合约，支持任务创建、验证和奖励发放

2. **合约部署脚本开发**
   - 开发deploy_team_vesting.js：TeamVesting合约部署脚本
   - 开发deploy_bnb_to_sm_exchange.js：BNBtoSMExchange合约部署脚本

3. **智能合约安全性提升**
   - 所有合约都使用OpenZeppelin的安全库实现
   - 实现UUPS可升级模式确保合约可维护性
   - 添加多重安全检查和防止重入攻击的保护措施
   - 合约之间使用标准化接口通信，提高互操作性

### 2023-05-20: 核心合约安全增强更新

1. **核心合约系统升级**
   - 将RewardsCore合约升级为CoreSystem合约，提供更完善的安全功能
   - 实现可暂停机制，允许管理员在紧急情况下暂停关键合约操作
   - 添加紧急资金提取功能，保护用户资产安全
   - 优化权限控制系统，提供更细粒度的角色管理

2. **团队代币解锁合约升级**
   - 将TeamUnlocker合约升级为TeamUnlockerV2
   - 添加紧急模式功能，允许在异常情况下冻结解锁操作
   - 实现多签确认机制，提高解锁决策的安全性
   - 添加自定义KPI管理功能，实现更灵活的解锁条件设置

3. **交易类合约安全性强化**
   - 为FlowerExchange和MerchantManager合约添加可暂停功能
   - 实现前端暂停状态检查，确保用户交易安全
   - 优化错误处理机制，提供更友好的用户体验

4. **开发文档更新**
   - 更新架构文档反映最新的合约结构
   - 提供暂停状态处理指南
   - 更新部署状态文档，标记已弃用的合约

## 合约暂停功能说明

为保障平台安全，核心智能合约已实现可暂停功能。这意味着在紧急情况下（如漏洞发现、市场异常等），平台管理员可以暂时暂停某些合约功能，直到问题解决。

### 暂停状态下的行为

当合约处于暂停状态时：

1. 所有涉及资金转移的操作将被阻止
2. 读取操作（如查询余额、查看任务）不受影响
3. 前端界面会显示相关提示，避免用户尝试执行被暂停的操作
4. 平台将通过社交媒体和站内通知告知暂停原因和预计恢复时间

### 用户注意事项

- 交易前系统会自动检查合约状态，如发现暂停将提示"由于系统维护，该功能暂时不可用"
- 如遇到无法解释的交易失败，请检查平台公告是否有合约暂停的通知
- 暂停状态不会影响用户资产的所有权，仅临时限制某些操作
- 只有被授权的管理员才能暂停或恢复合约操作，确保系统安全

### 常见问题

#### WalletConnect显示不完整问题

如果遇到WalletConnect连接二维码显示不完整的情况，可能有以下几个原因：

1. **z-index冲突**：页面中可能有其他元素的z-index值过高，导致WalletConnect模态框被覆盖。
   - 解决方法：已将模态框z-index提高到10000000，确保在最上层显示。

2. **样式覆盖**：全局CSS可能覆盖了WalletConnect的默认样式。
   - 解决方法：添加了专门的CSS修复，强制设置正确的位置、大小和边框。

3. **移动设备兼容性**：在某些移动设备或WebView中可能有特殊的显示问题。
   - 解决方法：添加了专门的移动设备适配样式，优化小屏幕显示效果。

4. **滚动锁定**：部分浏览器环境下body可能被锁定滚动。
   - 解决方法：添加了防止滚动锁定的代码，确保用户可以正常滚动页面。

对于仍然存在的问题，可以尝试：
1. 清除浏览器缓存和cookies
2. 尝试不同的浏览器（Chrome、Firefox、Safari等）
3. 在PC端和移动端分别进行测试
4. 检查浏览器控制台是否有相关错误信息

## 完成的功能模块

目前已经完成了SocioMint平台的所有主要页面和功能的开发：

1. **钱包连接功能**
   - 创建了WalletContext，实现了钱包连接和状态管理
   - 模拟钱包连接和状态保持功能

2. **首页功能**
   - 背景动效增强
   - 社交平台认证与奖励系统
   - BNB兑换SM功能

3. **资产管理**
   - 显示用户钱包地址和余额
   - 资产兑换功能
   - 交易历史记录

4. **任务系统**
   - 社交曝光任务列表
   - X话题宝箱任务
   - 任务创建功能

5. **市场功能**
   - 小红花买卖订单
   - 商家质押功能
   - 市场交易界面

6. **资金库系统**
   - 钱库功能
   - 资金质押与奖励
   - 动态APY计算

所有页面都采用了现代化的UI设计，参考了Nillion网站的视觉风格，实现了具有科技感的界面。每个功能都实现了基本的交互逻辑和状态管理，为后续接入区块链提供了良好的基础。

目前已完成的智能合约功能：

1. **代币与经济系统**
   - SM代币合约 - 支持投票、销毁、暂停等功能
   - 团队代币线性释放机制 - 基于用户增长的解锁条件
   - BNB兑换SM机制 - 支持反女巫攻击和动态汇率
   
2. **任务与激励系统**
   - 社交曝光任务合约 - 支持任务创建、验证和奖励
   - 空投奖励管理 - 支持多种活动类型和Merkle证明
   
3. **平台经济组件**
   - 国库资金管理 - 支持多签名提案和资金安全管理
   - 商户质押机制 - 限制商户名额，实现准入控制
   - 小红花兑换SM机制 - 连接中心化积分与链上代币

## 如何运行

```bash
# 克隆项目
git clone <repository-url>

# 进入项目目录
cd sociomint

# 安装依赖
npm install

# 启动开发服务器
npm run dev
```

打开 [http://localhost:3000](http://localhost:3000) 在浏览器中查看应用。如果该端口被占用，应用会自动选择下一个可用端口（如3001或3002）。

## 常见问题排查

### Tailwind CSS样式问题

如果遇到类似以下错误：

```
Error: Cannot apply unknown utility class: hover:shadow-primary/10
```

这是因为在CSS中使用了自定义颜色变量的阴影，但Tailwind配置中没有对应的设置。解决方法：

1. 在`globals.css`文件中，将`hover:shadow-primary/10`替换为`hover:shadow-[#0de5ff]/10`，使用具体的HEX颜色值而非Tailwind变量。
2. 类似地，将`shadow-primary/50`和`shadow-primary/20`分别替换为`shadow-[#0de5ff]/50`和`shadow-[#0de5ff]/20`。

### 页面路由问题

如果出现页面路由冲突，可能是因为Next.js有两套路由系统：

1. 旧的Pages Router（在`src/pages`目录）
2. 新的App Router（在`src/app`目录）

确保你只使用一种路由系统，如果需要，可以删除`src/pages`目录，专注于使用App Router。

## 下一步开发计划

1. **部署脚本完善**
   - 为所有核心合约编写部署脚本
   - 创建测试网自动化部署流程
   - 开发合约验证脚本

2. **合约测试**
   - 编写单元测试覆盖所有合约功能
   - 实现集成测试验证合约间交互
   - 进行安全审计和形式化验证

3. **前端集成**
   - 连接前端界面与已部署的智能合约
   - 实现钱包连接与合约交互
   - 开发交易状态监控和错误处理

4. **后端集成**
   - 实现Merkle树生成服务
   - 开发任务验证API
   - 构建小红花与SM代币兑换桥接

5. **测试网络部署与测试**
   - 在BSC测试网部署合约
   - 进行端到端功能测试
   - 收集用户反馈并优化体验

## 设计灵感

本项目UI设计灵感来源于:
- [Nillion](https://nillion.com/) - 未来感与流畅动效
- [Tutorial Token](https://tutorialtoken.com/) - 清晰的信息层级与布局

## 环境配置指南

为确保SocioMint应用正常运行，您需要配置以下环境变量。复制项目根目录中的`.env.example`文件并重命名为`.env.local`，然后根据以下说明设置各项变量。

### 必需配置项

1. **Web3连接**
   - `NEXT_PUBLIC_WALLET_CONNECT_PROJECT_ID`: 在[WalletConnect Cloud](https://cloud.walletconnect.com/sign-in)注册并创建项目后获取
   - `NEXT_PUBLIC_INFURA_ID`: 在[Infura](https://infura.io/register)注册并创建项目后获取，用于WalletConnect连接
   - `NEXT_PUBLIC_CHAIN_ID`: 区块链网络ID，BSC主网为56，测试网为97

2. **Supabase集成** (后端功能上线后需要)
   - `NEXT_PUBLIC_SUPABASE_URL`: Supabase项目URL
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`: Supabase匿名密钥

### 可选配置项

1. **自定义RPC端点**
   - `NEXT_PUBLIC_BSC_RPC_URL`: BSC主网RPC端点，默认使用Binance提供的公共节点
   - `NEXT_PUBLIC_BSC_TESTNET_RPC_URL`: BSC测试网RPC端点

2. **合约地址** (智能合约部署后需要)
   - `NEXT_PUBLIC_SM_TOKEN_ADDRESS`: SM代币合约地址
   - `NEXT_PUBLIC_STAKE_CONTRACT_ADDRESS`: 质押合约地址

3. **社交平台API** (社交功能上线后需要)
   - `X_API_KEY`: X/Twitter API密钥
   - `TELEGRAM_BOT_TOKEN`: Telegram机器人令牌
   - `DISCORD_CLIENT_SECRET`: Discord应用密钥

4. **业务参数配置**
   - `NEXT_PUBLIC_DEFAULT_EXCHANGE_RATE`: 默认兑换比率
   - `NEXT_PUBLIC_TASK_FEE_PERCENT`: 任务手续费百分比
   - `NEXT_PUBLIC_MARKET_FEE_PERCENT`: 市场手续费百分比
   - `NEXT_PUBLIC_MIN_STAKE_AMOUNT`: 最低质押数量

### 故障排除

如果钱包连接功能出现问题，请检查:

1. 确保已正确设置`NEXT_PUBLIC_WALLET_CONNECT_PROJECT_ID`和`NEXT_PUBLIC_INFURA_ID`
2. MetaMask连接需要安装浏览器插件
3. WalletConnect连接需要在移动设备上安装支持的钱包应用
4. 检查浏览器控制台是否有相关错误信息

## 智能合约部署指南

要部署SocioMint的智能合约，需要按照以下步骤进行操作：

1. **准备环境**
   ```bash
   # 安装Hardhat
   npm install --save-dev hardhat

   # 安装必要的依赖
   npm install --save-dev @openzeppelin/contracts-upgradeable @openzeppelin/hardhat-upgrades dotenv
   ```

2. **配置部署参数**
   - 创建`.env`文件并添加以下环境变量：
     ```
     PRIVATE_KEY=your_private_key
     BSC_TESTNET_RPC_URL=https://data-seed-prebsc-1-s1.binance.org:8545/
     BSC_MAINNET_RPC_URL=https://bsc-dataseed.binance.org/
     SM_TOKEN_ADDRESS=deployed_sm_token_address
     FEE_WALLET_ADDRESS=fee_receiver_address
     TEAM_WALLET_ADDRESS=team_wallet_address
     ```

3. **部署合约**
   ```bash
   # 部署SM代币合约
   npx hardhat run scripts/deploy_sm_token.js --network bscTestnet

   # 设置环境变量后部署其他合约
   npx hardhat run scripts/deploy_team_vesting.js --network bscTestnet
   npx hardhat run scripts/deploy_bnb_to_sm_exchange.js --network bscTestnet
   # 继续部署其他合约...
   ```

4. **验证合约**
   ```bash
   npx hardhat verify --network bscTestnet DEPLOYED_CONTRACT_ADDRESS constructor_arguments
   ```

5. **初始化配置**
   - 为BNBtoSMExchange合约转入初始SM代币
   - 设置Merkle根和白名单
   - 转移合约所有权到多签钱包
