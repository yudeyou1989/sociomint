const baseConfig = require('./jest.config.js');

module.exports = {
  ...baseConfig,
  
  // CI 环境特定配置
  ci: true,
  
  // 覆盖率配置
  collectCoverage: true,
  coverageDirectory: 'coverage',
  coverageReporters: [
    'text',
    'lcov',
    'html',
    'json-summary',
    'cobertura'
  ],
  
  // 覆盖率阈值
  coverageThreshold: {
    global: {
      branches: 70,
      functions: 70,
      lines: 75,
      statements: 75
    },
    // 特定文件的覆盖率要求
    './src/utils/': {
      branches: 80,
      functions: 90,
      lines: 90,
      statements: 90
    },
    './src/components/': {
      branches: 70,
      functions: 75,
      lines: 75,
      statements: 75
    }
  },
  
  // 测试结果报告
  reporters: [
    'default',
    ['jest-junit', {
      outputDirectory: './test-results',
      outputName: 'junit.xml',
      classNameTemplate: '{classname}',
      titleTemplate: '{title}',
      ancestorSeparator: ' › ',
      usePathForSuiteName: true
    }],
    ['jest-html-reporters', {
      publicPath: './test-results',
      filename: 'report.html',
      expand: true
    }]
  ],
  
  // 性能配置
  maxWorkers: '50%',
  
  // 超时配置
  testTimeout: 30000,
  
  // 缓存配置
  cache: false,
  
  // 详细输出
  verbose: true,
  
  // 错误时继续运行
  bail: false,
  
  // 强制退出
  forceExit: true,
  
  // 检测打开的句柄
  detectOpenHandles: true,
  
  // 检测泄漏
  detectLeaks: true,
  
  // 环境变量
  setupFilesAfterEnv: [
    '<rootDir>/src/setupTests.ts',
    '<rootDir>/src/setupTestsCI.ts'
  ]
};
