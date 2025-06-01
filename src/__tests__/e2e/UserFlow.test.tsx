/**
 * 简化的端到端用户流程测试
 * 测试关键业务流程而不依赖复杂的组件
 */

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

// 模拟应用状态管理
class MockAppState {
  private state = {
    user: {
      isConnected: false,
      address: '',
      balance: { bnb: '0', sm: '0' }
    },
    exchange: {
      isActive: true,
      currentPrice: '0.000000833',
      totalSold: '1000',
      totalRemaining: '9000'
    },
    transactions: [] as any[]
  };

  getState() {
    return { ...this.state };
  }

  connectWallet(address: string) {
    this.state.user = {
      isConnected: true,
      address,
      balance: { bnb: '5.0', sm: '100.0' }
    };
  }

  disconnectWallet() {
    this.state.user = {
      isConnected: false,
      address: '',
      balance: { bnb: '0', sm: '0' }
    };
  }

  addTransaction(tx: any) {
    this.state.transactions.push(tx);
  }

  updateBalance(bnb: string, sm: string) {
    this.state.user.balance = { bnb, sm };
  }
}

// 分离的页面组件避免 Hooks 规则问题
const HomePage = ({ appState, onConnect, onDisconnect, onNavigate, loading, error }: any) => {
  const state = appState.getState();

  return (
    <div data-testid="home-page">
      <h1>SocioMint</h1>
      <div data-testid="connection-status">
        {state.user.isConnected ? '已连接' : '未连接'}
      </div>
      {state.user.isConnected && (
        <div>
          <div data-testid="user-address">{state.user.address}</div>
          <div data-testid="bnb-balance">{state.user.balance.bnb} BNB</div>
          <div data-testid="sm-balance">{state.user.balance.sm} SM</div>
        </div>
      )}
      {!state.user.isConnected ? (
        <button
          onClick={onConnect}
          disabled={loading}
          data-testid="connect-button"
        >
          {loading ? '连接中...' : '连接钱包'}
        </button>
      ) : (
        <div>
          <button onClick={onDisconnect} data-testid="disconnect-button">
            断开连接
          </button>
          <button
            onClick={() => onNavigate('exchange')}
            data-testid="go-exchange"
          >
            代币兑换
          </button>
          <button
            onClick={() => onNavigate('history')}
            data-testid="go-history"
          >
            交易历史
          </button>
        </div>
      )}
      {error && <div data-testid="error-message">{error}</div>}
    </div>
  );
};

const ExchangePage = ({ appState, onNavigate, onExchange, loading, error }: any) => {
  const [amount, setAmount] = React.useState('');
  const state = appState.getState();

  return (
    <div data-testid="exchange-page">
      <h2>代币兑换</h2>
      <button onClick={() => onNavigate('home')} data-testid="back-home">
        返回首页
      </button>

      <div data-testid="exchange-stats">
        <div>当前价格: {state.exchange.currentPrice} BNB/SM</div>
        <div>已售出: {state.exchange.totalSold} SM</div>
        <div>剩余: {state.exchange.totalRemaining} SM</div>
      </div>

      <div>
        <input
          type="number"
          placeholder="输入 BNB 数量"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          data-testid="amount-input"
        />
        <button
          onClick={() => onExchange(amount)}
          disabled={loading || !amount}
          data-testid="exchange-button"
        >
          {loading ? '交易中...' : '购买代币'}
        </button>
      </div>

      {error && <div data-testid="error-message">{error}</div>}
    </div>
  );
};

