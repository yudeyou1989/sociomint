// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts-upgradeable/token/ERC20/ERC20Upgradeable.sol";
import "@openzeppelin/contracts-upgradeable/token/ERC20/extensions/ERC20BurnableUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/security/PausableUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/access/AccessControlUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/UUPSUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/security/ReentrancyGuardUpgradeable.sol";

/// @title SMToken - Gas优化版本的代币合约
/// @notice 实现带有安全特性的ERC20代币标准
contract SMToken is 
    Initializable, 
    ERC20Upgradeable, 
    ERC20BurnableUpgradeable, 
    PausableUpgradeable, 
    AccessControlUpgradeable, 
    UUPSUpgradeable,
    ReentrancyGuardUpgradeable 
{
    // 使用bytes32常量而不是字符串减少gas消耗
    bytes32 public constant PAUSER_ROLE = keccak256("PAUSER_ROLE");
    bytes32 public constant MINTER_ROLE = keccak256("MINTER_ROLE");
    bytes32 public constant UPGRADER_ROLE = keccak256("UPGRADER_ROLE");
    
    // 使用uint32可以节省存储空间，同时足够表示天数
    uint32 public constant TIMELOCK_DELAY = 2 days;
    
    // 紧凑结构体定义，尽可能在单个存储槽中放置多个字段
    struct TimelockAction {
        uint64 scheduledTime; // 使用uint64足够表示时间戳，减少存储空间
        bool executed;        // 合并到同一个存储槽
    }
    
    // 减少映射数量，合并相关数据
    mapping(bytes32 => TimelockAction) public timelockActions;
    
    // 合并相关事件，减少事件总数
    event TimelockAction(bytes32 indexed actionHash, uint8 actionType, uint64 scheduledTime);
    event TokenOperation(address indexed account, uint256 amount, uint8 operationType);
    
    /// @custom:oz-upgrades-unsafe-allow constructor
    constructor() {
        _disableInitializers();
    }

    /// @notice 初始化代币合约
    function initialize(string memory _name, string memory _symbol) 
        public 
        initializer 
    {
        // 合并初始化调用，减少SSTORE操作
        __ERC20_init(_name, _symbol);
        __ERC20Burnable_init();
        __Pausable_init();
        __AccessControl_init();
        __UUPSUpgradeable_init();
        __ReentrancyGuard_init();

        // 一次性授予所有角色，减少函数调用
        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _grantRole(PAUSER_ROLE, msg.sender);
        _grantRole(MINTER_ROLE, msg.sender);
        _grantRole(UPGRADER_ROLE, msg.sender);
    }

    /// @notice 暂停所有代币转移
    function pause() 
        external 
        onlyRole(PAUSER_ROLE) 
    {
        _pause();
    }

    /// @notice 恢复所有代币转移
    function unpause() 
        external 
        onlyRole(PAUSER_ROLE) 
    {
        _unpause();
    }

    /// @notice 通过时间锁安排铸币操作
    function scheduleMint(address to, uint256 amount) 
        external 
        onlyRole(MINTER_ROLE)
        returns (bytes32)
    {
        require(to != address(0), "SMToken: mint to the zero address");
        require(amount > 0, "SMToken: mint amount must be greater than 0");
        
        // 优化存储布局和逻辑
        bytes32 actionHash = keccak256(abi.encode("mint", to, amount, block.timestamp));
        timelockActions[actionHash] = TimelockAction({
            scheduledTime: uint64(block.timestamp + TIMELOCK_DELAY),
            executed: false
        });
        
        // 使用优化后的事件
        emit TimelockAction(actionHash, 0, uint64(block.timestamp + TIMELOCK_DELAY));
        return actionHash;
    }
    
    /// @notice 执行预定的铸币操作
    function executeMint(bytes32 actionHash, address to, uint256 amount)
        external
        onlyRole(MINTER_ROLE)
        nonReentrant
    {
        TimelockAction storage action = timelockActions[actionHash];
        require(action.scheduledTime > 0, "SMToken: action not scheduled");
        require(!action.executed, "SMToken: action already executed");
        require(block.timestamp >= action.scheduledTime, "SMToken: timelock delay not met");
        
        // 验证参数匹配
        bytes32 expectedHash = keccak256(abi.encode(
            "mint", 
            to, 
            amount, 
            action.scheduledTime - TIMELOCK_DELAY
        ));
        require(actionHash == expectedHash, "SMToken: action parameters mismatch");
        
        action.executed = true;
        
        _mint(to, amount);
        
        // 使用优化后的事件
        emit TimelockAction(actionHash, 1, 0);
        emit TokenOperation(to, amount, 0);
    }
    
    /// @notice 取消预定操作
    function cancelAction(bytes32 actionHash)
        external
        onlyRole(DEFAULT_ADMIN_ROLE)
    {
        TimelockAction storage action = timelockActions[actionHash];
        require(action.scheduledTime > 0, "SMToken: action not scheduled");
        require(!action.executed, "SMToken: action already executed");
        
        delete timelockActions[actionHash];
        
        // 使用优化后的事件
        emit TimelockAction(actionHash, 2, 0);
    }

    /// @notice 转移前的钩子函数
    function _beforeTokenTransfer(address from, address to, uint256 amount)
        internal
        override
        whenNotPaused
    {
        super._beforeTokenTransfer(from, to, amount);
    }

    /// @notice 授权合约升级
    function _authorizeUpgrade(address newImplementation)
        internal
        override
        onlyRole(UPGRADER_ROLE)
        whenPaused
    {
        require(paused(), "SMToken: must pause before upgrade");
    }
}