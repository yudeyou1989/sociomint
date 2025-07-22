/**
 * 社交任务提交API路由
 * 处理用户任务提交和审核
 */

import { NextRequest, NextResponse } from 'next/server';
import { SocialTasksDB } from '@/lib/database/socialTasks';

// 配置为动态路由以支持静态导出
export const dynamic = 'force-dynamic';
import { InputValidator } from '@/lib/security';

/**
 * 提交任务完成证明
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // 验证必填字段
    const requiredFields = ['taskId', 'userId', 'walletAddress', 'submissionData'];
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
    
    // 验证任务是否存在且活跃
    const task = await SocialTasksDB.getTaskById(body.taskId);
    if (!task) {
      return NextResponse.json(
        {
          success: false,
          error: '任务不存在',
          code: 'TASK_NOT_FOUND'
        },
        { status: 404 }
      );
    }
    
    if (!task.isActive) {
      return NextResponse.json(
        {
          success: false,
          error: '任务已关闭',
          code: 'TASK_INACTIVE'
        },
        { status: 400 }
      );
    }
    
    // 检查任务是否已过期
    if (task.endDate && Date.now() > task.endDate) {
      return NextResponse.json(
        {
          success: false,
          error: '任务已过期',
          code: 'TASK_EXPIRED'
        },
        { status: 400 }
      );
    }
    
    // 检查参与人数限制
    if (task.maxParticipants && task.currentParticipants >= task.maxParticipants) {
      return NextResponse.json(
        {
          success: false,
          error: '任务参与人数已满',
          code: 'TASK_FULL'
        },
        { status: 400 }
      );
    }
    
    // 验证提交数据
    const submissionData = body.submissionData;
    
    // 验证URL（如果存在）
    if (submissionData.url && !InputValidator.validateUrl(submissionData.url)) {
      return NextResponse.json(
        {
          success: false,
          error: '无效的URL格式',
          code: 'INVALID_URL'
        },
        { status: 400 }
      );
    }
    
    // 验证内容长度
    if (submissionData.content && !InputValidator.validateLength(submissionData.content, 1, 5000)) {
      return NextResponse.json(
        {
          success: false,
          error: '内容长度必须在1-5000字符之间',
          code: 'INVALID_CONTENT_LENGTH'
        },
        { status: 400 }
      );
    }
    
    // 验证证明内容
    if (submissionData.proof && !InputValidator.validateLength(submissionData.proof, 1, 1000)) {
      return NextResponse.json(
        {
          success: false,
          error: '证明内容长度必须在1-1000字符之间',
          code: 'INVALID_PROOF_LENGTH'
        },
        { status: 400 }
      );
    }
    
    // 检查用户是否已经提交过此任务
    const userSubmissions = await SocialTasksDB.getUserSubmissions(body.userId);
    const existingSubmission = userSubmissions.find(sub => sub.taskId === body.taskId);
    
    if (existingSubmission) {
      return NextResponse.json(
        {
          success: false,
          error: '您已经提交过此任务',
          code: 'ALREADY_SUBMITTED'
        },
        { status: 400 }
      );
    }
    
    // 提交任务
    const submissionId = await SocialTasksDB.submitTask({
      taskId: body.taskId,
      userId: body.userId,
      walletAddress: body.walletAddress,
      submissionData: submissionData,
      status: 'pending',
    });
    
    if (!submissionId) {
      return NextResponse.json(
        {
          success: false,
          error: '提交任务失败',
          code: 'SUBMIT_TASK_FAILED'
        },
        { status: 500 }
      );
    }
    
    return NextResponse.json({
      success: true,
      data: { submissionId },
      message: '任务提交成功，等待审核'
    });
    
  } catch (error) {
    console.error('提交任务失败:', error);
    
    return NextResponse.json(
      {
        success: false,
        error: '提交任务失败',
        code: 'SUBMIT_TASK_FAILED'
      },
      { status: 500 }
    );
  }
}

/**
 * 获取用户的任务提交记录
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');
    
    if (!userId) {
      return NextResponse.json(
        {
          success: false,
          error: '缺少用户ID',
          code: 'MISSING_USER_ID'
        },
        { status: 400 }
      );
    }
    
    const submissions = await SocialTasksDB.getUserSubmissions(userId);
    
    return NextResponse.json({
      success: true,
      data: submissions,
      message: '获取提交记录成功'
    });
    
  } catch (error) {
    console.error('获取提交记录失败:', error);
    
    return NextResponse.json(
      {
        success: false,
        error: '获取提交记录失败',
        code: 'FETCH_SUBMISSIONS_FAILED'
      },
      { status: 500 }
    );
  }
}
