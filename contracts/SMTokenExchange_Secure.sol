// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * @title SMTokenExchange_Secure - 安全修复版本的代币交换合约
 * @author SocioMint团队
 * @notice 修复了价格操纵、重入攻击等安全漏洞的代币交换合约
 * @dev 修复内容：
 * 1. 滑点保护 - 防止价格操纵
 * 2. 重入攻击防护加强
 * 3. 价格更新验证机制
 * 4. 紧急暂停机制完善
 */

import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import "@openzeppelin/contracts-upgradeable/security/ReentrancyGuardUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/security/PausableUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/access/AccessControlUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/UUPSUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/token/ERC20/IERC20Upgradeable.sol";
import "@chainlink/contracts/src/v0.8/interfaces/AggregatorV3Interface.sol";

contract SMTokenExchange_Secure is
    Initializable,
    ReentrancyGuardUpgradeable,
    PausableUpgradeable,
    AccessControlUpgradeable,
    UUPSUpgradeable
{
    // 角色定义
    bytes32 public constant ADMIN_ROLE = keccak256("ADMIN_ROLE");
    bytes32 public constant FUNDS_MANAGER_ROLE = keccak256("FUNDS_MANAGER_ROLE");
    bytes32 public constant VERIFIER_ROLE = keccak256("VERIFIER_ROLE");
    bytes32 public constant PAUSER_ROLE = keccak256("PAUSER_ROLE");

    // 紧急暂停最大持续时间
    uint256 public constant MAX_PAUSE_DURATION = 7 days;

    // 外部合约接口
    AggregatorV3Interface public bnbPriceFeed;
    IERC20Upgradeable public token;

    // 交换配置
    uint8 public constant MAX_ROUNDS = 5;
    uint8 public currentRound;
    bool public exchangeActive;

    // 购买限制
    uint128 public minPurchaseAmount;
    uint128 public maxPurchaseAmount;
    uint256 public maxTokensPerTransaction = 1000000 * 1e18; // 100万代币上限

    // 轮次数据结构体
    struct RoundData {
        uint128 price;
        uint128 tokenAmount;
    }

    // 用户数据结构体
    struct UserData {
        uint128 totalPurchased;
        uint64 lastPurchaseTime;
        bool isVerified;
    }

    // 存储映射
    mapping(uint8 => RoundData) public rounds;
    mapping(address => UserData) public users;
    mapping(address => bool) private _exchanging; // 防止重入

    // 合约状态变量
    uint128 public totalTokensForSale;
    uint128 public totalTokensSold;

    // 价格波动限制器
    uint16 public maxPriceChangePercent = 1000; // 10%
    uint32 public priceChangeTimelock = 1 hours;
    uint64 public lastPriceChangeTime;
    uint128 public lastPrice;

    // 暂停相关
    uint256 public pauseStartTime;
    bool public emergencyPauseActive;

    // 事件定义
    event TokensExchanged(
        address indexed buyer,
        uint256 bnbAmount,
        uint256 tokenAmount,
        uint256 timestamp,
        uint8 round,
        uint256 price
    );

    event DetailedTokensExchanged(
        address indexed buyer,
        uint256 bnbAmount,
        uint256 tokenAmount,
        uint256 timestamp,
        uint8 round,
        uint256 price,
        uint256 totalTokensSold,
        uint256 userTotalPurchased
    );

    event PriceUpdated(uint8 indexed round, uint128 oldPrice, uint128 newPrice, uint256 timestamp);
    event UserVerified(address indexed user, bool verified);
    event ExchangeStatusChanged(bool active);
    event EmergencyPauseActivated(address indexed pauser, uint256 timestamp);
    event EmergencyPauseDeactivated(address indexed pauser, uint256 timestamp);
    event EmergencyPauseExpired(uint256 timestamp);

    // 自定义错误
    error ExchangeNotActive();
    error AmountBelowMinimum();
    error AmountAboveMaximum();
    error PriceNotSet();
    error NotEnoughTokensLeft();
    error TokenTransferFailed();
    error SlippageTooHigh();
    error ExceedsMaxTokensPerTransaction();
    error PriceChangeExceedsLimit();
    error PriceChangeRateLimited();
    error InvalidMarketPrice();
    error EmergencyPauseAlreadyActive();
    error EmergencyPauseNotActive();
    error ExchangeInProgress();

    // 防止重入的修饰符
    modifier noReentrantExchange() {
        if (_exchanging[msg.sender]) revert ExchangeInProgress();
        _exchanging[msg.sender] = true;
        _;
        _exchanging[msg.sender] = false;
    }

    // 自动检查暂停过期
    modifier checkEmergencyPause() {
        if (emergencyPauseActive && 
            block.timestamp > pauseStartTime + MAX_PAUSE_DURATION) {
            emergencyPauseActive = false;
            _unpause();
            emit EmergencyPauseExpired(block.timestamp);
        }
        _;
    }

    constructor() {
        _disableInitializers();
    }

    function initialize(
        address _tokenAddress,
        address _bnbPriceFeed,
        uint128 _minPurchaseAmount,
        uint128 _maxPurchaseAmount
    ) public initializer {
        __ReentrancyGuard_init();
        __Pausable_init();
        __AccessControl_init();
        __UUPSUpgradeable_init();

        token = IERC20Upgradeable(_tokenAddress);
        bnbPriceFeed = AggregatorV3Interface(_bnbPriceFeed);
        minPurchaseAmount = _minPurchaseAmount;
        maxPurchaseAmount = _maxPurchaseAmount;

        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _grantRole(ADMIN_ROLE, msg.sender);
        _grantRole(FUNDS_MANAGER_ROLE, msg.sender);
        _grantRole(VERIFIER_ROLE, msg.sender);
        _grantRole(PAUSER_ROLE, msg.sender);
    }

    /**
     * @notice 紧急暂停功能，带有时间限制
     */
    function emergencyPause() external onlyRole(PAUSER_ROLE) {
        if (emergencyPauseActive) revert EmergencyPauseAlreadyActive();
        
        pauseStartTime = block.timestamp;
        emergencyPauseActive = true;
        _pause();
        
        emit EmergencyPauseActivated(msg.sender, block.timestamp);
    }

    /**
     * @notice 解除紧急暂停
     */
    function emergencyUnpause() external onlyRole(PAUSER_ROLE) {
        if (!emergencyPauseActive) revert EmergencyPauseNotActive();
        
        emergencyPauseActive = false;
        _unpause();
        
        emit EmergencyPauseDeactivated(msg.sender, block.timestamp);
    }

    /**
     * @notice 检查暂停是否过期并自动解除
     */
    function checkPauseExpiry() external {
        if (emergencyPauseActive && 
            block.timestamp > pauseStartTime + MAX_PAUSE_DURATION) {
            
            emergencyPauseActive = false;
            _unpause();
            
            emit EmergencyPauseExpired(block.timestamp);
        }
    }

    /**
     * @notice 安全的代币兑换功能，带有滑点保护
     */
    function exchangeTokens(uint256 minTokenAmount)
        external
        payable
        nonReentrant
        noReentrantExchange
        whenNotPaused
        checkEmergencyPause
    {
        // 1. 检查阶段 - 验证所有条件
        if (!exchangeActive) revert ExchangeNotActive();
        if (msg.value < minPurchaseAmount) revert AmountBelowMinimum();
        if (msg.value > maxPurchaseAmount) revert AmountAboveMaximum();

        // 使用局部变量缓存状态变量，减少SLOAD操作
        uint8 round = currentRound;
        uint128 price = rounds[round].price;

        if (price == 0) revert PriceNotSet();

        // 计算代币数量
        uint256 tokenAmount = (msg.value * 1e18) / price;
        
        // 滑点保护
        if (tokenAmount < minTokenAmount) revert SlippageTooHigh();

        // 检查最大单笔购买限制
        if (tokenAmount > maxTokensPerTransaction) revert ExceedsMaxTokensPerTransaction();

        // 缓存状态变量
        uint128 tokensSold = totalTokensSold;
        uint128 newTokensSold = tokensSold + uint128(tokenAmount);

        // 确保有足够的代币可供出售
        if (newTokensSold > totalTokensForSale) revert NotEnoughTokensLeft();

        // 2. 效果阶段 - 更新状态
        totalTokensSold = newTokensSold;
        
        // 更新用户数据
        UserData storage userData = users[msg.sender];
        userData.totalPurchased += uint128(tokenAmount);
        userData.lastPurchaseTime = uint64(block.timestamp);

        // 3. 交互阶段 - 外部调用
        bool success = token.transfer(msg.sender, tokenAmount);
        if (!success) revert TokenTransferFailed();

        // 发出详细事件
        emit TokensExchanged(msg.sender, msg.value, tokenAmount, block.timestamp, round, price);
        emit DetailedTokensExchanged(
            msg.sender,
            msg.value,
            tokenAmount,
            block.timestamp,
            round,
            price,
            totalTokensSold,
            userData.totalPurchased
        );
    }

    /**
     * @notice 安全的价格更新功能，带有验证机制
     */
    function updateRoundPrice(uint8 roundIndex, uint128 newPrice)
        external
        onlyRole(ADMIN_ROLE)
    {
        require(roundIndex < MAX_ROUNDS, "Invalid round");
        require(newPrice > 0, "Price must be greater than zero");
        require(
            block.timestamp >= lastPriceChangeTime + priceChangeTimelock,
            "Price update cooldown not met"
        );

        uint128 currentPrice = rounds[roundIndex].price;
        
        // 验证价格变化幅度
        if (currentPrice > 0) {
            uint256 priceChange = newPrice > currentPrice 
                ? ((newPrice - currentPrice) * 10000) / currentPrice
                : ((currentPrice - newPrice) * 10000) / currentPrice;
                
            if (priceChange > maxPriceChangePercent) revert PriceChangeExceedsLimit();
        }

        // 验证价格合理性（与市场价格对比）
        int256 marketPrice = getMarketPrice();
        if (marketPrice <= 0) revert InvalidMarketPrice();
        
        uint256 deviation = uint256(marketPrice) > newPrice
            ? ((uint256(marketPrice) - newPrice) * 10000) / uint256(marketPrice)
            : ((newPrice - uint256(marketPrice)) * 10000) / uint256(marketPrice);
            
        require(deviation <= 2000, "Price deviates too much from market"); // 20% max deviation

        rounds[roundIndex].price = newPrice;
        lastPriceChangeTime = block.timestamp;
        lastPrice = newPrice;
        
        emit PriceUpdated(roundIndex, currentPrice, newPrice, block.timestamp);
    }

    /**
     * @notice 获取市场价格
     */
    function getMarketPrice() internal view returns (int256) {
        if (address(bnbPriceFeed) != address(0)) {
            (, int256 price, , , ) = bnbPriceFeed.latestRoundData();
            return price;
        }
        return 0;
    }

    /**
     * @notice 计算指定BNB数量可兑换的代币数量
     */
    function getTokenAmountForBnb(uint256 _bnbAmount)
        public
        view
        returns (uint256)
    {
        uint256 currentPrice = rounds[currentRound].price;
        require(currentPrice > 0, "Price not set for current round");

        return (_bnbAmount * 1e18) / currentPrice;
    }

    /**
     * @notice 验证用户
     */
    function verifyUser(address user, bool verified)
        external
        onlyRole(VERIFIER_ROLE)
    {
        users[user].isVerified = verified;
        emit UserVerified(user, verified);
    }

    /**
     * @notice 设置交换状态
     */
    function setExchangeActive(bool active)
        external
        onlyRole(ADMIN_ROLE)
    {
        exchangeActive = active;
        emit ExchangeStatusChanged(active);
    }

    /**
     * @notice 提取资金
     */
    function withdrawFunds(uint256 amount)
        external
        onlyRole(FUNDS_MANAGER_ROLE)
        nonReentrant
    {
        require(amount <= address(this).balance, "Insufficient balance");
        
        (bool success, ) = payable(msg.sender).call{value: amount}("");
        require(success, "Transfer failed");
    }

    /**
     * @dev 授权升级
     */
    function _authorizeUpgrade(address newImplementation)
        internal
        onlyRole(DEFAULT_ADMIN_ROLE)
        override
    {}

    /**
     * @notice 获取合约状态
     */
    function getExchangeStats()
        external
        view
        returns (
            uint256 totalTokensSoldAmount,
            uint256 totalTokensRemaining,
            uint256 totalBnbRaised,
            uint256 currentPrice,
            uint256 nextRoundPrice,
            bool isActive,
            uint8 round
        )
    {
        totalTokensSoldAmount = totalTokensSold;
        totalTokensRemaining = totalTokensForSale - totalTokensSold;
        totalBnbRaised = address(this).balance;
        currentPrice = rounds[currentRound].price;
        nextRoundPrice = currentRound < MAX_ROUNDS - 1 ? rounds[currentRound + 1].price : 0;
        isActive = exchangeActive;
        round = currentRound;
    }
}
