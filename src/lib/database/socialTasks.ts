/**
 * 社交任务数据库操作
 * 管理社交任务的创建、查询、更新等操作
 */

import { supabase } from '@/lib/supabase';
import { SocialTask, TaskSubmission } from '@/types/global';

export class SocialTasksDB {
  /**
   * 获取所有活跃的社交任务
   */
  static async getActiveTasks(): Promise<SocialTask[]> {
    try {
      const { data, error } = await supabase
        .from('social_tasks')
        .select('*')
        .eq('is_active', true)
        .order('created_at', { ascending: false });

      if (error) throw error;

      return data?.map(this.mapDbToTask) || [];
    } catch (error) {
      console.error('获取社交任务失败:', error);
      return [];
    }
  }

  /**
   * 根据ID获取任务详情
   */
  static async getTaskById(taskId: string): Promise<SocialTask | null> {
    try {
      const { data, error } = await supabase
        .from('social_tasks')
        .select('*')
        .eq('id', taskId)
        .single();

      if (error) throw error;

      return data ? this.mapDbToTask(data) : null;
    } catch (error) {
      console.error('获取任务详情失败:', error);
      return null;
    }
  }

  /**
   * 创建新的社交任务
   */
  static async createTask(task: Omit<SocialTask, 'id' | 'currentParticipants'>): Promise<string | null> {
    try {
      const { data, error } = await supabase
        .from('social_tasks')
        .insert([{
          type: task.type,
          title: task.title,
          description: task.description,
          requirements: task.requirements,
          reward: task.reward,
          is_active: task.isActive,
          start_date: new Date(task.startDate).toISOString(),
          end_date: task.endDate ? new Date(task.endDate).toISOString() : null,
          max_participants: task.maxParticipants,
          created_by: task.createdBy,
        }])
        .select('id')
        .single();

      if (error) throw error;

      return data?.id || null;
    } catch (error) {
      console.error('创建社交任务失败:', error);
      return null;
    }
  }

  /**
   * 更新任务状态
   */
  static async updateTaskStatus(taskId: string, isActive: boolean): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('social_tasks')
        .update({ is_active: isActive })
        .eq('id', taskId);

      if (error) throw error;
      return true;
    } catch (error) {
      console.error('更新任务状态失败:', error);
      return false;
    }
  }

  /**
   * 提交任务完成证明
   */
  static async submitTask(submission: Omit<TaskSubmission, 'id' | 'submittedAt'>): Promise<string | null> {
    try {
      const { data, error } = await supabase
        .from('task_submissions')
        .insert([{
          task_id: submission.taskId,
          user_id: submission.userId,
          wallet_address: submission.walletAddress,
          submission_data: submission.submissionData,
          status: 'pending',
          submitted_at: new Date().toISOString(),
        }])
        .select('id')
        .single();

      if (error) throw error;

      // 更新任务参与人数
      await this.incrementParticipantCount(submission.taskId);

      return data?.id || null;
    } catch (error) {
      console.error('提交任务失败:', error);
      return null;
    }
  }

  /**
   * 获取用户的任务提交记录
   */
  static async getUserSubmissions(userId: string): Promise<TaskSubmission[]> {
    try {
      const { data, error } = await supabase
        .from('task_submissions')
        .select(`
          *,
          social_tasks (
            title,
            type,
            reward
          )
        `)
        .eq('user_id', userId)
        .order('submitted_at', { ascending: false });

      if (error) throw error;

      return data?.map(this.mapDbToSubmission) || [];
    } catch (error) {
      console.error('获取用户提交记录失败:', error);
      return [];
    }
  }

  /**
   * 审核任务提交
   */
  static async reviewSubmission(
    submissionId: string, 
    status: 'approved' | 'rejected',
    reviewerId: string,
    rejectReason?: string
  ): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('task_submissions')
        .update({
          status,
          reviewed_at: new Date().toISOString(),
          reviewed_by: reviewerId,
          reject_reason: rejectReason || null,
        })
        .eq('id', submissionId);

      if (error) throw error;

      // 如果审核通过，发放奖励
      if (status === 'approved') {
        await this.distributeReward(submissionId);
      }

      return true;
    } catch (error) {
      console.error('审核任务提交失败:', error);
      return false;
    }
  }

  /**
   * 获取待审核的提交
   */
  static async getPendingSubmissions(): Promise<TaskSubmission[]> {
    try {
      const { data, error } = await supabase
        .from('task_submissions')
        .select(`
          *,
          social_tasks (
            title,
            type,
            reward
          )
        `)
        .eq('status', 'pending')
        .order('submitted_at', { ascending: true });

      if (error) throw error;

      return data?.map(this.mapDbToSubmission) || [];
    } catch (error) {
      console.error('获取待审核提交失败:', error);
      return [];
    }
  }

  /**
   * 增加任务参与人数
   */
  private static async incrementParticipantCount(taskId: string): Promise<void> {
    try {
      const { error } = await supabase.rpc('increment_participant_count', {
        task_id: taskId
      });

      if (error) throw error;
    } catch (error) {
      console.error('更新参与人数失败:', error);
    }
  }

  /**
   * 发放任务奖励
   */
  private static async distributeReward(submissionId: string): Promise<void> {
    try {
      // 获取提交详情
      const { data: submission, error: submissionError } = await supabase
        .from('task_submissions')
        .select(`
          *,
          social_tasks (reward)
        `)
        .eq('id', submissionId)
        .single();

      if (submissionError) throw submissionError;

      const reward = submission.social_tasks.reward;
      
      // 记录奖励发放
      const { error: rewardError } = await supabase
        .from('flower_transactions')
        .insert([{
          user_id: submission.user_id,
          wallet_address: submission.wallet_address,
          type: 'earn',
          amount: parseInt(reward.amount),
          source: 'task',
          description: `完成社交任务奖励`,
          related_task_id: submission.task_id,
          timestamp: new Date().toISOString(),
        }]);

      if (rewardError) throw rewardError;

      // 更新用户小红花余额
      await supabase.rpc('update_flower_balance', {
        user_wallet: submission.wallet_address,
        amount_change: parseInt(reward.amount),
        transaction_type: 'earn'
      });

    } catch (error) {
      console.error('发放奖励失败:', error);
    }
  }

  /**
   * 数据库记录转换为任务对象
   */
  private static mapDbToTask(dbRecord: any): SocialTask {
    return {
      id: dbRecord.id,
      type: dbRecord.type,
      title: dbRecord.title,
      description: dbRecord.description,
      requirements: dbRecord.requirements,
      reward: dbRecord.reward,
      isActive: dbRecord.is_active,
      startDate: new Date(dbRecord.start_date).getTime(),
      endDate: dbRecord.end_date ? new Date(dbRecord.end_date).getTime() : undefined,
      maxParticipants: dbRecord.max_participants,
      currentParticipants: dbRecord.current_participants || 0,
      createdBy: dbRecord.created_by,
    };
  }

  /**
   * 数据库记录转换为提交对象
   */
  private static mapDbToSubmission(dbRecord: any): TaskSubmission {
    return {
      id: dbRecord.id,
      taskId: dbRecord.task_id,
      userId: dbRecord.user_id,
      walletAddress: dbRecord.wallet_address,
      submissionData: dbRecord.submission_data,
      status: dbRecord.status,
      submittedAt: new Date(dbRecord.submitted_at).getTime(),
      reviewedAt: dbRecord.reviewed_at ? new Date(dbRecord.reviewed_at).getTime() : undefined,
      reviewedBy: dbRecord.reviewed_by,
      rejectReason: dbRecord.reject_reason,
    };
  }
}
