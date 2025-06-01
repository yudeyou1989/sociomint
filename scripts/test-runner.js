#!/usr/bin/env node

/**
 * 测试运行器脚本
 * 提供不同类型的测试运行选项
 */

const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');

class TestRunner {
    constructor() {
        this.testResults = {
            total: 0,
            passed: 0,
            failed: 0,
            coverage: {
                statements: 0,
                branches: 0,
                functions: 0,
                lines: 0,
            }
        };
    }

    /**
     * 运行指定类型的测试
     */
    async runTests(type = 'all', options = {}) {
        console.log(`🧪 开始运行 ${type} 测试...\n`);

        const testCommands = {
            basic: ['npm', 'test', '--', '--testPathPattern=simple.test.ts', '--watchAll=false'],
            utils: ['npm', 'test', '--', '--testPathPattern=utils.test.ts', '--watchAll=false'],
            components: ['npm', 'test', '--', '--testPathPattern=components/', '--watchAll=false'],
            integration: ['npm', 'test', '--', '--testPathPattern=integration/', '--watchAll=false'],
            e2e: ['npm', 'test', '--', '--testPathPattern=e2e/', '--watchAll=false'],
            all: ['npm', 'test', '--', '--watchAll=false'],
            coverage: ['npm', 'test', '--', '--coverage', '--watchAll=false'],
        };

        if (options.coverage) {
            testCommands[type].push('--coverage');
        }

        const command = testCommands[type];
        if (!command) {
            console.error(`❌ 未知的测试类型: ${type}`);
            return false;
        }

        try {
            const result = await this.executeCommand(command);
            this.parseTestResults(result);
            this.displayResults(type);
            return result.success;
        } catch (error) {
            console.error(`❌ 测试执行失败:`, error.message);
            return false;
        }
    }

    /**
     * 执行命令
     */
    executeCommand(command) {
        return new Promise((resolve, reject) => {
            const [cmd, ...args] = command;
            const process = spawn(cmd, args, {
                stdio: 'pipe',
                shell: true,
                cwd: path.join(__dirname, '..')
            });

            let stdout = '';
            let stderr = '';

            process.stdout.on('data', (data) => {
                const output = data.toString();
                stdout += output;
                console.log(output);
            });

            process.stderr.on('data', (data) => {
                const output = data.toString();
                stderr += output;
                console.error(output);
            });

            process.on('close', (code) => {
                resolve({
                    success: code === 0,
                    stdout,
                    stderr,
                    exitCode: code
                });
            });

            process.on('error', (error) => {
                reject(error);
            });
        });
    }

    /**
     * 解析测试结果
     */
    parseTestResults(result) {
        const output = result.stdout;

        // 解析测试数量
        const testMatch = output.match(/Tests:\s+(\d+)\s+passed,\s+(\d+)\s+total/);
        if (testMatch) {
            this.testResults.passed = parseInt(testMatch[1]);
            this.testResults.total = parseInt(testMatch[2]);
            this.testResults.failed = this.testResults.total - this.testResults.passed;
        }

        // 解析覆盖率
        const coverageMatch = output.match(/All files\s+\|\s+([\d.]+)\s+\|\s+([\d.]+)\s+\|\s+([\d.]+)\s+\|\s+([\d.]+)/);
        if (coverageMatch) {
            this.testResults.coverage = {
                statements: parseFloat(coverageMatch[1]),
                branches: parseFloat(coverageMatch[2]),
                functions: parseFloat(coverageMatch[3]),
                lines: parseFloat(coverageMatch[4]),
            };
        }
    }

    /**
     * 显示测试结果
     */
    displayResults(testType) {
        console.log('\n📊 测试结果摘要');
        console.log('='.repeat(50));
        console.log(`测试类型: ${testType}`);
        console.log(`总测试数: ${this.testResults.total}`);
        console.log(`通过: ${this.testResults.passed}`);
        console.log(`失败: ${this.testResults.failed}`);
        console.log(`通过率: ${this.testResults.total > 0 ? ((this.testResults.passed / this.testResults.total) * 100).toFixed(2) : 0}%`);

        if (this.testResults.coverage.statements > 0) {
            console.log('\n📈 覆盖率统计');
            console.log(`语句覆盖率: ${this.testResults.coverage.statements}%`);
            console.log(`分支覆盖率: ${this.testResults.coverage.branches}%`);
            console.log(`函数覆盖率: ${this.testResults.coverage.functions}%`);
            console.log(`行覆盖率: ${this.testResults.coverage.lines}%`);
        }

        // 保存结果到文件
        this.saveResults(testType);
    }

