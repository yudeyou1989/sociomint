/**
 * 小红花空投池API路由
 * 处理空投池的CRUD操作
 */

import { NextRequest, NextResponse } from 'next/server';
import { AirdropPoolsDB } from '@/lib/database/airdropPools';
import { InputValidator } from '@/lib/security';

// 配置为动态路由以支持静态导出
export const dynamic = 'force-dynamic';

/**
 * 获取所有活跃的空投池
 */
export async function GET(request: NextRequest) {
  try {
    const pools = await AirdropPoolsDB.getActivePools();
    
    return NextResponse.json({
      success: true,
      data: pools,
      message: '获取空投池成功'
    });
  } catch (error) {
    console.error('获取空投池失败:', error);
    
    return NextResponse.json(
      {
        success: false,
        error: '获取空投池失败',
        code: 'FETCH_POOLS_FAILED'
      },
      { status: 500 }
    );
  }
}

/**
 * 创建新的空投池
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // 验证必填字段
    const requiredFields = ['name', 'description', 'totalReward', 'tokenType', 'entryFee', 'maxParticipants', 'startDate', 'endDate', 'distributionDate'];
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
    
    // 验证名称长度
    if (!InputValidator.validateLength(body.name, 1, 100)) {
      return NextResponse.json(
        {
          success: false,
          error: '空投池名称长度必须在1-100字符之间',
          code: 'INVALID_NAME_LENGTH'
        },
        { status: 400 }
      );
    }
    
    // 验证描述长度
    if (!InputValidator.validateLength(body.description, 1, 1000)) {
      return NextResponse.json(
        {
          success: false,
          error: '空投池描述长度必须在1-1000字符之间',
          code: 'INVALID_DESCRIPTION_LENGTH'
        },
        { status: 400 }
      );
    }
    
    // 验证代币类型
    const validTokenTypes = ['SM', 'FLOWER'];
    if (!validTokenTypes.includes(body.tokenType)) {
      return NextResponse.json(
        {
          success: false,
          error: '无效的代币类型',
          code: 'INVALID_TOKEN_TYPE'
        },
        { status: 400 }
      );
    }
    
    // 验证总奖励数量
    if (!InputValidator.validateNumber(body.totalReward)) {
      return NextResponse.json(
        {
          success: false,
          error: '总奖励数量必须是有效数字',
          code: 'INVALID_TOTAL_REWARD'
        },
        { status: 400 }
      );
    }
    
    // 验证入场费
    if (!InputValidator.validatePositiveInteger(body.entryFee.toString())) {
      return NextResponse.json(
        {
          success: false,
          error: '入场费必须是正整数',
          code: 'INVALID_ENTRY_FEE'
        },
        { status: 400 }
      );
    }
    
    // 验证最大参与人数
    if (!InputValidator.validatePositiveInteger(body.maxParticipants.toString())) {
      return NextResponse.json(
        {
          success: false,
          error: '最大参与人数必须是正整数',
          code: 'INVALID_MAX_PARTICIPANTS'
        },
        { status: 400 }
      );
    }
    
    // 验证日期
    const startDate = new Date(body.startDate).getTime();
    const endDate = new Date(body.endDate).getTime();
    const distributionDate = new Date(body.distributionDate).getTime();
    const now = Date.now();
    
    if (startDate < now) {
      return NextResponse.json(
        {
          success: false,
          error: '开始时间不能早于当前时间',
          code: 'INVALID_START_DATE'
        },
        { status: 400 }
      );
    }
    
    if (endDate <= startDate) {
      return NextResponse.json(
        {
          success: false,
          error: '结束时间必须晚于开始时间',
          code: 'INVALID_END_DATE'
        },
        { status: 400 }
      );
    }
    
    if (distributionDate <= endDate) {
      return NextResponse.json(
        {
          success: false,
          error: '分发时间必须晚于结束时间',
          code: 'INVALID_DISTRIBUTION_DATE'
        },
        { status: 400 }
      );
    }
    
    // 创建空投池
    const poolData = {
      name: body.name,
      description: body.description,
      totalReward: body.totalReward,
      tokenType: body.tokenType,
      entryFee: body.entryFee,
      maxParticipants: body.maxParticipants,
      startDate: startDate,
      endDate: endDate,
      distributionDate: distributionDate,
      isActive: body.isActive !== false, // 默认为true
      requirements: body.requirements || {},
    };
    
    const poolId = await AirdropPoolsDB.createPool(poolData);
    
    if (!poolId) {
      return NextResponse.json(
        {
          success: false,
          error: '创建空投池失败',
          code: 'CREATE_POOL_FAILED'
        },
        { status: 500 }
      );
    }
    
    return NextResponse.json({
      success: true,
      data: { poolId },
      message: '创建空投池成功'
    });
    
  } catch (error) {
    console.error('创建空投池失败:', error);
    
    return NextResponse.json(
      {
        success: false,
        error: '创建空投池失败',
        code: 'CREATE_POOL_FAILED'
      },
      { status: 500 }
    );
  }
}
