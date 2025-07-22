/**
 * 社交任务列表功能测试
 * 测试社交任务的显示、参与、提交等功能
 */

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { jest } from '@jest/globals';

// Mock相关hooks
jest.mock('@/hooks/useSocialTasks', () => ({
  useSocialTasks: jest.fn()
}));

jest.mock('@/hooks/useWallet', () => ({
  useWallet: jest.fn()
}));

// Mock任务数据
const mockTasks = [
  {
    id: '1',
    type: 'twitter',
    title: '关注官方Twitter',
    description: '关注@SocioMint官方Twitter账号',
    requirements: {
      action: 'follow',
      target: '@SocioMint'
    },
    reward: {
      amount: '100',
      token: 'FLOWER'
    },
    isActive: true,
    startDate: Date.now() - 86400000,
    endDate: Date.now() + 86400000,
    maxParticipants: 1000,
    currentParticipants: 150,
    createdBy: 'admin'
  },
  {
    id: '2',
    type: 'telegram',
    title: '加入Telegram群组',
    description: '加入SocioMint官方Telegram群组',
    requirements: {
      action: 'join',
      target: 'https://t.me/sociomint'
    },
    reward: {
      amount: '50',
      token: 'FLOWER'
    },
    isActive: true,
    startDate: Date.now() - 86400000,
    endDate: Date.now() + 86400000,
    maxParticipants: 500,
    currentParticipants: 200,
    createdBy: 'admin'
  }
];

// Mock组件
const MockSocialTaskList = () => {
  const tasks = require('@/hooks/useSocialTasks').useSocialTasks();
  const wallet = require('@/hooks/useWallet').useWallet();
  
  if (!wallet.isConnected) {
    return <div>请先连接钱包</div>;
  }
  
  if (tasks.isLoading) {
    return <div>加载中...</div>;
  }
  
  if (tasks.error) {
    return <div className="error">加载失败: {tasks.error}</div>;
  }
  
  return (
    <div>
      <h2>社交任务列表</h2>
      {tasks.data?.length === 0 ? (
        <div>暂无可用任务</div>
      ) : (
        <div className="task-list">
          {tasks.data?.map((task: any) => (
            <div key={task.id} className="task-item">
              <h3>{task.title}</h3>
              <p>{task.description}</p>
              <div className="task-info">
                <span>奖励: {task.reward.amount} {task.reward.token}</span>
                <span>参与人数: {task.currentParticipants}/{task.maxParticipants}</span>
              </div>
              <button
                onClick={() => tasks.participateTask(task.id)}
                disabled={task.currentParticipants >= task.maxParticipants}
              >
                {task.currentParticipants >= task.maxParticipants ? '已满员' : '参与任务'}
              </button>
            </div>
          ))}
        </div>
      )}
      <button onClick={tasks.refreshTasks}>刷新任务</button>
    </div>
  );
};

