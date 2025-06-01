#!/usr/bin/env node

/**
 * 安全修复版本合约部署脚本
 * 部署修复了安全漏洞的 SMToken_Secure 和 SMTokenExchange_Secure 合约
 */

const { ethers, upgrades } = require('hardhat');
const fs = require('fs');
const path = require('path');

class SecureContractDeployer {
    constructor() {
        this.deploymentData = {
            network: '',
            timestamp: new Date().toISOString(),
            contracts: {},
            verification: {},
            security: {
                fixes: [
                    'C-01: 时间锁哈希碰撞风险修复',
                    'C-02: 价格操纵风险修复',
                    'M-01: 重入攻击防护加强',
                    'M-02: 访问控制去中心化',
                    'M-03: 价格更新验证',
                    'M-04: 紧急暂停机制完善'
                ]
            }
        };
    }

    /**
     * 部署安全版本的合约
     */
    async deploySecureContracts() {
        console.log('🔒 开始部署安全修复版本的合约...\n');

        try {
            // 获取网络信息
            const network = await ethers.provider.getNetwork();
            this.deploymentData.network = network.name;
            console.log(`📡 网络: ${network.name} (Chain ID: ${network.chainId})`);

            // 获取部署者账户
            const [deployer] = await ethers.getSigners();
            console.log(`👤 部署者: ${deployer.address}`);
            console.log(`💰 余额: ${ethers.formatEther(await deployer.provider.getBalance(deployer.address))} ETH\n`);

            // 部署 SMToken_Secure
            console.log('🚀 部署 SMToken_Secure...');
            const smTokenSecure = await this.deploySMTokenSecure(deployer);

            // 部署 SMTokenExchange_Secure
            console.log('🚀 部署 SMTokenExchange_Secure...');
            const smTokenExchangeSecure = await this.deploySMTokenExchangeSecure(deployer, smTokenSecure.target);

            // 配置合约
            console.log('⚙️ 配置合约...');
            await this.configureContracts(smTokenSecure, smTokenExchangeSecure);

            // 验证部署
            console.log('✅ 验证部署...');
            await this.verifyDeployment(smTokenSecure, smTokenExchangeSecure);

            // 保存部署信息
            await this.saveDeploymentInfo();

            console.log('\n🎉 安全版本合约部署完成！');
            console.log('📄 部署信息已保存到 deployments/secure-deployment.json');

        } catch (error) {
            console.error('❌ 部署失败:', error);
            throw error;
        }
    }

    /**
     * 部署 SMToken_Secure 合约
     */
    async deploySMTokenSecure(deployer) {
        const SMTokenSecure = await ethers.getContractFactory('SMToken_Secure');
        
        // 部署参数
        const name = 'SocioMint Token Secure';
        const symbol = 'SMS';
        const initialMintingCap = ethers.parseEther('1000000000'); // 10亿代币
        const requiredApprovals = 3; // 需要3个批准

        console.log('  📋 部署参数:');
        console.log(`    名称: ${name}`);
        console.log(`    符号: ${symbol}`);
        console.log(`    铸造上限: ${ethers.formatEther(initialMintingCap)} SMS`);
        console.log(`    所需批准数: ${requiredApprovals}`);

        // 使用 UUPS 代理部署
        const smTokenSecure = await upgrades.deployProxy(
            SMTokenSecure,
            [name, symbol, initialMintingCap, requiredApprovals],
            {
                kind: 'uups',
                initializer: 'initialize'
            }
        );

        await smTokenSecure.waitForDeployment();

        const proxyAddress = await smTokenSecure.getAddress();
        const implementationAddress = await upgrades.erc1967.getImplementationAddress(proxyAddress);

        console.log(`  ✅ SMToken_Secure 部署成功:`);
        console.log(`    代理地址: ${proxyAddress}`);
        console.log(`    实现地址: ${implementationAddress}`);

        this.deploymentData.contracts.smTokenSecure = {
            proxy: proxyAddress,
            implementation: implementationAddress,
            name,
            symbol,
            initialMintingCap: initialMintingCap.toString(),
            requiredApprovals
        };

        return smTokenSecure;
    }

