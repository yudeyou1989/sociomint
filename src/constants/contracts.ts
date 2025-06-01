// 宝箱系统合约地址
interface BoxContractAddresses {
  [networkId: number]: string;
}

export const BOX_CONTRACT_ADDRESSES: BoxContractAddresses = {
  97: '0x5FbDB2315678afecb367f032d93F642f64180aa3', // BSC Testnet
  56: '0x8A791620dd6260079BF849Dc5567aDC3F2FdC318'  // BSC Mainnet
}

/**
 * 获取当前网络的宝箱合约地址
 * @param networkId 网络ID
 * @returns 宝箱合约地址
 */
export const getBoxContractAddress = (networkId: number): string => {
  return BOX_CONTRACT_ADDRESSES[networkId] || BOX_CONTRACT_ADDRESSES[97]; // 默认返回测试网地址
};

export const CONTRACTS = {
  // 主网
  MAINNET: {
    SM_TOKEN: "0x8A791620dd6260079BF849Dc5567aDC3F2FdC318", // 生产环境SMToken合约地址
    SM_EXCHANGE: "0x9B73F7d66d4aa53B073A5178CCd5FB381052EfeA", // 生产环境SMTokenExchange合约地址
  },
  // 测试网
  TESTNET: {
    SM_TOKEN: "0xd7d7dd989642222B6f685aF0220dc0065F489ae0", // SMToken测试网合约地址
    SM_EXCHANGE: "0xF0c4729f07d7B2F03E2E2F2feED36386Dc8bFb8E", // SMTokenExchange测试网合约地址
    SM_TOKEN_TEST: "0xa1f5Fba244B0030bbc6fD115E0351a731521DfD9", // SMToken_test测试网合约地址
  },
  // 本地开发环境
  LOCAL: {
    SM_TOKEN: "0x5FbDB2315678afecb367f032d93F642f64180aa3", // SMToken本地合约地址
    SM_EXCHANGE: "0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512", // SMTokenExchange本地合约地址
  }
};

// 导出合约地址常量，用于前端组件
export const CONTRACT_ADDRESSES = {
  token: process.env.NEXT_PUBLIC_SM_TOKEN_ADDRESS || CONTRACTS.TESTNET.SM_TOKEN_TEST, // 使用测试代币
  exchange: process.env.NEXT_PUBLIC_SM_EXCHANGE_ADDRESS || CONTRACTS.TESTNET.SM_EXCHANGE,
};