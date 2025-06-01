import { FaTwitter, FaTelegram, FaDiscord } from 'react-icons/fa';
import { BiLike, BiComment, BiUserPlus } from 'react-icons/bi';
import { RiRepeatFill } from 'react-icons/ri';
import { HiOutlineChevronRight } from 'react-icons/hi';

// 任务类型定义
type TaskAction = 'follow' | 'like' | 'retweet' | 'comment';
type Platform = 'x' | 'telegram' | 'discord';

// 任务属性定义
interface TaskProps {
  id: number | string;
  platform: Platform;
  action: TaskAction;
  reward: number;
  completed: number;
  total: number;
}

// 平台图标映射
const platformIcons = {
  x: <FaTwitter className="w-5 h-5 text-blue-400" />,
  telegram: <FaTelegram className="w-5 h-5 text-cyan-400" />,
  discord: <FaDiscord className="w-5 h-5 text-purple-400" />,
};

// 行动图标映射
const actionIcons = {
  follow: <BiUserPlus className="w-5 h-5" />,
  like: <BiLike className="w-5 h-5" />,
  retweet: <RiRepeatFill className="w-5 h-5" />,
  comment: <BiComment className="w-5 h-5" />,
};

// 行动文本映射
const actionText = {
  follow: '关注',
  like: '点赞',
  retweet: '转发',
  comment: '评论',
};

// 平台文本映射
const platformText = {
  x: 'X (Twitter)',
  telegram: 'Telegram',
  discord: 'Discord',
};

const TaskCard = ({
  id,
  platform,
  action,
  reward,
  completed,
  total,
}: TaskProps) => {
  // 计算完成百分比
  const progress = (completed / total) * 100;
  
  // 确保ID是字符串格式
  const idString = id.toString();

  return (
    <div className="glass-card p-5 relative overflow-hidden group">
      {/* 背景装饰 */}
      <div className="absolute bottom-0 right-0 w-32 h-32 rounded-full blur-3xl opacity-10 bg-primary group-hover:opacity-20 transition-opacity"></div>

      {/* 平台标识 */}
      <div className="absolute top-4 right-4 w-9 h-9 flex items-center justify-center rounded-full bg-gray-800/70 border border-gray-700 shadow-lg group-hover:border-primary/50 transition-all duration-300">
        {platformIcons[platform]}
      </div>

      {/* 任务内容 */}
      <div className="flex items-start mb-5">
        <div className="p-2.5 rounded-lg bg-gradient-to-br from-gray-800 to-gray-900 shadow-md border border-gray-800 mr-4">
          <div className="text-primary group-hover:text-white transition-colors">
            {actionIcons[action]}
          </div>
        </div>
        <div>
          <h3 className="font-semibold text-lg">
            {platformText[platform]} {actionText[action]}任务
          </h3>
          <p className="text-sm text-gray-400 mt-1 flex items-center">
            <span className="inline-block w-2 h-2 rounded-full bg-primary/70 mr-2 animate-pulse"></span>
            任务ID: {idString.length > 8 ? `${idString.substring(0, 8)}...` : idString}
          </p>
        </div>
      </div>

      {/* 奖励显示 */}
      <div className="mb-5 bg-black/20 p-3 rounded-lg border border-gray-800">
        <div className="flex items-center">
          <span className="text-sm text-gray-300">奖励:</span>
          <span className="ml-2 text-xl text-primary font-bold">{reward}</span>
          <span className="ml-1 text-xs text-gray-400">小红花/人</span>
        </div>
      </div>

      {/* 进度条 */}
      <div className="mb-3">
        <div className="w-full h-2.5 bg-gray-800/70 rounded-full overflow-hidden backdrop-blur-sm">
          <div
            className="h-full bg-gradient-to-r from-primary to-secondary animate-pulse"
            style={{ width: `${progress}%` }}
          ></div>
        </div>
      </div>

      {/* 完成情况 */}
      <div className="flex justify-between text-sm mb-6">
        <span className="text-gray-400">
          {completed}/{total} 已完成
        </span>
        <span className="text-primary font-medium">
          {Math.round(progress)}%
        </span>
      </div>

      {/* 操作按钮 */}
      <div className="mt-auto">
        <button className="w-full py-2.5 px-4 rounded-md transition-all duration-300 flex items-center justify-center group-hover:shadow-md group-hover:shadow-primary/10 overflow-hidden relative">
          <span className="relative z-10 flex items-center">
            查看详情
            <HiOutlineChevronRight className="ml-1 w-4 h-4 transform group-hover:translate-x-1 transition-transform duration-300" />
          </span>
          <span className="absolute inset-0 bg-gradient-to-r from-primary/10 to-secondary/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></span>
          <span className="absolute inset-0 border border-gray-700 group-hover:border-primary/50 rounded-md transition-colors duration-300"></span>
        </button>
      </div>
    </div>
  );
};

export default TaskCard;