    /**
     * 保存测试结果
     */
    saveResults(testType) {
        const resultsDir = path.join(__dirname, '../test-results');
        if (!fs.existsSync(resultsDir)) {
            fs.mkdirSync(resultsDir, { recursive: true });
        }

        const resultData = {
            testType,
            timestamp: new Date().toISOString(),
            results: this.testResults,
            summary: {
                success: this.testResults.failed === 0,
                passRate: this.testResults.total > 0 ? (this.testResults.passed / this.testResults.total) * 100 : 0,
                coverageAverage: (
                    this.testResults.coverage.statements +
                    this.testResults.coverage.branches +
                    this.testResults.coverage.functions +
                    this.testResults.coverage.lines
                ) / 4,
            }
        };

        const resultFile = path.join(resultsDir, `test-result-${testType}-${Date.now()}.json`);
        fs.writeFileSync(resultFile, JSON.stringify(resultData, null, 2));
        console.log(`\n📄 结果已保存到: ${resultFile}`);
    }

    /**
     * 生成测试报告
     */
    generateReport() {
        const resultsDir = path.join(__dirname, '../test-results');
        if (!fs.existsSync(resultsDir)) {
            console.log('📄 没有找到测试结果文件');
            return;
        }

        const resultFiles = fs.readdirSync(resultsDir)
            .filter(file => file.startsWith('test-result-') && file.endsWith('.json'))
            .sort()
            .slice(-10); // 最近10次结果

        if (resultFiles.length === 0) {
            console.log('📄 没有找到测试结果文件');
            return;
        }

        console.log('\n📊 测试历史报告');
        console.log('='.repeat(80));
        console.log('时间\t\t\t类型\t\t通过率\t覆盖率');
        console.log('-'.repeat(80));

        resultFiles.forEach(file => {
            const filePath = path.join(resultsDir, file);
            const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));
            
            const time = new Date(data.timestamp).toLocaleString('zh-CN');
            const type = data.testType.padEnd(12);
            const passRate = `${data.summary.passRate.toFixed(1)}%`.padEnd(8);
            const coverage = `${data.summary.coverageAverage.toFixed(1)}%`;
            
            console.log(`${time}\t${type}\t${passRate}\t${coverage}`);
        });
    }

    /**
     * 清理测试结果
     */
    cleanResults() {
        const resultsDir = path.join(__dirname, '../test-results');
        if (fs.existsSync(resultsDir)) {
            const files = fs.readdirSync(resultsDir);
            files.forEach(file => {
                fs.unlinkSync(path.join(resultsDir, file));
            });
            console.log('🧹 测试结果已清理');
        }
    }

    /**
     * 显示帮助信息
     */
    showHelp() {
        console.log(`
🧪 SocioMint 测试运行器

用法: node scripts/test-runner.js [命令] [选项]

命令:
  basic       运行基础测试
  utils       运行工具函数测试
  components  运行组件测试
  integration 运行集成测试
  e2e         运行端到端测试
  all         运行所有测试
  coverage    运行覆盖率测试
  report      显示测试历史报告
  clean       清理测试结果
  help        显示帮助信息

选项:
  --coverage  生成覆盖率报告

示例:
  node scripts/test-runner.js basic
  node scripts/test-runner.js all --coverage
  node scripts/test-runner.js report
        `);
    }
}

// 主函数
async function main() {
    const args = process.argv.slice(2);
    const command = args[0] || 'help';
    const options = {
        coverage: args.includes('--coverage')
    };

    const runner = new TestRunner();

    switch (command) {
        case 'basic':
        case 'utils':
        case 'components':
        case 'integration':
        case 'e2e':
        case 'all':
        case 'coverage':
            const success = await runner.runTests(command, options);
            process.exit(success ? 0 : 1);
            break;
        
        case 'report':
            runner.generateReport();
            break;
        
        case 'clean':
            runner.cleanResults();
            break;
        
        case 'help':
        default:
            runner.showHelp();
            break;
    }
}

// 运行主函数
if (require.main === module) {
    main().catch(console.error);
}

module.exports = TestRunner;
