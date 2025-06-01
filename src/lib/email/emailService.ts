/**
 * 邮件服务模块
 * 支持 SendGrid 和 Resend 邮件服务
 */

import { Resend } from 'resend';
import sgMail from '@sendgrid/mail';

// 环境变量
const SENDGRID_API_KEY = process.env.SENDGRID_API_KEY;
const RESEND_API_KEY = process.env.RESEND_API_KEY;
const FROM_EMAIL = process.env.SENDGRID_FROM_EMAIL || 'noreply@sociomint.com';
const EMAIL_PROVIDER = process.env.EMAIL_PROVIDER || 'resend'; // 'sendgrid' | 'resend'

// 初始化邮件服务
let resend: Resend | null = null;
let sendgridInitialized = false;

if (EMAIL_PROVIDER === 'resend' && RESEND_API_KEY) {
  resend = new Resend(RESEND_API_KEY);
  console.log('✅ Resend email service initialized');
} else if (EMAIL_PROVIDER === 'sendgrid' && SENDGRID_API_KEY) {
  sgMail.setApiKey(SENDGRID_API_KEY);
  sendgridInitialized = true;
  console.log('✅ SendGrid email service initialized');
} else {
  console.warn('⚠️ No email service configured');
}

// 邮件模板类型
export interface EmailTemplate {
  subject: string;
  html: string;
  text?: string;
}

// 邮件发送选项
export interface EmailOptions {
  to: string | string[];
  subject: string;
  html: string;
  text?: string;
  from?: string;
  replyTo?: string;
  attachments?: Array<{
    filename: string;
    content: string | Buffer;
    type?: string;
  }>;
}

/**
 * 发送邮件（通用函数）
 */
export async function sendEmail(options: EmailOptions): Promise<{
  success: boolean;
  messageId?: string;
  error?: string;
}> {
  try {
    if (EMAIL_PROVIDER === 'resend' && resend) {
      return await sendWithResend(options);
    } else if (EMAIL_PROVIDER === 'sendgrid' && sendgridInitialized) {
      return await sendWithSendGrid(options);
    } else {
      throw new Error('No email service configured');
    }
  } catch (error: any) {
    console.error('❌ Email sending failed:', error);
    return {
      success: false,
      error: error.message
    };
  }
}

/**
 * 使用 Resend 发送邮件
 */
async function sendWithResend(options: EmailOptions): Promise<{
  success: boolean;
  messageId?: string;
  error?: string;
}> {
  if (!resend) {
    throw new Error('Resend not initialized');
  }

  const { data, error } = await resend.emails.send({
    from: options.from || FROM_EMAIL,
    to: Array.isArray(options.to) ? options.to : [options.to],
    subject: options.subject,
    html: options.html,
    text: options.text,
    reply_to: options.replyTo,
    attachments: options.attachments?.map(att => ({
      filename: att.filename,
      content: att.content
    }))
  });

  if (error) {
    throw new Error(error.message);
  }

  return {
    success: true,
    messageId: data?.id
  };
}

/**
 * 使用 SendGrid 发送邮件
 */
async function sendWithSendGrid(options: EmailOptions): Promise<{
  success: boolean;
  messageId?: string;
  error?: string;
}> {
  const msg = {
    to: options.to,
    from: options.from || FROM_EMAIL,
    subject: options.subject,
    html: options.html,
    text: options.text,
    replyTo: options.replyTo,
    attachments: options.attachments?.map(att => ({
      filename: att.filename,
      content: Buffer.isBuffer(att.content) ? att.content.toString('base64') : att.content,
      type: att.type || 'application/octet-stream',
      disposition: 'attachment'
    }))
  };

  const [response] = await sgMail.send(msg);

  return {
    success: true,
    messageId: response.headers['x-message-id']
  };
}

/**
 * 发送欢迎邮件
 */
export async function sendWelcomeEmail(
  email: string,
  username: string,
  walletAddress: string
): Promise<{ success: boolean; error?: string }> {
  const template = getWelcomeEmailTemplate(username, walletAddress);
  
  return await sendEmail({
    to: email,
    subject: template.subject,
    html: template.html,
    text: template.text
  });
}

/**
 * 发送 SM 代币领取通知邮件
 */
export async function sendTokenClaimNotification(
  email: string,
  username: string,
  amount: string,
  txHash: string
): Promise<{ success: boolean; error?: string }> {
  const template = getTokenClaimTemplate(username, amount, txHash);
  
  return await sendEmail({
    to: email,
    subject: template.subject,
    html: template.html,
    text: template.text
  });
}

/**
 * 发送空投池参与通知邮件
 */
