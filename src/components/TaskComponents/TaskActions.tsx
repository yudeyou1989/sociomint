import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { ethers } from 'ethers';
import { useWallet } from '@/hooks/useWallet';
import { toast } from 'react-hot-toast';
import { Input, Button, Select, Textarea, Upload, Modal, Spin, Tag, Alert } from 'antd';
import { UploadOutlined, CheckCircleOutlined, CloseCircleOutlined, ExclamationCircleOutlined } from '@ant-design/icons';
import TaskSystemABI from '@/abis/TaskSystem.json';
import TaskEscrowABI from '@/abis/TaskEscrow.json';
import apiService from '@/services/apiService';

const { Option } = Select;
const { confirm } = Modal;

// 任务状态映射
const taskStatusMap = {
  0: '草稿',
  1: '开放',
  2: '进行中',
  3: '已完成',
  4: '已取消',
  5: '有争议'
};

// 任务类型映射
const taskTypeMap = {
  0: '社交任务',
  1: '开发任务',
  2: '内容创作',
  3: '测试任务',
  4: '营销任务',
  5: '其他'
};

interface TaskActionsProps {
  taskId?: string;
  mode: 'create' | 'join' | 'submit' | 'verify' | 'dispute' | 'resolve';
  onSuccess?: () => void;
}