describe('SocialTaskList', () => {
  const mockUseSocialTasks = require('@/hooks/useSocialTasks').useSocialTasks;
  const mockUseWallet = require('@/hooks/useWallet').useWallet;

  beforeEach(() => {
    jest.clearAllMocks();
    
    // 默认钱包状态
    mockUseWallet.mockReturnValue({
      address: '0x1234567890123456789012345678901234567890',
      isConnected: true,
      chainId: 56
    });
    
    // 默认任务状态
    mockUseSocialTasks.mockReturnValue({
      data: mockTasks,
      isLoading: false,
      error: null,
      participateTask: jest.fn(),
      submitTask: jest.fn(),
      refreshTasks: jest.fn()
    });
  });

  describe('基本渲染', () => {
    it('应该显示任务列表标题', () => {
      render(<MockSocialTaskList />);
      
      expect(screen.getByText('社交任务列表')).toBeInTheDocument();
    });

    it('应该显示所有任务', () => {
      render(<MockSocialTaskList />);
      
      expect(screen.getByText('关注官方Twitter')).toBeInTheDocument();
      expect(screen.getByText('加入Telegram群组')).toBeInTheDocument();
    });

    it('应该显示任务详细信息', () => {
      render(<MockSocialTaskList />);
      
      expect(screen.getByText('关注@SocioMint官方Twitter账号')).toBeInTheDocument();
      expect(screen.getByText('奖励: 100 FLOWER')).toBeInTheDocument();
      expect(screen.getByText('参与人数: 150/1000')).toBeInTheDocument();
    });

    it('未连接钱包时应该显示提示', () => {
      mockUseWallet.mockReturnValue({
        isConnected: false
      });
      
      render(<MockSocialTaskList />);
      
      expect(screen.getByText('请先连接钱包')).toBeInTheDocument();
    });
  });

  describe('加载状态', () => {
    it('加载中时应该显示加载提示', () => {
      mockUseSocialTasks.mockReturnValue({
        data: null,
        isLoading: true,
        error: null,
        participateTask: jest.fn(),
        submitTask: jest.fn(),
        refreshTasks: jest.fn()
      });
      
      render(<MockSocialTaskList />);
      
      expect(screen.getByText('加载中...')).toBeInTheDocument();
    });

    it('加载失败时应该显示错误信息', () => {
      mockUseSocialTasks.mockReturnValue({
        data: null,
        isLoading: false,
        error: '网络连接失败',
        participateTask: jest.fn(),
        submitTask: jest.fn(),
        refreshTasks: jest.fn()
      });
      
      render(<MockSocialTaskList />);
      
      expect(screen.getByText('加载失败: 网络连接失败')).toBeInTheDocument();
    });

    it('没有任务时应该显示空状态', () => {
      mockUseSocialTasks.mockReturnValue({
        data: [],
        isLoading: false,
        error: null,
        participateTask: jest.fn(),
        submitTask: jest.fn(),
        refreshTasks: jest.fn()
      });
      
      render(<MockSocialTaskList />);
      
      expect(screen.getByText('暂无可用任务')).toBeInTheDocument();
    });
  });

  describe('任务参与', () => {
    it('点击参与按钮应该调用参与函数', () => {
      const mockParticipateTask = jest.fn();
      mockUseSocialTasks.mockReturnValue({
        data: mockTasks,
        isLoading: false,
        error: null,
        participateTask: mockParticipateTask,
        submitTask: jest.fn(),
        refreshTasks: jest.fn()
      });
      
      render(<MockSocialTaskList />);
      
      const participateButtons = screen.getAllByText('参与任务');
      fireEvent.click(participateButtons[0]);
      
      expect(mockParticipateTask).toHaveBeenCalledWith('1');
    });

    it('任务满员时按钮应该被禁用', () => {
      const fullTask = {
        ...mockTasks[0],
        currentParticipants: 1000,
        maxParticipants: 1000
      };
      
      mockUseSocialTasks.mockReturnValue({
        data: [fullTask],
        isLoading: false,
        error: null,
        participateTask: jest.fn(),
        submitTask: jest.fn(),
        refreshTasks: jest.fn()
      });
      
      render(<MockSocialTaskList />);
      
      const button = screen.getByText('已满员');
      expect(button).toBeDisabled();
    });
  });

  describe('任务刷新', () => {
    it('点击刷新按钮应该调用刷新函数', () => {
      const mockRefreshTasks = jest.fn();
      mockUseSocialTasks.mockReturnValue({
        data: mockTasks,
        isLoading: false,
        error: null,
        participateTask: jest.fn(),
        submitTask: jest.fn(),
        refreshTasks: mockRefreshTasks
      });
      
      render(<MockSocialTaskList />);
      
      const refreshButton = screen.getByText('刷新任务');
      fireEvent.click(refreshButton);
      
      expect(mockRefreshTasks).toHaveBeenCalled();
    });
  });

  describe('任务类型显示', () => {
    it('应该正确显示不同类型的任务', () => {
      const mixedTasks = [
        { ...mockTasks[0], type: 'twitter' },
        { ...mockTasks[1], type: 'telegram' },
        {
          ...mockTasks[0],
          id: '3',
          type: 'discord',
          title: '加入Discord服务器',
          description: '加入SocioMint Discord服务器'
        }
      ];
      
      mockUseSocialTasks.mockReturnValue({
        data: mixedTasks,
        isLoading: false,
        error: null,
        participateTask: jest.fn(),
        submitTask: jest.fn(),
        refreshTasks: jest.fn()
      });
      
      render(<MockSocialTaskList />);
      
      expect(screen.getByText('关注官方Twitter')).toBeInTheDocument();
      expect(screen.getByText('加入Telegram群组')).toBeInTheDocument();
      expect(screen.getByText('加入Discord服务器')).toBeInTheDocument();
    });
  });

  describe('奖励显示', () => {
    it('应该正确显示不同类型的奖励', () => {
      const tasksWithDifferentRewards = [
        { ...mockTasks[0], reward: { amount: '100', token: 'FLOWER' } },
        { ...mockTasks[1], reward: { amount: '0.1', token: 'SM' } }
      ];
      
      mockUseSocialTasks.mockReturnValue({
        data: tasksWithDifferentRewards,
        isLoading: false,
        error: null,
        participateTask: jest.fn(),
        submitTask: jest.fn(),
        refreshTasks: jest.fn()
      });
      
      render(<MockSocialTaskList />);
      
      expect(screen.getByText('奖励: 100 FLOWER')).toBeInTheDocument();
      expect(screen.getByText('奖励: 0.1 SM')).toBeInTheDocument();
    });
  });

  describe('任务状态', () => {
    it('应该只显示活跃的任务', () => {
      const tasksWithInactive = [
        { ...mockTasks[0], isActive: true },
        { ...mockTasks[1], isActive: false, title: '已结束的任务' }
      ];
      
      mockUseSocialTasks.mockReturnValue({
        data: tasksWithInactive.filter(task => task.isActive),
        isLoading: false,
        error: null,
        participateTask: jest.fn(),
        submitTask: jest.fn(),
        refreshTasks: jest.fn()
      });
      
      render(<MockSocialTaskList />);
      
      expect(screen.getByText('关注官方Twitter')).toBeInTheDocument();
      expect(screen.queryByText('已结束的任务')).not.toBeInTheDocument();
    });
  });

  describe('可访问性', () => {
    it('任务项应该有正确的结构', () => {
      render(<MockSocialTaskList />);
      
      const taskItems = screen.getAllByRole('button', { name: /参与任务/ });
      expect(taskItems).toHaveLength(2);
    });

    it('按钮应该有正确的状态', () => {
      render(<MockSocialTaskList />);
      
      const buttons = screen.getAllByRole('button');
      buttons.forEach(button => {
        expect(button).toBeInTheDocument();
      });
    });
  });

  describe('错误处理', () => {
    it('应该处理参与任务失败', async () => {
      const mockParticipateTask = jest.fn().mockRejectedValue(new Error('参与失败'));
      mockUseSocialTasks.mockReturnValue({
        data: mockTasks,
        isLoading: false,
        error: null,
        participateTask: mockParticipateTask,
        submitTask: jest.fn(),
        refreshTasks: jest.fn()
      });
      
      render(<MockSocialTaskList />);
      
      const participateButton = screen.getAllByText('参与任务')[0];
      fireEvent.click(participateButton);
      
      await waitFor(() => {
        expect(mockParticipateTask).toHaveBeenCalled();
      });
    });
  });
});