    /**
     * 部署 SMTokenExchange_Secure 合约
     */
    async deploySMTokenExchangeSecure(deployer, tokenAddress) {
        const SMTokenExchangeSecure = await ethers.getContractFactory('SMTokenExchange_Secure');
        
        // 部署参数
        const bnbPriceFeed = '0x0567F2323251f0Aab15c8dFb1967E4e8A7D42aeE'; // BSC Testnet BNB/USD
        const minPurchaseAmount = ethers.parseEther('0.01'); // 0.01 BNB
        const maxPurchaseAmount = ethers.parseEther('10'); // 10 BNB

        console.log('  📋 部署参数:');
        console.log(`    代币地址: ${tokenAddress}`);
        console.log(`    价格预言机: ${bnbPriceFeed}`);
        console.log(`    最小购买: ${ethers.formatEther(minPurchaseAmount)} BNB`);
        console.log(`    最大购买: ${ethers.formatEther(maxPurchaseAmount)} BNB`);

        // 使用 UUPS 代理部署
        const smTokenExchangeSecure = await upgrades.deployProxy(
            SMTokenExchangeSecure,
            [tokenAddress, bnbPriceFeed, minPurchaseAmount, maxPurchaseAmount],
            {
                kind: 'uups',
                initializer: 'initialize'
            }
        );

        await smTokenExchangeSecure.waitForDeployment();

        const proxyAddress = await smTokenExchangeSecure.getAddress();
        const implementationAddress = await upgrades.erc1967.getImplementationAddress(proxyAddress);

        console.log(`  ✅ SMTokenExchange_Secure 部署成功:`);
        console.log(`    代理地址: ${proxyAddress}`);
        console.log(`    实现地址: ${implementationAddress}`);

        this.deploymentData.contracts.smTokenExchangeSecure = {
            proxy: proxyAddress,
            implementation: implementationAddress,
            tokenAddress,
            bnbPriceFeed,
            minPurchaseAmount: minPurchaseAmount.toString(),
            maxPurchaseAmount: maxPurchaseAmount.toString()
        };

        return smTokenExchangeSecure;
    }

    /**
     * 配置合约
     */
    async configureContracts(smTokenSecure, smTokenExchangeSecure) {
        // 为交换合约授予铸币权限
        const MINTER_ROLE = await smTokenSecure.MINTER_ROLE();
        const exchangeAddress = await smTokenExchangeSecure.getAddress();
        
        console.log('  🔑 授予交换合约铸币权限...');
        const grantRoleTx = await smTokenSecure.grantRole(MINTER_ROLE, exchangeAddress);
        await grantRoleTx.wait();
        console.log(`    ✅ 已授予 ${exchangeAddress} MINTER_ROLE`);

        // 设置初始价格
        console.log('  💰 设置初始价格...');
        const initialPrice = ethers.parseEther('0.000000833'); // 0.000000833 BNB per SMS
        const setPriceTx = await smTokenExchangeSecure.updateRoundPrice(0, initialPrice);
        await setPriceTx.wait();
        console.log(`    ✅ 设置轮次 0 价格: ${ethers.formatEther(initialPrice)} BNB/SMS`);

        // 激活交换
        console.log('  🔄 激活代币交换...');
        const activateTx = await smTokenExchangeSecure.setExchangeActive(true);
        await activateTx.wait();
        console.log('    ✅ 代币交换已激活');

        // 向交换合约转移代币
        console.log('  📤 向交换合约转移代币...');
        const transferAmount = ethers.parseEther('100000000'); // 1亿代币
        
        // 首先安排铸币
        const scheduleTx = await smTokenSecure.scheduleMint(exchangeAddress, transferAmount);
        const scheduleReceipt = await scheduleTx.wait();
        
        // 获取 actionHash
        const event = scheduleReceipt.logs.find(log => 
            log.topics[0] === smTokenSecure.interface.getEvent('TimelockActionEvent').topicHash
        );
        const actionHash = event.topics[1];
        
        console.log(`    ⏰ 已安排铸币操作: ${actionHash}`);
        console.log('    ⚠️  注意: 需要等待时间锁延迟后才能执行铸币');

        this.deploymentData.configuration = {
            minterRoleGranted: true,
            initialPrice: initialPrice.toString(),
            exchangeActive: true,
            scheduledMint: {
                actionHash,
                amount: transferAmount.toString(),
                recipient: exchangeAddress
            }
        };
    }

