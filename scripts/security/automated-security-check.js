#!/usr/bin/env node

/**
 * 自动化安全检查脚本
 * 用于检测智能合约中的常见安全问题
 */

const fs = require('fs');
const path = require('path');

class SecurityChecker {
    constructor() {
        this.issues = [];
        this.contractsPath = path.join(__dirname, '../../contracts');
        this.srcPath = path.join(__dirname, '../../src');
    }

    /**
     * 运行所有安全检查
     */
    async runAllChecks() {
        console.log('🔍 开始自动化安全检查...\n');

        // 检查智能合约
        await this.checkSmartContracts();
        
        // 检查前端代码
        await this.checkFrontendSecurity();
        
        // 检查配置文件
        await this.checkConfigSecurity();
        
        // 生成报告
        this.generateReport();
    }

    /**
     * 检查智能合约安全性
     */
    async checkSmartContracts() {
        console.log('📋 检查智能合约安全性...');
        
        const contractFiles = this.getContractFiles();
        
        for (const file of contractFiles) {
            const content = fs.readFileSync(file, 'utf8');
            
            // 检查重入攻击
            this.checkReentrancy(content, file);
            
            // 检查整数溢出
            this.checkIntegerOverflow(content, file);
            
            // 检查访问控制
            this.checkAccessControl(content, file);
            
            // 检查时间戳依赖
            this.checkTimestampDependence(content, file);
            
            // 检查未检查的外部调用
            this.checkUncheckedExternalCalls(content, file);
            
            // 检查Gas限制
            this.checkGasLimits(content, file);
        }
    }

    /**
     * 检查重入攻击漏洞
     */
    checkReentrancy(content, file) {
        const patterns = [
            /\.call\s*\(/g,
            /\.send\s*\(/g,
            /\.transfer\s*\(/g
        ];

        patterns.forEach(pattern => {
            const matches = content.match(pattern);
            if (matches) {
                // 检查是否有 nonReentrant 修饰符
                if (!content.includes('nonReentrant') && !content.includes('ReentrancyGuard')) {
                    this.addIssue('HIGH', 'REENTRANCY', file, 
                        '检测到外部调用但缺少重入保护', matches);
                }
            }
        });
    }

    /**
     * 检查整数溢出
     */
    checkIntegerOverflow(content, file) {
        // 检查是否使用了 SafeMath 或 Solidity 0.8+
        if (!content.includes('pragma solidity ^0.8') && 
            !content.includes('SafeMath') && 
            !content.includes('using SafeMath')) {
            
            const arithmeticOps = content.match(/[\+\-\*\/]\s*=/g);
            if (arithmeticOps) {
                this.addIssue('MEDIUM', 'INTEGER_OVERFLOW', file,
                    '检测到算术运算但缺少溢出保护', arithmeticOps);
            }
        }
    }

    /**
     * 检查访问控制
     */
    checkAccessControl(content, file) {
        // 检查是否有 onlyOwner 或类似的访问控制
        const sensitiveOps = [
            'mint', 'burn', 'pause', 'unpause', 'upgrade', 'withdraw'
        ];

        sensitiveOps.forEach(op => {
            const regex = new RegExp(`function\\s+${op}`, 'gi');
            const matches = content.match(regex);
            
            if (matches) {
                // 检查是否有访问控制修饰符
                const funcRegex = new RegExp(`function\\s+${op}[^{]*{`, 'gi');
                const funcMatch = content.match(funcRegex);
                
                if (funcMatch && !funcMatch[0].includes('only') && 
                    !funcMatch[0].includes('Role') && !funcMatch[0].includes('require')) {
                    this.addIssue('HIGH', 'ACCESS_CONTROL', file,
                        `敏感函数 ${op} 缺少访问控制`, matches);
                }
            }
        });
    }

    /**
     * 检查时间戳依赖
     */
    checkTimestampDependence(content, file) {
        const timestampUsage = content.match(/block\.timestamp|now/g);
        
        if (timestampUsage && timestampUsage.length > 3) {
            this.addIssue('LOW', 'TIMESTAMP_DEPENDENCE', file,
                '过度依赖 block.timestamp，可能被矿工操纵', timestampUsage);
        }
    }

    /**
     * 检查未检查的外部调用
     */
    checkUncheckedExternalCalls(content, file) {
        const externalCalls = content.match(/\.call\([^)]*\)/g);
        
        if (externalCalls) {
            externalCalls.forEach(call => {
                // 检查调用结果是否被检查
                const callIndex = content.indexOf(call);
                const beforeCall = content.substring(Math.max(0, callIndex - 100), callIndex);
                const afterCall = content.substring(callIndex, callIndex + 200);
                
                if (!beforeCall.includes('require') && !afterCall.includes('require') &&
                    !beforeCall.includes('if') && !afterCall.includes('if')) {
                    this.addIssue('MEDIUM', 'UNCHECKED_CALL', file,
                        '外部调用结果未被检查', [call]);
                }
            });
        }
    }

    /**
     * 检查Gas限制问题
     */
    checkGasLimits(content, file) {
        // 检查循环中的外部调用
        const loopPatterns = [/for\s*\([^)]*\)\s*{[^}]*\.call/g, /while\s*\([^)]*\)\s*{[^}]*\.call/g];
        
        loopPatterns.forEach(pattern => {
            const matches = content.match(pattern);
            if (matches) {
                this.addIssue('MEDIUM', 'GAS_LIMIT', file,
                    '循环中的外部调用可能导致Gas限制问题', matches);
            }
        });
    }

