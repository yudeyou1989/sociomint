// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/security/Pausable.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/math/Math.sol";

/**
 * @title SMTokenExchange - SM代币交换合约
 * @author SocioMint团队
 * @notice 用于SM代币与BNB的交换
 */
contract SMTokenExchange is ReentrancyGuard, Pausable, Ownable {
    
    IERC20 public immutable smToken;
    
    // 价格参数
    uint256 public currentPrice;      // 当前价格 (wei per token)
    uint256 public priceIncrement;    // 每轮价格增量
    uint256 public maxTokensPerRound; // 每轮最大代币数
    
    // 轮次信息
    uint256 public currentRound;      // 当前轮次
    uint256 public tokensInCurrentRound; // 当前轮次已售代币数
    
    // 统计信息
    uint256 public totalTokensSold;   // 总售出代币数
    uint256 public totalBNBRaised;    // 总筹集BNB数
    
    // 事件
    event TokensPurchased(
        address indexed buyer,
        uint256 bnbAmount,
        uint256 tokenAmount,
        uint256 round,
        uint256 price
    );
    
    event TokensSold(
        address indexed seller,
        uint256 tokenAmount,
        uint256 bnbAmount,
        uint256 round,
        uint256 price
    );
    
    event PriceUpdated(uint256 newPrice, uint256 round);
    event RoundAdvanced(uint256 newRound, uint256 newPrice);
    
    /**
     * @dev 构造函数
     * @param _smToken SM代币合约地址
     * @param _initialPrice 初始价格
     * @param _priceIncrement 价格增量
     * @param _maxTokensPerRound 每轮最大代币数
     */
    constructor(
        address _smToken,
        uint256 _initialPrice,
        uint256 _priceIncrement,
        uint256 _maxTokensPerRound
    ) Ownable() {
        require(_smToken != address(0), "Invalid token address");
        require(_initialPrice > 0, "Invalid initial price");
        require(_priceIncrement > 0, "Invalid price increment");
        require(_maxTokensPerRound > 0, "Invalid max tokens per round");
        
        smToken = IERC20(_smToken);
        currentPrice = _initialPrice;
        priceIncrement = _priceIncrement;
        maxTokensPerRound = _maxTokensPerRound;
        currentRound = 1;
    }
    
    /**
     * @dev 购买代币
     */
    function buyTokens() external payable nonReentrant whenNotPaused {
        require(msg.value > 0, "BNB amount must be greater than 0");
        
        uint256 bnbAmount = msg.value;
        uint256 tokenAmount = calculateTokensForBNB(bnbAmount);
        
        require(tokenAmount > 0, "Insufficient BNB for purchase");
        require(
            smToken.balanceOf(address(this)) >= tokenAmount,
            "Insufficient token balance in contract"
        );
        
        // 更新轮次信息
        _updateRoundInfo(tokenAmount);
        
        // 转移代币
        require(smToken.transfer(msg.sender, tokenAmount), "Token transfer failed");
        
        // 更新统计信息
        totalTokensSold += tokenAmount;
        totalBNBRaised += bnbAmount;
        
        emit TokensPurchased(msg.sender, bnbAmount, tokenAmount, currentRound, currentPrice);
    }
    
    /**
     * @dev 出售代币
     * @param tokenAmount 要出售的代币数量
     */
    function sellTokens(uint256 tokenAmount) external nonReentrant whenNotPaused {
        require(tokenAmount > 0, "Token amount must be greater than 0");
        require(
            smToken.balanceOf(msg.sender) >= tokenAmount,
            "Insufficient token balance"
        );
        
        uint256 bnbAmount = calculateBNBForTokens(tokenAmount);
        require(address(this).balance >= bnbAmount, "Insufficient BNB in contract");
        
        // 转移代币到合约
        require(
            smToken.transferFrom(msg.sender, address(this), tokenAmount),
            "Token transfer failed"
        );
        
        // 转移BNB给用户
        (bool success, ) = payable(msg.sender).call{value: bnbAmount}("");
        require(success, "BNB transfer failed");
        
        emit TokensSold(msg.sender, tokenAmount, bnbAmount, currentRound, currentPrice);
    }
    
    /**
     * @dev 计算指定BNB数量可购买的代币数量
     * @param bnbAmount BNB数量
     * @return 代币数量
     */
    function calculateTokensForBNB(uint256 bnbAmount) public view returns (uint256) {
        if (bnbAmount == 0 || currentPrice == 0) return 0;
        return (bnbAmount * 1e18) / currentPrice;
    }
    
    /**
     * @dev 计算指定代币数量可获得的BNB数量
     * @param tokenAmount 代币数量
     * @return BNB数量
     */
    function calculateBNBForTokens(uint256 tokenAmount) public view returns (uint256) {
        if (tokenAmount == 0 || currentPrice == 0) return 0;
        return (tokenAmount * currentPrice) / 1e18;
    }
    
    /**
     * @dev 更新轮次信息
     * @param tokenAmount 购买的代币数量
     */
    function _updateRoundInfo(uint256 tokenAmount) internal {
        tokensInCurrentRound += tokenAmount;
        
        // 检查是否需要进入下一轮
        if (tokensInCurrentRound >= maxTokensPerRound) {
            currentRound++;
            currentPrice += priceIncrement;
            tokensInCurrentRound = 0;
            
            emit RoundAdvanced(currentRound, currentPrice);
            emit PriceUpdated(currentPrice, currentRound);
        }
    }
    
    /**
     * @dev 获取合约状态信息
     */
    function getContractInfo() external view returns (
        uint256 _currentPrice,
        uint256 _currentRound,
        uint256 _tokensInCurrentRound,
        uint256 _maxTokensPerRound,
        uint256 _totalTokensSold,
        uint256 _totalBNBRaised,
        uint256 _contractTokenBalance,
        uint256 _contractBNBBalance
    ) {
        return (
            currentPrice,
            currentRound,
            tokensInCurrentRound,
            maxTokensPerRound,
            totalTokensSold,
            totalBNBRaised,
            smToken.balanceOf(address(this)),
            address(this).balance
        );
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
     * @dev 提取BNB
     * @param amount 提取数量
     */
    function withdrawBNB(uint256 amount) external onlyOwner {
        require(amount <= address(this).balance, "Insufficient balance");
        (bool success, ) = payable(owner()).call{value: amount}("");
        require(success, "Transfer failed");
    }
    
    /**
     * @dev 提取代币
     * @param amount 提取数量
     */
    function withdrawTokens(uint256 amount) external onlyOwner {
        require(amount <= smToken.balanceOf(address(this)), "Insufficient token balance");
        require(smToken.transfer(owner(), amount), "Token transfer failed");
    }
    
    /**
     * @dev 接收BNB
     */
    receive() external payable {}
}
