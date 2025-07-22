'use client';

import { useState, useEffect } from 'react';
import { useWallet } from '@/contexts/WalletContext';
import {
  FaHammer,
  FaFileUpload,
  FaUserShield,
  FaTimes,
  FaCheck,
  FaTimesCircle,
  FaBalanceScale,
  FaUser,
} from 'react-icons/fa';
import { toast } from 'react-hot-toast';

// 纠纷状态类型
type DisputeStatus = 'active' | 'voting' | 'resolved';

// 纠纷类型
interface Dispute {
  id: string;
  tradeId: string;
  createdBy: string;
  createdByName: string;
  opponent: string;
  opponentName: string;
  description: string;
  evidence: string[];
  opponentEvidence: string[];
  votes: {
    userVoted: string;
    votedFor: 'plaintiff' | 'defendant';
  }[];
  status: DisputeStatus;
  createdAt: string;
  resolvedAt?: string;
  resolution?: 'plaintiff' | 'defendant';
}

// 纠纷系统组件
const DisputeSystem = () => {
  const { wallet, balance } = useWallet();
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showVoteModal, setShowVoteModal] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [disputeDescription, setDisputeDescription] = useState('');
  const [disputeEvidence, setDisputeEvidence] = useState<File[]>([]);
  const [selectedDispute, setSelectedDispute] = useState<Dispute | null>(null);
  const [voteFor, setVoteFor] = useState<'plaintiff' | 'defendant' | null>(
    null,
  );

  // 模拟纠纷列表
  const [disputes, setDisputes] = useState<Dispute[]>([
    {
      id: 'disp-001',
      tradeId: 'tx-123456',
      createdBy: '0x1a2b...3c4d',
      createdByName: '用户A',
      opponent: '0x5e6f...7g8h',
      opponentName: '商人B',
      description:
        '我已经付款但商人没有发货，已经24小时了。我已上传付款截图作为证据。',
      evidence: ['evidence1.jpg'],
      opponentEvidence: ['evidence2.jpg'],
      votes: [
        { userVoted: '0xabc1', votedFor: 'plaintiff' },
        { userVoted: '0xabc2', votedFor: 'plaintiff' },
        { userVoted: '0xabc3', votedFor: 'defendant' },
        { userVoted: '0xabc4', votedFor: 'plaintiff' },
      ],
      status: 'voting',
      createdAt: '2023-06-15T10:30:00Z',
    },
    {
      id: 'disp-002',
      tradeId: 'tx-789012',
      createdBy: '0x9i10...11j12',
      createdByName: '商人C',
      opponent: '0xab12...cd34',
      opponentName: '用户D',
      description:
        '用户声称已付款，但我没有收到任何付款，也没有收到任何付款证明。',
      evidence: ['evidence3.jpg'],
      opponentEvidence: [],
      votes: [
        { userVoted: '0xabc5', votedFor: 'defendant' },
        { userVoted: '0xabc6', votedFor: 'plaintiff' },
        { userVoted: '0xabc7', votedFor: 'defendant' },
      ],
      status: 'active',
      createdAt: '2023-06-16T14:20:00Z',
    },
    {
      id: 'disp-003',
      tradeId: 'tx-345678',
      createdBy: '0xef56...gh78',
      createdByName: '用户E',
      opponent: '0xij90...kl12',
      opponentName: '商人F',
      description: '商人发送的货物数量不足，少了约20%的数量。',
      evidence: ['evidence4.jpg', 'evidence5.jpg'],
      opponentEvidence: ['evidence6.jpg'],
      votes: [
        { userVoted: '0xabc8', votedFor: 'plaintiff' },
        { userVoted: '0xabc9', votedFor: 'plaintiff' },
        { userVoted: '0xabc10', votedFor: 'plaintiff' },
        { userVoted: '0xabc11', votedFor: 'defendant' },
        { userVoted: '0xabc12', votedFor: 'plaintiff' },
        { userVoted: '0xabc13', votedFor: 'plaintiff' },
      ],
      status: 'resolved',
      createdAt: '2023-06-14T09:15:00Z',
      resolvedAt: '2023-06-17T11:45:00Z',
      resolution: 'plaintiff',
    },
  ]);

  // 创建纠纷
  const handleCreateDispute = () => {
    if (!wallet.isConnected) {
      toast.error('请先连接钱包');
      return;
    }

    if (disputeDescription.trim() === '') {
      toast.error('请描述纠纷情况');
      return;
    }

    if (disputeEvidence.length === 0) {
      toast.error('请上传至少一张证据截图');
      return;
    }

    setIsProcessing(true);

    // 模拟创建纠纷
    setTimeout(() => {
      setIsProcessing(false);
      setShowCreateModal(false);

      // 创建新纠纷
      const newDispute: Dispute = {
        id: `disp-${Date.now()}`,
        tradeId: `tx-${Math.floor(Math.random() * 1000000)}`,
        createdBy: wallet.address || '0x1234',
        createdByName: '您',
        opponent: '0x5e6f...7g8h',
        opponentName: '商人X',
        description: disputeDescription,
        evidence: disputeEvidence.map((file) => file.name),
        opponentEvidence: [],
        votes: [],
        status: 'active',
        createdAt: new Date().toISOString(),
      };

      setDisputes([newDispute, ...disputes]);
      setDisputeDescription('');
      setDisputeEvidence([]);

      toast.success('纠纷创建成功，等待对方回应和用户投票');
    }, 2000);
  };

  // 处理投票
  const handleVote = () => {
    if (!wallet.isConnected || !selectedDispute || !voteFor) {
      return;
    }

    if (balance.sm < 1000) {
      toast.error('您的SM余额不足1000，无法参与投票');
      return;
    }

    setIsProcessing(true);

    // 模拟投票过程
    setTimeout(() => {
      setIsProcessing(false);
      setShowVoteModal(false);

      // 添加投票
      const updatedDisputes = disputes.map((dispute) => {
        if (dispute.id === selectedDispute.id) {
          const updatedVotes = [
            ...dispute.votes,
            {
              userVoted: wallet.address || '0xuser',
              votedFor: voteFor,
            },
          ];

          // 检查是否达到10票或者一方获得6票
          let newStatus = dispute.status;
          let resolution = undefined;

          const plaintiffVotes = updatedVotes.filter(
            (v) => v.votedFor === 'plaintiff',
          ).length;
          const defendantVotes = updatedVotes.filter(
            (v) => v.votedFor === 'defendant',
          ).length;

          if (
            updatedVotes.length >= 10 ||
            plaintiffVotes >= 6 ||
            defendantVotes >= 6
          ) {
            newStatus = 'resolved';
            resolution =
              plaintiffVotes > defendantVotes ? 'plaintiff' : 'defendant';
          }

          return {
            ...dispute,
            votes: updatedVotes,
            status: newStatus,
            resolvedAt:
              newStatus === 'resolved' ? new Date().toISOString() : undefined,
            resolution: resolution,
          };
        }
        return dispute;
      });

      setDisputes(updatedDisputes);
      setSelectedDispute(null);
      setVoteFor(null);

      toast.success('投票成功，感谢您的参与');
    }, 2000);
  };

  // 上传证据文件
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const fileArray = Array.from(e.target.files);
      if (fileArray.length + disputeEvidence.length > 3) {
        toast.error('最多上传3张证据图片');
        return;
      }
      setDisputeEvidence([...disputeEvidence, ...fileArray]);
    }
  };

  // 删除证据文件
  const removeFile = (index: number) => {
    setDisputeEvidence(disputeEvidence.filter((_, i) => i !== index));
  };

  // 判断用户是否可以投票
  const canUserVote = (dispute: Dispute) => {
    if (dispute.status !== 'active' && dispute.status !== 'voting')
      return false;
    if (!wallet.isConnected || balance.sm < 1000) return false;
    if (
      dispute.createdBy === wallet.address ||
      dispute.opponent === wallet.address
    )
      return false;
    if (dispute.votes.some((v) => v.userVoted === wallet.address)) return false;
    return true;
  };

  // 获取纠纷状态标签
  const getStatusLabel = (status: DisputeStatus, resolution?: string) => {
    switch (status) {
      case 'active':
        return (
          <span className="bg-blue-500/20 text-blue-400 px-2 py-1 rounded-full text-xs">
            等待回应
          </span>
        );
      case 'voting':
        return (
          <span className="bg-yellow-500/20 text-yellow-400 px-2 py-1 rounded-full text-xs">
            投票中
          </span>
        );
      case 'resolved':
        return resolution === 'plaintiff' ? (
          <span className="bg-green-500/20 text-green-400 px-2 py-1 rounded-full text-xs">
            发起方胜诉
          </span>
        ) : (
          <span className="bg-red-500/20 text-red-400 px-2 py-1 rounded-full text-xs">
            对方胜诉
          </span>
        );
      default:
        return null;
    }
  };

  return (
    <div className="mb-10">
      {/* 纠纷解决系统 */}
      <div className="tech-card mb-8">
        <div className="flex items-start">
          <div className="p-3 rounded-md bg-gray-800/70 mr-4">
            <FaHammer />
          </div>
          <div className="flex-1">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold">纠纷解决中心</h2>
              <button
                onClick={() => setShowCreateModal(true)}
                className="neon-button py-1.5 px-4 text-sm"
                disabled={!wallet.isConnected}
              >
                发起纠纷
              </button>
            </div>

            <p className="text-gray-300 mb-6">
              平台纠纷由社区共同裁决，参与投票需持有不少于1000
              SM。累计参与投票100次可获得&quot;正义铁拳&quot;称号。
            </p>

            {/* 纠纷列表 */}
            <div className="space-y-6">
              {disputes.length > 0 ? (
                disputes.map((dispute) => (
                  <div key={dispute.id} className="tech-card p-4">
                    <div className="flex justify-between items-start">
                      <div>
                        <h3 className="font-medium mb-1 flex items-center">
                          纠纷 #{dispute.id.split('-')[1]}
                          <span className="ml-3">
                            {getStatusLabel(dispute.status, dispute.resolution)}
                          </span>
                        </h3>
                        <div className="text-sm text-gray-400 mb-3">
                          创建于 {new Date(dispute.createdAt).toLocaleString()}
                          {dispute.resolvedAt &&
                            ` · 解决于 ${new Date(dispute.resolvedAt).toLocaleString()}`}
                        </div>
                      </div>

                      {/* 投票按钮 */}
                      {canUserVote(dispute) && (
                        <button
                          onClick={() => {
                            setSelectedDispute(dispute);
                            setShowVoteModal(true);
                          }}
                          className="py-1 px-3 bg-primary/80 hover:bg-primary text-black font-medium rounded-md text-sm"
                        >
                          参与投票
                        </button>
                      )}
                    </div>

                    <div className="flex flex-col md:flex-row md:space-x-4 mb-4">
                      <div className="flex-1 p-3 bg-gray-800/50 rounded-md mb-3 md:mb-0">
                        <div className="text-sm text-gray-400 mb-1">发起方</div>
                        <div className="font-medium">
                          {dispute.createdByName}
                        </div>
                        <div className="text-xs text-gray-500">
                          {dispute.createdBy}
                        </div>
                      </div>
                      <div className="flex-1 p-3 bg-gray-800/50 rounded-md">
                        <div className="text-sm text-gray-400 mb-1">对方</div>
                        <div className="font-medium">
                          {dispute.opponentName}
                        </div>
                        <div className="text-xs text-gray-500">
                          {dispute.opponent}
                        </div>
                      </div>
                    </div>

                    <div className="mb-4">
                      <div className="text-sm text-gray-400 mb-1">纠纷描述</div>
                      <div className="p-3 bg-gray-800/30 rounded-md text-sm">
                        {dispute.description}
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                      <div>
                        <div className="text-sm text-gray-400 mb-1">
                          发起方证据 ({dispute.evidence.length})
                        </div>
                        <div className="flex flex-wrap gap-2">
                          {dispute.evidence.map((evidence, index) => (
                            <div
                              key={index}
                              className="bg-gray-800 p-1 rounded"
                            >
                              <div className="w-20 h-20 bg-gray-700 rounded flex items-center justify-center">
                                <span className="text-xs text-gray-500">
                                  证据{index + 1}
                                </span>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>

                      <div>
                        <div className="text-sm text-gray-400 mb-1">
                          对方证据 ({dispute.opponentEvidence.length})
                        </div>
                        <div className="flex flex-wrap gap-2">
                          {dispute.opponentEvidence.length > 0 ? (
                            dispute.opponentEvidence.map((evidence, index) => (
                              <div
                                key={index}
                                className="bg-gray-800 p-1 rounded"
                              >
                                <div className="w-20 h-20 bg-gray-700 rounded flex items-center justify-center">
                                  <span className="text-xs text-gray-500">
                                    证据{index + 1}
                                  </span>
                                </div>
                              </div>
                            ))
                          ) : (
                            <div className="text-sm text-gray-500">
                              暂无对方证据
                            </div>
                          )}
                        </div>
                      </div>
                    </div>

                    <div>
                      <div className="text-sm text-gray-400 mb-2">
                        投票情况 ({dispute.votes.length}/10)
                      </div>
                      <div className="relative h-2 bg-gray-700 rounded-full overflow-hidden mb-2">
                        {dispute.votes.length > 0 && (
                          <>
                            <div
                              className="absolute left-0 top-0 h-full bg-green-500"
                              style={{
                                width: `${(dispute.votes.filter((v) => v.votedFor === 'plaintiff').length / 10) * 100}%`,
                              }}
                            ></div>
                            <div
                              className="absolute right-0 top-0 h-full bg-red-500"
                              style={{
                                width: `${(dispute.votes.filter((v) => v.votedFor === 'defendant').length / 10) * 100}%`,
                              }}
                            ></div>
                          </>
                        )}
                      </div>
                      <div className="flex justify-between text-xs">
                        <div>
                          {
                            dispute.votes.filter(
                              (v) => v.votedFor === 'plaintiff',
                            ).length
                          }{' '}
                          票支持发起方
                        </div>
                        <div>
                          {
                            dispute.votes.filter(
                              (v) => v.votedFor === 'defendant',
                            ).length
                          }{' '}
                          票支持对方
                        </div>
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-10 text-gray-400">
                  暂无纠纷记录
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* 创建纠纷模态框 */}
      {showCreateModal && (
        <div className="fixed inset-0 flex items-center justify-center z-50 bg-black/70 backdrop-blur-sm">
          <div className="tech-card p-6 max-w-md w-full mx-4 relative">
            <button
              onClick={() => setShowCreateModal(false)}
              className="absolute top-3 right-3 text-gray-400 hover:text-white"
            >
              <FaTimes />
            </button>

            <h3 className="text-xl font-bold mb-4">发起纠纷</h3>
            <p className="text-gray-300 mb-6">
              请详细描述您的纠纷情况，并上传相关证据截图。社区用户将根据双方提供的信息进行投票裁决。
            </p>

            <div className="mb-4">
              <label className="block text-gray-400 mb-2">纠纷描述</label>
              <textarea
                value={disputeDescription}
                onChange={(e) => setDisputeDescription(e.target.value)}
                className="w-full px-4 py-2 rounded-md bg-gray-800 border border-gray-700 focus:border-primary focus:outline-none h-32"
                placeholder="请详细描述纠纷情况，例如：交易时间、金额、问题等..."
                required
              />
            </div>

            <div className="mb-6">
              <label className="block text-gray-400 mb-2">
                上传证据 (最多3张)
              </label>
              <div className="flex flex-wrap gap-2 mb-3">
                {disputeEvidence.map((file, index) => (
                  <div key={index} className="relative bg-gray-800 p-1 rounded">
                    <div className="w-20 h-20 bg-gray-700 rounded flex items-center justify-center">
                      <span className="text-xs text-gray-500">{file.name}</span>
                    </div>
                    <button
                      onClick={() => removeFile(index)}
                      className="absolute -top-2 -right-2 w-5 h-5 bg-red-500 rounded-full flex items-center justify-center text-white text-xs"
                    >
                      <FaTimes />
                    </button>
                  </div>
                ))}

                {disputeEvidence.length < 3 && (
                  <label className="w-20 h-20 bg-gray-800 border border-dashed border-gray-600 rounded flex flex-col items-center justify-center cursor-pointer hover:bg-gray-700 transition-colors">
                    <FaFileUpload className="text-gray-500 mb-1" />
                    <span className="text-xs text-gray-500">上传</span>
                    <input
                      type="file"
                      className="hidden"
                      accept="image/*"
                      onChange={handleFileSelect}
                    />
                  </label>
                )}
              </div>
              <p className="text-xs text-gray-500">
                支持 JPG, PNG 格式，每张图片不超过 2MB
              </p>
            </div>

            <div className="mb-6 p-3 bg-yellow-500/10 border border-yellow-500/30 rounded-md">
              <h4 className="font-medium text-yellow-400 mb-1">重要提示</h4>
              <ul className="text-xs text-gray-300 space-y-1">
                <li>• 请确保您提供的信息真实准确，虚假信息可能导致账户处罚</li>
                <li>• 纠纷结果由社区投票决定，10票或一方获得6票即可裁决</li>
                <li>• 若您为商人且纠纷失败，可能导致商人资格被取消</li>
              </ul>
            </div>

            <button
              onClick={handleCreateDispute}
              disabled={
                isProcessing ||
                disputeDescription.trim() === '' ||
                disputeEvidence.length === 0
              }
              className="neon-button w-full py-2.5"
            >
              {isProcessing ? '处理中...' : '提交纠纷'}
            </button>
          </div>
        </div>
      )}

      {/* 投票模态框 */}
      {showVoteModal && selectedDispute && (
        <div className="fixed inset-0 flex items-center justify-center z-50 bg-black/70 backdrop-blur-sm">
          <div className="tech-card p-6 max-w-md w-full mx-4 relative">
            <button
              onClick={() => {
                setShowVoteModal(false);
                setSelectedDispute(null);
                setVoteFor(null);
              }}
              className="absolute top-3 right-3 text-gray-400 hover:text-white"
            >
              <FaTimes />
            </button>

            <div className="text-center mb-6">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/20 text-primary mb-4">
                <FaBalanceScale className="w-8 h-8" />
              </div>
              <h3 className="text-xl font-bold mb-2">参与纠纷投票</h3>
              <p className="text-gray-300">
                请仔细阅读双方的纠纷描述和证据，公正地做出您的判断。
              </p>
            </div>

            <div className="mb-6">
              <h4 className="font-medium text-primary mb-3">纠纷详情</h4>
              <div className="p-3 bg-gray-800/40 rounded-md mb-4">
                <div className="text-sm text-gray-400 mb-1">纠纷描述</div>
                <p className="text-sm">{selectedDispute.description}</p>
              </div>

              <div className="grid grid-cols-2 gap-4 mb-4">
                <div className="p-3 bg-gray-800/40 rounded-md">
                  <div className="text-sm text-gray-400 mb-1">发起方</div>
                  <div className="font-medium">
                    {selectedDispute.createdByName}
                  </div>
                  <div className="text-xs text-gray-500 mb-2">
                    {selectedDispute.createdBy}
                  </div>
                  <div className="text-xs text-gray-400">
                    证据: {selectedDispute.evidence.length}张
                  </div>
                </div>

                <div className="p-3 bg-gray-800/40 rounded-md">
                  <div className="text-sm text-gray-400 mb-1">对方</div>
                  <div className="font-medium">
                    {selectedDispute.opponentName}
                  </div>
                  <div className="text-xs text-gray-500 mb-2">
                    {selectedDispute.opponent}
                  </div>
                  <div className="text-xs text-gray-400">
                    证据: {selectedDispute.opponentEvidence.length}张
                  </div>
                </div>
              </div>

              <div className="text-sm text-gray-400 mb-2">
                投票进度 ({selectedDispute.votes.length}/10)
              </div>
              <div className="relative h-2 bg-gray-700 rounded-full overflow-hidden mb-1">
                {selectedDispute.votes.length > 0 && (
                  <>
                    <div
                      className="absolute left-0 top-0 h-full bg-green-500"
                      style={{
                        width: `${(selectedDispute.votes.filter((v) => v.votedFor === 'plaintiff').length / 10) * 100}%`,
                      }}
                    ></div>
                    <div
                      className="absolute right-0 top-0 h-full bg-red-500"
                      style={{
                        width: `${(selectedDispute.votes.filter((v) => v.votedFor === 'defendant').length / 10) * 100}%`,
                      }}
                    ></div>
                  </>
                )}
              </div>
              <div className="flex justify-between text-xs mb-4">
                <div>
                  {
                    selectedDispute.votes.filter(
                      (v) => v.votedFor === 'plaintiff',
                    ).length
                  }{' '}
                  票支持发起方
                </div>
                <div>
                  {
                    selectedDispute.votes.filter(
                      (v) => v.votedFor === 'defendant',
                    ).length
                  }{' '}
                  票支持对方
                </div>
              </div>
            </div>

            <div className="mb-6">
              <div className="text-gray-400 mb-3">您的投票</div>
              <div className="grid grid-cols-2 gap-4">
                <button
                  onClick={() => setVoteFor('plaintiff')}
                  className={`p-3 border rounded-md flex flex-col items-center transition-colors ${
                    voteFor === 'plaintiff'
                      ? 'border-green-500 bg-green-500/10'
                      : 'border-gray-700 bg-gray-800 hover:border-gray-600'
                  }`}
                >
                  <FaCheck />
                  <span className="font-medium">支持发起方</span>
                  <span className="text-xs text-gray-400 mt-1">
                    {selectedDispute.createdByName}
                  </span>
                </button>

                <button
                  onClick={() => setVoteFor('defendant')}
                  className={`p-3 border rounded-md flex flex-col items-center transition-colors ${
                    voteFor === 'defendant'
                      ? 'border-red-500 bg-red-500/10'
                      : 'border-gray-700 bg-gray-800 hover:border-gray-600'
                  }`}
                >
                  <FaTimes />
                  <span className="font-medium">支持对方</span>
                  <span className="text-xs text-gray-400 mt-1">
                    {selectedDispute.opponentName}
                  </span>
                </button>
              </div>
            </div>

            <div className="mb-6 p-3 bg-gray-800/40 rounded-md border border-gray-700">
              <div className="flex items-center mb-2">
                <FaUser />
                <span className="text-primary font-medium">参与条件</span>
              </div>
              <ul className="text-xs text-gray-300 space-y-1">
                <li>• 您需要持有至少1000 SM才能参与投票</li>
                <li>• 您当前持有: {balance.sm} SM</li>
                <li>• 参与投票将获得&quot;正义之手&quot;称号</li>
                <li>• 累计投票100次可获得&quot;正义铁拳&quot;称号</li>
              </ul>
            </div>

            <button
              onClick={handleVote}
              disabled={isProcessing || !voteFor || balance.sm < 1000}
              className="neon-button w-full py-2.5"
            >
              {isProcessing ? '处理中...' : '提交投票'}
            </button>

            {balance.sm < 1000 && (
              <p className="text-red-400 text-xs mt-3 text-center">
                您的SM余额不足1000，无法参与投票
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default DisputeSystem;