export async function sendAirdropParticipationEmail(
  email: string,
  username: string,
  depositAmount: string,
  roundId: string,
  expectedReward: string
): Promise<{ success: boolean; error?: string }> {
  const template = getAirdropParticipationTemplate(username, depositAmount, roundId, expectedReward);
  
  return await sendEmail({
    to: email,
    subject: template.subject,
    html: template.html,
    text: template.text
  });
}

/**
 * 发送宝箱开启通知邮件
 */
export async function sendTreasureBoxNotification(
  email: string,
  username: string,
  boxType: string,
  rewards: Array<{ type: string; amount: string }>
): Promise<{ success: boolean; error?: string }> {
  const template = getTreasureBoxTemplate(username, boxType, rewards);
  
  return await sendEmail({
    to: email,
    subject: template.subject,
    html: template.html,
    text: template.text
  });
}

/**
 * 发送社交任务完成通知邮件
 */
export async function sendSocialTaskCompletionEmail(
  email: string,
  username: string,
  taskTitle: string,
  platform: string,
  reward: string
): Promise<{ success: boolean; error?: string }> {
  const template = getSocialTaskTemplate(username, taskTitle, platform, reward);
  
  return await sendEmail({
    to: email,
    subject: template.subject,
    html: template.html,
    text: template.text
  });
}

/**
 * 欢迎邮件模板
 */
