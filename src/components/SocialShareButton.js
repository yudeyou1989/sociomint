import React, { useState } from 'react';
import { Button, Dropdown, message, Space, Tooltip, Modal, Input } from 'antd';
import { 
  ShareAltOutlined, 
  CopyOutlined, 
  TwitterOutlined, 
  FacebookOutlined,
  LinkedinOutlined,
  WeiboOutlined,
  QrcodeOutlined
} from '@ant-design/icons';
import useSocialShare from '../hooks/useSocialShare';
import { useTranslation } from 'react-i18next';
import QRCode from 'qrcode.react';

// Telegram图标
const TelegramIcon = ({ style }) => (
  <svg viewBox="0 0 24 24" height="1em" width="1em" fill="currentColor" style={style}>
    <path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm5.562 8.067l-1.597 7.55c-.124.547-.462.68-.937.422l-2.587-1.908-1.247 1.198c-.138.138-.253.253-.52.253l.186-2.623 4.76-4.298c.2-.186-.05-.29-.32-.1l-5.88 3.697-2.53-.789c-.55-.174-.56-.55.12-.81l9.873-3.802c.455-.174.856.106.68.681z" />
  </svg>
);

// WhatsApp图标
const WhatsAppIcon = ({ style }) => (
  <svg viewBox="0 0 24 24" height="1em" width="1em" fill="currentColor" style={style}>
    <path d="M12.031 6.172c-3.181 0-5.767 2.586-5.768 5.766-.001 1.298.38 2.27 1.019 3.287l-.582 2.128 2.182-.573c.978.58 1.911.928 3.145.929 3.178 0 5.767-2.587 5.768-5.766.001-3.187-2.575-5.77-5.764-5.771zm3.392 8.244c-.144.405-.837.774-1.17.824-.299.045-.677.063-1.092-.069-.252-.08-.575-.187-.988-.365-1.739-.751-2.874-2.502-2.961-2.617-.087-.116-.708-.94-.708-1.793s.448-1.273.607-1.446c.159-.173.346-.217.462-.217l.332.006c.106.005.249-.04.39.298.144.347.491 1.2.534 1.287.043.087.072.188.014.304-.058.116-.087.188-.173.289l-.26.304c-.087.086-.177.18-.076.354.101.174.449.741.964 1.201.662.591 1.221.774 1.394.86s.274.072.376-.036c.101-.108.433-.506.549-.68.116-.173.231-.145.39-.087s1.011.477 1.184.564c.173.087.288.131.332.202.043.72.043.433-.101.824z" />
    <path d="M12 0C5.373 0 0 5.373 0 12c0 2.172.576 4.208 1.581 5.968L0 24l6.09-1.562C7.814 23.447 9.862 24 12 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm0 22c-2.023 0-3.93-.52-5.583-1.438l-3.501.875.905-3.438C2.659 15.915 2 14.025 2 12 2 6.486 6.486 2 12 2s10 4.486 10 10-4.486 10-10 10z" />
  </svg>
);

