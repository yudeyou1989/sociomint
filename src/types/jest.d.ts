/// <reference types="jest" />

declare global {
  namespace jest {
    interface Mock<T = any, Y extends any[] = any> {
      (...args: Y): T;
      mockReturnValue(value: T): this;
      mockResolvedValue(value: T): this;
      mockImplementation(fn?: (...args: Y) => T): this;
      mockImplementationOnce(fn?: (...args: Y) => T): this;
      mockReturnValueOnce(value: T): this;
      mockResolvedValueOnce(value: T): this;
      mockRejectedValue(value: any): this;
      mockRejectedValueOnce(value: any): this;
      mockClear(): this;
      mockReset(): this;
      mockRestore(): void;
    }

    interface Matchers<R> {
      toBeInTheDocument(): R;
      toHaveClass(className: string): R;
      toHaveAttribute(attr: string, value?: string): R;
      toHaveTextContent(text: string | RegExp): R;
      toBeVisible(): R;
      toBeDisabled(): R;
      toBeEnabled(): R;
      toHaveValue(value: string | number): R;
    }
  }

  const jest: {
    fn<T extends (...args: any[]) => any>(implementation?: T): jest.Mock<ReturnType<T>, Parameters<T>>;
    mock(moduleName: string, factory?: () => any, options?: any): any;
    clearAllMocks(): void;
    resetAllMocks(): void;
    restoreAllMocks(): void;
    requireActual(moduleName: string): any;
    spyOn<T extends {}, M extends keyof T>(object: T, method: M): jest.Mock;
  };

  const expect: {
    (actual: any): jest.Matchers<any>;
    any(constructor: any): any;
    anything(): any;
    arrayContaining(array: any[]): any;
    objectContaining(object: any): any;
    stringContaining(string: string): any;
    stringMatching(regexp: RegExp | string): any;
  };

  const describe: (name: string, fn: () => void) => void;
  const it: (name: string, fn: () => void | Promise<void>) => void;
  const test: (name: string, fn: () => void | Promise<void>) => void;
  const beforeEach: (fn: () => void | Promise<void>) => void;
  const afterEach: (fn: () => void | Promise<void>) => void;
  const beforeAll: (fn: () => void | Promise<void>) => void;
  const afterAll: (fn: () => void | Promise<void>) => void;
}

export {};
