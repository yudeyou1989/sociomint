#!/bin/bash

# SocioMint开发环境初始化脚本
# 此脚本帮助开发者快速设置项目开发环境

set -e

# 颜色设置
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${GREEN}开始设置SocioMint开发环境...${NC}"

# 检查Node.js版本
NODE_VERSION=$(node -v)
echo -e "检测到Node.js版本: ${YELLOW}$NODE_VERSION${NC}"

# 最低Node.js版本要求
MIN_NODE_VERSION="16.0.0"

if [[ "$(printf '%s\n' "$MIN_NODE_VERSION" "$NODE_VERSION" | sort -V | head -n1)" != "$MIN_NODE_VERSION" ]]; then
  echo -e "${RED}错误: 需要Node.js v$MIN_NODE_VERSION或更高版本${NC}"
  exit 1
fi

# 检查是否安装了yarn
if ! command -v yarn &> /dev/null; then
  echo -e "${YELLOW}未检测到yarn，正在安装...${NC}"
  npm install -g yarn
else
  echo -e "检测到yarn: ${YELLOW}$(yarn -v)${NC}"
fi

# 检查环境文件
if [ ! -f .env ]; then
  echo -e "${YELLOW}未找到.env文件，从.env.example创建...${NC}"
  if [ -f .env.example ]; then
    cp .env.example .env
    echo -e "${GREEN}.env文件已创建，请根据需要修改配置${NC}"
  else
    echo -e "${RED}错误: 未找到.env.example文件${NC}"
    exit 1
  fi
else
  echo -e "${GREEN}发现.env文件${NC}"
fi

# 安装依赖
echo -e "${YELLOW}安装项目依赖...${NC}"
yarn install

# 检查合约编译环境
echo -e "${YELLOW}检查合约编译环境...${NC}"
if [ -d "contracts" ]; then
  cd contracts
  
  # 安装合约依赖
  echo -e "${YELLOW}安装合约依赖...${NC}"
  yarn install
  
  # 编译合约
  echo -e "${YELLOW}编译智能合约...${NC}"
  npx hardhat compile
  
  cd ..
  echo -e "${GREEN}合约环境设置完成${NC}"
else
  echo -e "${YELLOW}未找到contracts目录，跳过合约设置${NC}"
fi

# 设置数据库（如果使用本地数据库）
echo -e "${YELLOW}检查数据库配置...${NC}"
# 这里可以添加数据库初始化代码，如果有本地数据库需求

# 生成类型
echo -e "${YELLOW}生成TypeScript类型...${NC}"
yarn generate-types

# 运行测试确保环境正常
echo -e "${YELLOW}运行测试...${NC}"
yarn test

# 启动开发服务器
echo -e "${GREEN}开发环境设置完成！${NC}"
echo -e "${GREEN}您可以使用以下命令启动开发服务器:${NC}"
echo -e "${YELLOW}yarn dev${NC}"

# 显示帮助信息
echo -e "\n${GREEN}===== 开发帮助 =====${NC}"
echo -e "1. 修改前端代码: ${YELLOW}src/目录${NC}"
echo -e "2. 修改智能合约: ${YELLOW}contracts/contracts/目录${NC}"
echo -e "3. 运行前端测试: ${YELLOW}yarn test${NC}"
echo -e "4. 运行合约测试: ${YELLOW}cd contracts && npx hardhat test${NC}"
echo -e "5. 部署合约: ${YELLOW}cd contracts && npx hardhat run scripts/deploy.js --network testnet${NC}"
echo -e "6. 构建生产版本: ${YELLOW}yarn build${NC}" 