// 微博图标
const WeiboIcon = () => (
  <svg viewBox="0 0 1024 1024" width="1em" height="1em" fill="currentColor">
    <path d="M851.4 590.193c-22.196-66.233-90.385-90.422-105.912-91.863-15.523-1.442-29.593-9.94-19.295-27.505 10.302-17.566 29.304-68.684-7.248-104.681-36.564-36.564-116.512-22.462-173.094 0.866-56.434 23.327-53.39 7.055-51.65-8.925 1.89-16.848 32.355-111.02-60.791-122.395C311.395 220.86 154.85 370.754 99.572 457.15 16 587.607 29.208 675.873 29.208 675.873h0.58c10.009 121.819 190.787 218.869 412.328 218.869 190.5 0 350.961-71.853 398.402-169.478 0 0 0.143-0.433 0.575-1.156 4.938-10.506 8.71-21.168 11.035-32.254 6.668-26.205 11.755-64.215-0.728-101.66z m-436.7 251.27c-157.71 0-285.674-84.095-285.674-187.768 0-103.671 127.82-187.76 285.674-187.76 157.705 0 285.673 84.089 285.673 187.76 0 103.815-127.968 187.768-285.673 187.768z" />
    <path d="M803.096 425.327c2.896 1.298 5.945 1.869 8.994 1.869 8.993 0 17.7-5.328 21.323-14.112 5.95-13.964 8.993-28.793 8.993-44.205 0-62.488-51.208-113.321-114.181-113.321-15.379 0-30.32 3.022-44.396 8.926-11.755 4.896-17.263 18.432-12.335 30.24 4.933 11.662 18.572 17.134 30.465 12.238 8.419-3.46 17.268-5.33 26.41-5.33 37.431 0 67.752 30.241 67.752 67.247 0 9.068-1.735 17.857-5.369 26.202a22.832 22.832 0 0 0 12.335 30.236l0.01 0.01z" />
    <path d="M726.922 114.157c-25.969 0-51.65 3.744-76.315 10.942-18.423 5.472-28.868 24.622-23.5 42.91 5.509 18.29 24.804 28.657 43.237 23.329 18.855-5.616 38.453-8.438 56.578-8.438 114.185 0 206.95 91.94 206.95 205.038 0 18.798-2.836 37.946-8.42 56.178-5.508 18.290 4.79 37.588 23.212 43.053 3.342 1.014 6.817 1.442 10.159 1.442 14.943 0 28.725-9.648 33.37-24.48 7.547-24.906 11.462-50.826 11.462-76.193 0-151.73-123.477-274.43-276.167-274.43h-0.579z" />
    <path d="M388.294 534.47c-84.151 0-152.34 59.178-152.34 132.334 0 73.141 68.189 132.328 152.34 132.328 84.148 0 152.337-59.182 152.337-132.328 0-73.15-68.19-132.334-152.337-132.334zM338.53 752.763c-29.454 0-53.39-23.755-53.39-52.987 0-29.228 23.941-52.989 53.39-52.989 29.453 0 53.39 23.76 53.39 52.989 0 29.227-23.937 52.987-53.39 52.987z m99.82-95.465c-6.382 11.086-19.296 15.696-28.726 10.219-9.43-5.323-11.75-18.717-5.37-29.803 6.386-11.09 19.297-15.7 28.725-10.224 9.43 5.472 11.755 18.853 5.37 29.808z" />
  </svg>
);

/**
 * 社交分享按钮组件
 * @param {Object} props - 组件属性
 * @param {string} props.contentType - 内容类型，如'task'、'profile'
 * @param {string} props.contentId - 内容ID
 * @param {string} props.title - 分享标题
 * @param {string} props.description - 分享描述
 * @param {string} props.imageUrl - 分享图片URL
 * @param {string} props.url - 分享链接，默认为当前页面URL
 * @param {string[]} props.hashtags - 分享标签数组
 * @param {string} props.buttonType - 按钮类型，可选值：'primary'、'default'、'text'、'link'
 * @param {string} props.buttonSize - 按钮大小，可选值：'large'、'middle'、'small'
 * @param {string} props.buttonText - 按钮文本，为空则只显示图标
 * @param {string} props.buttonShape - 按钮形状，可选值：'default'、'circle'、'round'
 * @param {boolean} props.showCopyOption - 是否显示复制链接选项
 * @param {string} props.placement - 下拉菜单位置
 * @param {React.CSSProperties} props.style - 按钮样式
 * @returns {JSX.Element} 社交分享按钮组件
 */