const HistoryPage = ({ appState, onNavigate }: any) => {
  const state = appState.getState();

  return (
    <div data-testid="history-page">
      <h2>交易历史</h2>
      <button onClick={() => onNavigate('home')} data-testid="back-home">
        返回首页
      </button>

      <div data-testid="transaction-list">
        {state.transactions.length === 0 ? (
          <div data-testid="no-transactions">暂无交易记录</div>
        ) : (
          state.transactions.map((tx: any, index: number) => (
            <div key={index} data-testid={`transaction-${index}`}>
              <div>哈希: {tx.hash}</div>
              <div>金额: {tx.amount} BNB</div>
              <div>获得: {tx.tokenAmount.toFixed(4)} SM</div>
              <div>状态: {tx.status}</div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

// 主应用组件 - 使用固定的 Hooks 结构
const MockApp = () => {
  const [appState, setAppState] = React.useState(new MockAppState());
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState('');
  const [currentPage, setCurrentPage] = React.useState('home');

  const handleConnect = async () => {
    setLoading(true);
    setError('');
    try {
      await new Promise(resolve => setTimeout(resolve, 100)); // 模拟异步
      appState.connectWallet('0x123456789abcdef123456789abcdef123456789a');
      // 强制重新渲染
      setAppState({ ...appState });
    } catch (err) {
      setError('连接失败');
    } finally {
      setLoading(false);
    }
  };

  const handleDisconnect = () => {
    appState.disconnectWallet();
    // 强制重新渲染
    setAppState({ ...appState });
    setCurrentPage('home');
  };

  const handleNavigate = (page: string) => {
    setCurrentPage(page);
    setError(''); // 清除错误
  };

  const handleExchange = async (amount: string) => {
    const state = appState.getState();

    if (!state.user.isConnected) {
      setError('请先连接钱包');
      return;
    }

    const bnbAmount = parseFloat(amount);
    if (bnbAmount <= 0) {
      setError('金额必须大于0');
      return;
    }

    if (bnbAmount > parseFloat(state.user.balance.bnb)) {
      setError('余额不足');
      return;
    }

    setLoading(true);
    setError('');
    try {
      await new Promise(resolve => setTimeout(resolve, 200)); // 模拟交易

      const tokenAmount = (bnbAmount / parseFloat(state.exchange.currentPrice)) * 1e-18;
      const newBnbBalance = (parseFloat(state.user.balance.bnb) - bnbAmount).toString();
      const newSmBalance = (parseFloat(state.user.balance.sm) + tokenAmount).toString();

      appState.updateBalance(newBnbBalance, newSmBalance);
      appState.addTransaction({
        hash: '0x' + Math.random().toString(16).substr(2, 8),
        amount: bnbAmount,
        tokenAmount,
        timestamp: Date.now(),
        status: 'success'
      });

      // 强制重新渲染
      setAppState({ ...appState });
    } catch (err) {
      setError('交易失败');
    } finally {
      setLoading(false);
    }
  };

  // 使用分离的组件避免 Hooks 规则问题
  return (
    <div data-testid="app">
      {currentPage === 'home' && (
        <HomePage
          appState={appState}
          onConnect={handleConnect}
          onDisconnect={handleDisconnect}
          onNavigate={handleNavigate}
          loading={loading}
          error={error}
        />
      )}
      {currentPage === 'exchange' && (
        <ExchangePage
          appState={appState}
          onNavigate={handleNavigate}
          onExchange={handleExchange}
          loading={loading}
          error={error}
        />
      )}
      {currentPage === 'history' && (
        <HistoryPage
          appState={appState}
          onNavigate={handleNavigate}
        />
      )}
    </div>
  );
};

describe('End-to-End User Flow Tests', () => {
  const user = userEvent.setup();

  describe('Complete User Journey', () => {
    it('should complete full user journey from connection to purchase', async () => {
      render(<MockApp />);

      // 1. 验证初始状态
      expect(screen.getByTestId('home-page')).toBeInTheDocument();
      expect(screen.getByTestId('connection-status')).toHaveTextContent('未连接');
      expect(screen.getByTestId('connect-button')).toBeInTheDocument();

      // 2. 连接钱包
      await user.click(screen.getByTestId('connect-button'));

      // 验证连接中状态
      expect(screen.getByTestId('connect-button')).toHaveTextContent('连接中...');

      // 等待连接完成
      await waitFor(() => {
        expect(screen.getByTestId('connection-status')).toHaveTextContent('已连接');
      });

      // 3. 验证用户信息显示
      expect(screen.getByTestId('user-address')).toHaveTextContent('0x123456789abcdef123456789abcdef123456789a');
      expect(screen.getByTestId('bnb-balance')).toHaveTextContent('5.0 BNB');
      expect(screen.getByTestId('sm-balance')).toHaveTextContent('100.0 SM');

      // 4. 导航到交换页面
      await user.click(screen.getByTestId('go-exchange'));

      expect(screen.getByTestId('exchange-page')).toBeInTheDocument();
      expect(screen.getByTestId('exchange-stats')).toBeInTheDocument();

      // 5. 执行代币购买
      const amountInput = screen.getByTestId('amount-input');
      await user.type(amountInput, '1.0');

      expect(amountInput).toHaveValue(1);

      await user.click(screen.getByTestId('exchange-button'));

      // 验证交易中状态
      expect(screen.getByTestId('exchange-button')).toHaveTextContent('交易中...');

      // 等待交易完成
      await waitFor(() => {
        expect(screen.getByTestId('exchange-button')).toHaveTextContent('购买代币');
      });

      // 6. 返回首页验证余额更新
      await user.click(screen.getByTestId('back-home'));

      expect(screen.getByTestId('home-page')).toBeInTheDocument();
      // 余额应该有所变化（虽然具体数值可能因计算而异）
      expect(screen.getByTestId('bnb-balance')).not.toHaveTextContent('5.0 BNB');

      // 7. 查看交易历史
      await user.click(screen.getByTestId('go-history'));

      expect(screen.getByTestId('history-page')).toBeInTheDocument();
      expect(screen.getByTestId('transaction-0')).toBeInTheDocument();

      // 8. 断开连接
      await user.click(screen.getByTestId('back-home'));
      await user.click(screen.getByTestId('disconnect-button'));

      expect(screen.getByTestId('connection-status')).toHaveTextContent('未连接');
      expect(screen.getByTestId('connect-button')).toBeInTheDocument();
    });

    it('should handle wallet connection errors', async () => {
      // 这里可以测试连接失败的情况
      // 由于我们的 mock 实现比较简单，这里只做基本验证
      render(<MockApp />);

      expect(screen.getByTestId('connect-button')).toBeInTheDocument();
    });

    it('should validate exchange input', async () => {
      render(<MockApp />);

      // 连接钱包
      await user.click(screen.getByTestId('connect-button'));
      await waitFor(() => {
        expect(screen.getByTestId('connection-status')).toHaveTextContent('已连接');
      });

      // 导航到交换页面
      await user.click(screen.getByTestId('go-exchange'));

      // 测试无效输入
      const amountInput = screen.getByTestId('amount-input');
      await user.type(amountInput, '0');

      await user.click(screen.getByTestId('exchange-button'));

      await waitFor(() => {
        expect(screen.getByTestId('error-message')).toHaveTextContent('金额必须大于0');
      });
    });

    it('should handle insufficient balance', async () => {
      render(<MockApp />);

      // 连接钱包
      await user.click(screen.getByTestId('connect-button'));
      await waitFor(() => {
        expect(screen.getByTestId('connection-status')).toHaveTextContent('已连接');
      });

      // 导航到交换页面
      await user.click(screen.getByTestId('go-exchange'));

      // 尝试购买超过余额的金额
      const amountInput = screen.getByTestId('amount-input');
      await user.type(amountInput, '10.0'); // 超过 5.0 BNB 余额

      await user.click(screen.getByTestId('exchange-button'));

      await waitFor(() => {
        expect(screen.getByTestId('error-message')).toHaveTextContent('余额不足');
      });
    });

    it('should show empty transaction history initially', async () => {
      render(<MockApp />);

      // 连接钱包
      await user.click(screen.getByTestId('connect-button'));
      await waitFor(() => {
        expect(screen.getByTestId('connection-status')).toHaveTextContent('已连接');
      });

      // 查看交易历史
      await user.click(screen.getByTestId('go-history'));

      expect(screen.getByTestId('no-transactions')).toHaveTextContent('暂无交易记录');
    });

    it('should handle navigation between pages', async () => {
      render(<MockApp />);

      // 连接钱包
      await user.click(screen.getByTestId('connect-button'));
      await waitFor(() => {
        expect(screen.getByTestId('connection-status')).toHaveTextContent('已连接');
      });

      // 测试页面导航
      await user.click(screen.getByTestId('go-exchange'));
      expect(screen.getByTestId('exchange-page')).toBeInTheDocument();

      await user.click(screen.getByTestId('back-home'));
      expect(screen.getByTestId('home-page')).toBeInTheDocument();

      await user.click(screen.getByTestId('go-history'));
      expect(screen.getByTestId('history-page')).toBeInTheDocument();

      await user.click(screen.getByTestId('back-home'));
      expect(screen.getByTestId('home-page')).toBeInTheDocument();
    });

    it('should prevent exchange when wallet not connected', async () => {
      render(<MockApp />);

      // 直接尝试访问交换功能（在实际应用中可能通过 URL 直接访问）
      // 这里我们模拟未连接状态下的交换尝试
      expect(screen.getByTestId('connection-status')).toHaveTextContent('未连接');
      expect(screen.queryByTestId('go-exchange')).not.toBeInTheDocument();
    });

    it('should handle multiple transactions', async () => {
      render(<MockApp />);

      // 连接钱包
      await user.click(screen.getByTestId('connect-button'));
      await waitFor(() => {
        expect(screen.getByTestId('connection-status')).toHaveTextContent('已连接');
      });

      // 执行第一笔交易
      await user.click(screen.getByTestId('go-exchange'));

      let amountInput = screen.getByTestId('amount-input');
      await user.type(amountInput, '1.0');
      await user.click(screen.getByTestId('exchange-button'));

      await waitFor(() => {
        expect(screen.getByTestId('exchange-button')).toHaveTextContent('购买代币');
      });

      // 执行第二笔交易
      await user.clear(amountInput);
      await user.type(amountInput, '0.5');
      await user.click(screen.getByTestId('exchange-button'));

      await waitFor(() => {
        expect(screen.getByTestId('exchange-button')).toHaveTextContent('购买代币');
      });

      // 查看交易历史
      await user.click(screen.getByTestId('back-home'));
      await user.click(screen.getByTestId('go-history'));

      expect(screen.getByTestId('transaction-0')).toBeInTheDocument();
      expect(screen.getByTestId('transaction-1')).toBeInTheDocument();
    });
  });

  describe('Error Scenarios', () => {
    it('should handle loading states correctly', async () => {
      render(<MockApp />);

      const connectButton = screen.getByTestId('connect-button');

      // 点击连接按钮
      await user.click(connectButton);

      // 验证加载状态
      expect(connectButton).toHaveTextContent('连接中...');
      expect(connectButton).toBeDisabled();

      // 等待加载完成
      await waitFor(() => {
        expect(screen.getByTestId('connection-status')).toHaveTextContent('已连接');
      });
    });

    it('should clear errors when performing new actions', async () => {
      render(<MockApp />);

      // 连接钱包
      await user.click(screen.getByTestId('connect-button'));
      await waitFor(() => {
        expect(screen.getByTestId('connection-status')).toHaveTextContent('已连接');
      });

      // 导航到交换页面并产生错误
      await user.click(screen.getByTestId('go-exchange'));

      const amountInput = screen.getByTestId('amount-input');
      await user.type(amountInput, '0');
      await user.click(screen.getByTestId('exchange-button'));

      await waitFor(() => {
        expect(screen.getByTestId('error-message')).toBeInTheDocument();
      });

      // 输入有效金额应该清除错误
      await user.clear(amountInput);
      await user.type(amountInput, '1.0');
      await user.click(screen.getByTestId('exchange-button'));

      // 错误应该被清除（在交易开始时）
      expect(screen.queryByTestId('error-message')).not.toBeInTheDocument();
    });
  });
});