function getWelcomeEmailTemplate(username: string, walletAddress: string): EmailTemplate {
  return {
    subject: '🌸 欢迎加入 SocioMint！',
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>欢迎加入 SocioMint</title>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
          .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
          .button { display: inline-block; background: #667eea; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin: 10px 0; }
          .footer { text-align: center; margin-top: 30px; color: #666; font-size: 14px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>🌸 欢迎加入 SocioMint！</h1>
            <p>Web3 社交广告平台</p>
          </div>
          <div class="content">
            <h2>你好，${username}！</h2>
            <p>欢迎加入 SocioMint 社区！我们很高兴你成为我们 Web3 社交广告平台的一员。</p>
            
            <h3>🎯 你可以开始：</h3>
            <ul>
              <li>🐦 绑定 Twitter 账号完成社交任务</li>
              <li>💬 加入 Discord 和 Telegram 社区</li>
              <li>🌸 参与小红花空投池</li>
              <li>💰 交换 SM 代币</li>
              <li>🎁 开启神秘宝箱</li>
            </ul>
            
            <div style="background: #e8f4fd; padding: 15px; border-radius: 6px; margin: 20px 0;">
              <strong>你的钱包地址：</strong><br>
              <code style="background: white; padding: 5px; border-radius: 3px;">${walletAddress}</code>
            </div>
            
            <a href="https://sociomint.com/dashboard" class="button">🚀 开始探索</a>
            
            <h3>📱 加入我们的社区：</h3>
            <p>
              <a href="https://twitter.com/SocioMint">🐦 Twitter</a> | 
              <a href="https://discord.gg/sociomint">💬 Discord</a> | 
              <a href="https://t.me/sociomint">📱 Telegram</a>
            </p>
          </div>
          <div class="footer">
            <p>© 2024 SocioMint. 让社交创造价值。</p>
          </div>
        </div>
      </body>
      </html>
    `,
    text: `欢迎加入 SocioMint！

你好，${username}！

欢迎加入 SocioMint 社区！我们很高兴你成为我们 Web3 社交广告平台的一员。

你可以开始：
- 绑定 Twitter 账号完成社交任务
- 加入 Discord 和 Telegram 社区
- 参与小红花空投池
- 交换 SM 代币
- 开启神秘宝箱

你的钱包地址：${walletAddress}

立即开始：https://sociomint.com/dashboard

加入我们的社区：
Twitter: https://twitter.com/SocioMint
Discord: https://discord.gg/sociomint
Telegram: https://t.me/sociomint

© 2024 SocioMint. 让社交创造价值。`
  };
}

/**
 * 代币领取通知模板
 */
function getTokenClaimTemplate(username: string, amount: string, txHash: string): EmailTemplate {
  return {
    subject: '🏆 SM 代币领取成功！',
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>SM 代币领取成功</title>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #2ecc71 0%, #27ae60 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
          .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
          .amount { background: #e8f5e8; padding: 20px; border-radius: 6px; text-align: center; margin: 20px 0; }
          .tx-hash { background: #f0f0f0; padding: 10px; border-radius: 3px; word-break: break-all; font-family: monospace; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>🏆 恭喜！</h1>
            <p>SM 代币领取成功</p>
          </div>
          <div class="content">
            <h2>你好，${username}！</h2>
            <p>你已成功领取 SM 代币奖励！</p>
            
            <div class="amount">
              <h3>💰 领取数量</h3>
              <h2 style="color: #27ae60; margin: 10px 0;">${amount} SM</h2>
            </div>
            
            <p><strong>交易哈希：</strong></p>
            <div class="tx-hash">${txHash}</div>
            
            <p>你可以在 <a href="https://bscscan.com/tx/${txHash}">BscScan</a> 上查看交易详情。</p>
            
            <p>继续参与更多活动，赚取更多 SM 代币！</p>
          </div>
        </div>
      </body>
      </html>
    `,
    text: `🏆 SM 代币领取成功！

你好，${username}！

你已成功领取 ${amount} SM 代币奖励！

交易哈希：${txHash}

你可以在 BscScan 上查看交易详情：https://bscscan.com/tx/${txHash}

继续参与更多活动，赚取更多 SM 代币！`
  };
}

/**
 * 空投池参与通知模板
 */
function getAirdropParticipationTemplate(
  username: string,
  depositAmount: string,
  roundId: string,
  expectedReward: string
): EmailTemplate {
  return {
    subject: '🌸 空投池参与成功！',
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>空投池参与成功</title>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
          .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
          .stats { display: flex; justify-content: space-around; margin: 20px 0; }
          .stat { text-align: center; background: white; padding: 15px; border-radius: 6px; flex: 1; margin: 0 5px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>🌸 参与成功！</h1>
            <p>小红花空投池</p>
          </div>
          <div class="content">
            <h2>你好，${username}！</h2>
            <p>你已成功参与第 ${roundId} 轮小红花空投池！</p>
            
            <div class="stats">
              <div class="stat">
                <h4>投入数量</h4>
                <h3>${depositAmount} 🌸</h3>
              </div>
              <div class="stat">
                <h4>预期奖励</h4>
                <h3>${expectedReward} SM</h3>
              </div>
            </div>
            
            <p>本轮空投将在一周后结算，届时你可以领取你的 SM 代币奖励。</p>
            
            <p>我们会在奖励可领取时通知你！</p>
          </div>
        </div>
      </body>
      </html>
    `,
    text: `🌸 空投池参与成功！

你好，${username}！

你已成功参与第 ${roundId} 轮小红花空投池！

投入数量：${depositAmount} 小红花
预期奖励：${expectedReward} SM

本轮空投将在一周后结算，届时你可以领取你的 SM 代币奖励。

我们会在奖励可领取时通知你！`
  };
}

/**
 * 宝箱开启通知模板
 */
function getTreasureBoxTemplate(
  username: string,
  boxType: string,
  rewards: Array<{ type: string; amount: string }>
): EmailTemplate {
  const rewardsList = rewards.map(r => `${r.amount} ${r.type}`).join(', ');
  
  return {
    subject: '🎁 宝箱开启成功！',
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>宝箱开启成功</title>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #f39c12 0%, #e67e22 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
          .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
          .rewards { background: #fff3cd; padding: 20px; border-radius: 6px; margin: 20px 0; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>🎁 恭喜！</h1>
            <p>宝箱开启成功</p>
          </div>
          <div class="content">
            <h2>你好，${username}！</h2>
            <p>你已成功开启 ${boxType} 宝箱！</p>
            
            <div class="rewards">
              <h3>🎉 获得奖励：</h3>
              <p style="font-size: 18px; font-weight: bold;">${rewardsList}</p>
            </div>
            
            <p>继续完成社交任务，获得更多宝箱！</p>
          </div>
        </div>
      </body>
      </html>
    `,
    text: `🎁 宝箱开启成功！

你好，${username}！

你已成功开启 ${boxType} 宝箱！

获得奖励：${rewardsList}

继续完成社交任务，获得更多宝箱！`
  };
}

/**
 * 社交任务完成通知模板
 */
function getSocialTaskTemplate(
  username: string,
  taskTitle: string,
  platform: string,
  reward: string
): EmailTemplate {
  return {
    subject: '✅ 社交任务完成！',
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>社交任务完成</title>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #3498db 0%, #2980b9 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
          .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
          .task-info { background: #e3f2fd; padding: 15px; border-radius: 6px; margin: 20px 0; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>✅ 任务完成！</h1>
            <p>社交任务奖励</p>
          </div>
          <div class="content">
            <h2>你好，${username}！</h2>
            <p>你已成功完成社交任务！</p>
            
            <div class="task-info">
              <h4>📋 任务详情：</h4>
              <p><strong>任务：</strong>${taskTitle}</p>
              <p><strong>平台：</strong>${platform}</p>
              <p><strong>奖励：</strong>${reward} 小红花</p>
            </div>
            
            <p>继续完成更多社交任务，赚取更多小红花！</p>
          </div>
        </div>
      </body>
      </html>
    `,
    text: `✅ 社交任务完成！

你好，${username}！

你已成功完成社交任务！

任务详情：
任务：${taskTitle}
平台：${platform}
奖励：${reward} 小红花

继续完成更多社交任务，赚取更多小红花！`
  };
}
