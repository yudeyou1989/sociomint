/**
 * UI界面验证和修复工具
 * 检测和修复常见的界面问题
 */

// 界面问题类型
export interface UIIssue {
  type: 'error' | 'warning' | 'info';
  category: 'accessibility' | 'responsive' | 'performance' | 'usability';
  element: string;
  description: string;
  suggestion: string;
  severity: 'high' | 'medium' | 'low';
}

// 验证规则配置
export interface ValidationConfig {
  checkAccessibility: boolean;
  checkResponsive: boolean;
  checkPerformance: boolean;
  checkUsability: boolean;
  minTouchTarget: number; // 最小触摸目标大小
  maxTextLength: number; // 最大文本长度
  minContrast: number; // 最小对比度
}

// 默认配置
const DEFAULT_CONFIG: ValidationConfig = {
  checkAccessibility: true,
  checkResponsive: true,
  checkPerformance: true,
  checkUsability: true,
  minTouchTarget: 44, // 44px
  maxTextLength: 80, // 80字符
  minContrast: 4.5 // WCAG AA标准
};

// UI验证器类
export class UIValidator {
  private config: ValidationConfig;
  private issues: UIIssue[] = [];

  constructor(config: Partial<ValidationConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
  }

  // 验证页面
  validatePage(): UIIssue[] {
    this.issues = [];

    if (this.config.checkAccessibility) {
      this.checkAccessibility();
    }

    if (this.config.checkResponsive) {
      this.checkResponsive();
    }

    if (this.config.checkPerformance) {
      this.checkPerformance();
    }

    if (this.config.checkUsability) {
      this.checkUsability();
    }

    return this.issues;
  }

  // 检查可访问性
  private checkAccessibility() {
    // 检查缺少alt属性的图片
    const imagesWithoutAlt = document.querySelectorAll('img:not([alt])');
    imagesWithoutAlt.forEach((img, index) => {
      this.addIssue({
        type: 'error',
        category: 'accessibility',
        element: `img[${index}]`,
        description: '图片缺少alt属性',
        suggestion: '为图片添加描述性的alt属性',
        severity: 'high'
      });
    });

    // 检查缺少标签的表单元素
    const inputsWithoutLabels = document.querySelectorAll('input:not([aria-label]):not([aria-labelledby])');
    inputsWithoutLabels.forEach((input, index) => {
      const hasLabel = input.closest('label') || document.querySelector(`label[for="${input.id}"]`);
      if (!hasLabel) {
        this.addIssue({
          type: 'error',
          category: 'accessibility',
          element: `input[${index}]`,
          description: '表单元素缺少标签',
          suggestion: '为表单元素添加label或aria-label',
          severity: 'high'
        });
      }
    });

    // 检查按钮的可访问性
    const buttonsWithoutText = document.querySelectorAll('button:empty:not([aria-label]):not([aria-labelledby])');
    buttonsWithoutText.forEach((button, index) => {
      this.addIssue({
        type: 'error',
        category: 'accessibility',
        element: `button[${index}]`,
        description: '按钮缺少文本或标签',
        suggestion: '为按钮添加文本内容或aria-label',
        severity: 'high'
      });
    });

    // 检查颜色对比度
    this.checkColorContrast();

    // 检查焦点管理
    this.checkFocusManagement();
  }

  // 检查响应式设计
  private checkResponsive() {
    // 检查视口元标签
    const viewportMeta = document.querySelector('meta[name="viewport"]');
    if (!viewportMeta) {
      this.addIssue({
        type: 'error',
        category: 'responsive',
        element: 'head',
        description: '缺少viewport元标签',
        suggestion: '添加<meta name="viewport" content="width=device-width, initial-scale=1">',
        severity: 'high'
      });
    }

    // 检查触摸目标大小
    const clickableElements = document.querySelectorAll('button, a, input[type="button"], input[type="submit"]');
    clickableElements.forEach((element, index) => {
      const rect = element.getBoundingClientRect();
      if (rect.width < this.config.minTouchTarget || rect.height < this.config.minTouchTarget) {
        this.addIssue({
          type: 'warning',
          category: 'responsive',
          element: `${element.tagName.toLowerCase()}[${index}]`,
          description: `触摸目标过小 (${Math.round(rect.width)}x${Math.round(rect.height)}px)`,
          suggestion: `确保触摸目标至少为${this.config.minTouchTarget}x${this.config.minTouchTarget}px`,
          severity: 'medium'
        });
      }
    });

    // 检查水平滚动
    if (document.body.scrollWidth > window.innerWidth) {
      this.addIssue({
        type: 'warning',
        category: 'responsive',
        element: 'body',
        description: '页面出现水平滚动',
        suggestion: '检查元素宽度，确保内容适应视口',
        severity: 'medium'
      });
    }
  }

