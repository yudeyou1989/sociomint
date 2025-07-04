#!/bin/bash

# SocioMint 生产环境自动化部署脚本
# 用于完整的生产环境部署流程

set -e  # 遇到错误立即退出

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# 日志函数
log_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

log_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# 检查必需的环境变量
check_environment() {
    log_info "检查环境变量..."
    
    local required_vars=(
        "CLOUDFLARE_API_TOKEN"
        "CLOUDFLARE_ACCOUNT_ID"
        "NEXT_PUBLIC_WALLET_CONNECT_PROJECT_ID"
        "NEXT_PUBLIC_SUPABASE_URL"
        "NEXT_PUBLIC_SUPABASE_ANON_KEY"
    )
    
    local missing_vars=()
    
    for var in "${required_vars[@]}"; do
        if [ -z "${!var}" ]; then
            missing_vars+=("$var")
        fi
    done
    
    if [ ${#missing_vars[@]} -ne 0 ]; then
        log_error "缺少以下环境变量:"
        for var in "${missing_vars[@]}"; do
            echo "  - $var"
        done
        log_error "请设置所有必需的环境变量后重试"
        exit 1
    fi
    
    log_success "所有必需的环境变量都已设置"
}

# 检查依赖
check_dependencies() {
    log_info "检查依赖..."
    
    # 检查Node.js
    if ! command -v node &> /dev/null; then
        log_error "Node.js 未安装"
        exit 1
    fi
    
    # 检查npm
    if ! command -v npm &> /dev/null; then
        log_error "npm 未安装"
        exit 1
    fi
    
    # 检查wrangler
    if ! command -v npx &> /dev/null; then
        log_error "npx 未安装"
        exit 1
    fi
    
    log_success "所有依赖都已安装"
}

# 安装项目依赖
install_dependencies() {
    log_info "安装项目依赖..."
    
    if [ ! -d "node_modules" ]; then
        npm ci
    else
        log_info "依赖已存在，跳过安装"
    fi
    
    log_success "依赖安装完成"
}

# 运行测试
run_tests() {
    log_info "运行测试..."
    
    # 运行基础测试
    if npm run test:ci 2>/dev/null; then
        log_success "测试通过"
    else
        log_warning "测试失败或未配置，继续部署"
    fi
}

# 构建项目
build_project() {
    log_info "构建项目..."
    
    # 清理之前的构建
    rm -rf .next/cache cache
    find .next -name "*.pack" -delete 2>/dev/null || true
    
    # 构建项目
    npm run build
    
    if [ $? -eq 0 ]; then
        log_success "项目构建成功"
    else
        log_error "项目构建失败"
        exit 1
    fi
}

# 测试RPC连接
test_rpc_connection() {
    log_info "测试RPC连接..."
    
    if node scripts/test-rpc-connection.js; then
        log_success "RPC连接测试通过"
    else
        log_warning "RPC连接测试失败，但继续部署"
    fi
}

# 部署到Cloudflare Pages
deploy_to_cloudflare() {
    log_info "部署到Cloudflare Pages..."
    
    # 验证Cloudflare认证
    if ! npx wrangler whoami &>/dev/null; then
        log_error "Cloudflare认证失败，请检查API Token"
        exit 1
    fi
    
    # 执行部署
    if npx wrangler pages deploy --commit-dirty=true; then
        log_success "Cloudflare Pages部署成功"
    else
        log_error "Cloudflare Pages部署失败"
        exit 1
    fi
}

# 验证部署
verify_deployment() {
    log_info "验证部署..."
    
    # 等待部署生效
    log_info "等待部署生效 (30秒)..."
    sleep 30
    
    # 运行验证脚本
    if node scripts/verify-deployment.js; then
        log_success "部署验证通过"
    else
        log_warning "部署验证失败，请手动检查"
    fi
}

# 显示部署信息
show_deployment_info() {
    log_info "部署信息:"
    echo "  🌐 网站地址: https://sociomint.top"
    echo "  📊 Cloudflare控制台: https://dash.cloudflare.com/"
    echo "  📋 GitHub仓库: https://github.com/yudeyou1989/sociomint"
    echo "  📖 项目文档: ./PROJECT_COMPLETION_REPORT.md"
}

# 主函数
main() {
    log_info "🚀 开始SocioMint生产环境部署..."
    echo
    
    # 执行部署步骤
    check_dependencies
    check_environment
    install_dependencies
    run_tests
    build_project
    test_rpc_connection
    deploy_to_cloudflare
    verify_deployment
    
    echo
    log_success "🎉 部署完成!"
    show_deployment_info
    
    echo
    log_info "📋 后续步骤:"
    echo "  1. 访问 https://sociomint.top 验证网站"
    echo "  2. 测试钱包连接功能"
    echo "  3. 测试代币交换功能"
    echo "  4. 准备主网合约部署"
    echo "  5. 监控网站性能和错误"
}

# 错误处理
trap 'log_error "部署过程中出现错误，请检查日志"; exit 1' ERR

# 运行主函数
main "$@"
