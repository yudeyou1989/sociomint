// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title SMTokenMinimal - 主网精简版SM代币合约
 * @author SocioMint团队
 * @notice 主网部署的精简版SM代币，只包含核心功能以节约Gas费用
 * @dev 移除了暂停、铸造、批量转账等功能，专注于基础ERC20功能
 */
contract SMTokenMinimal is ERC20, Ownable {
    
    // 代币经济参数
    uint256 public constant TOTAL_SUPPLY = 10_000_000_000 * 10**18; // 100亿代币
    uint256 public constant TEAM_ALLOCATION = 3_000_000_000 * 10**18; // 30% 团队
    uint256 public constant COMMUNITY_ALLOCATION = 7_000_000_000 * 10**18; // 70% 社区
    
    // 解锁参数
    uint256 public constant INITIAL_UNLOCK_PERCENTAGE = 10; // 首次解锁10%
    uint256 public constant SUBSEQUENT_UNLOCK_PERCENTAGE = 3; // 后续每次解锁3%
    uint256 public constant PRICE_INCREASE_THRESHOLD = 2; // 价格需要翻倍
    uint256 public constant PRICE_HOLD_DURATION = 14 days; // 价格持续时间
    
    // 解锁状态
    uint256 public currentUnlockRound; // 当前解锁轮次 (0=未开始, 1=首次解锁, 2+=后续解锁)
    uint256 public totalUnlockedTokens; // 已解锁代币总量
    uint256 public lastUnlockTime; // 上次解锁时间
    uint256 public lastUnlockPrice; // 上次解锁时的价格 (以wei为单位)
    
    // 多签钱包地址
    address public multiSigWallet;
    
    // 事件
    event TokensUnlocked(
        uint256 indexed round,
        uint256 teamAmount,
        uint256 communityAmount,
        uint256 timestamp,
        uint256 triggerPrice
    );
    
    event MultiSigWalletUpdated(address indexed oldWallet, address indexed newWallet);
    event PriceUpdated(uint256 newPrice, uint256 timestamp);
    
    /**
     * @dev 构造函数 - 创建代币并设置初始参数
     * @param _multiSigWallet 多签钱包地址
     */
    constructor(address _multiSigWallet) ERC20("SocioMint Token", "SM") Ownable() {
        require(_multiSigWallet != address(0), "Invalid multisig wallet");
        
        multiSigWallet = _multiSigWallet;
        
        // 初始不铸造任何代币，等待解锁触发
        // 所有代币将通过解锁机制逐步释放
    }
    
    /**
     * @dev 触发代币解锁
     * @param currentPrice 当前价格 (以wei为单位)
     * 只有所有者可以调用，通常由价格监控系统触发
     */
    function triggerUnlock(uint256 currentPrice) external onlyOwner {
        require(currentPrice > 0, "Invalid price");
        
        if (currentUnlockRound == 0) {
            // 首次解锁 - 10%
            _executeInitialUnlock(currentPrice);
        } else {
            // 后续解锁 - 需要价格翻倍且持续14天
            require(
                currentPrice >= lastUnlockPrice * PRICE_INCREASE_THRESHOLD,
                "Price not doubled"
            );
            require(
                block.timestamp >= lastUnlockTime + PRICE_HOLD_DURATION,
                "Price hold duration not met"
            );
            
            _executeSubsequentUnlock(currentPrice);
        }
        
        emit PriceUpdated(currentPrice, block.timestamp);
    }
    
    /**
     * @dev 执行首次解锁 (10%)
     */
    function _executeInitialUnlock(uint256 price) internal {
        uint256 unlockAmount = (TOTAL_SUPPLY * INITIAL_UNLOCK_PERCENTAGE) / 100;
        uint256 teamAmount = (unlockAmount * 30) / 100; // 30% 给团队
        uint256 communityAmount = unlockAmount - teamAmount; // 70% 给社区
        
        // 铸造代币
        _mint(multiSigWallet, teamAmount); // 团队份额到多签钱包
        _mint(owner(), communityAmount); // 社区份额到合约所有者（用于分发）
        
        // 更新状态
        currentUnlockRound = 1;
        totalUnlockedTokens = unlockAmount;
        lastUnlockTime = block.timestamp;
        lastUnlockPrice = price;
        
        emit TokensUnlocked(1, teamAmount, communityAmount, block.timestamp, price);
    }
    
    /**
     * @dev 执行后续解锁 (3%)
     */
    function _executeSubsequentUnlock(uint256 price) internal {
        uint256 unlockAmount = (TOTAL_SUPPLY * SUBSEQUENT_UNLOCK_PERCENTAGE) / 100;
        uint256 teamAmount = (unlockAmount * 30) / 100; // 30% 给团队
        uint256 communityAmount = unlockAmount - teamAmount; // 70% 给社区
        
        // 检查是否超过总供应量
        require(
            totalUnlockedTokens + unlockAmount <= TOTAL_SUPPLY,
            "Exceeds total supply"
        );
        
        // 铸造代币
        _mint(multiSigWallet, teamAmount); // 团队份额到多签钱包
        _mint(owner(), communityAmount); // 社区份额到合约所有者（用于分发）
        
        // 更新状态
        currentUnlockRound++;
        totalUnlockedTokens += unlockAmount;
        lastUnlockTime = block.timestamp;
        lastUnlockPrice = price;
        
        emit TokensUnlocked(currentUnlockRound, teamAmount, communityAmount, block.timestamp, price);
    }
    
    /**
     * @dev 更新多签钱包地址
     * @param _newMultiSigWallet 新的多签钱包地址
     */
    function updateMultiSigWallet(address _newMultiSigWallet) external onlyOwner {
        require(_newMultiSigWallet != address(0), "Invalid address");
        
        address oldWallet = multiSigWallet;
        multiSigWallet = _newMultiSigWallet;
        
        emit MultiSigWalletUpdated(oldWallet, _newMultiSigWallet);
    }
    
    /**
     * @dev 获取解锁进度信息
     */
    function getUnlockProgress() external view returns (
        uint256 round,
        uint256 unlockedTokens,
        uint256 totalSupply,
        uint256 unlockedPercentage,
        uint256 nextUnlockAmount,
        bool canUnlock
    ) {
        round = currentUnlockRound;
        unlockedTokens = totalUnlockedTokens;
        totalSupply = TOTAL_SUPPLY;
        unlockedPercentage = (totalUnlockedTokens * 100) / TOTAL_SUPPLY;
        
        if (currentUnlockRound == 0) {
            nextUnlockAmount = (TOTAL_SUPPLY * INITIAL_UNLOCK_PERCENTAGE) / 100;
            canUnlock = true; // 首次解锁总是可以的
        } else {
            nextUnlockAmount = (TOTAL_SUPPLY * SUBSEQUENT_UNLOCK_PERCENTAGE) / 100;
            canUnlock = totalUnlockedTokens + nextUnlockAmount <= TOTAL_SUPPLY;
        }
    }
    
    /**
     * @dev 获取价格条件信息
     */
    function getPriceConditions() external view returns (
        uint256 lastPrice,
        uint256 requiredPrice,
        uint256 lastUnlockTimestamp,
        uint256 nextUnlockTime,
        bool priceConditionMet,
        bool timeConditionMet
    ) {
        lastPrice = lastUnlockPrice;
        
        if (currentUnlockRound == 0) {
            requiredPrice = 0; // 首次解锁无价格要求
            nextUnlockTime = 0;
            priceConditionMet = true;
            timeConditionMet = true;
        } else {
            requiredPrice = lastUnlockPrice * PRICE_INCREASE_THRESHOLD;
            lastUnlockTimestamp = lastUnlockTime;
            nextUnlockTime = lastUnlockTime + PRICE_HOLD_DURATION;
            priceConditionMet = false; // 需要外部价格验证
            timeConditionMet = block.timestamp >= nextUnlockTime;
        }
    }
    
    /**
     * @dev 紧急暂停功能 - 只能暂停转账，不能暂停解锁
     * 这是一个简化的暂停机制，只在极端情况下使用
     */
    bool public emergencyPaused = false;
    
    function emergencyPause() external onlyOwner {
        emergencyPaused = true;
    }
    
    function emergencyUnpause() external onlyOwner {
        emergencyPaused = false;
    }
    
    /**
     * @dev 重写转账函数以支持紧急暂停
     */
    function transfer(address to, uint256 amount) public override returns (bool) {
        require(!emergencyPaused, "Emergency paused");
        return super.transfer(to, amount);
    }
    
    /**
     * @dev 重写transferFrom函数以支持紧急暂停
     */
    function transferFrom(address from, address to, uint256 amount) public override returns (bool) {
        require(!emergencyPaused, "Emergency paused");
        return super.transferFrom(from, to, amount);
    }
    
    /**
     * @dev 获取合约基本信息
     */
    function getContractInfo() external view returns (
        string memory name,
        string memory symbol,
        uint256 totalSupply,
        uint256 decimals,
        address owner,
        address multiSig,
        uint256 currentRound,
        bool paused
    ) {
        return (
            name(),
            symbol(),
            TOTAL_SUPPLY,
            decimals(),
            owner(),
            multiSigWallet,
            currentUnlockRound,
            emergencyPaused
        );
    }
}
