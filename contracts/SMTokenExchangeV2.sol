// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/UUPSUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/security/ReentrancyGuardUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/security/PausableUpgradeable.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";

/**
 * @title SMTokenExchange V2
 * @dev 扩展版本，支持每日持币奖励功能
 * @author SocioMint Team
 */
contract SMTokenExchangeV2 is 
    Initializable,
    UUPSUpgradeable,
    OwnableUpgradeable,
    ReentrancyGuardUpgradeable,
    PausableUpgradeable
{
    using SafeERC20 for IERC20;

    // ============ 状态变量 ============
    
    // 代币合约
    IERC20 public smToken;
    IERC20 public redFlowerToken;
    
    // 交换相关
    uint256 public exchangeRate; // 1 SM = exchangeRate 小红花
    uint256 public totalExchanged;
    
    // 每日奖励相关
    uint256 public flowersPer500Sm; // 每 500 SM 对应的小红花数量
    uint256 public maxDailyFlowersPerUser; // 每日最大领取数量
    uint256 public constant DAILY_CLAIM_INTERVAL = 24 hours; // 24小时间隔
    
    // 用户每日领取记录
    mapping(address => uint256) public lastClaimTime;
    mapping(address => uint256) public totalDailyFlowersClaimed;
    
    // ============ 事件 ============
    
    event TokensExchanged(
        address indexed user,
        uint256 smAmount,
        uint256 redFlowerAmount,
        uint256 timestamp
    );
    
    event DailyFlowersClaimed(
        address indexed user,
        uint256 smBalance,
        uint256 flowersAmount,
        uint256 timestamp
    );
    
    event DailyRewardConfigUpdated(
        uint256 flowersPer500Sm,
        uint256 maxDailyFlowersPerUser
    );
    
    // ============ 修饰符 ============
    
    modifier canClaimDaily() {
        require(
            block.timestamp >= lastClaimTime[msg.sender] + DAILY_CLAIM_INTERVAL,
            "Daily reward already claimed"
        );
        _;
    }
    
    // ============ 初始化 ============
    
    /// @custom:oz-upgrades-unsafe-allow constructor
    constructor() {
        _disableInitializers();
    }
    
    function initialize(
        address _smToken,
        address _redFlowerToken,
        uint256 _exchangeRate
    ) public initializer {
        __Ownable_init();
        __ReentrancyGuard_init();
        __Pausable_init();
        __UUPSUpgradeable_init();
        
        smToken = IERC20(_smToken);
        redFlowerToken = IERC20(_redFlowerToken);
        exchangeRate = _exchangeRate;
        
        // 每日奖励默认配置
        flowersPer500Sm = 10; // 每 500 SM 获得 10 小红花
        maxDailyFlowersPerUser = 200; // 每日最多 200 小红花
    }
    
    // ============ 升级授权 ============
    
    function _authorizeUpgrade(address newImplementation) 
        internal 
        override 
        onlyOwner 
    {}
    
    // ============ 代币交换功能 ============
    
    /**
     * @dev 将 SM 代币兑换为小红花
     * @param smAmount 要兑换的 SM 代币数量
     */
    function exchangeSmToFlowers(uint256 smAmount) 
        external 
        nonReentrant 
        whenNotPaused 
    {
        require(smAmount > 0, "Amount must be greater than 0");
        
        uint256 redFlowerAmount = smAmount * exchangeRate;
        
        // 检查合约余额
        require(
            redFlowerToken.balanceOf(address(this)) >= redFlowerAmount,
            "Insufficient red flower balance in contract"
        );
        
        // 转入 SM 代币
        smToken.safeTransferFrom(msg.sender, address(this), smAmount);
        
        // 转出小红花
        redFlowerToken.safeTransfer(msg.sender, redFlowerAmount);
        
        totalExchanged += smAmount;
        
        emit TokensExchanged(msg.sender, smAmount, redFlowerAmount, block.timestamp);
    }
    
    // ============ 每日持币奖励功能 ============
    
    /**
     * @dev 领取每日持币奖励
     */
    function claimDailyFlowers() 
        external 
        nonReentrant 
        whenNotPaused 
        canClaimDaily 
    {
        uint256 userSmBalance = smToken.balanceOf(msg.sender);
        require(userSmBalance > 0, "No SM tokens to claim rewards");
        
        uint256 flowersAmount = getDailyFlowerAmount(msg.sender);
        require(flowersAmount > 0, "No flowers to claim");
        
        // 检查合约小红花余额
        require(
            redFlowerToken.balanceOf(address(this)) >= flowersAmount,
            "Insufficient red flower balance in contract"
        );
        
        // 更新领取时间和累计数量
        lastClaimTime[msg.sender] = block.timestamp;
        totalDailyFlowersClaimed[msg.sender] += flowersAmount;
        
        // 转出小红花奖励
        redFlowerToken.safeTransfer(msg.sender, flowersAmount);
        
        emit DailyFlowersClaimed(msg.sender, userSmBalance, flowersAmount, block.timestamp);
    }
    
    /**
     * @dev 计算用户可领取的每日小红花数量
     * @param user 用户地址
     * @return 可领取的小红花数量
     */
    function getDailyFlowerAmount(address user) public view returns (uint256) {
        uint256 userSmBalance = smToken.balanceOf(user);
        if (userSmBalance == 0) {
            return 0;
        }
        
        // 计算基于持币量的奖励：每 500 SM 获得 flowersPer500Sm 小红花
        uint256 flowersAmount = (userSmBalance / (500 * 10**18)) * flowersPer500Sm;
        
        // 限制最大每日奖励
        if (flowersAmount > maxDailyFlowersPerUser) {
            flowersAmount = maxDailyFlowersPerUser;
        }
        
        return flowersAmount;
    }
    
    /**
     * @dev 检查用户是否可以领取每日奖励
     * @param user 用户地址
     * @return 是否可以领取
     */
    function canClaimDailyReward(address user) public view returns (bool) {
        return block.timestamp >= lastClaimTime[user] + DAILY_CLAIM_INTERVAL;
    }
    
    /**
     * @dev 获取用户下次可领取时间
     * @param user 用户地址
     * @return 下次可领取的时间戳
     */
    function getNextClaimTime(address user) public view returns (uint256) {
        if (lastClaimTime[user] == 0) {
            return block.timestamp; // 首次可立即领取
        }
        return lastClaimTime[user] + DAILY_CLAIM_INTERVAL;
    }
    
    /**
     * @dev 获取用户每日奖励统计信息
     * @param user 用户地址
     * @return smBalance 用户 SM 余额
     * @return dailyFlowers 每日可领取小红花数量
     * @return canClaim 是否可以领取
     * @return nextClaimTime 下次领取时间
     * @return totalClaimed 累计已领取数量
     */
    function getUserDailyRewardInfo(address user) 
        external 
        view 
        returns (
            uint256 smBalance,
            uint256 dailyFlowers,
            bool canClaim,
            uint256 nextClaimTime,
            uint256 totalClaimed
        ) 
    {
        smBalance = smToken.balanceOf(user);
        dailyFlowers = getDailyFlowerAmount(user);
        canClaim = canClaimDailyReward(user);
        nextClaimTime = getNextClaimTime(user);
        totalClaimed = totalDailyFlowersClaimed[user];
    }
    
    // ============ 管理员功能 ============
    
    /**
     * @dev 设置交换汇率
     * @param _exchangeRate 新的交换汇率
     */
    function setExchangeRate(uint256 _exchangeRate) external onlyOwner {
        require(_exchangeRate > 0, "Exchange rate must be greater than 0");
        exchangeRate = _exchangeRate;
    }
    
    /**
     * @dev 设置每日奖励配置
     * @param _flowersPer500Sm 每 500 SM 对应的小红花数量
     * @param _maxDailyFlowersPerUser 每日最大领取数量
     */
    function setDailyRewardConfig(
        uint256 _flowersPer500Sm,
        uint256 _maxDailyFlowersPerUser
    ) external onlyOwner {
        require(_flowersPer500Sm > 0, "Flowers per 500 SM must be greater than 0");
        require(_maxDailyFlowersPerUser > 0, "Max daily flowers must be greater than 0");
        
        flowersPer500Sm = _flowersPer500Sm;
        maxDailyFlowersPerUser = _maxDailyFlowersPerUser;
        
        emit DailyRewardConfigUpdated(_flowersPer500Sm, _maxDailyFlowersPerUser);
    }
    
    /**
     * @dev 紧急提取代币
     * @param token 代币地址
     * @param amount 提取数量
     */
    function emergencyWithdraw(address token, uint256 amount) external onlyOwner {
        IERC20(token).safeTransfer(owner(), amount);
    }
    
    /**
     * @dev 暂停合约
     */
    function pause() external onlyOwner {
        _pause();
    }
    
    /**
     * @dev 恢复合约
     */
    function unpause() external onlyOwner {
        _unpause();
    }
    
    // ============ 查询功能 ============
    
    /**
     * @dev 获取合约基本信息
     */
    function getContractInfo() 
        external 
        view 
        returns (
            address smTokenAddress,
            address redFlowerTokenAddress,
            uint256 currentExchangeRate,
            uint256 totalExchangedAmount,
            uint256 contractSmBalance,
            uint256 contractRedFlowerBalance
        ) 
    {
        smTokenAddress = address(smToken);
        redFlowerTokenAddress = address(redFlowerToken);
        currentExchangeRate = exchangeRate;
        totalExchangedAmount = totalExchanged;
        contractSmBalance = smToken.balanceOf(address(this));
        contractRedFlowerBalance = redFlowerToken.balanceOf(address(this));
    }
    
    /**
     * @dev 获取每日奖励配置
     */
    function getDailyRewardConfig() 
        external 
        view 
        returns (
            uint256 _flowersPer500Sm,
            uint256 _maxDailyFlowersPerUser,
            uint256 _dailyClaimInterval
        ) 
    {
        _flowersPer500Sm = flowersPer500Sm;
        _maxDailyFlowersPerUser = maxDailyFlowersPerUser;
        _dailyClaimInterval = DAILY_CLAIM_INTERVAL;
    }
}
