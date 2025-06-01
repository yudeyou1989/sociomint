import { createConfig } from 'wagmi';
import { bsc, bscTestnet } from 'viem/chains';
import { http } from 'viem';
import { injected, walletConnect } from '@wagmi/connectors';

// 导出链配置
export { bsc, bscTestnet };

// WalletConnect项目ID
const projectId = process.env.NEXT_PUBLIC_WALLET_CONNECT_PROJECT_ID || 'fced525820007c9c024132cf432ffcae';

// 定义链
const chains = [bsc, bscTestnet];

// 创建Wagmi配置
export const config = createConfig({
  chains,
  transports: {
    [bsc.id]: http(),
    [bscTestnet.id]: http(),
  },
  connectors: [
    injected({ chains }),
    walletConnect({
      projectId,
      chains,
      showQrModal: true,
    }),
  ],
});
