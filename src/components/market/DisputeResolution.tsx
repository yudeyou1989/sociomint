import { useState } from 'react';
// // // import {
  "🔨",
  FaUpload,
  FaFileAlt,
  "✕",
  "ℹ️",
} from 'react-icons/fa'; // 临时注释以修复构建 // 临时注释以修复构建 // 临时注释以修复构建

// 纠纷状态类型
type DisputeStatus = 'pending' | 'reviewing' | 'decided' | 'closed';

// 纠纷类型
interface Dispute {
  id: string;
  orderId: string;
  amount: number;
  currency: 'SM' | '小红花';
  reason: string;
  description: string;
  evidence: string[];
  status: DisputeStatus;
  createdAt: Date;
  updatedAt: Date;
  resolution?: string;
  outcome?: 'buyer' | 'seller' | 'split';
}

// 纠纷解决组件
const DisputeResolution = () => {
  const [activeTab, setActiveTab] = useState<'submit' | 'list'>('submit');
  const [showGuide, setShowGuide] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // 表单状态
  const [orderID, setOrderID] = useState('');
  const [reason, setReason] = useState('');
  const [description, setDescription] = useState('');
  const [files, setFiles] = useState<File[]>([]);

  // 模拟纠纷列表
  const [disputes, setDisputes] = useState<Dispute[]>([
    {
      id: 'D202504210001',
      orderId: 'T202504150023',
      amount: 5000,
      currency: 'SM',
      reason: '未收到付款',
      description: '完成交易后对方未确认，已等待48小时',
      evidence: ['聊天记录.jpg', '交易截图.png'],
      status: 'reviewing',
      createdAt: new Date(2025, 3, 21, 9, 30),
      updatedAt: new Date(2025, 3, 21, 14, 15),
    },
    {
      id: 'D202504150002',
      orderId: 'T202504100015',
      amount: 1500,
      currency: '小红花',
      reason: '服务质量不符',
      description: '订单要求完成10个转发，但只完成了6个',
      evidence: ['任务要求.jpg', '完成结果.png'],
      status: 'decided',
      createdAt: new Date(2025, 3, 15, 16, 20),
      updatedAt: new Date(2025, 3, 18, 11, 30),
      resolution: '经审核确认，卖家只完成了订单的60%。裁定部分退款。',
      outcome: 'split',
    },
  ]);

  // 处理文件上传
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const fileArray = Array.from(e.target.files);
      setFiles([...files, ...fileArray]);
    }
  };

  // 移除已选文件
  const removeFile = (index: number) => {
    const newFiles = [...files];
    newFiles.splice(index, 1);
    setFiles(newFiles);
  };

  // 提交纠纷
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!orderID || !reason || !description) {
      alert('请填写所有必填字段');
      return;
    }

    setIsSubmitting(true);

    // 模拟提交过程
    setTimeout(() => {
      // 创建新纠纷
      const newDispute: Dispute = {
        id: `D${Date.now().toString().substring(3, 13)}`,
        orderId: orderID,
        amount: Math.floor(Math.random() * 5000) + 500,
        currency: Math.random() > 0.5 ? 'SM' : '小红花',
        reason,
        description,
        evidence: files.map((file) => file.name),
        status: 'pending',
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      // 添加到列表
      setDisputes([newDispute, ...disputes]);

      // 重置表单
      setOrderID('');
      setReason('');
      setDescription('');
      setFiles([]);
      setIsSubmitting(false);

      // 切换到列表查看
      setActiveTab('list');

      alert('纠纷提交成功，请等待平台审核');
    }, 2000);
  };

  // 渲染状态标签
  const renderStatusBadge = (status: DisputeStatus) => {
    switch (status) {
      case 'pending':
        return (
          <span className="px-2 py-1 text-xs rounded-full bg-yellow-500/20 text-yellow-500">
            等待处理
          </span>
        );
      case 'reviewing':
        return (
          <span className="px-2 py-1 text-xs rounded-full bg-blue-500/20 text-blue-500">
            审核中
          </span>
        );
      case 'decided':
        return (
          <span className="px-2 py-1 text-xs rounded-full bg-green-500/20 text-green-500">
            已裁决
          </span>
        );
      case 'closed':
        return (
          <span className="px-2 py-1 text-xs rounded-full bg-gray-500/20 text-gray-400">
            已关闭
          </span>
        );
      default:
        return null;
    }
  };

  // 渲染结果标签
  const renderOutcomeBadge = (outcome?: 'buyer' | 'seller' | 'split') => {
    if (!outcome) return null;

    switch (outcome) {
      case 'buyer':
        return (
          <span className="px-2 py-1 text-xs rounded-full bg-green-500/20 text-green-500">
            买方胜诉
          </span>
        );
      case 'seller':
        return (
          <span className="px-2 py-1 text-xs rounded-full bg-green-500/20 text-green-500">
            卖方胜诉
          </span>
        );
      case 'split':
        return (
          <span className="px-2 py-1 text-xs rounded-full bg-blue-500/20 text-blue-500">
            部分退款
          </span>
        );
      default:
        return null;
    }
  };

  return (
    <div className="mb-8">
      <div className="tech-card">
        <div className="flex items-start">
          <div className="p-3 rounded-md bg-gray-800/70 mr-4">
            🔨
          </div>
          <div className="flex-1">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold">交易纠纷解决</h2>
              <button
                onClick={() => setShowGuide(!showGuide)}
                className="flex items-center text-primary text-sm"
              >
                ℹ️
                {showGuide ? '隐藏指南' : '纠纷指南'}
              </button>
            </div>

            {showGuide && (
              <div className="mb-6 p-4 border border-gray-700 rounded-md bg-gray-800/30">
                <h4 className="font-medium text-primary mb-2">
                  纠纷解决流程指南
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                  <div>
                    <div className="font-medium text-gray-300 mb-1">
                      1. 提交纠纷
                    </div>
                    <p className="text-gray-400">
                      填写完整的纠纷信息，上传截图等证据。提交后系统将冻结交易资金。
                    </p>
                  </div>
                  <div>
                    <div className="font-medium text-gray-300 mb-1">
                      2. 审核仲裁
                    </div>
                    <p className="text-gray-400">
                      平台仲裁团队将在48小时内审核您的纠纷，可能会要求双方提供更多信息。
                    </p>
                  </div>
                  <div>
                    <div className="font-medium text-gray-300 mb-1">
                      3. 执行裁决
                    </div>
                    <p className="text-gray-400">
                      仲裁结果公布后，系统将自动执行资金划转，解决纠纷。
                    </p>
                  </div>
                </div>
                <div className="mt-3 text-xs text-yellow-400">
                  提示：恶意提交纠纷可能导致账户惩罚，请确保您的纠纷理由真实有效。
                </div>
              </div>
            )}

            <div className="mb-6">
              <div className="flex border-b border-gray-700">
                <button
                  onClick={() => setActiveTab('submit')}
                  className={`py-2 px-4 font-medium text-sm ${activeTab === 'submit' ? 'text-primary border-b-2 border-primary' : 'text-gray-400'}`}
                >
                  提交纠纷
                </button>
                <button
                  onClick={() => setActiveTab('list')}
                  className={`py-2 px-4 font-medium text-sm ${activeTab === 'list' ? 'text-primary border-b-2 border-primary' : 'text-gray-400'}`}
                >
                  我的纠纷 ({disputes.length})
                </button>
              </div>
            </div>

            {activeTab === 'submit' ? (
              <form onSubmit={handleSubmit}>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                  <div>
                    <label className="block text-gray-300 mb-2">
                      订单编号 *
                    </label>
                    <input
                      type="text"
                      value={orderID}
                      onChange={(e) => setOrderID(e.target.value)}
                      className="w-full bg-black/50 border border-gray-800 rounded-md py-2 px-3 text-white"
                      placeholder="输入交易订单编号"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-gray-300 mb-2">
                      纠纷原因 *
                    </label>
                    <select
                      value={reason}
                      onChange={(e) => setReason(e.target.value)}
                      className="w-full bg-black/50 border border-gray-800 rounded-md py-2 px-3 text-white"
                      required
                    >
                      <option value="">选择纠纷原因</option>
                      <option value="未收到服务">未收到服务</option>
                      <option value="服务质量不符">服务质量不符</option>
                      <option value="未收到付款">未收到付款</option>
                      <option value="订单延迟">订单延迟</option>
                      <option value="沟通问题">沟通问题</option>
                      <option value="其他">其他</option>
                    </select>
                  </div>
                </div>

                <div className="mb-6">
                  <label className="block text-gray-300 mb-2">详细描述 *</label>
                  <textarea
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    className="w-full bg-black/50 border border-gray-800 rounded-md py-2 px-3 text-white h-32"
                    placeholder="请详细描述纠纷情况，包括时间、经过和您的诉求"
                    required
                  ></textarea>
                </div>

                <div className="mb-6">
                  <label className="block text-gray-300 mb-2">上传证据</label>
                  <div className="border border-dashed border-gray-700 rounded-md p-4 bg-black/30">
                    <div className="flex items-center justify-center">
                      <label className="cursor-pointer flex flex-col items-center">
                        <FaUpload className="text-primary mb-2" />
                        <span className="text-sm text-gray-400">
                          点击上传证据文件
                        </span>
                        <input
                          type="file"
                          onChange={handleFileChange}
                          className="hidden"
                          multiple
                        />
                      </label>
                    </div>

                    {files.length > 0 && (
                      <div className="mt-4">
                        <p className="text-xs text-gray-400 mb-2">
                          已选择 {files.length} 个文件：
                        </p>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                          {files.map((file, index) => (
                            <div
                              key={index}
                              className="flex items-center justify-between bg-gray-800/50 p-2 rounded-md text-xs"
                            >
                              <div className="flex items-center">
                                <FaFileAlt className="text-gray-400 mr-2" />
                                <span className="truncate max-w-[180px]">
                                  {file.name}
                                </span>
                              </div>
                              <button
                                type="button"
                                onClick={() => removeFile(index)}
                                className="text-red-400 hover:text-red-300"
                              >
                                ✕
                              </button>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex justify-end">
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className={`py-2 px-6 rounded-md flex items-center ${
                      isSubmitting
                        ? 'bg-gray-700 text-gray-400 cursor-not-allowed'
                        : 'neon-button'
                    }`}
                  >
                    {isSubmitting ? (
                      <>
                        <div className="w-4 h-4 border-2 border-t-transparent border-white rounded-full animate-spin mr-2"></div>
                        提交中...
                      </>
                    ) : (
                      <>提交纠纷</>
                    )}
                  </button>
                </div>
              </form>
            ) : (
              <div>
                {disputes.length === 0 ? (
                  <div className="text-center py-10">
                    <p className="text-gray-400">暂无纠纷记录</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {disputes.map((dispute) => (
                      <div
                        key={dispute.id}
                        className="p-4 bg-gray-800/30 border border-gray-700 rounded-md"
                      >
                        <div className="flex justify-between items-start mb-3">
                          <div>
                            <h3 className="font-medium">
                              纠纷单号: {dispute.id}
                            </h3>
                            <p className="text-sm text-gray-400">
                              关联订单: {dispute.orderId}
                            </p>
                          </div>
                          <div className="flex space-x-2">
                            {renderStatusBadge(dispute.status)}
                            {dispute.outcome &&
                              renderOutcomeBadge(dispute.outcome)}
                          </div>
                        </div>

                        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-3 text-sm">
                          <div>
                            <span className="text-gray-400 block">金额</span>
                            <span>
                              {dispute.amount} {dispute.currency}
                            </span>
                          </div>
                          <div>
                            <span className="text-gray-400 block">原因</span>
                            <span>{dispute.reason}</span>
                          </div>
                          <div>
                            <span className="text-gray-400 block">
                              提交时间
                            </span>
                            <span>{dispute.createdAt.toLocaleString()}</span>
                          </div>
                          <div>
                            <span className="text-gray-400 block">
                              更新时间
                            </span>
                            <span>{dispute.updatedAt.toLocaleString()}</span>
                          </div>
                        </div>

                        <div className="mb-3 text-sm">
                          <span className="text-gray-400 block mb-1">
                            详细描述
                          </span>
                          <p className="text-gray-300">{dispute.description}</p>
                        </div>

                        {dispute.evidence.length > 0 && (
                          <div className="mb-3">
                            <span className="text-gray-400 block mb-1 text-sm">
                              证据文件
                            </span>
                            <div className="flex flex-wrap gap-2">
                              {dispute.evidence.map((file, index) => (
                                <div
                                  key={index}
                                  className="bg-gray-800 px-2 py-1 rounded text-xs flex items-center"
                                >
                                  <FaFileAlt className="text-primary mr-1" />
                                  {file}
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        {dispute.resolution && (
                          <div className="p-3 bg-gray-800/80 rounded-md text-sm mt-3">
                            <span className="text-primary font-medium block mb-1">
                              仲裁结果
                            </span>
                            <p className="text-gray-300">
                              {dispute.resolution}
                            </p>
                          </div>
                        )}

                        {dispute.status === 'pending' && (
                          <div className="flex justify-end mt-3">
                            <button className="text-red-400 text-sm hover:text-red-300">
                              撤回纠纷
                            </button>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default DisputeResolution;
