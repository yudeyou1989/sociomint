/**
 * 空投池参与API路由
 * 处理用户参与空投池的操作
 */

import { NextRequest, NextResponse } from 'next/server';
import { AirdropPoolsDB } from '@/lib/database/airdropPools';

// 配置为动态路由以支持静态导出
export const dynamic = 'force-dynamic';
import { InputValidator } from '@/lib/security';

/**
 * 参与空投池
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // 验证必填字段
    const requiredFields = ['poolId', 'userId', 'walletAddress', 'entryAmount'];
    for (const field of requiredFields) {
      if (!body[field]) {
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
    
    // 验证钱包地址
    if (!InputValidator.validateWalletAddress(body.walletAddress)) {
      return NextResponse.json(
        {
          success: false,
          error: '无效的钱包地址',
          code: 'INVALID_WALLET_ADDRESS'
        },
        { status: 400 }
      );
    }
    
    // 验证入场金额
    if (!InputValidator.validatePositiveInteger(body.entryAmount.toString())) {
      return NextResponse.json(
        {
          success: false,
          error: '入场金额必须是正整数',
          code: 'INVALID_ENTRY_AMOUNT'
        },
        { status: 400 }
      );
    }
    
    // 验证空投池是否存在且活跃
    const pool = await AirdropPoolsDB.getPoolById(body.poolId);
    if (!pool) {
      return NextResponse.json(
        {
          success: false,
          error: '空投池不存在',
          code: 'POOL_NOT_FOUND'
        },
        { status: 404 }
      );
    }
    
    if (!pool.isActive) {
      return NextResponse.json(
        {
          success: false,
          error: '空投池已关闭',
          code: 'POOL_INACTIVE'
        },
        { status: 400 }
      );
    }
    
    // 检查空投池时间
    const now = Date.now();
    if (now < pool.startDate) {
      return NextResponse.json(
        {
          success: false,
          error: '空投池尚未开始',
          code: 'POOL_NOT_STARTED'
        },
        { status: 400 }
      );
    }
    
    if (now > pool.endDate) {
      return NextResponse.json(
        {
          success: false,
          error: '空投池已结束',
          code: 'POOL_ENDED'
        },
        { status: 400 }
      );
    }
    
    // 检查参与人数限制
    if (pool.currentParticipants >= pool.maxParticipants) {
      return NextResponse.json(
        {
          success: false,
          error: '空投池参与人数已满',
          code: 'POOL_FULL'
        },
        { status: 400 }
      );
    }
    
    // 验证入场金额是否符合要求
    if (body.entryAmount < pool.entryFee) {
      return NextResponse.json(
        {
          success: false,
          error: `入场金额不能少于 ${pool.entryFee} 小红花`,
          code: 'INSUFFICIENT_ENTRY_AMOUNT'
        },
        { status: 400 }
      );
    }
    
    // 参与空投池
    try {
      const participationId = await AirdropPoolsDB.participateInPool({
        poolId: body.poolId,
        userId: body.userId,
        walletAddress: body.walletAddress,
        entryAmount: body.entryAmount,
      });
      
      if (!participationId) {
        return NextResponse.json(
          {
            success: false,
            error: '参与空投池失败',
            code: 'PARTICIPATE_FAILED'
          },
          { status: 500 }
        );
      }
      
      return NextResponse.json({
        success: true,
        data: { participationId },
        message: '成功参与空投池'
      });
      
    } catch (error: any) {
      // 处理特定的业务错误
      if (error.message.includes('已经参与')) {
        return NextResponse.json(
          {
            success: false,
            error: '您已经参与过此空投池',
            code: 'ALREADY_PARTICIPATED'
          },
          { status: 400 }
        );
      }
      
      if (error.message.includes('余额不足')) {
        return NextResponse.json(
          {
            success: false,
            error: '小红花余额不足',
            code: 'INSUFFICIENT_BALANCE'
          },
          { status: 400 }
        );
      }
      
      if (error.message.includes('已满')) {
        return NextResponse.json(
          {
            success: false,
            error: '空投池参与人数已满',
            code: 'POOL_FULL'
          },
          { status: 400 }
        );
      }
      
      throw error; // 重新抛出未知错误
    }
    
  } catch (error) {
    console.error('参与空投池失败:', error);
    
    return NextResponse.json(
      {
        success: false,
        error: '参与空投池失败',
        code: 'PARTICIPATE_FAILED'
      },
      { status: 500 }
    );
  }
}

/**
 * 获取用户的参与记录
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const walletAddress = searchParams.get('walletAddress');
    
    if (!walletAddress) {
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
    if (!InputValidator.validateWalletAddress(walletAddress)) {
      return NextResponse.json(
        {
          success: false,
          error: '无效的钱包地址',
          code: 'INVALID_WALLET_ADDRESS'
        },
        { status: 400 }
      );
    }
    
    const participations = await AirdropPoolsDB.getUserParticipations(walletAddress);
    
    return NextResponse.json({
      success: true,
      data: participations,
      message: '获取参与记录成功'
    });
    
  } catch (error) {
    console.error('获取参与记录失败:', error);
    
    return NextResponse.json(
      {
        success: false,
        error: '获取参与记录失败',
        code: 'FETCH_PARTICIPATIONS_FAILED'
      },
      { status: 500 }
    );
  }
}