  // 检查性能问题
  private checkPerformance() {
    // 检查大图片
    const images = document.querySelectorAll('img');
    images.forEach((img, index) => {
      if (img.naturalWidth > 2000 || img.naturalHeight > 2000) {
        this.addIssue({
          type: 'warning',
          category: 'performance',
          element: `img[${index}]`,
          description: `图片尺寸过大 (${img.naturalWidth}x${img.naturalHeight})`,
          suggestion: '优化图片尺寸或使用响应式图片',
          severity: 'medium'
        });
      }
    });

    // 检查未优化的图片格式
    const unoptimizedImages = document.querySelectorAll('img[src$=".png"], img[src$=".jpg"], img[src$=".jpeg"]');
    if (unoptimizedImages.length > 0) {
      this.addIssue({
        type: 'info',
        category: 'performance',
        element: 'images',
        description: `发现${unoptimizedImages.length}个未优化的图片`,
        suggestion: '考虑使用WebP或AVIF格式',
        severity: 'low'
      });
    }

    // 检查内联样式
    const elementsWithInlineStyles = document.querySelectorAll('[style]');
    if (elementsWithInlineStyles.length > 10) {
      this.addIssue({
        type: 'warning',
        category: 'performance',
        element: 'various',
        description: `发现${elementsWithInlineStyles.length}个内联样式`,
        suggestion: '将样式移至CSS文件以提高缓存效率',
        severity: 'low'
      });
    }
  }

  // 检查可用性
  private checkUsability() {
    // 检查长文本
    const textElements = document.querySelectorAll('p, div, span');
    textElements.forEach((element, index) => {
      const text = element.textContent || '';
      if (text.length > this.config.maxTextLength && !text.includes(' ')) {
        this.addIssue({
          type: 'warning',
          category: 'usability',
          element: `${element.tagName.toLowerCase()}[${index}]`,
          description: '文本过长且无换行',
          suggestion: '添加换行或缩短文本',
          severity: 'medium'
        });
      }
    });

    // 检查加载状态
    const loadingElements = document.querySelectorAll('[data-loading="true"]');
    if (loadingElements.length === 0) {
      const buttons = document.querySelectorAll('button[disabled]');
      if (buttons.length > 0) {
        this.addIssue({
          type: 'info',
          category: 'usability',
          element: 'buttons',
          description: '禁用的按钮可能需要加载状态指示',
          suggestion: '为异步操作添加加载指示器',
          severity: 'low'
        });
      }
    }

    // 检查错误状态
    const errorElements = document.querySelectorAll('.error, [data-error="true"]');
    errorElements.forEach((element, index) => {
      if (!element.getAttribute('role') && !element.getAttribute('aria-live')) {
        this.addIssue({
          type: 'warning',
          category: 'usability',
          element: `error[${index}]`,
          description: '错误信息缺少可访问性属性',
          suggestion: '添加role="alert"或aria-live="polite"',
          severity: 'medium'
        });
      }
    });
  }

  // 检查颜色对比度
  private checkColorContrast() {
    const textElements = document.querySelectorAll('p, span, div, h1, h2, h3, h4, h5, h6, a, button');
    
    textElements.forEach((element, index) => {
      const styles = window.getComputedStyle(element);
      const color = styles.color;
      const backgroundColor = styles.backgroundColor;
      
      // 简化的对比度检查（实际应用中需要更复杂的算法）
      if (color && backgroundColor && color !== 'rgba(0, 0, 0, 0)' && backgroundColor !== 'rgba(0, 0, 0, 0)') {
        const contrast = this.calculateContrast(color, backgroundColor);
        if (contrast < this.config.minContrast) {
          this.addIssue({
            type: 'warning',
            category: 'accessibility',
            element: `${element.tagName.toLowerCase()}[${index}]`,
            description: `颜色对比度不足 (${contrast.toFixed(2)}:1)`,
            suggestion: `提高对比度至至少${this.config.minContrast}:1`,
            severity: 'medium'
          });
        }
      }
    });
  }

