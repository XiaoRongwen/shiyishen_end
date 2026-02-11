import nodemailer from 'nodemailer';
import { config } from '@/config';

/**
 * 邮件发送器（单例）
 */
const transporter = nodemailer.createTransport({
  host: config.email.host,
  port: config.email.port,
  secure: config.email.secure, // true for 465, false for other ports
  auth: {
    user: config.email.user,
    pass: config.email.password
  }
});

/**
 * 发送验证码邮件
 */
export const sendVerificationEmail = async (
  to: string,
  code: string,
  type: 'register' | 'reset_password' = 'register'
): Promise<boolean> => {
  try {

    const subject = type === 'register' ? '【圈创社区】注册验证码' : '【圈创社区】密码重置验证码';
    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>${subject}</title>
      </head>
      <body style="margin: 0; padding: 0; background-color: #f3f4f6; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;">
        <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f3f4f6; padding: 40px 0;">
          <tr>
            <td align="center">
              <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
                
                <!-- Header with Gradient -->
                <tr>
                  <td style="background: linear-gradient(135deg, #2563eb 0%, #4f46e5 100%); padding: 48px 48px 40px 48px; text-align: center;">
                    <h1 style="margin: 0; color: #ffffff; font-size: 32px; font-weight: 700; letter-spacing: 1px;">
                      圈创社区
                    </h1>
                    <p style="margin: 12px 0 0 0; color: rgba(255,255,255,0.9); font-size: 16px; font-weight: 500;">
                      ${type === 'register' ? '圈创社区｜与创业者并肩同行' : '密码重置验证'}
                    </p>
                  </td>
                </tr>
                
                <!-- Content -->
                <tr>
                  <td style="padding: 48px;">
                    <p style="margin: 0 0 24px 0; color: #1f2937; font-size: 16px; line-height: 1.6;">
                      您好，
                    </p>
                    <p style="margin: 0 0 32px 0; color: #4b5563; font-size: 15px; line-height: 1.6;">
                      ${type === 'register' ? '感谢您注册圈创社区。' : '您正在进行密码重置操作。'}请使用以下验证码完成验证：
                    </p>
                    
                    <!-- Code Box with Gradient Border -->
                    <table width="100%" cellpadding="0" cellspacing="0" style="margin: 0 0 32px 0;">
                      <tr>
                        <td style="background: linear-gradient(135deg, #2563eb 0%, #4f46e5 100%); padding: 2px; border-radius: 8px;">
                          <table width="100%" cellpadding="0" cellspacing="0">
                            <tr>
                              <td style="background-color: #ffffff; padding: 32px; text-align: center; border-radius: 6px;">
                                <div style="font-size: 36px; font-weight: 700; background: linear-gradient(135deg, #2563eb 0%, #4f46e5 100%); -webkit-background-clip: text; -webkit-text-fill-color: transparent; letter-spacing: 12px; font-family: 'Courier New', monospace;">
                                  ${code}
                                </div>
                              </td>
                            </tr>
                          </table>
                        </td>
                      </tr>
                    </table>
                    
                    <!-- Info Box -->
                    <table width="100%" cellpadding="0" cellspacing="0" style="margin: 0 0 24px 0;">
                      <tr>
                        <td style="background: linear-gradient(135deg, #eff6ff 0%, #e0e7ff 100%); padding: 20px 24px; border-radius: 6px;">
                          <p style="margin: 0 0 8px 0; color: #1f2937; font-size: 14px; line-height: 1.6;">
                            <strong style="color: #2563eb;">有效期：</strong>5 分钟
                          </p>
                          <p style="margin: 0; color: #1f2937; font-size: 14px; line-height: 1.6;">
                            <strong style="color: #2563eb;">提示：</strong>请勿将验证码告知他人
                          </p>
                        </td>
                      </tr>
                    </table>
                    
                    <!-- Warning Box -->
                    <table width="100%" cellpadding="0" cellspacing="0">
                      <tr>
                        <td style="background-color: #fef3c7; border: 1px solid #fbbf24; border-radius: 6px; padding: 16px 20px;">
                          <p style="margin: 0; color: #92400e; font-size: 13px; line-height: 1.6;">
                            ⚠️ 如非本人操作，请忽略此邮件，您的账户仍然安全。
                          </p>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
                
                <!-- Footer -->
                <tr>
                  <td style="background-color: #f9fafb; padding: 32px 48px; border-top: 1px solid #e5e7eb;">
                    <p style="margin: 0 0 8px 0; color: #6b7280; font-size: 13px; line-height: 1.6; text-align: center;">
                      此邮件由系统自动发送，请勿直接回复
                    </p>
                    <p style="margin: 0; color: #9ca3af; font-size: 12px; text-align: center;">
                      © 2025 圈创社区 · 互联网创业交流平台
                    </p>
                  </td>
                </tr>
                
              </table>
            </td>
          </tr>
        </table>
      </body>
      </html>
    `;

    await transporter.sendMail({
      from: {
        name: config.email.fromName,
        address: config.email.user || ''
      },
      to,
      subject,
      html
    });

    return true;
  } catch (error) {
    console.error('发送邮件失败:', error);
    return false;
  }
};

/**
 * 生成6位数字验证码
 */
export const generateVerificationCode = (): string => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};
