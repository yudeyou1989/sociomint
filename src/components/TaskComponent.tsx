import React, { useState, useEffect } from 'react';
import { useAccount } from 'wagmi';
import apiService from '@/services/apiService';

// 任务类型定义
interface Task {
  id: number;
  title: string;
  description: string;
  requirements: string[];
  reward_amount: number;
  reward_type: string;
  status: string;
  creator: {
    wallet_address: string;
    name?: string;
  };
  max_participants: number;
  current_participants: number;
  start_date: string;
  end_date: string;
  category: string;
  created_at: string;
}

// 参与任务类型定义
interface TaskParticipation {
  id: number;
  task_id: number;
  participant_id: string;
  status: 'joined' | 'submitted' | 'completed' | 'rejected';
  joined_at: string;
  submitted_at?: string;
  verified_at?: string;
  feedback?: string;
  task?: Task;
}

// 任务提交类型定义
interface TaskSubmission {
  content: string;
  attachments?: string[];
}

/**
 * 任务面板组件
 * 用于浏览、参与和管理任务
 */
const TaskPanel: React.FC = () => {
  const { address, isConnected } = useAccount();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [myParticipations, setMyParticipations] = useState<TaskParticipation[]>([]);
  const [myCreatedTasks, setMyCreatedTasks] = useState<Task[]>([]);
  const [currentView, setCurrentView] = useState<'browse' | 'participating' | 'created'>('browse');
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState<number>(1);
  const [totalPages, setTotalPages] = useState<number>(1);

  // 加载任务数据
  useEffect(() => {
    if (isConnected) {
      loadData();
    }
  }, [isConnected, currentView, page]);

  // 加载数据方法
  const loadData = async () => {
    setLoading(true);
    setError(null);
    try {
      if (currentView === 'browse') {
        const response = await apiService.getTasks(undefined, page, 10);
        setTasks(response.tasks || []);
        setTotalPages(Math.ceil((response.total || 0) / 10));
      } else if (currentView === 'participating' && address) {
        const participations = await apiService.getUserTasks(address, 'participant');
        setMyParticipations(participations || []);
      } else if (currentView === 'created' && address) {
        const createdTasks = await apiService.getUserTasks(address, 'creator');
        setMyCreatedTasks(createdTasks || []);
      }
    } catch (err) {
      setError('加载任务数据失败，请稍后重试');
      console.error('加载任务数据错误:', err);
    } finally {
      setLoading(false);
    }
  };

  // 参与任务
  const joinTask = async (taskId: number) => {
    if (!isConnected || !address) {
      setError('请先连接钱包');
      return;
    }

    try {
      await apiService.joinTask(taskId, address);
      // 刷新数据
      loadData();
    } catch (err: any) {
      setError(err.message || '参与任务失败，请稍后重试');
      console.error('参与任务错误:', err);
    }
  };

  return (
    <div className="w-full max-w-6xl mx-auto">
      {/* 导航标签 */}
      <div className="flex border-b border-gray-200 mb-8">
        <button
          className={`py-4 px-6 text-center ${
            currentView === 'browse'
              ? 'border-b-2 border-blue-500 text-blue-500'
              : 'text-gray-500'
          }`}
          onClick={() => setCurrentView('browse')}
        >
          浏览任务
        </button>
        <button
          className={`py-4 px-6 text-center ${
            currentView === 'participating'
              ? 'border-b-2 border-blue-500 text-blue-500'
              : 'text-gray-500'
          }`}
          onClick={() => setCurrentView('participating')}
        >
          我参与的
        </button>
        <button
          className={`py-4 px-6 text-center ${
            currentView === 'created'
              ? 'border-b-2 border-blue-500 text-blue-500'
              : 'text-gray-500'
          }`}
          onClick={() => setCurrentView('created')}
        >
          我创建的
        </button>
      </div>

      {/* 错误提示 */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-6">
          {error}
        </div>
      )}

      {/* 加载状态 */}
      {loading ? (
        <div className="flex justify-center py-10">
          <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-blue-500"></div>
        </div>
      ) : (
        <>
          {/* 浏览任务视图 */}
          {currentView === 'browse' && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {tasks.length > 0 ? (
                tasks.map((task) => (
                  <TaskCard 
                    key={task.id} 
                    task={task} 
                    onJoin={() => joinTask(task.id)} 
                    isParticipating={false}
                  />
                ))
              ) : (
                <div className="col-span-3 text-center py-10 text-gray-500">
                  目前没有可用的任务
                </div>
              )}
            </div>
          )}

          {/* 我参与的任务视图 */}
          {currentView === 'participating' && (
            <div className="grid grid-cols-1 gap-6">
              {myParticipations.length > 0 ? (
                myParticipations.map((participation) => (
                  <ParticipationCard 
                    key={participation.id} 
                    participation={participation} 
                    onRefresh={loadData}
                  />
                ))
              ) : (
                <div className="text-center py-10 text-gray-500">
                  你还没有参与任何任务
                </div>
              )}
            </div>
          )}

          {/* 我创建的任务视图 */}
          {currentView === 'created' && (
            <div className="grid grid-cols-1 gap-6">
              {myCreatedTasks.length > 0 ? (
                myCreatedTasks.map((task) => (
                  <CreatorTaskCard 
                    key={task.id} 
                    task={task} 
                    onRefresh={loadData}
                  />
                ))
              ) : (
                <div className="text-center py-10 text-gray-500">
                  你还没有创建任何任务
                </div>
              )}
            </div>
          )}

          {/* 分页控制 */}
          {currentView === 'browse' && totalPages > 1 && (
            <div className="flex justify-center mt-8">
              <button
                className="px-4 py-2 mr-2 bg-gray-100 rounded-md disabled:opacity-50"
                disabled={page === 1}
                onClick={() => setPage(page - 1)}
              >
                上一页
              </button>
              <span className="px-4 py-2">
                第 {page} 页，共 {totalPages} 页
              </span>
              <button
                className="px-4 py-2 ml-2 bg-gray-100 rounded-md disabled:opacity-50"
                disabled={page === totalPages}
                onClick={() => setPage(page + 1)}
              >
                下一页
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
};

/**
 * 任务卡片组件
 */
const TaskCard: React.FC<{
  task: Task;
  onJoin: () => void;
  isParticipating: boolean;
}> = ({ task, onJoin, isParticipating }) => {
  // 计算剩余时间
  const endDate = new Date(task.end_date);
  const now = new Date();
  const daysLeft = Math.max(0, Math.ceil((endDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)));
  
  // 判断是否已满员
  const isFull = task.current_participants >= task.max_participants;
  
  // 判断是否可参与
  const canJoin = task.status === 'open' && !isParticipating && !isFull;

  return (
    <div className="border border-gray-200 rounded-lg overflow-hidden shadow-sm hover:shadow-md transition-shadow">
      <div className="p-5">
        {/* 任务类别标签 */}
        <div className="flex justify-between items-center mb-3">
          <span className="bg-blue-100 text-blue-800 text-xs font-medium px-2.5 py-0.5 rounded">
            {task.category}
          </span>
          <span className="text-xs text-gray-500">
            {daysLeft > 0 ? `剩余${daysLeft}天` : '已截止'}
          </span>
        </div>
        
        {/* 任务标题 */}
        <h3 className="text-xl font-bold text-gray-900 mb-2">{task.title}</h3>
        
        {/* 任务描述 */}
        <p className="text-gray-700 mb-4 line-clamp-2">{task.description}</p>
        
        {/* 奖励信息 */}
        <div className="flex justify-between items-center mt-4">
          <div className="flex items-center">
            <span className="text-lg font-semibold text-green-600">{task.reward_amount}</span>
            <span className="text-sm text-gray-600 ml-1">{task.reward_type === 'sm_token' ? 'SM' : task.reward_type}</span>
          </div>
          
          {/* 参与按钮 */}
          <button
            onClick={onJoin}
            disabled={!canJoin}
            className={`px-4 py-2 rounded-md ${
              canJoin
                ? 'bg-blue-600 text-white hover:bg-blue-700'
                : 'bg-gray-200 text-gray-500 cursor-not-allowed'
            }`}
          >
            {isParticipating ? '已参与' : isFull ? '已满员' : '参与任务'}
          </button>
        </div>
      </div>
      
      {/* 任务信息底栏 */}
      <div className="bg-gray-50 px-5 py-3 border-t border-gray-200">
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <div className="h-7 w-7 rounded-full bg-gray-300"></div>
            <span className="text-sm text-gray-600 ml-2">
              {task.creator.name || `${task.creator.wallet_address.substring(0, 6)}...${task.creator.wallet_address.substring(38)}`}
            </span>
          </div>
          <span className="text-sm text-gray-500">
            参与人数: {task.current_participants}/{task.max_participants}
          </span>
        </div>
      </div>
    </div>
  );
};

/**
 * 参与任务卡片组件
 */
const ParticipationCard: React.FC<{
  participation: TaskParticipation;
  onRefresh: () => void;
}> = ({ participation, onRefresh }) => {
  const [submission, setSubmission] = useState<TaskSubmission>({ content: '' });
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const { address } = useAccount();
  const task = participation.task;
  
  if (!task) return null;
  
  // 提交任务
  const handleSubmit = async () => {
    if (!address) return;
    
    if (!submission.content.trim()) {
      return; // 内容为空不提交
    }
    
    setIsSubmitting(true);
    try {
      await apiService.submitTask(task.id, address, submission);
      onRefresh();
    } catch (err) {
      console.error('提交任务失败:', err);
    } finally {
      setIsSubmitting(false);
    }
  };
  
  return (
    <div className="border border-gray-200 rounded-lg overflow-hidden shadow-sm hover:shadow-md transition-shadow">
      <div className="p-5">
        {/* 任务状态标签 */}
        <div className="flex justify-between items-center mb-3">
          <span className={`text-xs font-medium px-2.5 py-0.5 rounded ${
            participation.status === 'joined' ? 'bg-blue-100 text-blue-800' :
            participation.status === 'submitted' ? 'bg-yellow-100 text-yellow-800' :
            participation.status === 'completed' ? 'bg-green-100 text-green-800' :
            'bg-red-100 text-red-800'
          }`}>
            {
              participation.status === 'joined' ? '进行中' :
              participation.status === 'submitted' ? '已提交' :
              participation.status === 'completed' ? '已完成' :
              '已拒绝'
            }
          </span>
          <span className="text-xs text-gray-500">
            参与时间: {new Date(participation.joined_at).toLocaleString()}
          </span>
        </div>
        
        {/* 任务标题 */}
        <h3 className="text-xl font-bold text-gray-900 mb-2">{task.title}</h3>
        
        {/* 任务描述 */}
        <p className="text-gray-700 mb-4">{task.description}</p>
        
        {/* 任务要求 */}
        <div className="mb-4">
          <h4 className="text-lg font-semibold mb-2">任务要求:</h4>
          <ul className="list-disc pl-5">
            {task.requirements.map((req, index) => (
              <li key={index} className="text-gray-700">{req}</li>
            ))}
          </ul>
        </div>
        
        {/* 提交表单，仅在"已参与"状态显示 */}
        {participation.status === 'joined' && (
          <div className="mt-6 border-t border-gray-200 pt-4">
            <h4 className="text-lg font-semibold mb-2">提交任务:</h4>
            <textarea
              className="w-full border border-gray-300 rounded-md p-3 mb-3"
              rows={4}
              placeholder="请输入任务完成证明..."
              value={submission.content}
              onChange={(e) => setSubmission({ ...submission, content: e.target.value })}
            ></textarea>
            <button
              onClick={handleSubmit}
              disabled={isSubmitting || !submission.content.trim()}
              className={`px-4 py-2 rounded-md ${
                isSubmitting || !submission.content.trim()
                  ? 'bg-gray-200 text-gray-500 cursor-not-allowed'
                  : 'bg-blue-600 text-white hover:bg-blue-700'
              }`}
            >
              {isSubmitting ? '提交中...' : '提交任务'}
            </button>
          </div>
        )}
        
        {/* 反馈信息，仅在"已拒绝"状态显示 */}
        {participation.status === 'rejected' && participation.feedback && (
          <div className="mt-6 border-t border-gray-200 pt-4">
            <h4 className="text-lg font-semibold mb-2">拒绝原因:</h4>
            <p className="text-gray-700 p-3 bg-red-50 rounded-md">{participation.feedback}</p>
          </div>
        )}
        
        {/* 奖励信息 */}
        <div className="flex justify-between items-center mt-6">
          <div className="flex items-center">
            <span className="text-sm mr-2">奖励:</span>
            <span className="text-lg font-semibold text-green-600">{task.reward_amount}</span>
            <span className="text-sm text-gray-600 ml-1">{task.reward_type === 'sm_token' ? 'SM' : task.reward_type}</span>
          </div>
          
          {/* 完成标志 */}
          {participation.status === 'completed' && (
            <div className="bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm">
              已获得奖励
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

/**
 * 创建者任务卡片组件
 */
const CreatorTaskCard: React.FC<{
  task: Task;
  onRefresh: () => void;
}> = ({ task, onRefresh }) => {
  const [expandedSubmission, setExpandedSubmission] = useState<number | null>(null);
  const [participants, setParticipants] = useState<any[]>([]);
  const [loadingParticipants, setLoadingParticipants] = useState(false);
  const { address } = useAccount();
  
  // 加载参与者信息
  useEffect(() => {
    if (task.id) {
      loadParticipants();
    }
  }, [task.id]);
  
  const loadParticipants = async () => {
    setLoadingParticipants(true);
    try {
      // 假设task.participants已经包含了参与者信息
      setParticipants(task.participants || []);
    } catch (err) {
      console.error('加载参与者失败:', err);
    } finally {
      setLoadingParticipants(false);
    }
  };
  
  // 验证任务提交
  const handleVerify = async (participantId: string, taskId: number, isApproved: boolean, feedback?: string) => {
    if (!address) return;
    
    try {
      await apiService.verifyTaskSubmission(taskId, participantId, isApproved, feedback);
      // 刷新数据
      loadParticipants();
      onRefresh();
    } catch (err) {
      console.error('验证任务失败:', err);
    }
  };
  
  return (
    <div className="border border-gray-200 rounded-lg overflow-hidden shadow-sm hover:shadow-md transition-shadow">
      <div className="p-5">
        {/* 任务状态标签 */}
        <div className="flex justify-between items-center mb-3">
          <span className={`text-xs font-medium px-2.5 py-0.5 rounded ${
            task.status === 'open' ? 'bg-blue-100 text-blue-800' :
            task.status === 'closed' ? 'bg-gray-100 text-gray-800' :
            task.status === 'completed' ? 'bg-green-100 text-green-800' :
            'bg-yellow-100 text-yellow-800'
          }`}>
            {task.status === 'open' ? '进行中' : 
             task.status === 'closed' ? '已关闭' : 
             task.status === 'completed' ? '已完成' : '待处理'}
          </span>
          <span className="text-xs text-gray-500">
            创建时间: {new Date(task.created_at).toLocaleString()}
          </span>
        </div>
        
        {/* 任务标题 */}
        <h3 className="text-xl font-bold text-gray-900 mb-2">{task.title}</h3>
        
        {/* 任务描述 */}
        <p className="text-gray-700 mb-4">{task.description}</p>
        
        {/* 参与者信息 */}
        <div className="mt-6 border-t border-gray-200 pt-4">
          <h4 className="text-lg font-semibold mb-2">参与者 ({participants.length}/{task.max_participants}):</h4>
          
          {loadingParticipants ? (
            <div className="flex justify-center py-4">
              <div className="animate-spin rounded-full h-6 w-6 border-t-2 border-b-2 border-blue-500"></div>
            </div>
          ) : participants.length > 0 ? (
            <div className="space-y-4">
              {participants.map((participant) => (
                <div key={participant.id} className="border border-gray-200 rounded-md p-3">
                  <div className="flex justify-between items-center">
                    <div className="flex items-center">
                      <div className="h-8 w-8 rounded-full bg-gray-300"></div>
                      <span className="ml-2 font-medium">
                        {participant.participant_id.substring(0, 6)}...{participant.participant_id.substring(38)}
                      </span>
                    </div>
                    <span className={`text-xs font-medium px-2 py-0.5 rounded ${
                      participant.status === 'joined' ? 'bg-blue-100 text-blue-800' :
                      participant.status === 'submitted' ? 'bg-yellow-100 text-yellow-800' :
                      participant.status === 'completed' ? 'bg-green-100 text-green-800' :
                      'bg-red-100 text-red-800'
                    }`}>
                      {
                        participant.status === 'joined' ? '进行中' :
                        participant.status === 'submitted' ? '已提交' :
                        participant.status === 'completed' ? '已完成' :
                        '已拒绝'
                      }
                    </span>
                  </div>
                  
                  {/* 已提交的任务内容 */}
                  {participant.status === 'submitted' && (
                    <div className="mt-3">
                      <button
                        onClick={() => setExpandedSubmission(expandedSubmission === participant.id ? null : participant.id)}
                        className="text-blue-600 text-sm font-medium mb-2 flex items-center"
                      >
                        {expandedSubmission === participant.id ? '收起提交内容' : '查看提交内容'}
                        <svg xmlns="http://www.w3.org/2000/svg" className={`h-4 w-4 ml-1 transform ${expandedSubmission === participant.id ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                        </svg>
                      </button>
                      
                      {expandedSubmission === participant.id && (
                        <div className="bg-gray-50 p-3 rounded-md mb-3">
                          <p className="text-gray-700">这里显示参与者提交的内容...</p>
                          {/* 审核按钮 */}
                          <div className="flex mt-3 space-x-2">
                            <button
                              onClick={() => handleVerify(participant.participant_id, task.id, true)}
                              className="px-3 py-1 bg-green-600 text-white rounded-md text-sm"
                            >
                              通过
                            </button>
                            <button
                              onClick={() => {
                                const feedback = prompt('请输入拒绝原因:');
                                if (feedback !== null) {
                                  handleVerify(participant.participant_id, task.id, false, feedback);
                                }
                              }}
                              className="px-3 py-1 bg-red-600 text-white rounded-md text-sm"
                            >
                              拒绝
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-500 text-center py-4">还没有人参与此任务</p>
          )}
        </div>
      </div>
      
      {/* 任务信息底栏 */}
      <div className="bg-gray-50 px-5 py-3 border-t border-gray-200">
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <span className="text-sm text-gray-600">
              奖励: {task.reward_amount} {task.reward_type === 'sm_token' ? 'SM' : task.reward_type}
            </span>
          </div>
          <span className="text-sm text-gray-500">
            截止日期: {new Date(task.end_date).toLocaleDateString()}
          </span>
        </div>
      </div>
    </div>
  );
};

export default TaskPanel; 