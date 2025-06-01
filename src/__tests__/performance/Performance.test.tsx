/**
 * 性能测试
 * 测试组件渲染性能和交互性能
 */

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

// 性能测试工具函数
const measureRenderTime = (renderFn: () => void): number => {
  const start = performance.now();
  renderFn();
  const end = performance.now();
  return end - start;
};

const measureAsyncOperation = async (asyncFn: () => Promise<void>): Promise<number> => {
  const start = performance.now();
  await asyncFn();
  const end = performance.now();
  return end - start;
};

// 模拟大数据量组件
const LargeDataComponent = ({ itemCount = 1000 }: { itemCount?: number }) => {
  const [items] = React.useState(() => 
    Array.from({ length: itemCount }, (_, i) => ({
      id: i,
      name: `Item ${i}`,
      value: Math.random() * 100,
    }))
  );

  return (
    <div data-testid="large-data-component">
      <h2>Large Data Component ({itemCount} items)</h2>
      <div data-testid="items-container">
        {items.map((item) => (
          <div key={item.id} data-testid={`item-${item.id}`}>
            {item.name}: {item.value.toFixed(2)}
          </div>
        ))}
      </div>
    </div>
  );
};

// 模拟复杂交互组件
const ComplexInteractionComponent = () => {
  const [count, setCount] = React.useState(0);
  const [items, setItems] = React.useState<string[]>([]);
  const [loading, setLoading] = React.useState(false);

  const handleAddItem = async () => {
    setLoading(true);
    // 模拟异步操作
    await new Promise(resolve => setTimeout(resolve, 10));
    setItems(prev => [...prev, `Item ${prev.length + 1}`]);
    setLoading(false);
  };

  const handleIncrement = () => {
    setCount(prev => prev + 1);
  };

  const handleBatchOperation = async () => {
    setLoading(true);
    // 模拟批量操作
    for (let i = 0; i < 100; i++) {
      setCount(prev => prev + 1);
      await new Promise(resolve => setTimeout(resolve, 1));
    }
    setLoading(false);
  };

  return (
    <div data-testid="complex-interaction-component">
      <div data-testid="counter">Count: {count}</div>
      <button onClick={handleIncrement} data-testid="increment-button">
        Increment
      </button>
      <button onClick={handleAddItem} data-testid="add-item-button" disabled={loading}>
        {loading ? 'Adding...' : 'Add Item'}
      </button>
      <button onClick={handleBatchOperation} data-testid="batch-operation-button" disabled={loading}>
        {loading ? 'Processing...' : 'Batch Operation'}
      </button>
      <div data-testid="items-list">
        {items.map((item, index) => (
          <div key={index} data-testid={`list-item-${index}`}>
            {item}
          </div>
        ))}
      </div>
    </div>
  );
};

// 模拟表单组件
const PerformanceForm = () => {
  const [formData, setFormData] = React.useState({
    name: '',
    email: '',
    message: '',
    category: '',
    priority: 'medium',
  });

  const [errors, setErrors] = React.useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  const handleChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // 清除错误
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};
    
    if (!formData.name.trim()) newErrors.name = 'Name is required';
    if (!formData.email.trim()) newErrors.email = 'Email is required';
    if (!formData.message.trim()) newErrors.message = 'Message is required';
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) return;
    
    setIsSubmitting(true);
    // 模拟提交
    await new Promise(resolve => setTimeout(resolve, 500));
    setIsSubmitting(false);
  };

  return (
    <form onSubmit={handleSubmit} data-testid="performance-form">
      <div>
        <input
          type="text"
          placeholder="Name"
          value={formData.name}
          onChange={(e) => handleChange('name', e.target.value)}
          data-testid="name-input"
        />
        {errors.name && <div data-testid="name-error">{errors.name}</div>}
      </div>
      
      <div>
        <input
          type="email"
          placeholder="Email"
          value={formData.email}
          onChange={(e) => handleChange('email', e.target.value)}
          data-testid="email-input"
        />
        {errors.email && <div data-testid="email-error">{errors.email}</div>}
      </div>
      
      <div>
        <textarea
          placeholder="Message"
          value={formData.message}
          onChange={(e) => handleChange('message', e.target.value)}
          data-testid="message-input"
        />
        {errors.message && <div data-testid="message-error">{errors.message}</div>}
      </div>
      
      <div>
        <select
          value={formData.category}
          onChange={(e) => handleChange('category', e.target.value)}
          data-testid="category-select"
        >
          <option value="">Select Category</option>
          <option value="general">General</option>
          <option value="support">Support</option>
          <option value="feedback">Feedback</option>
        </select>
      </div>
      
      <button type="submit" disabled={isSubmitting} data-testid="submit-button">
        {isSubmitting ? 'Submitting...' : 'Submit'}
      </button>
    </form>
  );
};

