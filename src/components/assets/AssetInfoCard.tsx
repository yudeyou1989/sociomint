// // import { FaWallet, "🪙", FaSeedling } from 'react-icons/fa'; // 临时注释以修复构建 // 临时注释以修复构建

interface AssetInfoCardProps {
  walletAddress: string;
  smBalance: number;
  flowerBalance: number;
}

const AssetInfoCard = ({
  walletAddress,
  smBalance,
  flowerBalance,
}: AssetInfoCardProps) => {
  return (
    <div className="tech-card mb-8">
      <h2 className="text-xl font-bold mb-6">资产信息</h2>

      <div className="space-y-4">
        {/* 钱包地址 */}
        <div className="flex items-center p-4 bg-gray-800/50 rounded-md border border-gray-700">
          <div className="p-2 rounded-md bg-gray-800 mr-4">
            <FaWallet className="w-5 h-5 text-primary" />
          </div>
          <div>
            <div className="text-sm text-gray-400">钱包地址</div>
            <div className="font-mono text-white">{walletAddress}</div>
          </div>
        </div>

        {/* SM 余额 */}
        <div className="flex items-center p-4 bg-gray-800/50 rounded-md border border-gray-700">
          <div className="p-2 rounded-md bg-gray-800 mr-4">
            🪙
          </div>
          <div>
            <div className="text-sm text-gray-400">SM 余额</div>
            <div className="text-white font-bold text-xl">
              {smBalance} <span className="text-primary">SM</span>
            </div>
          </div>
        </div>

        {/* 小红花余额 */}
        <div className="flex items-center p-4 bg-gray-800/50 rounded-md border border-gray-700">
          <div className="p-2 rounded-md bg-gray-800 mr-4">
            <FaSeedling className="w-5 h-5 text-primary" />
          </div>
          <div>
            <div className="text-sm text-gray-400">小红花余额</div>
            <div className="text-white font-bold text-xl">
              {flowerBalance} <span className="text-primary">小红花</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AssetInfoCard;
