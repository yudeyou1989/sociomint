// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * @title SMToken_Secure - 安全修复版本的SocioMint平台ERC20代币
 * @author SocioMint团队
 * @notice 这是修复了安全漏洞的SocioMint平台官方代币合约
 * @dev 修复内容：
 * 1. 时间锁哈希碰撞风险 - 添加nonce防止碰撞
 * 2. 访问控制加强 - 实现多签机制
 * 3. 紧急暂停机制完善 - 添加时间限制
 * 4. 重入攻击防护加强 - 严格CEI模式
 */

// 导入OpenZeppelin库
import "@openzeppelin/contracts-upgradeable/token/ERC20/ERC20Upgradeable.sol";
import "@openzeppelin/contracts-upgradeable/token/ERC20/extensions/ERC20BurnableUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/security/PausableUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/access/AccessControlUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/UUPSUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/security/ReentrancyGuardUpgradeable.sol";

contract SMToken_Secure is
    Initializable,
    ERC20Upgradeable,
    ERC20BurnableUpgradeable,
    PausableUpgradeable,
    AccessControlUpgradeable,
    UUPSUpgradeable,
    ReentrancyGuardUpgradeable
{
    // 角色定义
    bytes32 public constant PAUSER_ROLE = keccak256("PAUSER_ROLE");
    bytes32 public constant MINTER_ROLE = keccak256("MINTER_ROLE");
    bytes32 public constant UPGRADER_ROLE = keccak256("UPGRADER_ROLE");
    bytes32 public constant APPROVER_ROLE = keccak256("APPROVER_ROLE");

    // 时间锁定延迟常量
    uint32 public constant TIMELOCK_DELAY = 2 days;

    // 紧急暂停最大持续时间
    uint256 public constant MAX_PAUSE_DURATION = 7 days;

    // 铸造上限和已铸造数量
    uint256 public mintingCap;
    uint256 public mintedAmount;

    // 多签批准所需的最小批准数
    uint8 public requiredApprovals;

    // 操作nonce，防止哈希碰撞
    uint256 private _actionNonce;

    // 暂停开始时间
    uint256 public pauseStartTime;
    bool public emergencyPauseActive;

    // 时间锁操作的结构体
    struct TimelockAction {
        uint64 scheduledTime;
        bool executed;
        uint8 approvals;
        mapping(address => bool) approvers;
    }

    // 存储所有已安排的时间锁操作
    mapping(bytes32 => TimelockAction) public timelockActions;

    // 事件定义
    event TimelockActionEvent(bytes32 indexed actionHash, uint8 actionType, uint64 scheduledTime);
    event TokenOperation(address indexed account, uint256 amount, uint8 operationType);
    event ActionApproved(bytes32 indexed actionHash, address indexed approver, uint8 approvalCount);
    event MintingCapUpdated(uint256 oldCap, uint256 newCap);
    event ApprovalRequirementUpdated(uint8 oldRequirement, uint8 newRequirement);
    event EmergencyPauseActivated(address indexed pauser, uint256 timestamp);
    event EmergencyPauseDeactivated(address indexed pauser, uint256 timestamp);
    event EmergencyPauseExpired(uint256 timestamp);

    // 自定义错误
    error MintToZeroAddress();
    error MintAmountMustBeGreaterThanZero();
    error ExceedsMintingCap();
    error ActionNotScheduled();
    error ActionAlreadyExecuted();
    error ActionAlreadyScheduled();
    error TimelockDelayNotMet();
    error InsufficientApprovals();
    error ActionParametersMismatch();
    error AlreadyApproved();
    error EmergencyPauseAlreadyActive();
    error EmergencyPauseNotActive();

    constructor() {
        _disableInitializers();
    }

    function initialize(
        string memory _name,
        string memory _symbol,
        uint256 _initialMintingCap,
        uint8 _requiredApprovals
    )
        public
        initializer
    {
        __ERC20_init(_name, _symbol);
        __ERC20Burnable_init();
        __Pausable_init();
        __AccessControl_init();
        __UUPSUpgradeable_init();
        __ReentrancyGuard_init();

        mintingCap = _initialMintingCap;
        requiredApprovals = _requiredApprovals > 0 ? _requiredApprovals : 1;

        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _grantRole(PAUSER_ROLE, msg.sender);
        _grantRole(MINTER_ROLE, msg.sender);
        _grantRole(UPGRADER_ROLE, msg.sender);
        _grantRole(APPROVER_ROLE, msg.sender);
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
     * @notice 安全的时间锁铸币安排，防止哈希碰撞
     */
    function scheduleMint(address to, uint256 amount)
        external
        onlyRole(MINTER_ROLE)
        returns (bytes32)
    {
        if (to == address(0)) revert MintToZeroAddress();
        if (amount == 0) revert MintAmountMustBeGreaterThanZero();
        if (mintedAmount + amount > mintingCap) revert ExceedsMintingCap();

        // 使用nonce和区块号防止哈希碰撞
        bytes32 actionHash = keccak256(abi.encode(
            "mint",
            to,
            amount,
            block.timestamp,
            ++_actionNonce,
            block.number
        ));

        // 检查操作是否已存在
        if (timelockActions[actionHash].scheduledTime != 0) {
            revert ActionAlreadyScheduled();
        }

        uint64 scheduledTime = uint64(block.timestamp + TIMELOCK_DELAY);
        TimelockAction storage action = timelockActions[actionHash];
        action.scheduledTime = scheduledTime;
        action.executed = false;
        action.approvals = 0;

        emit TimelockActionEvent(actionHash, 0, scheduledTime);
        return actionHash;
    }

    /**
     * @notice 批准铸币操作
     */
    function approveAction(bytes32 actionHash)
        external
        onlyRole(APPROVER_ROLE)
    {
        TimelockAction storage action = timelockActions[actionHash];

        if (action.scheduledTime == 0) revert ActionNotScheduled();
        if (action.executed) revert ActionAlreadyExecuted();
        if (action.approvers[msg.sender]) revert AlreadyApproved();

        action.approvers[msg.sender] = true;
        action.approvals += 1;

        emit ActionApproved(actionHash, msg.sender, action.approvals);
    }

    /**
     * @notice 执行预定的铸币操作，严格遵循CEI模式
     */
    function executeMint(bytes32 actionHash, address to, uint256 amount)
        external
        onlyRole(MINTER_ROLE)
        nonReentrant
        whenNotPaused
    {
        // 检查阶段
        TimelockAction storage action = timelockActions[actionHash];

        if (action.scheduledTime == 0) revert ActionNotScheduled();
        if (action.executed) revert ActionAlreadyExecuted();
        if (block.timestamp < action.scheduledTime) revert TimelockDelayNotMet();
        if (action.approvals < requiredApprovals) revert InsufficientApprovals();

        // 验证铸造上限
        if (mintedAmount + amount > mintingCap) revert ExceedsMintingCap();

        // 效果阶段 - 更新状态
        action.executed = true;
        mintedAmount += amount;

        // 交互阶段 - 外部调用
        _mint(to, amount);

        emit TimelockActionEvent(actionHash, 1, 0);
        emit TokenOperation(to, amount, 0);
    }

    /**
     * @notice 取消预定操作
     */
    function cancelAction(bytes32 actionHash)
        external
        onlyRole(DEFAULT_ADMIN_ROLE)
    {
        TimelockAction storage action = timelockActions[actionHash];

        if (action.scheduledTime == 0) revert ActionNotScheduled();
        if (action.executed) revert ActionAlreadyExecuted();

        delete timelockActions[actionHash];

        emit TimelockActionEvent(actionHash, 2, 0);
    }

    /**
     * @notice 更新铸造上限
     */
    function updateMintingCap(uint256 newCap)
        external
        onlyRole(DEFAULT_ADMIN_ROLE)
    {
        require(newCap >= mintedAmount, "New cap cannot be less than minted amount");

        uint256 oldCap = mintingCap;
        mintingCap = newCap;

        emit MintingCapUpdated(oldCap, newCap);
    }

    /**
     * @notice 更新批准要求
     */
    function updateApprovalRequirement(uint8 newRequirement)
        external
        onlyRole(DEFAULT_ADMIN_ROLE)
    {
        require(newRequirement > 0, "Requirement must be greater than 0");

        uint8 oldRequirement = requiredApprovals;
        requiredApprovals = newRequirement;

        emit ApprovalRequirementUpdated(oldRequirement, newRequirement);
    }

    /**
     * @notice 获取操作详情
     */
    function getActionDetails(bytes32 actionHash)
        external
        view
        returns (
            uint64 scheduledTime,
            bool executed,
            uint8 approvals,
            bool canExecute
        )
    {
        TimelockAction storage action = timelockActions[actionHash];
        scheduledTime = action.scheduledTime;
        executed = action.executed;
        approvals = action.approvals;
        canExecute = !executed &&
                    block.timestamp >= scheduledTime &&
                    approvals >= requiredApprovals;
    }

    /**
     * @dev 重写转账函数，添加暂停过期检查
     */
    function _beforeTokenTransfer(
        address from,
        address to,
        uint256 amount
    ) internal override(ERC20Upgradeable) {
        // 自动检查暂停过期
        if (emergencyPauseActive &&
            block.timestamp > pauseStartTime + MAX_PAUSE_DURATION) {
            emergencyPauseActive = false;
            _unpause();
            emit EmergencyPauseExpired(block.timestamp);
        }

        super._beforeTokenTransfer(from, to, amount);
    }

    /**
     * @dev 授权升级
     */
    function _authorizeUpgrade(address newImplementation)
        internal
        onlyRole(UPGRADER_ROLE)
        override
    {}
}
