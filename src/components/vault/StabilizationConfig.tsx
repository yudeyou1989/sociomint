import { useState } from 'react';
// // // import {
  FaCog,
  "⚠️",
  "ℹ️",
  FaSave,
  "✕",
} from 'react-icons/fa'; // 临时注释以修复构建 // 临时注释以修复构建 // 临时注释以修复构建

// 稳定机制类型
type MechanismType = 'buyback' | 'dynamic-rate' | 'staking';

// 触发条件类型
interface TriggerCondition {
  id: string;
  mechanismType: MechanismType;
  priceThreshold: number;
  thresholdType: 'above' | 'below';
  actionAmount: number;
  cooldownHours: number;
  isActive: boolean;
}

// 稳定机制配置组件
const StabilizationConfig = () => {
  // 模拟触发条件数据
  const [triggerConditions, setTriggerConditions] = useState<
    TriggerCondition[]
  >([
    {
      id: 'trigger-001',
      mechanismType: 'buyback',
      priceThreshold: 10.5,
      thresholdType: 'below',
      actionAmount: 50000,
      cooldownHours: 24,
      isActive: true,
    },
    {
      id: 'trigger-002',
      mechanismType: 'dynamic-rate',
      priceThreshold: 14.5,
      thresholdType: 'above',
      actionAmount: 0.5, // 发行费率增加百分比
      cooldownHours: 12,
      isActive: true,
    },
    {
      id: 'trigger-003',
      mechanismType: 'staking',
      priceThreshold: 11.0,
      thresholdType: 'below',
      actionAmount: 2.5, // 锁仓年化收益率
      cooldownHours: 48,
      isActive: false,
    },
  ]);

  // 获取机制名称
  const getMechanismName = (type: MechanismType): string => {
    switch (type) {
      case 'buyback':
        return '自动回购';
      case 'dynamic-rate':
        return '动态发行费率';
      case 'staking':
        return '锁仓挖矿激励';
      default:
        return '未知机制';
    }
  };

  // 获取操作数量显示文本
  const getActionDisplay = (condition: TriggerCondition): string => {
    switch (condition.mechanismType) {
      case 'buyback':
        return `${condition.actionAmount.toLocaleString()} SM`;
      case 'dynamic-rate':
        return `+${condition.actionAmount}%`;
      case 'staking':
        return `${condition.actionAmount}% APY`;
      default:
        return condition.actionAmount.toString();
    }
  };

  // 切换触发条件状态
  const toggleConditionStatus = (id: string) => {
    setTriggerConditions((conditions) =>
      conditions.map((condition) =>
        condition.id === id
          ? { ...condition, isActive: !condition.isActive }
          : condition,
      ),
    );
  };

  // 编辑状态
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<TriggerCondition | null>(null);

  // 开始编辑触发条件
  const startEditing = (condition: TriggerCondition) => {
    setEditingId(condition.id);
    setEditForm({ ...condition });
  };

  // 取消编辑
  const cancelEditing = () => {
    setEditingId(null);
    setEditForm(null);
  };

  // 更新编辑表单
  const updateEditForm = (
    key: keyof TriggerCondition,
    value: number | string | boolean,
  ) => {
    if (!editForm) return;

    setEditForm({
      ...editForm,
      [key]: value,
    });
  };

  // 保存编辑
  const saveEditing = () => {
    if (!editForm) return;

    setTriggerConditions((conditions) =>
      conditions.map((condition) =>
        condition.id === editForm.id ? editForm : condition,
      ),
    );

    cancelEditing();
  };

  // 删除触发条件
  const deleteCondition = (id: string) => {
    if (confirm('确定要删除此触发条件吗？')) {
      setTriggerConditions((conditions) =>
        conditions.filter((condition) => condition.id !== id),
      );

      if (editingId === id) {
        cancelEditing();
      }
    }
  };

  // 添加新的触发条件
  const addNewCondition = () => {
    const newCondition: TriggerCondition = {
      id: `trigger-${Date.now().toString().substr(-6)}`,
      mechanismType: 'buyback',
      priceThreshold: 12.0,
      thresholdType: 'below',
      actionAmount: 10000,
      cooldownHours: 24,
      isActive: false,
    };

    setTriggerConditions([...triggerConditions, newCondition]);
    startEditing(newCondition);
  };

  return (
    <div className="bg-gray-800/30 border border-gray-700 rounded-md p-4">
      <div className="flex justify-between items-center mb-6">
        <h3 className="font-medium flex items-center">
          <FaCog className="mr-2 text-primary" />
          稳定机制触发条件配置
        </h3>

        <button
          onClick={addNewCondition}
          className="px-3 py-1 bg-primary text-white rounded-md text-sm"
        >
          添加触发条件
        </button>
      </div>

      <div className="mb-4 p-3 bg-blue-500/10 border border-blue-500/30 rounded-md flex items-start">
        ℹ️
        <p className="text-sm text-gray-300">
          配置不同的价格触发条件，当通证价格达到设定阈值时，系统将自动执行相应的稳定机制。合理设置触发条件和冷却时间，可以有效维持通证价值稳定。
        </p>
      </div>

      {triggerConditions.length === 0 ? (
        <div className="text-center py-8 text-gray-400">
          暂无触发条件，请点击&quot;添加触发条件&quot;按钮创建。
        </div>
      ) : (
        <div className="space-y-4">
          {triggerConditions.map((condition) => (
            <div
              key={condition.id}
              className={`border rounded-md ${
                editingId === condition.id
                  ? 'border-primary bg-gray-800/50'
                  : 'border-gray-700 bg-gray-800/30'
              }`}
            >
              {editingId === condition.id && editForm ? (
                // 编辑表单
                <div className="p-4">
                  <div className="flex justify-between items-center mb-4">
                    <h4 className="font-medium">编辑触发条件</h4>
                    <button
                      onClick={cancelEditing}
                      className="text-gray-400 hover:text-white"
                    >
                      ✕
                    </button>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                    <div>
                      <label className="block text-sm text-gray-400 mb-1">
                        机制类型
                      </label>
                      <select
                        value={editForm.mechanismType}
                        onChange={(e) =>
                          updateEditForm(
                            'mechanismType',
                            e.target.value as MechanismType,
                          )
                        }
                        className="w-full bg-gray-900 border border-gray-700 rounded-md p-2 text-white"
                      >
                        <option value="buyback">自动回购</option>
                        <option value="dynamic-rate">动态发行费率</option>
                        <option value="staking">锁仓挖矿激励</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm text-gray-400 mb-1">
                        触发条件
                      </label>
                      <div className="flex items-center">
                        <select
                          value={editForm.thresholdType}
                          onChange={(e) =>
                            updateEditForm(
                              'thresholdType',
                              e.target.value as 'above' | 'below',
                            )
                          }
                          className="bg-gray-900 border border-gray-700 rounded-md p-2 text-white mr-2"
                        >
                          <option value="above">高于</option>
                          <option value="below">低于</option>
                        </select>

                        <input
                          type="number"
                          value={editForm.priceThreshold}
                          onChange={(e) =>
                            updateEditForm(
                              'priceThreshold',
                              parseFloat(e.target.value),
                            )
                          }
                          step="0.1"
                          min="0"
                          className="flex-1 bg-gray-900 border border-gray-700 rounded-md p-2 text-white"
                        />
                        <span className="ml-2">SM</span>
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                    <div>
                      <label className="block text-sm text-gray-400 mb-1">
                        {editForm.mechanismType === 'buyback'
                          ? '回购数量'
                          : editForm.mechanismType === 'dynamic-rate'
                            ? '费率调整'
                            : '年化收益率'}
                      </label>
                      <div className="flex items-center">
                        <input
                          type="number"
                          value={editForm.actionAmount}
                          onChange={(e) =>
                            updateEditForm(
                              'actionAmount',
                              parseFloat(e.target.value),
                            )
                          }
                          step={
                            editForm.mechanismType === 'buyback' ? 1000 : 0.1
                          }
                          min="0"
                          className="flex-1 bg-gray-900 border border-gray-700 rounded-md p-2 text-white"
                        />
                        <span className="ml-2">
                          {editForm.mechanismType === 'buyback'
                            ? 'SM'
                            : editForm.mechanismType === 'dynamic-rate'
                              ? '%'
                              : '% APY'}
                        </span>
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm text-gray-400 mb-1">
                        冷却时间
                      </label>
                      <div className="flex items-center">
                        <input
                          type="number"
                          value={editForm.cooldownHours}
                          onChange={(e) =>
                            updateEditForm(
                              'cooldownHours',
                              parseInt(e.target.value),
                            )
                          }
                          step="1"
                          min="0"
                          className="flex-1 bg-gray-900 border border-gray-700 rounded-md p-2 text-white"
                        />
                        <span className="ml-2">小时</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center mb-2">
                    <input
                      type="checkbox"
                      id={`active-${editForm.id}`}
                      checked={editForm.isActive}
                      onChange={(e) =>
                        updateEditForm('isActive', e.target.checked)
                      }
                      className="mr-2"
                    />
                    <label
                      htmlFor={`active-${editForm.id}`}
                      className="text-sm"
                    >
                      启用此触发条件
                    </label>
                  </div>

                  <div className="flex justify-end space-x-2 mt-4">
                    <button
                      onClick={() => deleteCondition(editForm.id)}
                      className="px-3 py-1 bg-red-600/70 hover:bg-red-600 text-white rounded-md text-sm"
                    >
                      删除
                    </button>
                    <button
                      onClick={cancelEditing}
                      className="px-3 py-1 bg-gray-700 hover:bg-gray-600 text-white rounded-md text-sm"
                    >
                      取消
                    </button>
                    <button
                      onClick={saveEditing}
                      className="px-3 py-1 bg-primary hover:bg-primary/90 text-white rounded-md text-sm flex items-center"
                    >
                      <FaSave className="mr-1" /> 保存
                    </button>
                  </div>
                </div>
              ) : (
                // 显示触发条件
                <div className="p-4">
                  <div className="flex justify-between items-start">
                    <div>
                      <div className="flex items-center">
                        <span
                          className={`inline-block w-2 h-2 rounded-full ${condition.isActive ? 'bg-green-500' : 'bg-gray-500'} mr-2`}
                        ></span>
                        <h4 className="font-medium">
                          {getMechanismName(condition.mechanismType)}
                        </h4>
                      </div>

                      <div className="text-sm text-gray-400 mt-1">
                        当价格
                        {condition.thresholdType === 'above' ? '高于' : '低于'}{' '}
                        <span className="text-white">
                          {condition.priceThreshold} SM
                        </span>{' '}
                        时触发
                      </div>
                    </div>

                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => toggleConditionStatus(condition.id)}
                        className={`text-xs px-2 py-1 rounded-md ${
                          condition.isActive
                            ? 'bg-green-500/20 text-green-500'
                            : 'bg-gray-500/20 text-gray-400'
                        }`}
                      >
                        {condition.isActive ? '已启用' : '已禁用'}
                      </button>

                      <button
                        onClick={() => startEditing(condition)}
                        className="text-xs px-2 py-1 bg-gray-700 hover:bg-gray-600 text-white rounded-md"
                      >
                        编辑
                      </button>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4 mt-3 text-sm">
                    <div>
                      <span className="text-gray-500">操作数量:</span>
                      <span className="ml-2">
                        {getActionDisplay(condition)}
                      </span>
                    </div>

                    <div>
                      <span className="text-gray-500">冷却时间:</span>
                      <span className="ml-2">
                        {condition.cooldownHours} 小时
                      </span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      <div className="mt-6 p-3 bg-yellow-500/10 border border-yellow-500/30 rounded-md flex items-start">
        ⚠️
        <p className="text-sm text-gray-300">
          注意：自动触发机制可能会影响系统储备金和流动性。请确保设置合理的触发阈值和操作数量，避免过度干预市场。建议配置多级触发条件，形成梯度保护机制。
        </p>
      </div>
    </div>
  );
};

export default StabilizationConfig;
