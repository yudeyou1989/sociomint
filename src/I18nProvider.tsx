'use client';

import { ReactNode, useEffect } from 'react';
import i18n from 'i18next';
import { initReactI18next, I18nextProvider } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

// 导入翻译资源
const resources = {
  en: {
    translation: {
      common: {
        loading: 'Loading...',
        error: 'An error occurred',
        connect: 'Connect Wallet',
        disconnect: 'Disconnect',
        address: 'Address',
        balance: 'Balance',
        approve: 'Approve',
        viewOnExplorer: 'View on Explorer'
      },
      navigation: {
        home: 'Home',
        exchange: 'Exchange',
        verify: 'Verification',
        history: 'History'
      },
      footer: {
        copyright: '© 2025 SocioMint. All rights reserved.',
        terms: 'Terms of Service',
        privacy: 'Privacy Policy',
        contact: 'Contact Us'
      },
      exchange: {
        title: 'SM Token Exchange',
        marketInfo: 'Market Information',
        buyTokens: 'Buy SM Tokens',
        tokenName: 'Token Name',
        currentPrice: 'Current Price',
        nextRoundPrice: 'Next Round Price',
        tokensSold: 'Tokens Sold',
        tokensRemaining: 'Tokens Remaining',
        yourBalance: 'Your Balance',
        enterBNBAmount: 'Enter BNB Amount',
        youReceive: 'You Receive',
        rate: 'Exchange Rate',
        buyNow: 'Buy Now',
        processing: 'Processing...',
        connectWalletPrompt: 'Please connect your wallet to purchase tokens',
        verificationRequired: 'Your account is not verified. Verification is required to purchase tokens.',
        verifyNow: 'Verify Now',
        enterValidAmount: 'Please enter a valid amount',
        processingTransaction: 'Processing your transaction...',
        transactionSubmitted: 'Transaction submitted. Waiting for confirmation...',
        transactionSuccess: 'Transaction successful! You have purchased SM tokens.',
        transactionFailed: 'Transaction failed. Please try again.',
        viewTransaction: 'View Transaction on BscScan'
      },
      verification: {
        title: 'Account Verification',
        description: 'Complete verification to purchase SM tokens',
        status: 'Verification Status',
        notVerified: 'Not Verified',
        verified: 'Verified',
        pending: 'Pending',
        personalInfo: 'Personal Information',
        fullName: 'Full Name',
        idNumber: 'ID Number',
        email: 'Email Address',
        phone: 'Phone Number',
        submit: 'Submit Verification Request',
        submitting: 'Submitting...',
        success: 'Verification request submitted successfully!',
        failed: 'Failed to submit verification request. Please try again.',
        alreadyVerified: 'Your account is already verified.'
      }
    }
  },
  zh: {
    translation: {
      common: {
        loading: '加载中...',
        error: '发生错误',
        connect: '连接钱包',
        disconnect: '断开连接',
        address: '地址',
        balance: '余额',
        approve: '授权',
        viewOnExplorer: '在区块浏览器查看'
      },
      navigation: {
        home: '首页',
        exchange: '代币兑换',
        verify: '身份验证',
        history: '交易记录'
      },
      footer: {
        copyright: '© 2025 SocioMint. 保留所有权利。',
        terms: '服务条款',
        privacy: '隐私政策',
        contact: '联系我们'
      },
      exchange: {
        title: 'SM 代币交易所',
        marketInfo: '市场信息',
        buyTokens: '购买 SM 代币',
        tokenName: '代币名称',
        currentPrice: '当前价格',
        nextRoundPrice: '下一轮价格',
        tokensSold: '已售代币',
        tokensRemaining: '剩余代币',
        yourBalance: '您的余额',
        enterBNBAmount: '输入 BNB 数量',
        youReceive: '您将获得',
        rate: '兑换比率',
        buyNow: '立即购买',
        processing: '处理中...',
        connectWalletPrompt: '请连接您的钱包以购买代币',
        verificationRequired: '您的账户未验证。购买代币需要完成身份验证。',
        verifyNow: '立即验证',
        enterValidAmount: '请输入有效金额',
        processingTransaction: '正在处理您的交易...',
        transactionSubmitted: '交易已提交。等待确认...',
        transactionSuccess: '交易成功！您已购买 SM 代币。',
        transactionFailed: '交易失败。请重试。',
        viewTransaction: '在 BscScan 上查看交易'
      },
      verification: {
        title: '账户验证',
        description: '完成验证以购买 SM 代币',
        status: '验证状态',
        notVerified: '未验证',
        verified: '已验证',
        pending: '审核中',
        personalInfo: '个人信息',
        fullName: '姓名',
        idNumber: '身份证号',
        email: '电子邮箱',
        phone: '手机号码',
        submit: '提交验证申请',
        submitting: '提交中...',
        success: '验证申请提交成功！',
        failed: '提交验证申请失败。请重试。',
        alreadyVerified: '您的账户已验证。'
      }
    }
  }
};

// i18next配置
i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources,
    fallbackLng: 'zh', // 默认语言为中文
    debug: true,
    interpolation: {
      escapeValue: false // 允许在翻译中使用HTML
    },
    detection: {
      order: ['querystring', 'localStorage', 'navigator', 'cookie'],
      lookupQuerystring: 'lang',
      lookupCookie: 'i18next',
      lookupLocalStorage: 'i18nextLng',
      caches: ['localStorage']
    }
  });

export default function I18nProvider({ children }: { children: ReactNode }) {
  useEffect(() => {
    // 如果没有设置语言，默认使用中文
    if (!localStorage.getItem('i18nextLng')) {
      i18n.changeLanguage('zh');
    }
  }, []);

  return <I18nextProvider i18n={i18n}>{children}</I18nextProvider>;
}
