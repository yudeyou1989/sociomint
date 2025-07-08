// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";

/**
 * @title SMBNBExchangeMinimal - 主网精简版BNB兑换SM代币合约
 * @author SocioMint团队
 * @notice 主网部署的精简版BNB兑换合约，实现动态价格的BNB兑换SM功能
 * @dev 专注于核心兑换功能，移除复杂的权限管理和升级功能
 */
contract SMBNBExchangeMinimal is ReentrancyGuard, Ownable {
    using SafeERC20 for IERC20;
    
    // 代币合约
    IERC20 public immutable smToken;
    
    // 兑换参数
    uint256 public constant TOTAL_SM_FOR_SALE = 30_000_000 * 10**18; // 3000万SM用于兑换
    uint256 public constant TARGET_BNB_AMOUNT = 300 * 10**18; // 目标筹集300 BNB
    uint256 public constant PRICE_INCREASE_INTERVAL = 1_500_000 * 10**18; // 每150万SM价格上涨一次 (5%)
    
    // 兑换状态
    uint256 public totalSmSold; // 已售出的SM数量
    uint256 public totalBnbRaised; // 已筹集的BNB数量
    uint256 public currentPriceLevel; // 当前价格等级 (0-19, 共20个等级)
    
    // 用户限制
    uint256 public constant MIN_BNB_AMOUNT = 0.01 ether; // 最小兑换0.01 BNB
    uint256 public constant MAX_BNB_AMOUNT = 10 ether; // 最大兑换10 BNB
    
    // 用户兑换记录
    mapping(address => uint256) public userBnbSpent; // 用户已花费的BNB
    mapping(address => uint256) public userSmReceived; // 用户已获得的SM
    mapping(address => bool) public isVerifiedUser; // 用户是否已验证
    
    // 兑换状态
    bool public exchangeActive = true;
    bool public emergencyPaused = false;
    
    // 提取地址
    address public treasuryWallet;
    
    // 事件
    event TokensPurchased(
        address indexed buyer,
        uint256 bnbAmount,
        uint256 smAmount,
        uint256 priceLevel,
        uint256 currentPrice
    );
    
    event PriceLevelUpdated(uint256 oldLevel, uint256 newLevel, uint256 newPrice);
    event UserVerified(address indexed user);
    event ExchangeStatusUpdated(bool active);
    event EmergencyPauseUpdated(bool paused);
    event TreasuryWalletUpdated(address indexed oldWallet, address indexed newWallet);
    event BNBWithdrawn(address indexed to, uint256 amount);
    
    /**
     * @dev 构造函数
     * @param _smToken SM代币合约地址
     * @param _treasuryWallet 国库钱包地址
     */
    constructor(
        address _smToken,
        address _treasuryWallet
    ) Ownable() {
        require(_smToken != address(0), "Invalid SM token address");
        require(_treasuryWallet != address(0), "Invalid treasury wallet");
        
        smToken = IERC20(_smToken);
        treasuryWallet = _treasuryWallet;
    }
    
    /**
     * @dev 计算当前SM代币价格 (BNB per SM)
     * 价格从初始值开始，每售出150万SM上涨约5%
     */
    function getCurrentPrice() public view returns (uint256) {
        // 初始价格: 300 BNB / 30,000,000 SM = 0.00001 BNB per SM
        uint256 basePrice = (TARGET_BNB_AMOUNT * 10**18) / TOTAL_SM_FOR_SALE;
        
        // 每个价格等级上涨5%
        uint256 priceMultiplier = 100 + (currentPriceLevel * 5); // 100%, 105%, 110%, ...
        
        return (basePrice * priceMultiplier) / 100;
    }
    
    /**
     * @dev 计算指定BNB数量可以购买的SM数量
     * @param bnbAmount BNB数量
     */
    function calculateSmAmount(uint256 bnbAmount) public view returns (uint256) {
        uint256 currentPrice = getCurrentPrice();
        return (bnbAmount * 10**18) / currentPrice;
    }
    
    /**
     * @dev 计算购买指定SM数量需要的BNB数量
     * @param smAmount SM数量
     */
    function calculateBnbAmount(uint256 smAmount) public view returns (uint256) {
        uint256 currentPrice = getCurrentPrice();
        return (smAmount * currentPrice) / 10**18;
    }
    
    /**
     * @dev 用户验证 - 必须先验证才能参与兑换
     * @param user 要验证的用户地址
     */
    function verifyUser(address user) external onlyOwner {
        require(user != address(0), "Invalid user address");
        isVerifiedUser[user] = true;
        emit UserVerified(user);
    }
    
    /**
     * @dev 批量用户验证
     * @param users 要验证的用户地址数组
     */
    function batchVerifyUsers(address[] calldata users) external onlyOwner {
        require(users.length <= 100, "Too many users");
        
        for (uint256 i = 0; i < users.length; i++) {
            if (users[i] != address(0)) {
                isVerifiedUser[users[i]] = true;
                emit UserVerified(users[i]);
            }
        }
    }
    
    /**
     * @dev 购买SM代币
     * 用户发送BNB，获得相应数量的SM代币
     */
    function buyTokens() external payable nonReentrant {
        require(exchangeActive, "Exchange not active");
        require(!emergencyPaused, "Emergency paused");
        require(isVerifiedUser[msg.sender], "User not verified");
        require(msg.value >= MIN_BNB_AMOUNT, "Below minimum BNB amount");
        require(msg.value <= MAX_BNB_AMOUNT, "Above maximum BNB amount");
        require(userBnbSpent[msg.sender] + msg.value <= MAX_BNB_AMOUNT, "Exceeds user limit");
        
        uint256 bnbAmount = msg.value;
        uint256 smAmount = calculateSmAmount(bnbAmount);
        
        require(totalSmSold + smAmount <= TOTAL_SM_FOR_SALE, "Exceeds total supply for sale");
        require(smToken.balanceOf(address(this)) >= smAmount, "Insufficient SM balance");
        
        // 更新状态
        totalSmSold += smAmount;
        totalBnbRaised += bnbAmount;
        userBnbSpent[msg.sender] += bnbAmount;
        userSmReceived[msg.sender] += smAmount;
        
        // 检查是否需要更新价格等级
        uint256 newPriceLevel = totalSmSold / PRICE_INCREASE_INTERVAL;
        if (newPriceLevel > currentPriceLevel && newPriceLevel < 20) { // 最多20个价格等级
            uint256 oldLevel = currentPriceLevel;
            currentPriceLevel = newPriceLevel;
            emit PriceLevelUpdated(oldLevel, newPriceLevel, getCurrentPrice());
        }
        
        // 转移SM代币给用户
        smToken.safeTransfer(msg.sender, smAmount);
        
        emit TokensPurchased(msg.sender, bnbAmount, smAmount, currentPriceLevel, getCurrentPrice());
        
        // 如果售完，自动关闭兑换
        if (totalSmSold >= TOTAL_SM_FOR_SALE) {
            exchangeActive = false;
            emit ExchangeStatusUpdated(false);
        }
    }
    
    /**
     * @dev 设置兑换状态
     * @param _active 是否激活兑换
     */
    function setExchangeActive(bool _active) external onlyOwner {
        exchangeActive = _active;
        emit ExchangeStatusUpdated(_active);
    }
    
    /**
     * @dev 紧急暂停
     * @param _paused 是否暂停
     */
    function setEmergencyPause(bool _paused) external onlyOwner {
        emergencyPaused = _paused;
        emit EmergencyPauseUpdated(_paused);
    }
    
    /**
     * @dev 更新国库钱包地址
     * @param _newTreasuryWallet 新的国库钱包地址
     */
    function updateTreasuryWallet(address _newTreasuryWallet) external onlyOwner {
        require(_newTreasuryWallet != address(0), "Invalid address");
        
        address oldWallet = treasuryWallet;
        treasuryWallet = _newTreasuryWallet;
        
        emit TreasuryWalletUpdated(oldWallet, _newTreasuryWallet);
    }
    
    /**
     * @dev 提取BNB到国库钱包
     */
    function withdrawBNB() external onlyOwner {
        uint256 balance = address(this).balance;
        require(balance > 0, "No BNB to withdraw");
        
        (bool success, ) = treasuryWallet.call{value: balance}("");
        require(success, "BNB transfer failed");
        
        emit BNBWithdrawn(treasuryWallet, balance);
    }
    
    /**
     * @dev 提取剩余的SM代币 (只有在兑换结束后)
     */
    function withdrawRemainingTokens() external onlyOwner {
        require(!exchangeActive, "Exchange still active");
        
        uint256 balance = smToken.balanceOf(address(this));
        if (balance > 0) {
            smToken.safeTransfer(treasuryWallet, balance);
        }
    }
    
    /**
     * @dev 获取兑换统计信息
     */
    function getExchangeStats() external view returns (
        uint256 smSold,
        uint256 bnbRaised,
        uint256 smRemaining,
        uint256 currentPrice,
        uint256 priceLevel,
        uint256 progress, // 进度百分比 (0-100)
        bool active,
        bool paused
    ) {
        smSold = totalSmSold;
        bnbRaised = totalBnbRaised;
        smRemaining = TOTAL_SM_FOR_SALE - totalSmSold;
        currentPrice = getCurrentPrice();
        priceLevel = currentPriceLevel;
        progress = (totalSmSold * 100) / TOTAL_SM_FOR_SALE;
        active = exchangeActive;
        paused = emergencyPaused;
    }
    
    /**
     * @dev 获取用户兑换信息
     * @param user 用户地址
     */
    function getUserInfo(address user) external view returns (
        bool verified,
        uint256 bnbSpent,
        uint256 smReceived,
        uint256 remainingLimit
    ) {
        verified = isVerifiedUser[user];
        bnbSpent = userBnbSpent[user];
        smReceived = userSmReceived[user];
        remainingLimit = MAX_BNB_AMOUNT > bnbSpent ? MAX_BNB_AMOUNT - bnbSpent : 0;
    }
    
    /**
     * @dev 获取价格信息
     */
    function getPriceInfo() external view returns (
        uint256 currentPrice,
        uint256 nextPriceLevel,
        uint256 smUntilNextPrice,
        uint256 finalPrice
    ) {
        currentPrice = getCurrentPrice();
        nextPriceLevel = currentPriceLevel + 1;
        
        if (nextPriceLevel < 20) {
            uint256 nextLevelThreshold = nextPriceLevel * PRICE_INCREASE_INTERVAL;
            smUntilNextPrice = nextLevelThreshold > totalSmSold ? 
                nextLevelThreshold - totalSmSold : 0;
        } else {
            smUntilNextPrice = 0; // 已达到最高价格等级
        }
        
        // 计算最终价格 (第19级的价格)
        uint256 basePrice = (TARGET_BNB_AMOUNT * 10**18) / TOTAL_SM_FOR_SALE;
        finalPrice = (basePrice * 195) / 100; // 100% + 19 * 5% = 195%
    }
}
