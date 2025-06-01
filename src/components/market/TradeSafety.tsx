import { useState } from 'react';
import {
  FaShieldAlt,
  FaLock,
  FaExclamationTriangle,
  FaCheckCircle,
  FaTimes,
  FaInfoCircle,
} from 'react-icons/fa';

// 交易安全组件
const TradeSafety = () => {
  const [showDetails, setShowDetails] = useState(false);
  const [verificationStatus, setVerificationStatus] = useState<
    'none' | 'pending' | 'success' | 'failed'
  >('none');
  const [showRiskModal, setShowRiskModal] = useState(false);

  // 模拟安全验证过程
  const startVerification = () => {
    setVerificationStatus('pending');

    // 模拟API调用验证
    setTimeout(() => {
      // 随机结果 - 实际应用中应根据真实验证结果
      const result = Math.random() > 0.2 ? 'success' : 'failed';
      setVerificationStatus(result as 'success' | 'failed');
    }, 2000);
  };

  // 重置验证状态
  const resetVerification = () => {
    setVerificationStatus('none');
  };

  return (
    <div className="mb-8">
      <div className="tech-card">
        <div className="flex items-start">
          <div className="p-3 rounded-md bg-gray-800/70 mr-4">
            <FaShieldAlt className="w-6 h-6 text-primary" />
          </div>
          <div className="flex-1">
            <div className="flex justify-between items-center">
              <h2 className="text-xl font-bold mb-2">交易安全机制</h2>
              <button
                onClick={() => setShowDetails(!showDetails)}
                className="text-primary text-sm"
              >
                {showDetails ? '收起详情' : '查看详情'}
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
              {/* 担保交易机制 */}
              <div className="p-4 bg-gray-800/50 rounded-md border border-gray-700">
                <div className="flex items-center text-primary mb-2">
                  <FaLock className="mr-2" />
                  <span className="font-medium">担保交易</span>
                </div>
                <p className="text-sm text-gray-300">
                  系统将自动托管资金，确保双方安全完成交易。买方资金将被锁定，直到交易确认完成。
                </p>
                {showDetails && (
                  <div className="mt-3 text-xs text-gray-400">
                    <p>• 买方资金存入智能合约</p>
                    <p>• 卖方完成服务后资金自动解锁</p>
                    <p>• 出现争议时进入纠纷解决流程</p>
                  </div>
                )}
              </div>

              {/* 安全验证 */}
              <div className="p-4 bg-gray-800/50 rounded-md border border-gray-700">
                <div className="flex items-center text-primary mb-2">
                  <FaCheckCircle className="mr-2" />
                  <span className="font-medium">安全验证</span>
                </div>

                {verificationStatus === 'none' && (
                  <>
                    <p className="text-sm text-gray-300 mb-3">
                      交易前对交易对手进行风险评估，降低交易风险。
                    </p>
                    <button
                      onClick={startVerification}
                      className="w-full py-1.5 text-xs bg-primary text-black rounded-md"
                    >
                      开始验证
                    </button>
                  </>
                )}

                {verificationStatus === 'pending' && (
                  <div className="flex flex-col items-center justify-center py-2">
                    <div className="w-5 h-5 border-2 border-t-transparent border-primary rounded-full animate-spin mb-2"></div>
                    <p className="text-xs text-gray-300">正在验证...</p>
                  </div>
                )}

                {verificationStatus === 'success' && (
                  <div className="flex flex-col items-center justify-center py-2">
                    <FaCheckCircle className="text-green-500 w-5 h-5 mb-2" />
                    <p className="text-xs text-green-500">
                      验证通过，可放心交易
                    </p>
                    <button
                      onClick={resetVerification}
                      className="mt-2 text-xs text-gray-400 hover:text-primary"
                    >
                      重新验证
                    </button>
                  </div>
                )}

                {verificationStatus === 'failed' && (
                  <div className="flex flex-col items-center justify-center py-2">
                    <FaExclamationTriangle className="text-yellow-500 w-5 h-5 mb-2" />
                    <p className="text-xs text-yellow-500">
                      存在风险提示，谨慎交易
                    </p>
                    <button
                      onClick={resetVerification}
                      className="mt-2 text-xs text-gray-400 hover:text-primary"
                    >
                      重新验证
                    </button>
                  </div>
                )}
              </div>

              {/* 风险提示 */}
              <div className="p-4 bg-gray-800/50 rounded-md border border-gray-700">
                <div className="flex items-center text-primary mb-2">
                  <FaExclamationTriangle className="mr-2" />
                  <span className="font-medium">风险提示</span>
                </div>
                <p className="text-sm text-gray-300 mb-3">
                  了解常见交易风险，增强安全意识。
                </p>
                <button
                  onClick={() => setShowRiskModal(true)}
                  className="w-full py-1.5 text-xs bg-gray-700 text-white hover:bg-gray-600 rounded-md"
                >
                  查看风险提示
                </button>
              </div>
            </div>

            {showDetails && (
              <div className="mt-6 p-4 border border-gray-700 rounded-md bg-gray-800/30">
                <h4 className="font-medium text-primary mb-2">安全交易指南</h4>
                <ul className="text-sm text-gray-300 space-y-2">
                  <li>• 始终使用平台提供的担保交易功能，避免场外交易</li>
                  <li>• 交易前核实对方身份和信用评级</li>
                  <li>• 保持通信记录，作为可能的纠纷证据</li>
                  <li>• 发现异常情况立即报告平台管理员</li>
                  <li>• 交易完成后及时确认并评价</li>
                </ul>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* 风险提示模态框 */}
      {showRiskModal && (
        <div className="fixed inset-0 flex items-center justify-center z-50 bg-black/70 backdrop-blur-sm">
          <div className="tech-card p-6 max-w-md w-full mx-4 relative">
            <button
              onClick={() => setShowRiskModal(false)}
              className="absolute top-3 right-3 text-gray-400 hover:text-white"
            >
              <FaTimes />
            </button>

            <h3 className="text-xl font-bold mb-4 flex items-center">
              <FaExclamationTriangle className="text-yellow-500 mr-2" />
              交易风险提示
            </h3>

            <div className="space-y-4">
              <div className="p-3 bg-yellow-500/10 border border-yellow-500/30 rounded-md">
                <h4 className="font-medium text-yellow-400 mb-1">
                  价格异常风险
                </h4>
                <p className="text-sm text-gray-300">
                  交易价格明显偏离市场价格，可能存在诈骗风险。建议对比多个商家报价，选择合理价格区间。
                </p>
              </div>

              <div className="p-3 bg-yellow-500/10 border border-yellow-500/30 rounded-md">
                <h4 className="font-medium text-yellow-400 mb-1">通信陷阱</h4>
                <p className="text-sm text-gray-300">
                  警惕商家引导至平台外通信和交易，或索要您的账户密码、验证码等敏感信息。平台官方不会索要您的敏感信息。
                </p>
              </div>

              <div className="p-3 bg-yellow-500/10 border border-yellow-500/30 rounded-md">
                <h4 className="font-medium text-yellow-400 mb-1">
                  交易流程风险
                </h4>
                <p className="text-sm text-gray-300">
                  不按平台规定流程交易可能导致资金损失。请严格按照平台担保交易流程操作，避免直接转账。
                </p>
              </div>

              <div className="p-3 bg-yellow-500/10 border border-yellow-500/30 rounded-md">
                <h4 className="font-medium text-yellow-400 mb-1">
                  欺诈用户特征
                </h4>
                <p className="text-sm text-gray-300">
                  警惕注册时间短、无历史评价、评价异常、主动要求加急且不按流程操作的用户。
                </p>
              </div>
            </div>

            <div className="mt-6 flex justify-center">
              <button
                onClick={() => setShowRiskModal(false)}
                className="py-2 px-6 bg-primary text-black rounded-md"
              >
                我已了解风险
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TradeSafety;