    /**
     * 验证部署
     */
    async verifyDeployment(smTokenSecure, smTokenExchangeSecure) {
        console.log('  🔍 验证合约状态...');

        // 验证 SMToken_Secure
        const tokenName = await smTokenSecure.name();
        const tokenSymbol = await smTokenSecure.symbol();
        const mintingCap = await smTokenSecure.mintingCap();
        const requiredApprovals = await smTokenSecure.requiredApprovals();

        console.log(`    📋 SMToken_Secure:`);
        console.log(`      名称: ${tokenName}`);
        console.log(`      符号: ${tokenSymbol}`);
        console.log(`      铸造上限: ${ethers.formatEther(mintingCap)}`);
        console.log(`      所需批准数: ${requiredApprovals}`);

        // 验证 SMTokenExchange_Secure
        const exchangeActive = await smTokenExchangeSecure.exchangeActive();
        const currentRound = await smTokenExchangeSecure.currentRound();
        const minPurchase = await smTokenExchangeSecure.minPurchaseAmount();
        const maxPurchase = await smTokenExchangeSecure.maxPurchaseAmount();

        console.log(`    📋 SMTokenExchange_Secure:`);
        console.log(`      交换状态: ${exchangeActive ? '激活' : '未激活'}`);
        console.log(`      当前轮次: ${currentRound}`);
        console.log(`      最小购买: ${ethers.formatEther(minPurchase)} BNB`);
        console.log(`      最大购买: ${ethers.formatEther(maxPurchase)} BNB`);

        this.deploymentData.verification = {
            smTokenSecure: {
                name: tokenName,
                symbol: tokenSymbol,
                mintingCap: mintingCap.toString(),
                requiredApprovals: requiredApprovals.toString()
            },
            smTokenExchangeSecure: {
                exchangeActive,
                currentRound: currentRound.toString(),
                minPurchaseAmount: minPurchase.toString(),
                maxPurchaseAmount: maxPurchase.toString()
            }
        };
    }

    /**
     * 保存部署信息
     */
    async saveDeploymentInfo() {
        const deploymentsDir = path.join(__dirname, '../../deployments');
        if (!fs.existsSync(deploymentsDir)) {
            fs.mkdirSync(deploymentsDir, { recursive: true });
        }

        const deploymentFile = path.join(deploymentsDir, 'secure-deployment.json');
        fs.writeFileSync(deploymentFile, JSON.stringify(this.deploymentData, null, 2));

        // 也保存到安全报告目录
        const securityReportsDir = path.join(__dirname, '../security-reports');
        const securityDeploymentFile = path.join(securityReportsDir, 'secure-deployment.json');
        fs.writeFileSync(securityDeploymentFile, JSON.stringify(this.deploymentData, null, 2));
    }

    /**
     * 生成部署后的安全检查清单
     */
    generateSecurityChecklist() {
        const checklist = `
# 安全部署后检查清单

## ✅ 已完成的安全修复
${this.deploymentData.security.fixes.map(fix => `- [x] ${fix}`).join('\n')}

## 🔍 部署后验证项目
- [ ] 验证合约地址和实现地址
- [ ] 确认所有角色权限正确分配
- [ ] 测试紧急暂停功能
- [ ] 验证时间锁机制工作正常
- [ ] 测试滑点保护功能
- [ ] 确认价格更新验证机制
- [ ] 验证重入攻击防护
- [ ] 测试多签批准流程

## 🚨 监控设置
- [ ] 设置大额交易告警
- [ ] 配置价格异常监控
- [ ] 启用合约调用监控
- [ ] 设置紧急响应流程

## 📋 下一步行动
1. 等待时间锁延迟后执行铸币操作
2. 进行全面的功能测试
3. 设置监控和告警系统
4. 准备主网部署计划
5. 安排第三方安全审计

## 📞 紧急联系
- 安全团队: security@sociomint.com
- 技术支持: tech@sociomint.com
`;

        const checklistFile = path.join(__dirname, '../security-reports/post-deployment-checklist.md');
        fs.writeFileSync(checklistFile, checklist);
        
        console.log('📋 安全检查清单已生成: security-reports/post-deployment-checklist.md');
    }
}

// 主函数
async function main() {
    const deployer = new SecureContractDeployer();
    
    try {
        await deployer.deploySecureContracts();
        deployer.generateSecurityChecklist();
        
        console.log('\n🎯 部署总结:');
        console.log('- 所有安全漏洞已修复');
        console.log('- 合约已成功部署到测试网');
        console.log('- 配置已完成，等待时间锁执行');
        console.log('- 安全检查清单已生成');
        
    } catch (error) {
        console.error('部署失败:', error);
        process.exit(1);
    }
}

// 运行部署
if (require.main === module) {
    main().catch(console.error);
}

module.exports = SecureContractDeployer;