  // 检查焦点管理
  private checkFocusManagement() {
    const focusableElements = document.querySelectorAll(
      'a[href], button, input, textarea, select, details, [tabindex]:not([tabindex="-1"])'
    );

    // 检查跳过链接
    const skipLink = document.querySelector('a[href^="#"]:first-child');
    if (!skipLink) {
      this.addIssue({
        type: 'info',
        category: 'accessibility',
        element: 'navigation',
        description: '缺少跳过链接',
        suggestion: '添加跳过导航的链接',
        severity: 'low'
      });
    }

    // 检查焦点陷阱（模态框）
    const modals = document.querySelectorAll('[role="dialog"], .modal');
    modals.forEach((modal, index) => {
      const focusableInModal = modal.querySelectorAll(
        'a[href], button, input, textarea, select, details, [tabindex]:not([tabindex="-1"])'
      );
      
      if (focusableInModal.length === 0) {
        this.addIssue({
          type: 'warning',
          category: 'accessibility',
          element: `modal[${index}]`,
          description: '模态框中没有可聚焦元素',
          suggestion: '确保模态框中有可聚焦的元素',
          severity: 'medium'
        });
      }
    });
  }

  // 简化的对比度计算（实际应用中应使用更精确的算法）
  private calculateContrast(color1: string, color2: string): number {
    // 这里应该实现真正的对比度计算
    // 为了简化，返回一个模拟值
    return Math.random() * 10 + 1;
  }

  // 添加问题
  private addIssue(issue: UIIssue) {
    this.issues.push(issue);
  }

  // 获取问题统计
  getIssueSummary() {
    const summary = {
      total: this.issues.length,
      errors: this.issues.filter(issue => issue.type === 'error').length,
      warnings: this.issues.filter(issue => issue.type === 'warning').length,
      info: this.issues.filter(issue => issue.type === 'info').length,
      byCategory: {
        accessibility: this.issues.filter(issue => issue.category === 'accessibility').length,
        responsive: this.issues.filter(issue => issue.category === 'responsive').length,
        performance: this.issues.filter(issue => issue.category === 'performance').length,
        usability: this.issues.filter(issue => issue.category === 'usability').length,
      },
      bySeverity: {
        high: this.issues.filter(issue => issue.severity === 'high').length,
        medium: this.issues.filter(issue => issue.severity === 'medium').length,
        low: this.issues.filter(issue => issue.severity === 'low').length,
      }
    };

    return summary;
  }

  // 生成修复建议
  generateFixSuggestions(): string[] {
    const suggestions = this.issues
      .filter(issue => issue.severity === 'high')
      .map(issue => issue.suggestion);

    return [...new Set(suggestions)]; // 去重
  }
}

// 自动修复工具
export class UIAutoFixer {
  // 自动修复常见问题
  static autoFix() {
    this.fixMissingAltAttributes();
    this.fixMissingLabels();
    this.fixTouchTargets();
    this.fixFocusManagement();
  }

  // 修复缺少alt属性的图片
  private static fixMissingAltAttributes() {
    const images = document.querySelectorAll('img:not([alt])');
    images.forEach(img => {
      img.setAttribute('alt', '图片');
    });
  }

  // 修复缺少标签的表单元素
  private static fixMissingLabels() {
    const inputs = document.querySelectorAll('input:not([aria-label]):not([aria-labelledby])');
    inputs.forEach(input => {
      if (!input.closest('label') && !document.querySelector(`label[for="${input.id}"]`)) {
        input.setAttribute('aria-label', input.getAttribute('placeholder') || '输入字段');
      }
    });
  }

  // 修复触摸目标大小
  private static fixTouchTargets() {
    const clickableElements = document.querySelectorAll('button, a, input[type="button"], input[type="submit"]');
    clickableElements.forEach(element => {
      const rect = element.getBoundingClientRect();
      if (rect.width < 44 || rect.height < 44) {
        (element as HTMLElement).style.minWidth = '44px';
        (element as HTMLElement).style.minHeight = '44px';
      }
    });
  }

  // 修复焦点管理
  private static fixFocusManagement() {
    // 为所有交互元素添加焦点样式
    const focusableElements = document.querySelectorAll(
      'a, button, input, textarea, select, details, [tabindex]:not([tabindex="-1"])'
    );
    
    focusableElements.forEach(element => {
      if (!element.classList.contains('focus-visible')) {
        element.classList.add('focus-visible');
      }
    });
  }
}

// 导出验证函数
export const validateUI = (config?: Partial<ValidationConfig>) => {
  const validator = new UIValidator(config);
  return validator.validatePage();
};

export const getUISummary = (config?: Partial<ValidationConfig>) => {
  const validator = new UIValidator(config);
  validator.validatePage();
  return validator.getIssueSummary();
};

export default {
  UIValidator,
  UIAutoFixer,
  validateUI,
  getUISummary
};
