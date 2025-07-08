/**
 * 软质押API路由
 * 处理软质押相关的数据查询和操作
 */

import { NextRequest, NextResponse } from 'next/server';
import SoftStakingService from '@/lib/services/softStakingService';
import { InputValidator } from '@/lib/security';

// 配置为动态路由以支持静态导出
export const dynamic = 'force-dynamic';

/**
 * 获取用户软质押统计信息
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userWallet = searchParams.get('wallet');
    const action = searchParams.get('action') || 'stats';

    if (!userWallet) {
      return NextResponse.json(
        {
          success: false,
          error: '缺少钱包地址参数',
          code: 'MISSING_WALLET_ADDRESS'
        },
        { status: 400 }
      );
    }

    // 验证钱包地址格式
    if (!InputValidator.validateEthereumAddress(userWallet)) {
      return NextResponse.json(
        {
          success: false,
          error: '无效的钱包地址格式',
          code: 'INVALID_WALLET_ADDRESS'
        },
        { status: 400 }
      );
    }

    let data;

    switch (action) {
      case 'stats':
        data = await SoftStakingService.getUserStats(userWallet);
        break;
        
      case 'sessions':
        const limit = parseInt(searchParams.get('limit') || '10');
        data = await SoftStakingService.getUserSessions(userWallet, limit);
        break;
        
      case 'rewards':
        const rewardLimit = parseInt(searchParams.get('limit') || '30');
        data = await SoftStakingService.getUserRewards(userWallet, rewardLimit);
        break;
        
      case 'eligibility':
        data = {
          isEligible: await SoftStakingService.checkEligibility(userWallet),
          minBalance24h: await SoftStakingService.getUser24hMinBalance(userWallet),
          todayReward: await SoftStakingService.calculateReward(userWallet)
        };
        break;
        
      case 'config':
        data = await SoftStakingService.getConfig();
        break;
        
      default:
        return NextResponse.json(
          {
            success: false,
            error: '不支持的操作类型',
            code: 'UNSUPPORTED_ACTION'
          },
          { status: 400 }
        );
    }

    return NextResponse.json({
      success: true,
      data,
      message: '获取软质押信息成功'
    });
  } catch (error) {
    console.error('获取软质押信息失败:', error);
    
    return NextResponse.json(
      {
        success: false,
        error: '获取软质押信息失败',
        code: 'FETCH_SOFT_STAKING_FAILED'
      },
      { status: 500 }
    );
  }
}

/**
 * 记录余额快照或更新软质押状态
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action, userWallet, blockNumber, txHash } = body;

    if (!userWallet) {
      return NextResponse.json(
        {
          success: false,
          error: '缺少钱包地址',
          code: 'MISSING_WALLET_ADDRESS'
        },
        { status: 400 }
      );
    }

    // 验证钱包地址格式
    if (!InputValidator.validateEthereumAddress(userWallet)) {
      return NextResponse.json(
        {
          success: false,
          error: '无效的钱包地址格式',
          code: 'INVALID_WALLET_ADDRESS'
        },
        { status: 400 }
      );
    }

    let result;

    switch (action) {
      case 'snapshot':
        result = await SoftStakingService.recordBalanceSnapshot(
          userWallet,
          blockNumber,
          txHash
        );
        break;
        
      case 'batch_snapshot':
        const { userWallets } = body;
        if (!Array.isArray(userWallets)) {
          return NextResponse.json(
            {
              success: false,
              error: '用户钱包列表必须是数组',
              code: 'INVALID_WALLET_LIST'
            },
            { status: 400 }
          );
        }
        
        // 验证所有钱包地址
        for (const wallet of userWallets) {
          if (!InputValidator.validateEthereumAddress(wallet)) {
            return NextResponse.json(
              {
                success: false,
                error: `无效的钱包地址: ${wallet}`,
                code: 'INVALID_WALLET_ADDRESS'
              },
              { status: 400 }
            );
          }
        }
        
        await SoftStakingService.batchRecordSnapshots(userWallets);
        result = { processed: userWallets.length };
        break;
        
      default:
        return NextResponse.json(
          {
            success: false,
            error: '不支持的操作类型',
            code: 'UNSUPPORTED_ACTION'
          },
          { status: 400 }
        );
    }

    return NextResponse.json({
      success: true,
      data: result,
      message: '操作成功'
    });
  } catch (error) {
    console.error('软质押操作失败:', error);
    
    return NextResponse.json(
      {
        success: false,
        error: '操作失败',
        code: 'SOFT_STAKING_OPERATION_FAILED'
      },
      { status: 500 }
    );
  }
}

/**
 * 更新软质押配置（管理员操作）
 */
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { 
      min_holding_hours,
      min_balance_threshold,
      flowers_per_500_sm,
      max_daily_flowers,
      snapshot_interval_hours,
      tolerance_percentage
    } = body;

    // 验证必填字段
    const requiredFields = [
      'min_holding_hours',
      'min_balance_threshold', 
      'flowers_per_500_sm',
      'max_daily_flowers'
    ];
    
    for (const field of requiredFields) {
      if (body[field] === undefined || body[field] === null) {
        return NextResponse.json(
          {
            success: false,
            error: `缺少必填字段: ${field}`,
            code: 'MISSING_REQUIRED_FIELD'
          },
          { status: 400 }
        );
      }
    }

    // 验证数值范围
    if (min_holding_hours <= 0) {
      return NextResponse.json(
        {
          success: false,
          error: '最低持币时长必须大于0',
          code: 'INVALID_HOLDING_HOURS'
        },
        { status: 400 }
      );
    }

    if (parseFloat(min_balance_threshold) < 0) {
      return NextResponse.json(
        {
          success: false,
          error: '最低余额阈值不能为负数',
          code: 'INVALID_BALANCE_THRESHOLD'
        },
        { status: 400 }
      );
    }

    if (tolerance_percentage && (tolerance_percentage < 0 || tolerance_percentage > 100)) {
      return NextResponse.json(
        {
          success: false,
          error: '容忍度百分比必须在0-100之间',
          code: 'INVALID_TOLERANCE_PERCENTAGE'
        },
        { status: 400 }
      );
    }

    // 这里应该添加管理员权限验证
    // TODO: 实现管理员权限验证逻辑

    // 插入新配置（实际实现需要连接数据库）
    const newConfig = {
      min_holding_hours,
      min_balance_threshold,
      flowers_per_500_sm,
      max_daily_flowers,
      snapshot_interval_hours: snapshot_interval_hours || 1,
      tolerance_percentage: tolerance_percentage || 5.0,
      effective_date: new Date().toISOString().split('T')[0],
      is_active: true
    };

    return NextResponse.json({
      success: true,
      data: newConfig,
      message: '软质押配置更新成功'
    });
  } catch (error) {
    console.error('更新软质押配置失败:', error);
    
    return NextResponse.json(
      {
        success: false,
        error: '更新配置失败',
        code: 'UPDATE_CONFIG_FAILED'
      },
      { status: 500 }
    );
  }
}
