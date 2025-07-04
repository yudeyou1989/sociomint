/**
 * 社交任务API路由
 * 处理社交任务的CRUD操作
 */

import { NextRequest, NextResponse } from 'next/server';
import { SocialTasksDB } from '@/lib/database/socialTasks';

// 配置为动态路由以支持静态导出
export const dynamic = 'force-dynamic';
import { InputValidator } from '@/lib/security';

/**
 * 获取所有活跃的社交任务
 */
export async function GET(request: NextRequest) {
  try {
    const tasks = await SocialTasksDB.getActiveTasks();
    
    return NextResponse.json({
      success: true,
      data: tasks,
      message: '获取社交任务成功'
    });
  } catch (error) {
    console.error('获取社交任务失败:', error);
    
    return NextResponse.json(
      {
        success: false,
        error: '获取社交任务失败',
        code: 'FETCH_TASKS_FAILED'
      },
      { status: 500 }
    );
  }
}

/**
 * 创建新的社交任务
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // 验证必填字段
    const requiredFields = ['type', 'title', 'description', 'requirements', 'reward', 'createdBy'];
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
    
    // 验证任务类型
    const validTypes = ['twitter', 'telegram', 'discord', 'custom'];
    if (!validTypes.includes(body.type)) {
      return NextResponse.json(
        {
          success: false,
          error: '无效的任务类型',
          code: 'INVALID_TASK_TYPE'
        },
        { status: 400 }
      );
    }
    
    // 验证标题长度
    if (!InputValidator.validateLength(body.title, 1, 100)) {
      return NextResponse.json(
        {
          success: false,
          error: '任务标题长度必须在1-100字符之间',
          code: 'INVALID_TITLE_LENGTH'
        },
        { status: 400 }
      );
    }
    
    // 验证描述长度
    if (!InputValidator.validateLength(body.description, 1, 1000)) {
      return NextResponse.json(
        {
          success: false,
          error: '任务描述长度必须在1-1000字符之间',
          code: 'INVALID_DESCRIPTION_LENGTH'
        },
        { status: 400 }
      );
    }
    
    // 验证奖励数量
    if (!body.reward.amount || !InputValidator.validatePositiveInteger(body.reward.amount)) {
      return NextResponse.json(
        {
          success: false,
          error: '奖励数量必须是正整数',
          code: 'INVALID_REWARD_AMOUNT'
        },
        { status: 400 }
      );
    }
    
    // 验证URL（如果存在）
    if (body.requirements.target && !InputValidator.validateUrl(body.requirements.target)) {
      return NextResponse.json(
        {
          success: false,
          error: '无效的目标URL',
          code: 'INVALID_TARGET_URL'
        },
        { status: 400 }
      );
    }
    
    // 创建任务
    const taskData = {
      type: body.type,
      title: body.title,
      description: body.description,
      requirements: body.requirements,
      reward: body.reward,
      isActive: body.isActive !== false, // 默认为true
      startDate: body.startDate || Date.now(),
      endDate: body.endDate,
      maxParticipants: body.maxParticipants,
      createdBy: body.createdBy,
    };
    
    const taskId = await SocialTasksDB.createTask(taskData);
    
    if (!taskId) {
      return NextResponse.json(
        {
          success: false,
          error: '创建任务失败',
          code: 'CREATE_TASK_FAILED'
        },
        { status: 500 }
      );
    }
    
    return NextResponse.json({
      success: true,
      data: { taskId },
      message: '创建社交任务成功'
    });
    
  } catch (error) {
    console.error('创建社交任务失败:', error);
    
    return NextResponse.json(
      {
        success: false,
        error: '创建社交任务失败',
        code: 'CREATE_TASK_FAILED'
      },
      { status: 500 }
    );
  }
}
