/**
 * 简化的组件测试
 * 测试基础的 React 组件功能
 */

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

// 简单的计数器组件
const Counter = ({ initialValue = 0 }: { initialValue?: number }) => {
  const [count, setCount] = React.useState(initialValue);
  const [loading, setLoading] = React.useState(false);

  const increment = () => setCount(prev => prev + 1);
  const decrement = () => setCount(prev => prev - 1);
  const reset = () => setCount(initialValue);

  const asyncIncrement = async () => {
    setLoading(true);
    await new Promise(resolve => setTimeout(resolve, 100));
    setCount(prev => prev + 1);
    setLoading(false);
  };

  return (
    <div>
      <div data-testid="count">{count}</div>
      <div data-testid="loading">{loading ? 'Loading...' : 'Ready'}</div>
      <button onClick={increment} data-testid="increment">
        +
      </button>
      <button onClick={decrement} data-testid="decrement">
        -
      </button>
      <button onClick={reset} data-testid="reset">
        Reset
      </button>
      <button onClick={asyncIncrement} data-testid="async-increment" disabled={loading}>
        Async +
      </button>
    </div>
  );
};

// 表单组件
const SimpleForm = ({ onSubmit }: { onSubmit: (data: { name: string; email: string }) => void }) => {
  const [name, setName] = React.useState('');
  const [email, setEmail] = React.useState('');
  const [errors, setErrors] = React.useState<{ name?: string; email?: string }>({});

  const validate = () => {
    const newErrors: { name?: string; email?: string } = {};

    if (!name.trim()) {
      newErrors.name = 'Name is required';
    }

    if (!email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(email)) {
      newErrors.email = 'Email is invalid';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (validate()) {
      onSubmit({ name, email });
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <div>
        <input
          type="text"
          placeholder="Name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          data-testid="name-input"
        />
        {errors.name && <div data-testid="name-error">{errors.name}</div>}
      </div>
      <div>
        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          data-testid="email-input"
        />
        {errors.email && <div data-testid="email-error">{errors.email}</div>}
      </div>
      <button type="submit" data-testid="submit-button">
        Submit
      </button>
    </form>
  );
};

// 模拟钱包连接组件
const MockWalletConnect = () => {
  const [isConnected, setIsConnected] = React.useState(false);
  const [address, setAddress] = React.useState('');
  const [balance, setBalance] = React.useState('0');
  const [loading, setLoading] = React.useState(false);

  const connect = async () => {
    setLoading(true);
    try {
      // 模拟连接延迟
      await new Promise(resolve => setTimeout(resolve, 200));
      setIsConnected(true);
      setAddress('0x123456789abcdef123456789abcdef123456789a');
      setBalance('1.5');
    } catch (error) {
      console.error('Connection failed:', error);
    } finally {
      setLoading(false);
    }
  };

  const disconnect = () => {
    setIsConnected(false);
    setAddress('');
    setBalance('0');
  };

  return (
    <div>
      <div data-testid="connection-status">
        {isConnected ? 'Connected' : 'Not Connected'}
      </div>
      <div data-testid="address">{address}</div>
      <div data-testid="balance">{balance} ETH</div>
      <div data-testid="loading-status">
        {loading ? 'Connecting...' : 'Ready'}
      </div>
      {!isConnected ? (
        <button onClick={connect} disabled={loading} data-testid="connect-button">
          Connect Wallet
        </button>
      ) : (
        <button onClick={disconnect} data-testid="disconnect-button">
          Disconnect
        </button>
      )}
    </div>
  );
};

describe('Simple Component Tests', () => {
  describe('Counter Component', () => {
    it('renders with initial value', () => {
      render(<Counter initialValue={5} />);
      expect(screen.getByTestId('count')).toHaveTextContent('5');
    });

    it('increments count', () => {
      render(<Counter />);
      const incrementButton = screen.getByTestId('increment');

      fireEvent.click(incrementButton);
      expect(screen.getByTestId('count')).toHaveTextContent('1');

      fireEvent.click(incrementButton);
      expect(screen.getByTestId('count')).toHaveTextContent('2');
    });

    it('decrements count', () => {
      render(<Counter initialValue={5} />);
      const decrementButton = screen.getByTestId('decrement');

      fireEvent.click(decrementButton);
      expect(screen.getByTestId('count')).toHaveTextContent('4');
    });

    it('resets count', () => {
      render(<Counter initialValue={3} />);
      const incrementButton = screen.getByTestId('increment');
      const resetButton = screen.getByTestId('reset');

      fireEvent.click(incrementButton);
      fireEvent.click(incrementButton);
      expect(screen.getByTestId('count')).toHaveTextContent('5');

      fireEvent.click(resetButton);
      expect(screen.getByTestId('count')).toHaveTextContent('3');
    });

    it('handles async increment', async () => {
      render(<Counter />);
      const asyncButton = screen.getByTestId('async-increment');

      fireEvent.click(asyncButton);

      // 检查加载状态
      expect(screen.getByTestId('loading')).toHaveTextContent('Loading...');
      expect(asyncButton).toBeDisabled();

      // 等待异步操作完成
      await waitFor(() => {
        expect(screen.getByTestId('count')).toHaveTextContent('1');
        expect(screen.getByTestId('loading')).toHaveTextContent('Ready');
      });

      expect(asyncButton).not.toBeDisabled();
    });
  });

  describe('SimpleForm Component', () => {
    const mockSubmit = jest.fn();

    beforeEach(() => {
      mockSubmit.mockClear();
    });

    it('renders form fields', () => {
      render(<SimpleForm onSubmit={mockSubmit} />);

      expect(screen.getByTestId('name-input')).toBeInTheDocument();
      expect(screen.getByTestId('email-input')).toBeInTheDocument();
      expect(screen.getByTestId('submit-button')).toBeInTheDocument();
    });

    it('validates required fields', async () => {
      const user = userEvent.setup();
      render(<SimpleForm onSubmit={mockSubmit} />);

      const submitButton = screen.getByTestId('submit-button');
      await user.click(submitButton);

      expect(screen.getByTestId('name-error')).toHaveTextContent('Name is required');
      expect(screen.getByTestId('email-error')).toHaveTextContent('Email is required');
      expect(mockSubmit).not.toHaveBeenCalled();
    });

    it('validates email format', async () => {
      const user = userEvent.setup();
      render(<SimpleForm onSubmit={mockSubmit} />);

      const nameInput = screen.getByTestId('name-input');
      const emailInput = screen.getByTestId('email-input');
      const submitButton = screen.getByTestId('submit-button');

      await user.type(nameInput, 'John Doe');
      await user.type(emailInput, 'invalid-email');
      await user.click(submitButton);

      await waitFor(() => {
        expect(screen.getByTestId('email-error')).toHaveTextContent('Email is invalid');
      });
      expect(mockSubmit).not.toHaveBeenCalled();
    });

    it('submits valid form', async () => {
      const user = userEvent.setup();
      render(<SimpleForm onSubmit={mockSubmit} />);

      const nameInput = screen.getByTestId('name-input');
      const emailInput = screen.getByTestId('email-input');
      const submitButton = screen.getByTestId('submit-button');

      await user.type(nameInput, 'John Doe');
      await user.type(emailInput, 'john@example.com');
      await user.click(submitButton);

      expect(mockSubmit).toHaveBeenCalledWith({
        name: 'John Doe',
        email: 'john@example.com'
      });
    });
  });

  describe('MockWalletConnect Component', () => {
    it('renders initial state', () => {
      render(<MockWalletConnect />);

      expect(screen.getByTestId('connection-status')).toHaveTextContent('Not Connected');
      expect(screen.getByTestId('address')).toHaveTextContent('');
      expect(screen.getByTestId('balance')).toHaveTextContent('0 ETH');
      expect(screen.getByTestId('connect-button')).toBeInTheDocument();
    });

    it('connects wallet', async () => {
      render(<MockWalletConnect />);

      const connectButton = screen.getByTestId('connect-button');
      fireEvent.click(connectButton);

      // 检查加载状态
      expect(screen.getByTestId('loading-status')).toHaveTextContent('Connecting...');
      expect(connectButton).toBeDisabled();

      // 等待连接完成
      await waitFor(() => {
        expect(screen.getByTestId('connection-status')).toHaveTextContent('Connected');
        expect(screen.getByTestId('address')).toHaveTextContent('0x123456789abcdef123456789abcdef123456789a');
        expect(screen.getByTestId('balance')).toHaveTextContent('1.5 ETH');
      });

      expect(screen.getByTestId('disconnect-button')).toBeInTheDocument();
      expect(screen.queryByTestId('connect-button')).not.toBeInTheDocument();
    });

    it('disconnects wallet', async () => {
      render(<MockWalletConnect />);

      // 先连接
      const connectButton = screen.getByTestId('connect-button');
      fireEvent.click(connectButton);

      await waitFor(() => {
        expect(screen.getByTestId('connection-status')).toHaveTextContent('Connected');
      });

      // 然后断开连接
      await waitFor(() => {
        expect(screen.getByTestId('disconnect-button')).toBeInTheDocument();
      });

      const disconnectButton = screen.getByTestId('disconnect-button');
      fireEvent.click(disconnectButton);

      expect(screen.getByTestId('connection-status')).toHaveTextContent('Not Connected');
      expect(screen.getByTestId('address')).toHaveTextContent('');
      expect(screen.getByTestId('balance')).toHaveTextContent('0 ETH');
      expect(screen.getByTestId('connect-button')).toBeInTheDocument();
    });
  });
});
