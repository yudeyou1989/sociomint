/**
 * React组件类型修复
 * 解决常见的React和第三方库类型问题
 */

import React from 'react';

// 修复React.FC类型问题
declare module 'react' {
  interface FunctionComponent<P = {}> {
    (props: P, context?: any): ReactElement<any, any> | null;
    propTypes?: WeakValidationMap<P> | undefined;
    contextTypes?: ValidationMap<any> | undefined;
    defaultProps?: Partial<P> | undefined;
    displayName?: string | undefined;
  }
}

// 修复事件处理器类型
export interface EventHandlers {
  onClick?: (event: React.MouseEvent<HTMLElement>) => void;
  onSubmit?: (event: React.FormEvent<HTMLFormElement>) => void;
  onChange?: (event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => void;
  onFocus?: (event: React.FocusEvent<HTMLElement>) => void;
  onBlur?: (event: React.FocusEvent<HTMLElement>) => void;
  onKeyDown?: (event: React.KeyboardEvent<HTMLElement>) => void;
  onKeyUp?: (event: React.KeyboardEvent<HTMLElement>) => void;
  onMouseEnter?: (event: React.MouseEvent<HTMLElement>) => void;
  onMouseLeave?: (event: React.MouseEvent<HTMLElement>) => void;
}

// 修复常见的组件Props类型
export interface CommonProps {
  className?: string;
  style?: React.CSSProperties;
  children?: React.ReactNode;
  id?: string;
  'data-testid'?: string;
  'aria-label'?: string;
  'aria-describedby'?: string;
  role?: string;
}

// 修复表单相关类型
export interface FormFieldProps extends CommonProps {
  name?: string;
  value?: string | number;
  defaultValue?: string | number;
  placeholder?: string;
  disabled?: boolean;
  required?: boolean;
  readOnly?: boolean;
  autoComplete?: string;
  autoFocus?: boolean;
}

// 修复异步组件类型
export type AsyncComponent<P = {}> = React.ComponentType<P> & {
  preload?: () => Promise<void>;
};

// 修复Ref类型
export type RefType<T> = React.Ref<T> | React.RefObject<T> | React.MutableRefObject<T>;

// 修复Context类型
export interface ContextValue<T> {
  value: T;
  setValue?: (value: T) => void;
  loading?: boolean;
  error?: Error | null;
}

// 修复Hook返回类型
export interface UseStateReturn<T> {
  value: T;
  setValue: React.Dispatch<React.SetStateAction<T>>;
}

export interface UseEffectCleanup {
  (): void;
}

// 修复第三方库类型
declare module '@mui/material' {
  interface Theme {
    custom?: {
      [key: string]: any;
    };
  }
}

declare module 'react-icons' {
  export interface IconBaseProps {
    children?: React.ReactNode;
    size?: string | number;
    color?: string;
    title?: string;
    className?: string;
    style?: React.CSSProperties;
  }
}

// 修复Next.js类型
declare module 'next/router' {
  interface NextRouter {
    query: { [key: string]: string | string[] | undefined };
    pathname: string;
    asPath: string;
    push: (url: string, as?: string, options?: any) => Promise<boolean>;
    replace: (url: string, as?: string, options?: any) => Promise<boolean>;
    back: () => void;
    reload: () => void;
    prefetch: (url: string, asPath?: string, options?: any) => Promise<void>;
    beforePopState: (cb: (state: any) => boolean) => void;
    events: {
      on: (event: string, handler: (...args: any[]) => void) => void;
      off: (event: string, handler: (...args: any[]) => void) => void;
      emit: (event: string, ...args: any[]) => void;
    };
  }
}

// 修复Web3相关类型
declare module 'ethers' {
  interface BigNumber {
    toJSON(): string;
  }
}

declare module '@wagmi/core' {
  interface Config {
    chains: any[];
    connectors: any[];
    publicClient: any;
    webSocketPublicClient?: any;
  }
}

// 修复测试相关类型
declare module '@testing-library/react' {
  interface RenderOptions {
    wrapper?: React.ComponentType<any>;
    queries?: any;
    container?: HTMLElement;
    baseElement?: HTMLElement;
    hydrate?: boolean;
    legacyRoot?: boolean;
  }
}

// 修复环境变量类型
declare global {
  namespace NodeJS {
    interface ProcessEnv {
      [key: string]: string | undefined;
    }
  }
}

// 修复模块声明
declare module '*.svg' {
  const content: React.FunctionComponent<React.SVGAttributes<SVGElement>>;
  export default content;
}

declare module '*.png' {
  const content: string;
  export default content;
}

declare module '*.jpg' {
  const content: string;
  export default content;
}

declare module '*.jpeg' {
  const content: string;
  export default content;
}

declare module '*.gif' {
  const content: string;
  export default content;
}

declare module '*.webp' {
  const content: string;
  export default content;
}

declare module '*.ico' {
  const content: string;
  export default content;
}

declare module '*.css' {
  const content: { [className: string]: string };
  export default content;
}

declare module '*.scss' {
  const content: { [className: string]: string };
  export default content;
}

declare module '*.sass' {
  const content: { [className: string]: string };
  export default content;
}

declare module '*.module.css' {
  const content: { [className: string]: string };
  export default content;
}

declare module '*.module.scss' {
  const content: { [className: string]: string };
  export default content;
}

declare module '*.module.sass' {
  const content: { [className: string]: string };
  export default content;
}

// 导出所有类型
export * from './global';
export * from './components';