    /**
     * 检查前端安全性
     */
    async checkFrontendSecurity() {
        console.log('🌐 检查前端安全性...');
        
        // 检查环境变量泄露
        this.checkEnvVarLeaks();
        
        // 检查XSS漏洞
        this.checkXSSVulnerabilities();
        
        // 检查CSRF保护
        this.checkCSRFProtection();
    }

    /**
     * 检查环境变量泄露
     */
    checkEnvVarLeaks() {
        const jsFiles = this.getJSFiles();
        
        jsFiles.forEach(file => {
            const content = fs.readFileSync(file, 'utf8');
            
            // 检查私钥泄露
            const privateKeyPatterns = [
                /private[_\s]*key/gi,
                /secret[_\s]*key/gi,
                /0x[a-fA-F0-9]{64}/g
            ];
            
            privateKeyPatterns.forEach(pattern => {
                const matches = content.match(pattern);
                if (matches) {
                    this.addIssue('CRITICAL', 'PRIVATE_KEY_LEAK', file,
                        '可能的私钥泄露', matches);
                }
            });
        });
    }

    /**
     * 检查XSS漏洞
     */
    checkXSSVulnerabilities() {
        const reactFiles = this.getReactFiles();
        
        reactFiles.forEach(file => {
            const content = fs.readFileSync(file, 'utf8');
            
            // 检查 dangerouslySetInnerHTML 使用
            if (content.includes('dangerouslySetInnerHTML')) {
                this.addIssue('HIGH', 'XSS_RISK', file,
                    '使用 dangerouslySetInnerHTML 可能导致XSS攻击');
            }
            
            // 检查未转义的用户输入
            const userInputPatterns = [
                /\{[^}]*user[^}]*\}/gi,
                /\{[^}]*input[^}]*\}/gi
            ];
            
            userInputPatterns.forEach(pattern => {
                const matches = content.match(pattern);
                if (matches) {
                    this.addIssue('MEDIUM', 'UNESCAPED_INPUT', file,
                        '可能的未转义用户输入', matches);
                }
            });
        });
    }

    /**
     * 检查CSRF保护
     */
    checkCSRFProtection() {
        const apiFiles = this.getAPIFiles();
        
        apiFiles.forEach(file => {
            const content = fs.readFileSync(file, 'utf8');
            
            // 检查POST请求是否有CSRF保护
            if (content.includes('POST') && !content.includes('csrf') && 
                !content.includes('token') && !content.includes('nonce')) {
                this.addIssue('MEDIUM', 'CSRF_MISSING', file,
                    'POST请求缺少CSRF保护');
            }
        });
    }

    /**
     * 检查配置安全性
     */
    async checkConfigSecurity() {
        console.log('⚙️ 检查配置安全性...');
        
        // 检查 .env 文件
        this.checkEnvFiles();
        
        // 检查 package.json
        this.checkPackageJson();
        
        // 检查 Vercel 配置
        this.checkVercelConfig();
    }

    /**
     * 检查环境变量文件
     */
    checkEnvFiles() {
        const envFiles = ['.env', '.env.local', '.env.production'];
        
        envFiles.forEach(envFile => {
            const filePath = path.join(__dirname, '../../', envFile);
            if (fs.existsSync(filePath)) {
                const content = fs.readFileSync(filePath, 'utf8');
                
                // 检查是否包含敏感信息
                if (content.includes('private') || content.includes('secret')) {
                    this.addIssue('HIGH', 'ENV_SENSITIVE_DATA', filePath,
                        '环境变量文件包含敏感信息');
                }
            }
        });
    }

    /**
     * 检查 package.json
     */
    checkPackageJson() {
        const packagePath = path.join(__dirname, '../../package.json');
        if (fs.existsSync(packagePath)) {
            const packageJson = JSON.parse(fs.readFileSync(packagePath, 'utf8'));
            
            // 检查已知的有漏洞的包
            const vulnerablePackages = ['lodash', 'moment', 'request'];
            
            Object.keys(packageJson.dependencies || {}).forEach(dep => {
                if (vulnerablePackages.includes(dep)) {
                    this.addIssue('MEDIUM', 'VULNERABLE_DEPENDENCY', packagePath,
                        `依赖包 ${dep} 可能存在安全漏洞`);
                }
            });
        }
    }

    /**
     * 检查 Cloudflare Pages 配置
     */
    checkCloudflareConfig() {
        const headersPath = path.join(__dirname, '../../public/_headers');
        if (fs.existsSync(headersPath)) {
            const headers = fs.readFileSync(headersPath, 'utf8');

            // 检查安全头部
            const requiredHeaders = ['X-Frame-Options', 'X-Content-Type-Options', 'X-XSS-Protection'];

            requiredHeaders.forEach(header => {
                if (!headers.includes(header)) {
                    this.addIssue('MEDIUM', 'MISSING_SECURITY_HEADER', headersPath,
                        `缺少安全头部: ${header}`);
                }
            });
        }
    }

    /**
     * 添加安全问题
     */
    addIssue(severity, type, file, description, evidence = []) {
        this.issues.push({
            severity,
            type,
            file: path.relative(process.cwd(), file),
            description,
            evidence: evidence.slice(0, 3), // 只保留前3个证据
            timestamp: new Date().toISOString()
        });
    }

    /**
     * 生成安全报告
     */
    generateReport() {
        console.log('\n📊 安全检查报告');
        console.log('='.repeat(50));
        
        const severityCounts = {
            CRITICAL: 0,
            HIGH: 0,
            MEDIUM: 0,
            LOW: 0
        };

        this.issues.forEach(issue => {
            severityCounts[issue.severity]++;
        });

        console.log(`🔴 严重: ${severityCounts.CRITICAL}`);
        console.log(`🟠 高危: ${severityCounts.HIGH}`);
        console.log(`🟡 中危: ${severityCounts.MEDIUM}`);
        console.log(`🔵 低危: ${severityCounts.LOW}`);
        console.log(`📋 总计: ${this.issues.length} 个问题\n`);

        // 显示详细问题
        this.issues.forEach((issue, index) => {
            console.log(`${index + 1}. [${issue.severity}] ${issue.type}`);
            console.log(`   文件: ${issue.file}`);
            console.log(`   描述: ${issue.description}`);
            if (issue.evidence.length > 0) {
                console.log(`   证据: ${issue.evidence.join(', ')}`);
            }
            console.log('');
        });

        // 保存报告到文件
        this.saveReportToFile();
    }

    /**
     * 保存报告到文件
     */
    saveReportToFile() {
        const reportPath = path.join(__dirname, '../security-reports/automated-security-report.json');
        const report = {
            timestamp: new Date().toISOString(),
            summary: {
                total: this.issues.length,
                critical: this.issues.filter(i => i.severity === 'CRITICAL').length,
                high: this.issues.filter(i => i.severity === 'HIGH').length,
                medium: this.issues.filter(i => i.severity === 'MEDIUM').length,
                low: this.issues.filter(i => i.severity === 'LOW').length
            },
            issues: this.issues
        };

        fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
        console.log(`📄 详细报告已保存到: ${reportPath}`);
    }

    /**
     * 获取合约文件列表
     */
    getContractFiles() {
        const files = [];
        const contractsDir = this.contractsPath;
        
        if (fs.existsSync(contractsDir)) {
            const dirFiles = fs.readdirSync(contractsDir, { recursive: true });
            dirFiles.forEach(file => {
                if (file.endsWith('.sol')) {
                    files.push(path.join(contractsDir, file));
                }
            });
        }
        
        return files;
    }

    /**
     * 获取JS文件列表
     */
    getJSFiles() {
        const files = [];
        const srcDir = this.srcPath;
        
        if (fs.existsSync(srcDir)) {
            this.walkDir(srcDir, files, ['.js', '.ts']);
        }
        
        return files;
    }

    /**
     * 获取React文件列表
     */
    getReactFiles() {
        const files = [];
        const srcDir = this.srcPath;
        
        if (fs.existsSync(srcDir)) {
            this.walkDir(srcDir, files, ['.jsx', '.tsx']);
        }
        
        return files;
    }

    /**
     * 获取API文件列表
     */
    getAPIFiles() {
        const files = [];
        const apiDir = path.join(this.srcPath, 'pages/api');
        
        if (fs.existsSync(apiDir)) {
            this.walkDir(apiDir, files, ['.js', '.ts']);
        }
        
        return files;
    }

    /**
     * 递归遍历目录
     */
    walkDir(dir, fileList, extensions) {
        const files = fs.readdirSync(dir);
        
        files.forEach(file => {
            const filePath = path.join(dir, file);
            const stat = fs.statSync(filePath);
            
            if (stat.isDirectory()) {
                this.walkDir(filePath, fileList, extensions);
            } else if (extensions.some(ext => file.endsWith(ext))) {
                fileList.push(filePath);
            }
        });
    }
}

// 运行安全检查
if (require.main === module) {
    const checker = new SecurityChecker();
    checker.runAllChecks().catch(console.error);
}

module.exports = SecurityChecker;
