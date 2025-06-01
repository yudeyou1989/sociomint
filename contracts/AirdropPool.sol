// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/UUPSUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/security/ReentrancyGuardUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/security/PausableUpgradeable.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

/**
 * @title SocioMint 小红花空投池
 * @dev 用户使用小红花参与每周 SM 代币空投的智能合约
 * @author SocioMint Team
 */
contract AirdropPool is 
    Initializable, 
    UUPSUpgradeable, 
    OwnableUpgradeable, 
    ReentrancyGuardUpgradeable,
    PausableUpgradeable 
{
    // 代币接口
    IERC20 public smToken;
    IERC20 public redFlowerToken;
    
    // 空投池配置
    struct PoolConfig {
        uint256 weeklySmAmount;      // 每周空投的 SM 数量
        uint256 roundDuration;       // 每轮持续时间（秒）
        uint256 minDeposit;          // 最小投入小红花数量
        uint256 maxDeposit;          // 最大投入小红花数量
        bool isActive;               // 空投池是否激活
    }
    
    // 用户投入记录
    struct UserDeposit {
        uint256 amount;              // 投入的小红花数量
        uint256 roundId;             // 投入的轮次
        uint256 timestamp;           // 投入时间
        bool claimed;                // 是否已领取奖励
    }
    
    // 轮次信息
    struct Round {
        uint256 id;                  // 轮次ID
        uint256 startTime;           // 开始时间
        uint256 endTime;             // 结束时间
        uint256 totalDeposits;       // 总投入小红花数量
        uint256 totalRewards;        // 总奖励 SM 数量
        uint256 participantCount;    // 参与人数
        bool distributed;            // 是否已分配奖励
    }
    
    // 状态变量
    PoolConfig public poolConfig;
    uint256 public currentRoundId;
    uint256 public totalRounds;
    
    // 映射
    mapping(uint256 => Round) public rounds;                    // 轮次信息
    mapping(address => mapping(uint256 => UserDeposit)) public userDeposits; // 用户投入记录
    mapping(address => uint256[]) public userRounds;            // 用户参与的轮次
    mapping(uint256 => address[]) public roundParticipants;     // 每轮参与者
    mapping(address => uint256) public userTotalDeposits;       // 用户总投入
    mapping(address => uint256) public userTotalRewards;        // 用户总奖励
    
    // 事件
    event PoolConfigUpdated(uint256 weeklySmAmount, uint256 roundDuration, uint256 minDeposit, uint256 maxDeposit);
    event FlowersDeposited(address indexed user, uint256 amount, uint256 roundId);
    event RewardClaimed(address indexed user, uint256 amount, uint256 roundId);
    event RoundStarted(uint256 indexed roundId, uint256 startTime, uint256 endTime);
    event RoundEnded(uint256 indexed roundId, uint256 totalDeposits, uint256 participantCount);
    event RewardsDistributed(uint256 indexed roundId, uint256 totalRewards);
    event EmergencyWithdraw(address indexed user, uint256 amount);
    
    // 修饰符
    modifier onlyActivePool() {
        require(poolConfig.isActive, "AirdropPool: Pool is not active");
        _;
    }
    
    modifier validAmount(uint256 amount) {
        require(amount >= poolConfig.minDeposit, "AirdropPool: Amount below minimum");
        require(amount <= poolConfig.maxDeposit, "AirdropPool: Amount above maximum");
        _;
    }
    
    modifier roundActive(uint256 roundId) {
        require(roundId == currentRoundId, "AirdropPool: Round not active");
        require(block.timestamp >= rounds[roundId].startTime, "AirdropPool: Round not started");
        require(block.timestamp < rounds[roundId].endTime, "AirdropPool: Round ended");
        _;
    }
    
    /// @custom:oz-upgrades-unsafe-allow constructor
    constructor() {
        _disableInitializers();
    }
    
    /**
     * @dev 初始化合约
     */
    function initialize(
        address _smToken,
        address _redFlowerToken,
        uint256 _weeklySmAmount,
        uint256 _roundDuration
    ) public initializer {
        __Ownable_init();
        __ReentrancyGuard_init();
        __Pausable_init();
        __UUPSUpgradeable_init();
        
        smToken = IERC20(_smToken);
        redFlowerToken = IERC20(_redFlowerToken);
        
        poolConfig = PoolConfig({
            weeklySmAmount: _weeklySmAmount,
            roundDuration: _roundDuration,
            minDeposit: 10 * 10**18,      // 最小 10 小红花
            maxDeposit: 10000 * 10**18,   // 最大 10000 小红花
            isActive: true
        });
        
        currentRoundId = 1;
        totalRounds = 0;
        
        // 启动第一轮
        _startNewRound();
    }
    
    /**
     * @dev 用户投入小红花到空投池
     */
    function depositFlowers(uint256 amount) 
        external 
        nonReentrant 
        whenNotPaused 
        onlyActivePool 
        validAmount(amount)
        roundActive(currentRoundId)
    {
        require(amount > 0, "AirdropPool: Amount must be greater than 0");
        
        // 检查用户是否已在本轮投入
        require(userDeposits[msg.sender][currentRoundId].amount == 0, "AirdropPool: Already deposited in this round");
        
        // 转移小红花到合约
        require(
            redFlowerToken.transferFrom(msg.sender, address(this), amount),
            "AirdropPool: Transfer failed"
        );
        
        // 记录用户投入
        userDeposits[msg.sender][currentRoundId] = UserDeposit({
            amount: amount,
            roundId: currentRoundId,
            timestamp: block.timestamp,
            claimed: false
        });
        
        // 更新轮次信息
        rounds[currentRoundId].totalDeposits += amount;
        rounds[currentRoundId].participantCount += 1;
        
        // 添加到参与者列表
        roundParticipants[currentRoundId].push(msg.sender);
        userRounds[msg.sender].push(currentRoundId);
        
        // 更新用户统计
        userTotalDeposits[msg.sender] += amount;
        
        emit FlowersDeposited(msg.sender, amount, currentRoundId);
    }
    
    /**
     * @dev 用户领取奖励
     */
    function claimReward(uint256 roundId) 
        external 
        nonReentrant 
        whenNotPaused 
    {
        require(rounds[roundId].distributed, "AirdropPool: Rewards not distributed yet");
        require(userDeposits[msg.sender][roundId].amount > 0, "AirdropPool: No deposit in this round");
        require(!userDeposits[msg.sender][roundId].claimed, "AirdropPool: Already claimed");
        
        // 计算用户奖励
        uint256 userReward = calculateUserReward(msg.sender, roundId);
        require(userReward > 0, "AirdropPool: No reward to claim");
        
        // 标记为已领取
        userDeposits[msg.sender][roundId].claimed = true;
        userTotalRewards[msg.sender] += userReward;
        
        // 转移 SM 代币给用户
        require(
            smToken.transfer(msg.sender, userReward),
            "AirdropPool: Reward transfer failed"
        );
        
        emit RewardClaimed(msg.sender, userReward, roundId);
    }
    
    /**
     * @dev 管理员设置空投池参数
     */
    function setPoolConfig(
        uint256 _weeklySmAmount,
        uint256 _roundDuration,
        uint256 _minDeposit,
        uint256 _maxDeposit
    ) external onlyOwner {
        poolConfig.weeklySmAmount = _weeklySmAmount;
        poolConfig.roundDuration = _roundDuration;
        poolConfig.minDeposit = _minDeposit;
        poolConfig.maxDeposit = _maxDeposit;
        
        emit PoolConfigUpdated(_weeklySmAmount, _roundDuration, _minDeposit, _maxDeposit);
    }
    
    /**
     * @dev 管理员分配奖励（每周结算）
     */
    function distributeRewards(uint256 roundId) external onlyOwner {
        require(roundId <= currentRoundId, "AirdropPool: Invalid round");
        require(block.timestamp >= rounds[roundId].endTime, "AirdropPool: Round not ended");
        require(!rounds[roundId].distributed, "AirdropPool: Already distributed");
        
        Round storage round = rounds[roundId];
        round.totalRewards = poolConfig.weeklySmAmount;
        round.distributed = true;
        
        emit RewardsDistributed(roundId, round.totalRewards);
        
        // 如果当前轮次结束，启动新轮次
        if (roundId == currentRoundId) {
            _startNewRound();
        }
    }
    
    /**
     * @dev 计算用户在指定轮次的奖励
     */
    function calculateUserReward(address user, uint256 roundId) public view returns (uint256) {
        if (!rounds[roundId].distributed || userDeposits[user][roundId].amount == 0) {
            return 0;
        }
        
        Round memory round = rounds[roundId];
        UserDeposit memory deposit = userDeposits[user][roundId];
        
        // 奖励 = (用户投入 / 总投入) * 总奖励
        return (deposit.amount * round.totalRewards) / round.totalDeposits;
    }
    
    /**
     * @dev 获取当前轮次信息
     */
    function getCurrentRound() external view returns (Round memory) {
        return rounds[currentRoundId];
    }
    
    /**
     * @dev 获取用户在当前轮次的投入
     */
    function getUserCurrentDeposit(address user) external view returns (UserDeposit memory) {
        return userDeposits[user][currentRoundId];
    }
    
    /**
     * @dev 获取用户参与的所有轮次
     */
    function getUserRounds(address user) external view returns (uint256[] memory) {
        return userRounds[user];
    }
    
    /**
     * @dev 获取轮次参与者列表
     */
    function getRoundParticipants(uint256 roundId) external view returns (address[] memory) {
        return roundParticipants[roundId];
    }
    
    /**
     * @dev 获取下一轮开始时间
     */
    function getNextRoundStartTime() external view returns (uint256) {
        return rounds[currentRoundId].endTime;
    }
    
    /**
     * @dev 启动新轮次
     */
    function _startNewRound() internal {
        currentRoundId++;
        totalRounds++;
        
        uint256 startTime = block.timestamp;
        uint256 endTime = startTime + poolConfig.roundDuration;
        
        rounds[currentRoundId] = Round({
            id: currentRoundId,
            startTime: startTime,
            endTime: endTime,
            totalDeposits: 0,
            totalRewards: 0,
            participantCount: 0,
            distributed: false
        });
        
        emit RoundStarted(currentRoundId, startTime, endTime);
    }
    
    /**
     * @dev 紧急提取（仅限管理员）
     */
    function emergencyWithdraw(address token, uint256 amount) external onlyOwner {
        require(IERC20(token).transfer(owner(), amount), "AirdropPool: Emergency withdraw failed");
        emit EmergencyWithdraw(owner(), amount);
    }
    
    /**
     * @dev 暂停/恢复空投池
     */
    function togglePoolStatus() external onlyOwner {
        poolConfig.isActive = !poolConfig.isActive;
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
    
    /**
     * @dev 授权升级（UUPS 模式）
     */
    function _authorizeUpgrade(address newImplementation) internal override onlyOwner {}
    
    /**
     * @dev 获取合约版本
     */
    function version() external pure returns (string memory) {
        return "1.0.0";
    }
}
