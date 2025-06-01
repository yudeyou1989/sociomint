'use client';

import { useState } from 'react';

interface ExchangeCardProps {
  type: 'bnb-to-sm' | 'flower-to-sm';
  title: string;
  inputLabel: string;
  outputLabel: string;
  rate: number;
}

const ExchangeCard = ({
  type,
  title,
  inputLabel,
  outputLabel,
  rate,
}: ExchangeCardProps) => {
  const [inputAmount, setInputAmount] = useState<string>('');
  const [outputAmount, setOutputAmount] = useState<string>('');

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setInputAmount(value);

    // 计算输出金额
    if (value && !isNaN(parseFloat(value))) {
      const calculated = parseFloat(value) * rate;
      setOutputAmount(calculated.toFixed(2));
    } else {
      setOutputAmount('');
    }
  };

  const rateDisplay =
    type === 'bnb-to-sm' ? `1 BNB = ${rate} SM` : `1 小红花 = ${rate} SM`;

  return (
    <div className="tech-card relative overflow-hidden mb-8">
      <h2 className="text-xl font-bold mb-6">{title}</h2>

      <div className="mb-4">
        <label
          htmlFor={`${type}-input`}
          className="block text-sm font-medium text-gray-300 mb-2"
        >
          {inputLabel}
        </label>
        <input
          id={`${type}-input`}
          type="number"
          placeholder="0.0"
          value={inputAmount}
          onChange={handleInputChange}
          className="input-field w-full"
          min="0"
          step="0.01"
        />
      </div>

      <div className="text-sm text-gray-400 mb-4">动态汇率: {rateDisplay}</div>

      <div className="mb-4">
        <label
          htmlFor={`${type}-output`}
          className="block text-sm font-medium text-gray-300 mb-2"
        >
          {outputLabel}
        </label>
        <input
          id={`${type}-output`}
          type="text"
          readOnly
          value={outputAmount}
          className="input-field w-full bg-gray-800/50 cursor-not-allowed"
        />
      </div>

      <div className="text-xs text-gray-400 mb-4">Gas 费由用户承担</div>

      <button
        className="neon-button w-full"
        disabled={!inputAmount || inputAmount === '0'}
      >
        兑换
      </button>
    </div>
  );
};

export default ExchangeCard;
