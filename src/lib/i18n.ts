import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

export const defaultLocale = 'zh';
export const locales = ['en', 'zh'] as const;
export type Locale = typeof locales[number];

export const translations = {
  en: {
    common: {
      connect: 'Connect Wallet',
      disconnect: 'Disconnect',
      balance: 'Balance',
      exchange: 'Exchange',
      loading: 'Loading...',
      exchangeDescription: 'Exchange BNB for SM tokens with dynamic pricing',
      openMenu: 'Open Menu',
      closeMenu: 'Close Menu',
    },
    navigation: {
      home: 'Home',
      tasks: 'Tasks',
      socialTasks: 'Social Tasks',
      market: 'Market',
      assets: 'Assets',
      vault: 'Vault',
      referralSystem: 'Referral System',
    },
    home: {
      heroTitle: {
        line1: 'SocioMint Platform',
        line2: 'Social Mining Revolution'
      },
      heroSubtitle: 'Earn SM tokens through social media tasks and interactions',
      exploreTasks: 'Explore Tasks',
      visitMarket: 'Visit Market',
      stats: {
        verifications: 'Social Verifications',
        rewards: 'SM Rewards Distributed',
        tasks: 'Available Tasks'
      }
    },
    exchange: {
      title: 'Token Exchange',
      feeWarning: 'exchange fee'
    },
    presale: {
      title: 'SM Token Presale',
      subtitle: 'Join the SocioMint ecosystem early and get exclusive benefits'
    },
    socialTasks: {
      title: 'Social Tasks',
      subtitle: 'Complete social media tasks to earn red flowers and SM tokens',
      tabs: {
        tasks: 'Available Tasks',
        referrals: 'Referral System',
        rewards: 'Weekly Rewards'
      },
      sections: {
        availableTasks: 'Available Social Tasks',
        referralSystem: 'Referral System',
        weeklyRewards: 'Weekly Reward Status'
      },
      redFlower: {
        title: 'About Red Flowers',
        description: 'Red flowers are earned through social tasks and can be exchanged for SM tokens',
        earn: {
          title: 'Earn',
          description: 'Complete social tasks'
        },
        share: {
          title: 'Share',
          description: 'Invite friends to join'
        },
        exchange: {
          title: 'Exchange',
          description: 'Convert to SM tokens'
        }
      }
    },
    tasks: {
      title: 'Tasks',
      createTask: 'Create Task',
      connectWallet: 'Connect Wallet',
      connectWalletDescription: 'Please connect your wallet to participate in tasks',
      filters: 'Filters',
      noTasksFound: 'No tasks found',
      tabs: {
        exposure: 'Exposure Tasks',
        treasure: 'Treasure Box Tasks'
      },
      filters: {
        platform: 'Platform',
        action: 'Action',
        sortBy: 'Sort By',
        platformOptions: {
          all: 'All',
          x: 'X (Twitter)',
          telegram: 'Telegram',
          discord: 'Discord',
          instagram: 'Instagram',
          reddit: 'Reddit'
        },
        actionOptions: {
          all: 'All',
          follow: 'Follow',
          like: 'Like',
          retweet: 'Retweet',
          tweet: 'Tweet',
          join: 'Join',
          verify: 'Verify',
          comment: 'Comment',
          referral: 'Referral'
        },
        sortOptions: {
          rewardHighest: 'Highest Reward',
          rewardLowest: 'Lowest Completion',
          newest: 'Newest',
          oldest: 'Oldest'
        }
      }
    }
  },
  zh: {
    common: {
      connect: '连接钱包',
      disconnect: '断开连接',
      balance: '余额',
      exchange: '兑换',
      loading: '加载中...',
      exchangeDescription: '使用BNB兑换SM代币，采用动态定价机制',
      openMenu: '打开菜单',
      closeMenu: '关闭菜单',
    },
    navigation: {
      home: '首页',
      tasks: '任务',
      socialTasks: '社交任务',
      market: '市场',
      assets: '资产',
      vault: '金库',
      referralSystem: '推荐系统',
    },
    home: {
      heroTitle: {
        line1: 'SocioMint 社交挖矿平台',
        line2: '开启社交价值新时代'
      },
      heroSubtitle: '通过社交媒体任务和互动赚取SM代币',
      exploreTasks: '探索任务',
      visitMarket: '访问市场',
      stats: {
        verifications: '社交认证数量',
        rewards: 'SM奖励分发',
        tasks: '可用任务数'
      }
    },
    exchange: {
      title: '代币兑换',
      feeWarning: '兑换手续费'
    },
    presale: {
      title: 'SM代币预售',
      subtitle: '早期加入SocioMint生态系统，获得专属福利'
    },
    socialTasks: {
      title: '社交任务',
      subtitle: '完成社交媒体任务，赚取小红花和SM代币',
      tabs: {
        tasks: '可用任务',
        referrals: '推荐系统',
        rewards: '每周奖励'
      },
      sections: {
        availableTasks: '可用社交任务',
        referralSystem: '推荐系统',
        weeklyRewards: '每周奖励状态'
      },
      redFlower: {
        title: '关于小红花',
        description: '小红花通过完成社交任务获得，可以兑换SM代币',
        earn: {
          title: '赚取',
          description: '完成社交任务'
        },
        share: {
          title: '分享',
          description: '邀请朋友加入'
        },
        exchange: {
          title: '兑换',
          description: '转换为SM代币'
        }
      }
    },
    tasks: {
      title: '任务',
      createTask: '创建任务',
      connectWallet: '连接钱包',
      connectWalletDescription: '请连接钱包以参与任务',
      filters: '筛选',
      noTasksFound: '未找到任务',
      tabs: {
        exposure: '曝光任务',
        treasure: '宝箱任务'
      },
      filters: {
        platform: '平台',
        action: '动作',
        sortBy: '排序',
        platformOptions: {
          all: '全部',
          x: 'X (推特)',
          telegram: '电报',
          discord: 'Discord',
          instagram: 'Instagram',
          reddit: 'Reddit'
        },
        actionOptions: {
          all: '全部',
          follow: '关注',
          like: '点赞',
          retweet: '转发',
          tweet: '发推',
          join: '加入',
          verify: '验证',
          comment: '评论',
          referral: '推荐'
        },
        sortOptions: {
          rewardHighest: '奖励最高',
          rewardLowest: '完成度最低',
          newest: '最新',
          oldest: '最旧'
        }
      }
    }
  },
};

