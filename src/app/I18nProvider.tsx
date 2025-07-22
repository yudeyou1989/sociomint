'use client';

import { ReactNode } from 'react';

interface I18nProviderProps {
  children: ReactNode;
}

export function I18nProvider({ children }: I18nProviderProps) {
  // 简化的国际化提供者，避免构建时的依赖问题
  return <>{children}</>;
}