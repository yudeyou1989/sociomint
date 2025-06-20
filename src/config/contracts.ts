// 合约地址配置
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
    SM_TOKEN_TEST: "0xa1f5Fba244B0030bbc6fD115E0351a731521DfD9", // SMToken_test测试网合约地址 (1分钟时间锁)
  },
  // 本地开发环境
  LOCAL: {
    SM_TOKEN: "0x5FbDB2315678afecb367f032d93F642f64180aa3", // SMToken本地合约地址
    SM_EXCHANGE: "0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512", // SMTokenExchange本地合约地址
  }
};

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

// 导出合约地址常量，用于前端组件
export const CONTRACT_ADDRESSES = {
  token: process.env.NEXT_PUBLIC_SM_TOKEN_ADDRESS || CONTRACTS.TESTNET.SM_TOKEN_TEST, // 使用测试代币
  exchange: process.env.NEXT_PUBLIC_SM_EXCHANGE_ADDRESS || CONTRACTS.TESTNET.SM_EXCHANGE,
  tokenTest: CONTRACTS.TESTNET.SM_TOKEN_TEST,
};

// SMToken ABI
const SM_TOKEN_ABI = [
  {
    "inputs": [],
    "name": "MINTER_ROLE",
    "outputs": [
      {
        "internalType": "bytes32",
        "name": "",
        "type": "bytes32"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "PAUSER_ROLE",
    "outputs": [
      {
        "internalType": "bytes32",
        "name": "",
        "type": "bytes32"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "DEFAULT_ADMIN_ROLE",
    "outputs": [
      {
        "internalType": "bytes32",
        "name": "",
        "type": "bytes32"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "address",
        "name": "to",
        "type": "address"
      },
      {
        "internalType": "uint256",
        "name": "amount",
        "type": "uint256"
      }
    ],
    "name": "scheduleMint",
    "outputs": [
      {
        "internalType": "bytes32",
        "name": "",
        "type": "bytes32"
      }
    ],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "bytes32",
        "name": "actionHash",
        "type": "bytes32"
      },
      {
        "internalType": "address",
        "name": "to",
        "type": "address"
      },
      {
        "internalType": "uint256",
        "name": "amount",
        "type": "uint256"
      }
    ],
    "name": "executeMint",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "bytes32",
        "name": "role",
        "type": "bytes32"
      },
      {
        "internalType": "address",
        "name": "account",
        "type": "address"
      }
    ],
    "name": "hasRole",
    "outputs": [
      {
        "internalType": "bool",
        "name": "",
        "type": "bool"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "name",
    "outputs": [
      {
        "internalType": "string",
        "name": "",
        "type": "string"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "symbol",
    "outputs": [
      {
        "internalType": "string",
        "name": "",
        "type": "string"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "address",
        "name": "account",
        "type": "address"
      }
    ],
    "name": "balanceOf",
    "outputs": [
      {
        "internalType": "uint256",
        "name": "",
        "type": "uint256"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  }
];

// SMTokenExchange ABI
const SM_EXCHANGE_ABI = [
  {
    "inputs": [],
    "name": "exchangeTokens",
    "outputs": [],
    "stateMutability": "payable",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "getExchangeStats",
    "outputs": [
      {
        "internalType": "uint256",
        "name": "totalTokensSold",
        "type": "uint256"
      },
      {
        "internalType": "uint256",
        "name": "totalTokensRemaining",
        "type": "uint256"
      },
      {
        "internalType": "uint256",
        "name": "totalBnbRaised",
        "type": "uint256"
      },
      {
        "internalType": "uint256",
        "name": "currentPrice",
        "type": "uint256"
      },
      {
        "internalType": "uint256",
        "name": "nextRoundPrice",
        "type": "uint256"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "address",
        "name": "user",
        "type": "address"
      }
    ],
    "name": "userData",
    "outputs": [
      {
        "internalType": "uint128",
        "name": "totalPurchases",
        "type": "uint128"
      },
      {
        "internalType": "bool",
        "name": "isVerified",
        "type": "bool"
      },
      {
        "internalType": "uint64",
        "name": "lastPurchaseTime",
        "type": "uint64"
      },
      {
        "internalType": "bool",
        "name": "hasRefundRequest",
        "type": "bool"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  }
];

// 为了向后兼容，添加这些导出
export const contractAddresses = CONTRACT_ADDRESSES;
export const contractAbis = {
  smToken: SM_TOKEN_ABI,
  smTokenExchange: SM_EXCHANGE_ABI,
};

// 导出ABI常量
export { SM_TOKEN_ABI, SM_EXCHANGE_ABI };

// 导出类型定义
export interface ExchangeStats {
  totalTokensSold: bigint;
  totalTokensRemaining: bigint;
  totalBnbRaised: bigint;
  currentPrice: bigint;
  nextRoundPrice: bigint;
  isActive: boolean;
  currentRound: number;
}
