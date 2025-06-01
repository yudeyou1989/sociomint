// 简单的工具函数测试
describe('Utils', () => {
  describe('formatAddress', () => {
    it('formats long addresses correctly', () => {
      const formatAddress = (address: string) => {
        if (!address) return '';
        if (address.length <= 10) return address;
        return `${address.slice(0, 6)}...${address.slice(-4)}`;
      };

      const longAddress = '0x1234567890abcdef1234567890abcdef12345678';
      expect(formatAddress(longAddress)).toBe('0x1234...5678');
    });

    it('returns short addresses as is', () => {
      const formatAddress = (address: string) => {
        if (!address) return '';
        if (address.length <= 10) return address;
        return `${address.slice(0, 6)}...${address.slice(-4)}`;
      };

      const shortAddress = '0x123';
      expect(formatAddress(shortAddress)).toBe('0x123');
    });

    it('handles empty addresses', () => {
      const formatAddress = (address: string) => {
        if (!address) return '';
        if (address.length <= 10) return address;
        return `${address.slice(0, 6)}...${address.slice(-4)}`;
      };

      expect(formatAddress('')).toBe('');
    });
  });

  describe('formatNumber', () => {
    it('formats numbers with commas', () => {
      const formatNumber = (num: number) => {
        return num.toLocaleString('zh-CN');
      };

      expect(formatNumber(1000)).toBe('1,000');
      expect(formatNumber(1000000)).toBe('1,000,000');
    });

    it('handles decimal numbers', () => {
      const formatNumber = (num: number, decimals: number = 2) => {
        return num.toLocaleString('zh-CN', {
          minimumFractionDigits: decimals,
          maximumFractionDigits: decimals,
        });
      };

      expect(formatNumber(1000.123, 2)).toBe('1,000.12');
    });
  });

  describe('validateAddress', () => {
    it('validates Ethereum addresses', () => {
      const validateAddress = (address: string) => {
        return /^0x[a-fA-F0-9]{40}$/.test(address);
      };

      expect(validateAddress('0x1234567890abcdef1234567890abcdef12345678')).toBe(true);
      expect(validateAddress('0x123')).toBe(false);
      expect(validateAddress('invalid')).toBe(false);
    });
  });

  describe('sleep', () => {
    it('delays execution', async () => {
      const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));
      
      const start = Date.now();
      await sleep(100);
      const end = Date.now();
      
      expect(end - start).toBeGreaterThanOrEqual(90); // 允许一些误差
    });
  });
});
