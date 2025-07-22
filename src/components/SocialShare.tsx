import React, { useState } from 'react';
import {
  FaLink,
  FaQq,
  FaShareAlt
} from 'react-icons/fa';
import { toast } from 'react-hot-toast';

export interface SocialShareProps {
  /** 分享的标题 */
  title: string;
  /** 分享的URL, 默认为当前页面URL */
  url?: string;
  /** 分享的描述文本 */
  description?: string;
  /** 分享的图片URL */
  imageUrl?: string;
  /** 分享的标签 (用于Twitter等) */
  tags?: string[];
  /** 通过hashtag列表 (用于Twitter等) */
  hashtags?: string[];
  /** 自定义分享按钮样式 */
  buttonClassName?: string;
  /** 显示为下拉菜单 */
  dropdown?: boolean;
  /** 显示的平台列表, 不传则显示所有支持的平台 */
  platforms?: ('twitter' | 'facebook' | 'telegram' | 'linkedin' | 'reddit' | 'weibo' | 'qq')[];
  /** 自定义事件跟踪回调 */
  onShare?: (platform: string) => void;
}

/**
 * 社交分享组件
 * 支持多平台分享，可以自定义样式和显示的平台
 */
const SocialShare: React.FC<SocialShareProps> = ({ 
  title,
  url = typeof window !== 'undefined' ? window.location.href : '',
  description = '',
  imageUrl = '',
  tags = [],
  hashtags = [],
  buttonClassName = 'w-10 h-10 flex items-center justify-center rounded-full transition-colors',
  dropdown = false,
  platforms,
  onShare
}) => {
  const [isOpen, setIsOpen] = useState<boolean>(false);

  // 构建Twitter分享URL
  const getTwitterShareUrl = () => {
    const params = new URLSearchParams();
    params.append('text', `${title}\n\n${description}`);
    params.append('url', url);
    
    if (hashtags.length > 0) {
      params.append('hashtags', hashtags.join(','));
    }
    
    return `https://twitter.com/intent/tweet?${params.toString()}`;
  };

  // 构建Facebook分享URL
  const getFacebookShareUrl = () => {
    const params = new URLSearchParams();
    params.append('u', url);
    params.append('quote', title);
    
    return `https://www.facebook.com/sharer/sharer.php?${params.toString()}`;
  };

  // 构建Telegram分享URL
  const getTelegramShareUrl = () => {
    const params = new URLSearchParams();
    params.append('url', url);
    params.append('text', `${title}\n\n${description}`);
    
    return `https://t.me/share/url?${params.toString()}`;
  };

  // 构建LinkedIn分享URL
  const getLinkedinShareUrl = () => {
    const params = new URLSearchParams();
    params.append('url', url);
    params.append('title', title);
    params.append('summary', description);
    
    return `https://www.linkedin.com/shareArticle?mini=true&${params.toString()}`;
  };

  // 构建Reddit分享URL
  const getRedditShareUrl = () => {
    const params = new URLSearchParams();
    params.append('url', url);
    params.append('title', title);
    
    return `https://www.reddit.com/submit?${params.toString()}`;
  };

  // 构建微博分享URL
  const getWeiboShareUrl = () => {
    const params = new URLSearchParams();
    params.append('url', url);
    params.append('title', `${title}\n\n${description}`);
    
    if (imageUrl) {
      params.append('pic', imageUrl);
    }
    
    return `https://service.weibo.com/share/share.php?${params.toString()}`;
  };

  // 构建QQ分享URL
  const getQQShareUrl = () => {
    const params = new URLSearchParams();
    params.append('url', url);
    params.append('title', title);
    params.append('desc', description);
    
    if (imageUrl) {
      params.append('pics', imageUrl);
    }
    
    return `https://connect.qq.com/widget/shareqq/index.html?${params.toString()}`;
  };

  // 复制链接到剪贴板
  const copyToClipboard = () => {
    navigator.clipboard.writeText(url)
      .then(() => {
        toast.success('链接已复制到剪贴板');
      })
      .catch(() => {
        toast.error('复制失败，请手动复制');
      });

    // 触发分享事件
    onShare?.('copy');
  };

  // 处理分享点击事件
  const handleShareClick = (platform: string, shareUrl: string) => {
    // 打开分享窗口
    window.open(shareUrl, '_blank', 'width=600,height=600');
    
    // 触发分享事件跟踪
    onShare?.(platform);
    
    // 如果是下拉菜单，关闭菜单
    if (dropdown) {
      setIsOpen(false);
    }
  };

  // 定义支持的平台列表
  const allPlatforms = [
    {
      id: 'twitter',
      name: 'Twitter',
      icon: "🐦",
      color: 'hover:text-blue-400 hover:bg-blue-400/10',
      getUrl: getTwitterShareUrl
    },
    {
      id: 'facebook',
      name: 'Facebook',
      icon: "📘",
      color: 'hover:text-blue-600 hover:bg-blue-600/10',
      getUrl: getFacebookShareUrl
    },
    {
      id: 'telegram',
      name: 'Telegram',
      icon: "📱",
      color: 'hover:text-blue-500 hover:bg-blue-500/10',
      getUrl: getTelegramShareUrl
    },
    {
      id: 'linkedin',
      name: 'LinkedIn',
      icon: "💼",
      color: 'hover:text-blue-700 hover:bg-blue-700/10',
      getUrl: getLinkedinShareUrl
    },
    {
      id: 'reddit',
      name: 'Reddit',
      icon: "🔴",
      color: 'hover:text-orange-600 hover:bg-orange-600/10',
      getUrl: getRedditShareUrl
    },
    {
      id: 'weibo',
      name: '微博',
      icon: "🌐",
      color: 'hover:text-red-600 hover:bg-red-600/10',
      getUrl: getWeiboShareUrl
    },
    { 
      id: 'qq', 
      name: 'QQ', 
      icon: <FaQq />, 
      color: 'hover:text-blue-500 hover:bg-blue-500/10',
      getUrl: getQQShareUrl 
    }
  ];

  // 根据传入的platforms筛选要显示的平台
  const filteredPlatforms = platforms 
    ? allPlatforms.filter(p => platforms.includes(p.id as any)) 
    : allPlatforms;

  // 渲染普通模式的分享按钮列表
  if (!dropdown) {
    return (
      <div className="flex flex-wrap gap-2">
        {filteredPlatforms.map(platform => (
          <button
            key={platform.id}
            className={`${buttonClassName} ${platform.color}`}
            onClick={() => handleShareClick(platform.id, platform.getUrl())}
            aria-label={`分享到${platform.name}`}
            title={`分享到${platform.name}`}
          >
            {platform.icon}
          </button>
        ))}
        <button
          className={`${buttonClassName} hover:text-gray-300 hover:bg-gray-300/10`}
          onClick={copyToClipboard}
          aria-label="复制链接"
          title="复制链接"
        >
          <FaLink />
        </button>
      </div>
    );
  }

  // 渲染下拉菜单模式
  return (
    <div className="relative">
      <button
        className={`${buttonClassName} hover:text-blue-500 hover:bg-blue-500/10`}
        onClick={() => setIsOpen(!isOpen)}
        aria-label="分享"
        title="分享"
      >
        <FaShareAlt />
      </button>
      
      {isOpen && (
        <>
          {/* 点击外部关闭下拉菜单的遮罩 */}
          <div 
            className="fixed inset-0 z-10" 
            onClick={() => setIsOpen(false)}
          />
          
          {/* 下拉菜单内容 */}
          <div className="absolute right-0 mt-2 py-2 w-48 bg-gray-800 rounded-md shadow-xl z-20 border border-gray-700">
            {filteredPlatforms.map(platform => (
              <button
                key={platform.id}
                className={`w-full text-left px-4 py-2 flex items-center gap-3 hover:bg-gray-700 transition-colors`}
                onClick={() => handleShareClick(platform.id, platform.getUrl())}
              >
                <span className={platform.color.split(' ')[0]}>
                  {platform.icon}
                </span>
                <span>{platform.name}</span>
              </button>
            ))}
            <button
              className="w-full text-left px-4 py-2 flex items-center gap-3 hover:bg-gray-700 transition-colors"
              onClick={copyToClipboard}
            >
              <span className="text-gray-400">
                <FaLink />
              </span>
              <span>复制链接</span>
            </button>
          </div>
        </>
      )}
    </div>
  );
};

export default SocialShare; 