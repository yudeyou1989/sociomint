import { FaTwitter } from 'react-icons/fa';
import { RiTreasureMapFill } from 'react-icons/ri';

interface BoxProps {
  id: string;
  hashtag: string;
  reward: number;
  remaining: number;
  total: number;
}

const BoxCard = ({ id, hashtag, reward, remaining, total }: BoxProps) => {
  // 计算剩余百分比
  const remainingPercent = (remaining / total) * 100;

  return (
    <div className="tech-card relative overflow-hidden">
      {/* 平台标识 */}
      <div className="absolute top-3 right-3 p-1.5 rounded-full bg-gray-800/70">
        <FaTwitter className="w-4 h-4 text-blue-400" />
      </div>

      {/* 宝箱内容 */}
      <div className="flex items-start mb-4">
        <div className="p-2 rounded-md bg-gray-800/50 mr-3">
          <RiTreasureMapFill className="w-5 h-5 text-yellow-400" />
        </div>
        <div>
          <h3 className="font-medium">X 话题宝箱</h3>
          <p className="text-sm text-primary mt-1">{hashtag}</p>
        </div>
      </div>

      {/* 奖励显示 */}
      <div className="mb-4">
        <span className="text-sm text-gray-300">单个宝箱奖励:</span>
        <span className="ml-2 text-primary font-bold">{reward}</span>
        <span className="ml-1 text-xs text-gray-400">小红花</span>
      </div>

      {/* 进度条 */}
      <div className="mb-2">
        <div className="w-full h-2 bg-gray-800 rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-primary to-secondary"
            style={{ width: `${remainingPercent}%` }}
          ></div>
        </div>
      </div>

      {/* 剩余情况 */}
      <div className="flex justify-between text-sm">
        <span className="text-gray-400">
          {remaining}/{total} 剩余
        </span>
        <span className="text-gray-400">ID: {id.substring(0, 6)}...</span>
      </div>

      {/* 操作按钮 */}
      <div className="mt-5 flex space-x-2">
        <button className="w-full py-2 px-4 bg-blue-600 hover:bg-blue-700 rounded-md transition-colors text-sm">
          去 X 查看
        </button>
        <button className="py-2 px-3 bg-gray-800 hover:bg-gray-700 rounded-md border border-gray-700 hover:border-primary/50 transition-colors text-sm">
          详情
        </button>
      </div>
    </div>
  );
};

export default BoxCard;