describe('Performance Tests', () => {
  describe('Render Performance', () => {
    it('should render small data set quickly', () => {
      const renderTime = measureRenderTime(() => {
        render(<LargeDataComponent itemCount={100} />);
      });
      
      expect(renderTime).toBeLessThan(100); // 应该在100ms内完成
      expect(screen.getByTestId('large-data-component')).toBeInTheDocument();
    });

    it('should render medium data set within acceptable time', () => {
      const renderTime = measureRenderTime(() => {
        render(<LargeDataComponent itemCount={500} />);
      });
      
      expect(renderTime).toBeLessThan(300); // 应该在300ms内完成
      expect(screen.getByTestId('large-data-component')).toBeInTheDocument();
    });

    it('should handle large data set', () => {
      const renderTime = measureRenderTime(() => {
        render(<LargeDataComponent itemCount={1000} />);
      });
      
      // 大数据集可能需要更多时间，但应该在合理范围内
      expect(renderTime).toBeLessThan(1000); // 应该在1秒内完成
      expect(screen.getByTestId('large-data-component')).toBeInTheDocument();
    });

    it('should render complex form quickly', () => {
      const renderTime = measureRenderTime(() => {
        render(<PerformanceForm />);
      });
      
      expect(renderTime).toBeLessThan(50); // 表单应该很快渲染
      expect(screen.getByTestId('performance-form')).toBeInTheDocument();
    });
  });

  describe('Interaction Performance', () => {
    it('should handle rapid clicks efficiently', async () => {
      const user = userEvent.setup();
      render(<ComplexInteractionComponent />);
      
      const button = screen.getByTestId('increment-button');
      const startTime = performance.now();
      
      // 快速点击10次
      for (let i = 0; i < 10; i++) {
        await user.click(button);
      }
      
      const endTime = performance.now();
      const totalTime = endTime - startTime;
      
      expect(totalTime).toBeLessThan(500); // 10次点击应该在500ms内完成
      expect(screen.getByTestId('counter')).toHaveTextContent('Count: 10');
    });

    it('should handle form input changes efficiently', async () => {
      const user = userEvent.setup();
      render(<PerformanceForm />);
      
      const nameInput = screen.getByTestId('name-input');
      const startTime = performance.now();
      
      // 输入长文本
      await user.type(nameInput, 'This is a very long name that should test input performance');
      
      const endTime = performance.now();
      const totalTime = endTime - startTime;
      
      expect(totalTime).toBeLessThan(1000); // 输入应该在1秒内完成
      expect(nameInput).toHaveValue('This is a very long name that should test input performance');
    });

    it('should handle async operations efficiently', async () => {
      const user = userEvent.setup();
      render(<ComplexInteractionComponent />);
      
      const addButton = screen.getByTestId('add-item-button');
      
      const operationTime = await measureAsyncOperation(async () => {
        await user.click(addButton);
        await waitFor(() => {
          expect(screen.getByTestId('list-item-0')).toBeInTheDocument();
        });
      });
      
      expect(operationTime).toBeLessThan(100); // 异步操作应该很快完成
    });

    it('should handle form validation efficiently', async () => {
      const user = userEvent.setup();
      render(<PerformanceForm />);
      
      const submitButton = screen.getByTestId('submit-button');
      
      const validationTime = await measureAsyncOperation(async () => {
        await user.click(submitButton);
        await waitFor(() => {
          expect(screen.getByTestId('name-error')).toBeInTheDocument();
        });
      });
      
      expect(validationTime).toBeLessThan(50); // 验证应该很快完成
    });
  });

  describe('Memory Performance', () => {
    it('should not cause memory leaks with repeated renders', () => {
      // 测试重复渲染是否会导致内存泄漏
      const { unmount } = render(<LargeDataComponent itemCount={100} />);
      
      // 记录初始内存使用（如果可用）
      const initialMemory = (performance as any).memory?.usedJSHeapSize || 0;
      
      // 多次重新渲染
      for (let i = 0; i < 10; i++) {
        unmount();
        render(<LargeDataComponent itemCount={100} />);
      }
      
      // 检查内存使用是否在合理范围内
      const finalMemory = (performance as any).memory?.usedJSHeapSize || 0;
      
      if (initialMemory > 0 && finalMemory > 0) {
        const memoryIncrease = finalMemory - initialMemory;
        // 内存增长应该在合理范围内（比如不超过10MB）
        expect(memoryIncrease).toBeLessThan(10 * 1024 * 1024);
      }
      
      // 至少确保组件能正常渲染
      expect(screen.getByTestId('large-data-component')).toBeInTheDocument();
    });

    it('should handle component unmounting cleanly', () => {
      const { unmount } = render(<ComplexInteractionComponent />);
      
      expect(screen.getByTestId('complex-interaction-component')).toBeInTheDocument();
      
      // 卸载组件应该不会抛出错误
      expect(() => unmount()).not.toThrow();
    });
  });

  describe('Stress Tests', () => {
    it('should handle rapid state updates', async () => {
      const user = userEvent.setup();
      render(<ComplexInteractionComponent />);
      
      const batchButton = screen.getByTestId('batch-operation-button');
      
      const stressTime = await measureAsyncOperation(async () => {
        await user.click(batchButton);
        await waitFor(() => {
          expect(screen.getByTestId('counter')).toHaveTextContent('Count: 100');
        }, { timeout: 5000 });
      });
      
      expect(stressTime).toBeLessThan(3000); // 批量操作应该在3秒内完成
    });

    it('should handle multiple simultaneous operations', async () => {
      const user = userEvent.setup();
      render(<ComplexInteractionComponent />);
      
      const addButton = screen.getByTestId('add-item-button');
      const incrementButton = screen.getByTestId('increment-button');
      
      const startTime = performance.now();
      
      // 同时执行多个操作
      const promises = [
        user.click(addButton),
        user.click(incrementButton),
        user.click(incrementButton),
        user.click(incrementButton),
      ];
      
      await Promise.all(promises);
      
      const endTime = performance.now();
      const totalTime = endTime - startTime;
      
      expect(totalTime).toBeLessThan(200); // 多个操作应该快速完成
      expect(screen.getByTestId('counter')).toHaveTextContent('Count: 3');
    });

    it('should maintain performance with large forms', async () => {
      const user = userEvent.setup();
      render(<PerformanceForm />);
      
      const inputs = [
        screen.getByTestId('name-input'),
        screen.getByTestId('email-input'),
        screen.getByTestId('message-input'),
      ];
      
      const startTime = performance.now();
      
      // 在所有输入框中输入数据
      await user.type(inputs[0], 'John Doe');
      await user.type(inputs[1], 'john@example.com');
      await user.type(inputs[2], 'This is a test message with some content');
      
      const endTime = performance.now();
      const totalTime = endTime - startTime;
      
      expect(totalTime).toBeLessThan(1500); // 表单填写应该在1.5秒内完成
      expect(inputs[0]).toHaveValue('John Doe');
      expect(inputs[1]).toHaveValue('john@example.com');
      expect(inputs[2]).toHaveValue('This is a test message with some content');
    });
  });

  describe('Performance Benchmarks', () => {
    it('should meet render time benchmarks', () => {
      const benchmarks = [
        { itemCount: 10, maxTime: 10 },
        { itemCount: 50, maxTime: 25 },
        { itemCount: 100, maxTime: 50 },
        { itemCount: 200, maxTime: 100 },
      ];
      
      benchmarks.forEach(({ itemCount, maxTime }) => {
        const renderTime = measureRenderTime(() => {
          render(<LargeDataComponent itemCount={itemCount} />);
        });
        
        expect(renderTime).toBeLessThan(maxTime);
      });
    });

    it('should meet interaction time benchmarks', async () => {
      const user = userEvent.setup();
      render(<ComplexInteractionComponent />);
      
      const button = screen.getByTestId('increment-button');
      
      // 测试单次点击性能
      const singleClickTime = await measureAsyncOperation(async () => {
        await user.click(button);
      });
      
      expect(singleClickTime).toBeLessThan(10); // 单次点击应该在10ms内完成
      
      // 测试连续点击性能
      const startTime = performance.now();
      for (let i = 0; i < 5; i++) {
        await user.click(button);
      }
      const endTime = performance.now();
      const averageClickTime = (endTime - startTime) / 5;
      
      expect(averageClickTime).toBeLessThan(20); // 平均点击时间应该在20ms内
    });
  });
});