const SocialShareButton = ({
  contentType = 'general',
  contentId,
  title,
  description,
  imageUrl,
  url,
  hashtags,
  buttonType = 'default',
  buttonSize = 'middle',
  buttonText = '',
  buttonShape = 'default',
  showCopyOption = true,
  placement = 'bottomRight',
  style = {},
}) => {
  const { t } = useTranslation();
  const [showQRModal, setShowQRModal] = useState(false);
  
  // 使用社交分享钩子
  const {
    shareToPlaftorm,
    copyShareLink,
    isSharing,
    error,
    shortLink,
  } = useSocialShare({
    title,
    description,
    imageUrl,
    url,
    hashtags,
  });
  
  // 处理分享
  const handleShare = async (platform) => {
    try {
      if (platform === 'qrcode') {
        setShowQRModal(true);
        return;
      }
      
      if (platform === 'copy') {
        const success = await copyShareLink(contentType, contentId);
        if (success) {
          message.success(t('copySuccess', '链接已复制到剪贴板'));
        } else {
          message.error(t('copyFailed', '复制失败，请手动复制'));
        }
        return;
      }
      
      await shareToPlaftorm(platform, contentType, contentId);
      message.success(t('shareSuccess', '分享成功！'));
    } catch (error) {
      console.error('共享失败:', error);
      message.error(t('shareFailed', '分享失败，请稍后重试'));
    }
  };
  
  // 显示二维码模态框
  const showQRCodeModal = () => {
    setShowQRModal(true);
  };
  
  // 下拉菜单选项
  const menuItems = [
    {
      key: 'twitter',
      label: (
        <Space>
          <TwitterOutlined />
          {t('twitter', 'Twitter')}
        </Space>
      ),
      onClick: () => handleShare('twitter'),
    },
    {
      key: 'facebook',
      label: (
        <Space>
          <FacebookOutlined />
          {t('facebook', 'Facebook')}
        </Space>
      ),
      onClick: () => handleShare('facebook'),
    },
    {
      key: 'telegram',
      label: (
        <Space>
          <TelegramIcon />
          {t('telegram', 'Telegram')}
        </Space>
      ),
      onClick: () => handleShare('telegram'),
    },
    {
      key: 'linkedin',
      label: (
        <Space>
          <LinkedinOutlined />
          {t('linkedin', 'LinkedIn')}
        </Space>
      ),
      onClick: () => handleShare('linkedin'),
    },
    {
      key: 'weibo',
      label: (
        <Space>
          <WeiboIcon />
          {t('weibo', '微博')}
        </Space>
      ),
      onClick: () => handleShare('weibo'),
    },
    {
      key: 'whatsapp',
      label: (
        <Space>
          <WhatsAppIcon />
          {t('whatsapp', 'WhatsApp')}
        </Space>
      ),
      onClick: () => handleShare('whatsapp'),
    },
  ];
  
  // 添加复制链接选项
  if (showCopyOption) {
    menuItems.push({
      type: 'divider',
    });
    menuItems.push({
      key: 'copy',
      label: (
        <Space>
          <CopyOutlined />
          {t('copyLink', '复制链接')}
        </Space>
      ),
      onClick: () => handleShare('copy'),
    });
    menuItems.push({
      key: 'qrcode',
      label: (
        <Space>
          <QrcodeOutlined />
          {t('qrcode', '二维码')}
        </Space>
      ),
      onClick: () => handleShare('qrcode'),
    });
  }
  
  return (
    <>
      <Dropdown
        menu={{ items: menuItems }}
        placement={placement}
        trigger={['click']}
        disabled={isSharing}
      >
        <Tooltip title={t('share', '分享')}>
          <Button
            type={buttonType}
            size={buttonSize}
            shape={buttonShape}
            icon={<ShareAltOutlined />}
            loading={isSharing}
            style={style}
          >
            {buttonText}
          </Button>
        </Tooltip>
      </Dropdown>
      
      {/* 二维码模态框 */}
      <Modal
        title={t('scanQRCodeToShare', '扫描二维码分享')}
        open={showQRModal}
        onCancel={() => setShowQRModal(false)}
        footer={null}
        centered
      >
        <div style={{ textAlign: 'center', padding: '20px 0' }}>
          <QRCode value={shortLink || url || window.location.href} size={200} />
          <div style={{ marginTop: 16 }}>
            <Input.TextArea
              value={shortLink || url || window.location.href}
              autoSize={{ minRows: 2, maxRows: 3 }}
              readOnly
            />
            <Button
              type="primary"
              icon={<CopyOutlined />}
              onClick={() => {
                copyShareLink(contentType, contentId).then(success => {
                  if (success) {
                    message.success(t('copySuccess', '链接已复制到剪贴板'));
                  } else {
                    message.error(t('copyFailed', '复制失败，请手动复制'));
                  }
                });
              }}
              style={{ marginTop: 8 }}
            >
              {t('copyLink', '复制链接')}
            </Button>
          </div>
        </div>
      </Modal>
    </>
  );
};

export default SocialShareButton; 