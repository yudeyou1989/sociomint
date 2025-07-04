// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/token/ERC20/extensions/ERC20Burnable.sol";
import "@openzeppelin/contracts/security/Pausable.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title SMToken - SocioMint平台ERC20代币
 * @author SocioMint团队
 * @notice SocioMint平台官方代币合约
 */
contract SMToken is ERC20, ERC20Burnable, Pausable, Ownable {
    
    // 事件
    event TokensMinted(address indexed to, uint256 amount);
    event TokensBurned(address indexed from, uint256 amount);
    
    /**
     * @dev 构造函数
     * @param name 代币名称
     * @param symbol 代币符号
     * @param initialSupply 初始供应量
     */
    constructor(
        string memory name,
        string memory symbol,
        uint256 initialSupply
    ) ERC20(name, symbol) Ownable() {
        _mint(msg.sender, initialSupply);
        emit TokensMinted(msg.sender, initialSupply);
    }
    
    /**
     * @dev 暂停合约
     * 只有所有者可以调用
     */
    function pause() public onlyOwner {
        _pause();
    }
    
    /**
     * @dev 恢复合约
     * 只有所有者可以调用
     */
    function unpause() public onlyOwner {
        _unpause();
    }
    
    /**
     * @dev 铸造代币
     * @param to 接收地址
     * @param amount 铸造数量
     */
    function mint(address to, uint256 amount) public onlyOwner {
        _mint(to, amount);
        emit TokensMinted(to, amount);
    }
    
    /**
     * @dev 批量转账
     * @param recipients 接收地址数组
     * @param amounts 转账数量数组
     */
    function batchTransfer(
        address[] calldata recipients,
        uint256[] calldata amounts
    ) external {
        require(recipients.length == amounts.length, "Arrays length mismatch");
        require(recipients.length <= 100, "Too many recipients");
        
        for (uint256 i = 0; i < recipients.length; i++) {
            transfer(recipients[i], amounts[i]);
        }
    }
    
    /**
     * @dev 重写transfer函数以支持暂停功能
     */
    function transfer(address to, uint256 amount) 
        public 
        override 
        whenNotPaused 
        returns (bool) 
    {
        return super.transfer(to, amount);
    }
    
    /**
     * @dev 重写transferFrom函数以支持暂停功能
     */
    function transferFrom(address from, address to, uint256 amount) 
        public 
        override 
        whenNotPaused 
        returns (bool) 
    {
        return super.transferFrom(from, to, amount);
    }
    
    /**
     * @dev 重写burn函数以添加事件
     */
    function burn(uint256 amount) public override {
        super.burn(amount);
        emit TokensBurned(msg.sender, amount);
    }
    
    /**
     * @dev 重写burnFrom函数以添加事件
     */
    function burnFrom(address account, uint256 amount) public override {
        super.burnFrom(account, amount);
        emit TokensBurned(account, amount);
    }
}
