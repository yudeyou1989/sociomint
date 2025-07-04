/**
 * TypeScript类型检查脚本
 * 验证项目中的类型定义是否正确
 */

import { execSync } from 'child_process';
import { existsSync, readFileSync } from 'fs';
import path from 'path';

interface TypeCheckResult {
  success: boolean;
  errors: string[];
  warnings: string[];
  summary: {
    totalFiles: number;
    errorCount: number;
    warningCount: number;
  };
}

class TypeChecker {
  private projectRoot: string;
  private tsconfigPath: string;

  constructor() {
    this.projectRoot = process.cwd();
    this.tsconfigPath = path.join(this.projectRoot, 'tsconfig.json');
  }

  /**
   * 运行TypeScript编译器检查
   */
  async runTypeCheck(): Promise<TypeCheckResult> {
    console.log('🔍 开始TypeScript类型检查...\n');

    const result: TypeCheckResult = {
      success: true,
      errors: [],
      warnings: [],
      summary: {
        totalFiles: 0,
        errorCount: 0,
        warningCount: 0,
      }
    };

    try {
      // 检查tsconfig.json是否存在
      if (!existsSync(this.tsconfigPath)) {
        result.errors.push('tsconfig.json文件不存在');
        result.success = false;
        return result;
      }

      // 运行tsc --noEmit进行类型检查
      const command = 'npx tsc --noEmit --pretty';
      console.log(`执行命令: ${command}`);
      
      const output = execSync(command, { 
        encoding: 'utf8',
        cwd: this.projectRoot,
        stdio: 'pipe'
      });

      console.log('✅ TypeScript类型检查通过！');
      
    } catch (error: any) {
      result.success = false;
      
      if (error.stdout) {
        const lines = error.stdout.split('\n').filter((line: string) => line.trim());
        
        for (const line of lines) {
          if (line.includes('error TS')) {
            result.errors.push(line);
            result.summary.errorCount++;
          } else if (line.includes('warning TS')) {
            result.warnings.push(line);
            result.summary.warningCount++;
          }
        }
      }
      
      if (error.stderr) {
        result.errors.push(error.stderr);
      }
    }

    return result;
  }

  /**
   * 检查关键类型文件是否存在
   */
  checkTypeFiles(): { missing: string[]; existing: string[] } {
    const typeFiles = [
      'src/types/global.d.ts',
      'src/types/components.ts',
      'next-env.d.ts'
    ];

    const missing: string[] = [];
    const existing: string[] = [];

    for (const file of typeFiles) {
      const filePath = path.join(this.projectRoot, file);
      if (existsSync(filePath)) {
        existing.push(file);
      } else {
        missing.push(file);
      }
    }

    return { missing, existing };
  }

  /**
   * 验证tsconfig.json配置
   */
  validateTsConfig(): { valid: boolean; issues: string[] } {
    const issues: string[] = [];
    
    try {
      const tsconfigContent = readFileSync(this.tsconfigPath, 'utf8');
      const tsconfig = JSON.parse(tsconfigContent);
      
      // 检查必要的编译选项
      const requiredOptions = {
        strict: true,
        noEmit: true,
        esModuleInterop: true,
        skipLibCheck: true,
        jsx: 'preserve'
      };

      for (const [option, expectedValue] of Object.entries(requiredOptions)) {
        if (tsconfig.compilerOptions[option] !== expectedValue) {
          issues.push(`编译选项 ${option} 应该设置为 ${expectedValue}`);
        }
      }

      // 检查路径映射
      if (!tsconfig.compilerOptions.paths || !tsconfig.compilerOptions.paths['@/*']) {
        issues.push('缺少路径映射配置 @/*');
      }

      // 检查类型根目录
      if (!tsconfig.compilerOptions.typeRoots || 
          !tsconfig.compilerOptions.typeRoots.includes('./src/types')) {
        issues.push('typeRoots应该包含 ./src/types');
      }

    } catch (error) {
      issues.push(`解析tsconfig.json失败: ${error}`);
    }

    return {
      valid: issues.length === 0,
      issues
    };
  }

  /**
   * 生成类型检查报告
   */
  generateReport(result: TypeCheckResult): void {
    console.log('\n📊 TypeScript类型检查报告');
    console.log('='.repeat(50));
    
    // 检查类型文件
    const { missing, existing } = this.checkTypeFiles();
    console.log('\n📁 类型文件状态:');
    existing.forEach(file => console.log(`  ✅ ${file}`));
    missing.forEach(file => console.log(`  ❌ ${file} (缺失)`));
    
    // 检查tsconfig配置
    const { valid, issues } = this.validateTsConfig();
    console.log('\n⚙️  tsconfig.json配置:');
    if (valid) {
      console.log('  ✅ 配置正确');
    } else {
      console.log('  ❌ 配置问题:');
      issues.forEach(issue => console.log(`    - ${issue}`));
    }
    
    // 类型检查结果
    console.log('\n🔍 类型检查结果:');
    if (result.success) {
      console.log('  ✅ 所有类型检查通过');
    } else {
      console.log(`  ❌ 发现 ${result.summary.errorCount} 个错误`);
      if (result.summary.warningCount > 0) {
        console.log(`  ⚠️  发现 ${result.summary.warningCount} 个警告`);
      }
    }
    
    // 详细错误信息
    if (result.errors.length > 0) {
      console.log('\n❌ 错误详情:');
      result.errors.forEach((error, index) => {
        console.log(`  ${index + 1}. ${error}`);
      });
    }
    
    // 警告信息
    if (result.warnings.length > 0) {
      console.log('\n⚠️  警告详情:');
      result.warnings.forEach((warning, index) => {
        console.log(`  ${index + 1}. ${warning}`);
      });
    }
    
    console.log('\n' + '='.repeat(50));
    
    if (result.success && valid && missing.length === 0) {
      console.log('🎉 所有类型检查通过！项目类型安全性良好。');
    } else {
      console.log('⚠️  发现问题，请根据上述报告进行修复。');
    }
  }
}

// 主函数
async function main() {
  const checker = new TypeChecker();
  
  try {
    const result = await checker.runTypeCheck();
    checker.generateReport(result);
    
    // 设置退出码
    process.exit(result.success ? 0 : 1);
    
  } catch (error) {
    console.error('❌ 类型检查过程中发生错误:', error);
    process.exit(1);
  }
}

// 如果直接运行此脚本
if (require.main === module) {
  main();
}

export { TypeChecker };