export function getTranslation(locale: Locale, key: string): string {
  const keys = key.split('.');
  let value: any = translations[locale];
  for (const k of keys) {
    value = value?.[k];
  }
  return value || key;
}

// 优化的i18n初始化 - 懒加载语言包
const initI18n = async () => {
  // 只加载默认语言，其他语言按需加载
  const defaultResources = {
    [defaultLocale]: { translation: translations[defaultLocale] }
  };

  await i18n
    .use(initReactI18next)
    .init({
      resources: defaultResources,
      lng: defaultLocale,
      fallbackLng: 'en',
      interpolation: {
        escapeValue: false,
      },
      detection: {
        order: ['localStorage', 'navigator'],
        caches: ['localStorage'],
      },
      // 性能优化配置
      react: {
        useSuspense: false, // 避免Suspense导致的闪烁
        bindI18n: 'languageChanged loaded',
        bindI18nStore: 'added removed',
        transEmptyNodeValue: '',
        transSupportBasicHtmlNodes: true,
        transKeepBasicHtmlNodesFor: ['br', 'strong', 'i'],
      },
      // 减少初始化时间
      initImmediate: false,
      load: 'languageOnly',
      preload: [defaultLocale],
    });
};

// 按需加载语言包
export const loadLanguage = async (locale: Locale) => {
  if (!i18n.hasResourceBundle(locale, 'translation')) {
    i18n.addResourceBundle(locale, 'translation', translations[locale]);
  }
  await i18n.changeLanguage(locale);
};

// 初始化i18n
if (typeof window !== 'undefined') {
  initI18n();
} else {
  // 服务器端渲染时的简化初始化
  i18n.use(initReactI18next).init({
    resources: {
      [defaultLocale]: { translation: translations[defaultLocale] }
    },
    lng: defaultLocale,
    fallbackLng: 'en',
    interpolation: {
      escapeValue: false,
    },
  });
}

export default i18n;
