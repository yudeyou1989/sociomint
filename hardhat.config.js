const { HardhatUserConfig } = require("hardhat/config");
require("@nomicfoundation/hardhat-verify");
require("@openzeppelin/hardhat-upgrades");
require("dotenv/config");
require("@nomicfoundation/hardhat-ethers");
require("@nomicfoundation/hardhat-chai-matchers");

// 从环境变量获取配置
const PRIVATE_KEY = process.env.PRIVATE_KEY;
const BSC_TESTNET_RPC_URL = process.env.BSC_TESTNET_RPC_URL || "https://bsc-testnet.publicnode.com";
const BSC_MAINNET_RPC_URL = process.env.BSC_MAINNET_RPC_URL || "https://bsc-dataseed.binance.org/";
const BSCSCAN_API_KEY = process.env.BSCSCAN_API_KEY;

// 检查必要的环境变量
if (!PRIVATE_KEY || !BSCSCAN_API_KEY) {
  console.error("请确保已设置 PRIVATE_KEY 和 BSCSCAN_API_KEY 环境变量");
  process.exit(1);
}

// 处理私钥格式
const privateKey = PRIVATE_KEY.startsWith("0x") ? PRIVATE_KEY.substring(2) : PRIVATE_KEY;

// Hardhat 配置
const config = {
  solidity: {
    version: "0.8.20",
    settings: {
      optimizer: {
        enabled: true,
        runs: 200,
      },
    },
  },
  networks: {
    // 本地测试网络
    localhost: {
      url: "http://127.0.0.1:8545",
    },
    hardhat: {
      // 硬编码的测试账户默认拥有 10000 ETH
    },
    // BSC 测试网
    bscTestnet: {
      url: BSC_TESTNET_RPC_URL,
      chainId: 97,
      accounts: [privateKey],
      gasPrice: 20000000000, // 20 Gwei
    },
    // BSC 主网
    bsc: {
      url: BSC_MAINNET_RPC_URL,
      chainId: 56,
      accounts: [privateKey],
      gasPrice: 5000000000, // 5 Gwei
    },
  },
  // Etherscan 验证
  etherscan: {
    apiKey: {
      bscTestnet: BSCSCAN_API_KEY,
      bsc: BSCSCAN_API_KEY,
    },
  },
  // 路径设置
  paths: {
    sources: "./contracts",
    tests: "./test",
    cache: "./cache",
    artifacts: "./artifacts",
  },
  // Mocha 设置
  mocha: {
    timeout: 40000, // 测试超时时间
  },
};

module.exports = config; 