const TaskActions: React.FC<TaskActionsProps> = ({ taskId, mode, onSuccess }) => {
  const router = useRouter();
  const { address, isConnected, signer, provider } = useWallet();
  const [loading, setLoading] = useState(false);
  const [taskData, setTaskData] = useState<any>(null);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    reward: '',
    deadline: '',
    maxParticipants: '1',
    taskType: '0',
    requirementText: '',
    attachments: [],
    submissionUrl: '',
    submissionText: '',
    feedback: '',
    creatorAmount: '0',
    workerAmount: '0',
  });

  // 获取合约地址
  const taskSystemAddress = process.env.NEXT_PUBLIC_TASK_SYSTEM_ADDRESS;
  const taskEscrowAddress = process.env.NEXT_PUBLIC_TASK_ESCROW_ADDRESS;

  // 初始化时获取任务数据
  useEffect(() => {
    if (taskId && mode !== 'create') {
      fetchTaskData();
    }
  }, [taskId, mode]);

  // 获取任务详情
  const fetchTaskData = async () => {
    setLoading(true);
    try {
      const response = await apiService.getTaskDetail(taskId!);
      if (response.success && response.data) {
        setTaskData(response.data);
      } else {
        toast.error('获取任务详情失败');
      }
    } catch (error) {
      console.error('获取任务详情出错:', error);
      toast.error('获取任务详情失败');
    } finally {
      setLoading(false);
    }
  };

  // 处理表单输入变化
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value,
    });
  };

  // 处理选择框变化
  const handleSelectChange = (value: string, name: string) => {
    setFormData({
      ...formData,
      [name]: value,
    });
  };

  // 处理文件上传
  const handleFileUpload = (info: any) => {
    // 这里可以接入IPFS或其他存储服务
    console.log('文件上传:', info);
    // 假设我们得到了文件URL
    const fileUrl = 'https://example.com/files/sample.pdf';
    
    setFormData({
      ...formData,
      attachments: [...formData.attachments, fileUrl],
    });
  };

  // 创建任务
  const handleCreateTask = async () => {
    if (!isConnected || !signer) {
      toast.error('请先连接钱包');
      return;
    }

    // 校验表单
    if (!formData.title || !formData.description || !formData.reward) {
      toast.error('请填写完整信息');
      return;
    }

    setLoading(true);
    try {
      // 获取任务系统合约实例
      const taskSystemContract = new ethers.Contract(
        taskSystemAddress!,
        TaskSystemABI,
        signer
      );

      // 获取任务托管合约实例
      const taskEscrowContract = new ethers.Contract(
        taskEscrowAddress!,
        TaskEscrowABI,
        signer
      );

      // 准备任务数据
      const rewardInWei = ethers.utils.parseEther(formData.reward);
      const deadline = Math.floor(new Date(formData.deadline).getTime() / 1000);
      const maxParticipants = parseInt(formData.maxParticipants);
      const taskType = parseInt(formData.taskType);

      // 先授权代币额度给托管合约
      const allowanceTx = await taskEscrowContract.approveFunds(rewardInWei);
      await allowanceTx.wait();
      toast.success('代币授权成功');

      // 创建任务
      const createTaskTx = await taskSystemContract.createTask(
        formData.title,
        formData.description,
        rewardInWei,
        deadline,
        maxParticipants,
        taskType,
        formData.requirementText,
        JSON.stringify(formData.attachments)
      );

      await createTaskTx.wait();
      toast.success('任务创建成功');

      if (onSuccess) {
        onSuccess();
      } else {
        router.push('/tasks');
      }
    } catch (error: any) {
      console.error('创建任务失败:', error);
      toast.error(`创建任务失败: ${error.message || '未知错误'}`);
    } finally {
      setLoading(false);
    }
  };

  // 加入任务
  const handleJoinTask = async () => {
    if (!isConnected || !signer || !taskId) {
      toast.error('请先连接钱包');
      return;
    }

    setLoading(true);
    try {
      // 获取任务系统合约实例
      const taskSystemContract = new ethers.Contract(
        taskSystemAddress!,
        TaskSystemABI,
        signer
      );

      // 加入任务
      const joinTaskTx = await taskSystemContract.joinTask(taskId);
      await joinTaskTx.wait();
      toast.success('成功加入任务');

      if (onSuccess) {
        onSuccess();
      } else {
        router.push(`/tasks/${taskId}`);
      }
    } catch (error: any) {
      console.error('加入任务失败:', error);
      toast.error(`加入任务失败: ${error.message || '未知错误'}`);
    } finally {
      setLoading(false);
    }
  };

  // 提交任务
  const handleSubmitTask = async () => {
    if (!isConnected || !signer || !taskId) {
      toast.error('请先连接钱包');
      return;
    }

    // 校验表单
    if (!formData.submissionText && !formData.submissionUrl) {
      toast.error('请提供提交内容或URL');
      return;
    }

    setLoading(true);
    try {
      // 获取任务系统合约实例
      const taskSystemContract = new ethers.Contract(
        taskSystemAddress!,
        TaskSystemABI,
        signer
      );

      // 准备提交数据
      const submissionData = {
        text: formData.submissionText,
        url: formData.submissionUrl,
        timestamp: Math.floor(Date.now() / 1000)
      };

      // 提交任务
      const submitTaskTx = await taskSystemContract.submitTask(
        taskId,
        JSON.stringify(submissionData)
      );
      await submitTaskTx.wait();
      toast.success('任务提交成功');

      if (onSuccess) {
        onSuccess();
      } else {
        router.push(`/tasks/${taskId}`);
      }
    } catch (error: any) {
      console.error('提交任务失败:', error);
      toast.error(`提交任务失败: ${error.message || '未知错误'}`);
    } finally {
      setLoading(false);
    }
  };

  // 验证任务
  const handleVerifyTask = async (isApproved: boolean) => {
    if (!isConnected || !signer || !taskId || !taskData) {
      toast.error('请先连接钱包');
      return;
    }

    // 确认对话框
    confirm({
      title: isApproved ? '确认通过该任务提交?' : '确认拒绝该任务提交?',
      icon: <ExclamationCircleOutlined />,
      content: isApproved 
        ? '通过后，任务奖励将发放给参与者' 
        : '拒绝后，参与者需要重新提交任务',
      onOk: async () => {
        setLoading(true);
        try {
          // 获取任务系统合约实例
          const taskSystemContract = new ethers.Contract(
            taskSystemAddress!,
            TaskSystemABI,
            signer
          );

          // 验证任务
          const verifyTaskTx = await taskSystemContract.verifyTask(
            taskId,
            taskData.submissions[0].participant_id,
            isApproved,
            formData.feedback
          );
          await verifyTaskTx.wait();
          toast.success(isApproved ? '任务已验证通过' : '任务已拒绝');

          if (onSuccess) {
            onSuccess();
          } else {
            router.push(`/tasks/${taskId}`);
          }
        } catch (error: any) {
          console.error('验证任务失败:', error);
          toast.error(`验证任务失败: ${error.message || '未知错误'}`);
        } finally {
          setLoading(false);
        }
      },
    });
  };

  // 发起争议
  const handleDisputeTask = async () => {
    if (!isConnected || !signer || !taskId) {
      toast.error('请先连接钱包');
      return;
    }

    // 确认对话框
    confirm({
      title: '确认发起争议?',
      icon: <ExclamationCircleOutlined />,
      content: '发起争议后，平台会介入处理。请确保您有充分的理由。',
      onOk: async () => {
        setLoading(true);
        try {
          // 获取任务系统合约实例
          const taskSystemContract = new ethers.Contract(
            taskSystemAddress!,
            TaskSystemABI,
            signer
          );

          // 发起争议
          const disputeTaskTx = await taskSystemContract.disputeTask(
            taskId,
            formData.feedback
          );
          await disputeTaskTx.wait();
          toast.success('争议已发起');

          if (onSuccess) {
            onSuccess();
          } else {
            router.push(`/tasks/${taskId}`);
          }
        } catch (error: any) {
          console.error('发起争议失败:', error);
          toast.error(`发起争议失败: ${error.message || '未知错误'}`);
        } finally {
          setLoading(false);
        }
      },
    });
  };

  // 解决争议
  const handleResolveDispute = async () => {
    if (!isConnected || !signer || !taskId) {
      toast.error('请先连接钱包');
      return;
    }

    // 校验表单
    if (!formData.creatorAmount || !formData.workerAmount) {
      toast.error('请填写分配金额');
      return;
    }

    // 确认对话框
    confirm({
      title: '确认解决争议?',
      icon: <ExclamationCircleOutlined />,
      content: `创建者将获得 ${formData.creatorAmount} ETH，工作者将获得 ${formData.workerAmount} ETH`,
      onOk: async () => {
        setLoading(true);
        try {
          // 获取任务托管合约实例
          const taskEscrowContract = new ethers.Contract(
            taskEscrowAddress!,
            TaskEscrowABI,
            signer
          );

          // 解决争议
          const creatorAmount = ethers.utils.parseEther(formData.creatorAmount);
          const workerAmount = ethers.utils.parseEther(formData.workerAmount);
          
          const resolveDisputeTx = await taskEscrowContract.resolveDispute(
            taskId,
            creatorAmount,
            workerAmount
          );
          await resolveDisputeTx.wait();
          toast.success('争议已解决');

          if (onSuccess) {
            onSuccess();
          } else {
            router.push(`/tasks/${taskId}`);
          }
        } catch (error: any) {
          console.error('解决争议失败:', error);
          toast.error(`解决争议失败: ${error.message || '未知错误'}`);
        } finally {
          setLoading(false);
        }
      },
    });
  };

  // 渲染创建任务表单
  const renderCreateTaskForm = () => (
    <div className="space-y-4">
      <h2 className="text-xl font-bold">创建新任务</h2>
      
      <div>
        <label className="block mb-1">任务标题</label>
        <Input 
          name="title"
          value={formData.title}
          onChange={handleInputChange}
          placeholder="输入任务标题"
        />
      </div>
      
      <div>
        <label className="block mb-1">任务描述</label>
        <Textarea 
          name="description"
          value={formData.description}
          onChange={handleInputChange}
          placeholder="详细描述任务内容和要求"
          rows={4}
        />
      </div>
      
      <div>
        <label className="block mb-1">奖励金额 (ETH)</label>
        <Input 
          name="reward"
          value={formData.reward}
          onChange={handleInputChange}
          placeholder="0.1"
          type="number"
          step="0.01"
        />
      </div>
      
      <div>
        <label className="block mb-1">截止日期</label>
        <Input 
          name="deadline"
          value={formData.deadline}
          onChange={handleInputChange}
          type="datetime-local"
        />
      </div>
      
      <div>
        <label className="block mb-1">最大参与人数</label>
        <Input 
          name="maxParticipants"
          value={formData.maxParticipants}
          onChange={handleInputChange}
          placeholder="1"
          type="number"
          min="1"
        />
      </div>
      
      <div>
        <label className="block mb-1">任务类型</label>
        <Select
          value={formData.taskType}
          onChange={(value) => handleSelectChange(value, 'taskType')}
          style={{ width: '100%' }}
        >
          {Object.entries(taskTypeMap).map(([key, value]) => (
            <Option key={key} value={key}>{value}</Option>
          ))}
        </Select>
      </div>
      
      <div>
        <label className="block mb-1">要求详情</label>
        <Textarea 
          name="requirementText"
          value={formData.requirementText}
          onChange={handleInputChange}
          placeholder="详细描述完成任务需要满足的要求"
          rows={3}
        />
      </div>
      
      <div>
        <label className="block mb-1">附件</label>
        <Upload 
          beforeUpload={() => false}
          onChange={handleFileUpload}
        >
          <Button icon={<UploadOutlined />}>上传文件</Button>
        </Upload>
        {formData.attachments.length > 0 && (
          <div className="mt-2">
            {formData.attachments.map((url, index) => (
              <div key={index} className="text-sm text-blue-500">{url}</div>
            ))}
          </div>
        )}
      </div>
      
      <div className="mt-6">
        <Button 
          type="primary" 
          onClick={handleCreateTask} 
          loading={loading}
          block
        >
          创建任务
        </Button>
      </div>
    </div>
  );

  // 渲染加入任务按钮
  const renderJoinTaskButton = () => (
    <div>
      {taskData && (
        <div className="mb-4">
          <h3 className="text-lg font-bold">{taskData.title}</h3>
          <p className="text-sm text-gray-500">奖励: {ethers.utils.formatEther(taskData.reward)} ETH</p>
          <div className="mt-2">
            <Tag color="blue">{taskTypeMap[taskData.task_type]}</Tag>
            <Tag color="green">{taskStatusMap[taskData.status]}</Tag>
          </div>
        </div>
      )}
      
      <Button 
        type="primary" 
        onClick={handleJoinTask} 
        loading={loading}
        block
      >
        加入任务
      </Button>
    </div>
  );

  // 渲染提交任务表单
  const renderSubmitTaskForm = () => (
    <div className="space-y-4">
      <h2 className="text-xl font-bold">提交任务</h2>
      
      {taskData && (
        <div className="mb-4">
          <h3 className="text-lg">{taskData.title}</h3>
          <div className="mt-1">
            <Tag color="blue">{taskTypeMap[taskData.task_type]}</Tag>
          </div>
        </div>
      )}
      
      <div>
        <label className="block mb-1">提交内容</label>
        <Textarea 
          name="submissionText"
          value={formData.submissionText}
          onChange={handleInputChange}
          placeholder="描述您的工作成果"
          rows={4}
        />
      </div>
      
      <div>
        <label className="block mb-1">提交URL</label>
        <Input 
          name="submissionUrl"
          value={formData.submissionUrl}
          onChange={handleInputChange}
          placeholder="相关链接或作品URL"
        />
      </div>
      
      <div>
        <label className="block mb-1">附件</label>
        <Upload 
          beforeUpload={() => false}
          onChange={handleFileUpload}
        >
          <Button icon={<UploadOutlined />}>上传文件</Button>
        </Upload>
      </div>
      
      <div className="mt-6">
        <Button 
          type="primary" 
          onClick={handleSubmitTask} 
          loading={loading}
          block
        >
          提交任务
        </Button>
      </div>
    </div>
  );

  // 渲染验证任务表单
  const renderVerifyTaskForm = () => (
    <div className="space-y-4">
      <h2 className="text-xl font-bold">验证任务</h2>
      
      {taskData && (
        <div className="mb-4">
          <h3 className="text-lg">{taskData.title}</h3>
          {taskData.submissions && taskData.submissions.length > 0 && (
            <div className="mt-4 p-4 bg-gray-50 rounded-md">
              <h4 className="font-medium">提交内容:</h4>
              <p className="mt-2">{JSON.parse(taskData.submissions[0].content).text}</p>
              {JSON.parse(taskData.submissions[0].content).url && (
                <p className="mt-1">
                  <a 
                    href={JSON.parse(taskData.submissions[0].content).url} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-blue-500 underline"
                  >
                    查看提交链接
                  </a>
                </p>
              )}
            </div>
          )}
        </div>
      )}
      
      <div>
        <label className="block mb-1">反馈意见</label>
        <Textarea 
          name="feedback"
          value={formData.feedback}
          onChange={handleInputChange}
          placeholder="可选的反馈意见"
          rows={3}
        />
      </div>
      
      <div className="flex space-x-4 mt-6">
        <Button 
          type="primary" 
          onClick={() => handleVerifyTask(true)} 
          icon={<CheckCircleOutlined />}
          loading={loading}
          style={{ backgroundColor: '#52c41a', borderColor: '#52c41a' }}
        >
          通过
        </Button>
        <Button 
          danger
          onClick={() => handleVerifyTask(false)} 
          icon={<CloseCircleOutlined />}
          loading={loading}
        >
          拒绝
        </Button>
      </div>
    </div>
  );

  // 渲染发起争议表单
  const renderDisputeForm = () => (
    <div className="space-y-4">
      <h2 className="text-xl font-bold">发起争议</h2>
      <Alert
        message="重要提示"
        description="发起争议后，平台管理员将介入处理。请确保您有充分的理由支持您的争议。"
        type="warning"
        showIcon
        className="mb-4"
      />
      
      {taskData && (
        <div className="mb-4">
          <h3 className="text-lg">{taskData.title}</h3>
          <div className="mt-1">
            <Tag color="blue">{taskTypeMap[taskData.task_type]}</Tag>
            <Tag color="red">争议中</Tag>
          </div>
        </div>
      )}
      
      <div>
        <label className="block mb-1">争议理由</label>
        <Textarea 
          name="feedback"
          value={formData.feedback}
          onChange={handleInputChange}
          placeholder="请详细描述您发起争议的原因..."
          rows={4}
        />
      </div>
      
      <div className="mt-6">
        <Button 
          danger
          onClick={handleDisputeTask} 
          loading={loading}
          block
        >
          发起争议
        </Button>
      </div>
    </div>
  );

  // 渲染解决争议表单
  const renderResolveDisputeForm = () => (
    <div className="space-y-4">
      <h2 className="text-xl font-bold">解决争议</h2>
      <Alert
        message="重要提示"
        description="作为管理员，您需要公正地分配奖励资金。请确保您已充分了解争议情况。"
        type="warning"
        showIcon
        className="mb-4"
      />
      
      {taskData && (
        <div className="mb-4">
          <h3 className="text-lg">{taskData.title}</h3>
          <p className="text-sm text-gray-500">总奖励: {ethers.utils.formatEther(taskData.reward)} ETH</p>
          <div className="mt-1">
            <Tag color="red">争议中</Tag>
          </div>
        </div>
      )}
      
      <div>
        <label className="block mb-1">给创建者的金额 (ETH)</label>
        <Input 
          name="creatorAmount"
          value={formData.creatorAmount}
          onChange={handleInputChange}
          placeholder="0.05"
          type="number"
          step="0.01"
        />
      </div>
      
      <div>
        <label className="block mb-1">给工作者的金额 (ETH)</label>
        <Input 
          name="workerAmount"
          value={formData.workerAmount}
          onChange={handleInputChange}
          placeholder="0.05"
          type="number"
          step="0.01"
        />
      </div>
      
      <div className="mt-6">
        <Button 
          type="primary" 
          onClick={handleResolveDispute} 
          loading={loading}
          block
        >
          解决争议
        </Button>
      </div>
    </div>
  );

  // 根据模式渲染不同组件
  const renderContent = () => {
    if (loading && !taskData && mode !== 'create') {
      return <div className="flex justify-center my-8"><Spin size="large" /></div>;
    }

    switch (mode) {
      case 'create':
        return renderCreateTaskForm();
      case 'join':
        return renderJoinTaskButton();
      case 'submit':
        return renderSubmitTaskForm();
      case 'verify':
        return renderVerifyTaskForm();
      case 'dispute':
        return renderDisputeForm();
      case 'resolve':
        return renderResolveDisputeForm();
      default:
        return <div>未知操作模式</div>;
    }
  };

  return (
    <div className="max-w-2xl mx-auto p-6 bg-white rounded-lg shadow-md">
      {renderContent()}
    </div>
  );
};

export default TaskActions; 