import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from './useAuth';
import { useTranslation } from 'react-i18next';

/**
 * 社交分享钩子，提供多平台分享功能
 * @param {Object} options - 分享配置选项
 * @param {string} options.url - 分享链接，默认为当前页面URL
 * @param {string} options.title - 分享标题，默认为页面标题
 * @param {string} options.description - 分享描述
 * @param {string} options.imageUrl - 分享图片URL
 * @param {string[]} options.hashtags - 分享标签数组
 * @returns {Object} 分享函数和状态
 */
const useSocialShare = (options = {}) => {
  const { t } = useTranslation();
  const { user } = useAuth();
  
  // 分享状态
  const [shareUrl, setShareUrl] = useState('');
  const [shareTitle, setShareTitle] = useState('');
  const [shareImage, setShareImage] = useState('');
  const [shareDesc, setShareDesc] = useState('');
  const [shareHashtags, setShareHashtags] = useState([]);
  const [isSharing, setIsSharing] = useState(false);
  const [lastSharedPlatform, setLastSharedPlatform] = useState(null);
  const [error, setError] = useState(null);
  const [shortLink, setShortLink] = useState(null);
  const [shareCounts, setShareCounts] = useState({});
  
  // 初始化分享配置
  useEffect(() => {
    setShareUrl(options.url || window.location.href);
    setShareTitle(options.title || document.title);
    setShareImage(options.imageUrl || '');
    setShareDesc(options.description || '');
    
    if (options.hashtags) {
      if (Array.isArray(options.hashtags)) {
        setShareHashtags(options.hashtags);
      } else if (typeof options.hashtags === 'string') {
        setShareHashtags(options.hashtags.split(',').map(tag => tag.trim()));
      }
    }
  }, [options]);
  
  /**
   * 记录分享事件
   * @param {string} platform - 分享平台
   * @param {string} contentType - 内容类型
   * @param {string} contentId - 内容ID
   */
  const trackShareEvent = useCallback(async (platform, contentType, contentId) => {
    try {
      if (!user) return null;
      
      const { data, error } = await supabase
        .from('share_events')
        .insert({
          user_id: user.id,
          platform,
          content_type: contentType || 'general',
          content_id: contentId,
          url: shareUrl
        });
      
      if (error) throw error;
      return data;
    } catch (err) {
      console.error('分享事件跟踪失败:', err);
      return null;
    }
  }, [user, shareUrl]);
  
  /**
   * 生成Twitter分享URL
   * @returns {string} Twitter分享URL
   */
  const getTwitterShareUrl = useCallback(() => {
    const params = new URLSearchParams();
    params.append('url', shareUrl);
    params.append('text', shareTitle);
    
    if (shareHashtags.length > 0) {
      params.append('hashtags', shareHashtags.join(','));
    }
    
    return `https://twitter.com/intent/tweet?${params.toString()}`;
  }, [shareUrl, shareTitle, shareHashtags]);
  
  /**
   * 生成Facebook分享URL
   * @returns {string} Facebook分享URL
   */
  const getFacebookShareUrl = useCallback(() => {
    const params = new URLSearchParams();
    params.append('u', shareUrl);
    params.append('quote', shareTitle);
    
    return `https://www.facebook.com/sharer/sharer.php?${params.toString()}`;
  }, [shareUrl, shareTitle]);
  
  /**
   * 生成Telegram分享URL
   * @returns {string} Telegram分享URL
   */
  const getTelegramShareUrl = useCallback(() => {
    const params = new URLSearchParams();
    params.append('url', shareUrl);
    params.append('text', `${shareTitle}\n\n${shareDesc}`);
    
    return `https://t.me/share/url?${params.toString()}`;
  }, [shareUrl, shareTitle, shareDesc]);
  
  /**
   * 生成LinkedIn分享URL
   * @returns {string} LinkedIn分享URL
   */
  const getLinkedInShareUrl = useCallback(() => {
    const params = new URLSearchParams();
    params.append('url', shareUrl);
    params.append('title', shareTitle);
    params.append('summary', shareDesc);
    
    return `https://www.linkedin.com/shareArticle?mini=true&${params.toString()}`;
  }, [shareUrl, shareTitle, shareDesc]);
  
  /**
   * 生成微博分享URL
   * @returns {string} 微博分享URL
   */
  const getWeiboShareUrl = useCallback(() => {
    const params = new URLSearchParams();
    params.append('url', shareUrl);
    params.append('title', `${shareTitle}\n\n${shareDesc}`);
    
    if (shareImage) {
      params.append('pic', shareImage);
    }
    
    return `https://service.weibo.com/share/share.php?${params.toString()}`;
  }, [shareUrl, shareTitle, shareDesc, shareImage]);
  
  /**
   * 生成QQ分享URL
   * @returns {string} QQ分享URL
   */
  const getQQShareUrl = useCallback(() => {
    const params = new URLSearchParams();
    params.append('url', shareUrl);
    params.append('title', shareTitle);
    params.append('desc', shareDesc);
    
    if (shareImage) {
      params.append('pics', shareImage);
    }
    
    return `https://connect.qq.com/widget/shareqq/index.html?${params.toString()}`;
  }, [shareUrl, shareTitle, shareDesc, shareImage]);
  
  /**
   * 生成WhatsApp分享URL
   * @returns {string} WhatsApp分享URL
   */
  const getWhatsAppShareUrl = useCallback(() => {
    const text = `${shareTitle}\n${shareDesc}\n${shareUrl}`;
    return `https://wa.me/?text=${encodeURIComponent(text)}`;
  }, [shareUrl, shareTitle, shareDesc]);
  
  /**
   * 根据平台生成分享URL
   * @param {string} platform - 分享平台
   * @returns {string} 分享URL
   */
  const getShareUrl = useCallback((platform) => {
    switch (platform) {
      case 'twitter':
        return getTwitterShareUrl();
      case 'facebook':
        return getFacebookShareUrl();
      case 'telegram':
        return getTelegramShareUrl();
      case 'linkedin':
        return getLinkedInShareUrl();
      case 'weibo':
        return getWeiboShareUrl();
      case 'qq':
        return getQQShareUrl();
      case 'whatsapp':
        return getWhatsAppShareUrl();
      default:
        return shareUrl;
    }
  }, [
    getTwitterShareUrl,
    getFacebookShareUrl,
    getTelegramShareUrl,
    getLinkedInShareUrl,
    getWeiboShareUrl,
    getQQShareUrl,
    getWhatsAppShareUrl,
    shareUrl
  ]);
  
  /**
   * 分享到指定平台
   * @param {string} platform - 分享平台
   * @param {string} contentType - 内容类型
   * @param {string} contentId - 内容ID
   */
  const shareToPlaftorm = useCallback(async (platform, contentType, contentId) => {
    try {
      setIsSharing(true);
      setLastSharedPlatform(platform);
      
      const url = getShareUrl(platform);
      window.open(url, '_blank', 'width=600,height=400');
      
      // 记录分享事件
      await trackShareEvent(platform, contentType, contentId);
      
      return true;
    } catch (error) {
      console.error(`Failed to share to ${platform}:`, error);
      throw error;
    } finally {
      setIsSharing(false);
    }
  }, [getShareUrl, trackShareEvent]);
  
  /**
   * 复制分享链接
   * @param {string} contentType - 内容类型
   * @param {string} contentId - 内容ID
   * @returns {Promise<boolean>} 是否复制成功
   */
  const copyShareLink = useCallback(async (contentType, contentId) => {
    try {
      setIsSharing(true);
      
      // 生成短链接
      const shortUrl = await generateShortLink();
      
      // 复制链接到剪贴板
      await navigator.clipboard.writeText(shortUrl || shareUrl);
      
      // 记录分享事件
      await trackShareEvent('copy', contentType, contentId);
      
      return true;
    } catch (error) {
      console.error('Failed to copy share link:', error);
      return false;
    } finally {
      setIsSharing(false);
    }
  }, [shareUrl, trackShareEvent]);
  
  /**
   * 生成短链接
   * @param {string} longUrl - 原始URL
   * @returns {Promise<string>} 短链接
   */
  const generateShortLink = useCallback(async () => {
    try {
      const { data, error } = await supabase.rpc('generate_short_url', {
        long_url: shareUrl
      });
      
      if (error) throw error;
      setShortLink(data.short_url);
      return data.short_url;
    } catch (error) {
      console.error('Failed to generate short link:', error);
      return null;
    }
  }, [shareUrl]);
  
  /**
   * 获取分享次数
   * @param {string} contentType - 内容类型
   * @param {string} contentId - 内容ID
   * @returns {Promise<Object>} 各平台分享次数
   */
  const getShareCounts = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('share_events')
        .select('platform, count')
        .eq('url', shareUrl)
        .group('platform')
        .count();
      
      if (error) throw error;
      
      // 格式化结果
      const result = {};
      data.forEach(item => {
        result[item.platform] = parseInt(item.count);
      });
      
      setShareCounts(result);
      return result;
    } catch (error) {
      console.error('Failed to get share counts:', error);
      return {};
    }
  }, [shareUrl]);
  
  // 组件加载时生成短链接
  useEffect(() => {
    if (shareUrl) {
      generateShortLink();
      getShareCounts();
    }
  }, [shareUrl, generateShortLink, getShareCounts]);
  
  return {
    // 分享状态
    isSharing,
    lastSharedPlatform,
    
    // 分享配置
    shareUrl,
    shareTitle,
    shareDesc,
    shareImage,
    shareHashtags,
    
    // 分享方法
    shareToPlaftorm,
    copyShareLink,
    getShareUrl,
    generateShortLink,
    getShareCounts,
    
    // 辅助方法
    setShareUrl,
    setShareTitle,
    setShareDesc,
    setShareImage,
    setShareHashtags,
    
    // 新状态
    error,
    shortLink,
    shareCounts
  };
};

export default useSocialShare; 