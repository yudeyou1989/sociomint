import { useState, useEffect } from 'react';
import { parseEther, formatEther } from 'viem';
import { useSMTokenExchange } from '../useSMTokenExchange';

export interface PresaleContractData {
  purchaseTokens: (amount: bigint) => Promise<void>;
  isLoading: boolean;
  presaleEnded?: boolean;
  currentPrice?: bigint;
  soldTokens?: bigint;
  totalPresaleTokens?: bigint;
  minPurchaseAmount?: bigint;
  maxPurchaseAmount?: bigint;
  userPurchase?: bigint[];
}

export function usePresaleContract(): PresaleContractData {
  const [isLoading, setIsLoading] = useState(false);
  const [presaleEnded, setPresaleEnded] = useState(false);
  const [currentPrice, setCurrentPrice] = useState<bigint>(BigInt(0));
  const [soldTokens, setSoldTokens] = useState<bigint>(BigInt(0));
  const [totalPresaleTokens, setTotalPresaleTokens] = useState<bigint>(BigInt(0));
  const [minPurchaseAmount, setMinPurchaseAmount] = useState<bigint>(BigInt(0));
  const [maxPurchaseAmount, setMaxPurchaseAmount] = useState<bigint>(BigInt(0));
  const [userPurchase, setUserPurchase] = useState<bigint[]>([]);

  // 使用现有的 SMTokenExchange hook
  const { buyTokens, getCurrentPrice, isLoading: exchangeLoading } = useSMTokenExchange();

  useEffect(() => {
    // 初始化预售数据
    const initializePresaleData = async () => {
      try {
        setIsLoading(true);
        
        // 获取当前价格
        const price = await getCurrentPrice();
        if (price) {
          setCurrentPrice(BigInt(price));
        }
        
        // 设置默认值
        setTotalPresaleTokens(parseEther('1000000')); // 100万代币
        setSoldTokens(parseEther('250000')); // 已售出25万
        setMinPurchaseAmount(parseEther('0.01')); // 最小0.01 BNB
        setMaxPurchaseAmount(parseEther('10')); // 最大10 BNB
        setPresaleEnded(false);
        
      } catch (error) {
        console.error('初始化预售数据失败:', error);
      } finally {
        setIsLoading(false);
      }
    };

    initializePresaleData();
  }, [getCurrentPrice]);

  const purchaseTokens = async (amount: bigint) => {
    try {
      setIsLoading(true);
      await buyTokens(amount);
      
      // 更新已售出代币数量
      setSoldTokens(prev => prev + amount);
    } catch (error) {
      console.error('购买代币失败:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  return {
    purchaseTokens,
    isLoading: isLoading || exchangeLoading,
    presaleEnded,
    currentPrice,
    soldTokens,
    totalPresaleTokens,
    minPurchaseAmount,
    maxPurchaseAmount,
    userPurchase
  };
}
