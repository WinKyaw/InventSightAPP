import nodemailer from 'nodemailer';
import { EMAIL_CONFIG } from '../config';
import { EmailVerificationData, PasswordResetData } from '../types';

class EmailService {
  private transporter: nodemailer.Transporter | null = null;

  constructor() {
    if (EMAIL_CONFIG.enabled) {
      this.initializeTransporter();
    }
  }

  private initializeTransporter(): void {
    try {
      this.transporter = nodemailer.createTransport({
        host: EMAIL_CONFIG.host,
        port: EMAIL_CONFIG.port,
        secure: EMAIL_CONFIG.secure,
        auth: EMAIL_CONFIG.auth.user && EMAIL_CONFIG.auth.pass ? {
          user: EMAIL_CONFIG.auth.user,
          pass: EMAIL_CONFIG.auth.pass,
        } : undefined,
      });

      console.log('✅ Email service initialized successfully');
    } catch (error) {
      console.error('❌ Failed to initialize email service:', error);
    }
  }

  /**
   * Send email verification email
   */
  async sendVerificationEmail(data: EmailVerificationData): Promise<void> {
    if (!EMAIL_CONFIG.enabled || !this.transporter) {
      console.log('📧 Email verification disabled, skipping email send');
      return;
    }

    const htmlContent = this.generateVerificationEmailHTML(data);
    const textContent = this.generateVerificationEmailText(data);

    const mailOptions = {
      from: EMAIL_CONFIG.from,
      to: data.email,
      subject: 'Verify Your Email Address - InventSight',
      text: textContent,
      html: htmlContent,
    };

    try {
      await this.transporter.sendMail(mailOptions);
      console.log(`✅ Verification email sent to: ${data.email}`);
    } catch (error) {
      console.error('❌ Failed to send verification email:', error);
      throw new Error('Failed to send verification email');
    }
  }

  /**
   * Send password reset email
   */
  async sendPasswordResetEmail(data: PasswordResetData): Promise<void> {
    if (!EMAIL_CONFIG.enabled || !this.transporter) {
      console.log('📧 Email service disabled, skipping password reset email');
      return;
    }

    const htmlContent = this.generatePasswordResetEmailHTML(data);
    const textContent = this.generatePasswordResetEmailText(data);

    const mailOptions = {
      from: EMAIL_CONFIG.from,
      to: data.email,
      subject: 'Reset Your Password - InventSight',
      text: textContent,
      html: htmlContent,
    };

    try {
      await this.transporter.sendMail(mailOptions);
      console.log(`✅ Password reset email sent to: ${data.email}`);
    } catch (error) {
      console.error('❌ Failed to send password reset email:', error);
      throw new Error('Failed to send password reset email');
    }
  }

  /**
   * Generate HTML content for verification email
   */
  private generateVerificationEmailHTML(data: EmailVerificationData): string {
    return `
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Verify Your Email - InventSight</title>
        <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background-color: #4CAF50; color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
            .content { background-color: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
            .button { display: inline-block; padding: 15px 30px; background-color: #4CAF50; color: white; text-decoration: none; border-radius: 5px; margin: 20px 0; }
            .footer { text-align: center; margin-top: 30px; font-size: 12px; color: #666; }
            .code { background-color: #e9e9e9; padding: 15px; font-family: monospace; font-size: 16px; text-align: center; border-radius: 5px; margin: 20px 0; }
        </style>
    </head>
    <body>
        <div class="header">
            <h1>Welcome to InventSight!</h1>
        </div>
        <div class="content">
            <p>Hello ${data.name},</p>
            
            <p>Thank you for registering with InventSight! To complete your registration and start using our inventory management system, please verify your email address.</p>
            
            <p><strong>Click the button below to verify your email:</strong></p>
            
            <div style="text-align: center;">
                <a href="${data.verificationUrl}" class="button">Verify Email Address</a>
            </div>
            
            <p>Or copy and paste this link into your browser:</p>
            <div class="code">${data.verificationUrl}</div>
            
            <p><strong>This verification link will expire in 24 hours.</strong></p>
            
            <p>If you didn't create an account with InventSight, you can safely ignore this email.</p>
            
            <p>Best regards,<br>The InventSight Team</p>
        </div>
        <div class="footer">
            <p>© 2024 InventSight. All rights reserved.</p>
            <p>This is an automated email. Please do not reply to this message.</p>
        </div>
    </body>
    </html>
    `;
  }

  /**
   * Generate plain text content for verification email
   */
  private generateVerificationEmailText(data: EmailVerificationData): string {
    return `
Welcome to InventSight!

Hello ${data.name},

Thank you for registering with InventSight! To complete your registration and start using our inventory management system, please verify your email address.

Verification Link: ${data.verificationUrl}

This verification link will expire in 24 hours.

If you didn't create an account with InventSight, you can safely ignore this email.

Best regards,
The InventSight Team

© 2024 InventSight. All rights reserved.
This is an automated email. Please do not reply to this message.
    `;
  }

  /**
   * Generate HTML content for password reset email
   */
  private generatePasswordResetEmailHTML(data: PasswordResetData): string {
    return `
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Reset Your Password - InventSight</title>
        <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background-color: #ff6b6b; color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
            .content { background-color: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
            .button { display: inline-block; padding: 15px 30px; background-color: #ff6b6b; color: white; text-decoration: none; border-radius: 5px; margin: 20px 0; }
            .footer { text-align: center; margin-top: 30px; font-size: 12px; color: #666; }
            .code { background-color: #e9e9e9; padding: 15px; font-family: monospace; font-size: 16px; text-align: center; border-radius: 5px; margin: 20px 0; }
        </style>
    </head>
    <body>
        <div class="header">
            <h1>Password Reset Request</h1>
        </div>
        <div class="content">
            <p>Hello ${data.name},</p>
            
            <p>We received a request to reset your InventSight account password. If you made this request, click the button below to reset your password:</p>
            
            <div style="text-align: center;">
                <a href="${data.resetUrl}" class="button">Reset Password</a>
            </div>
            
            <p>Or copy and paste this link into your browser:</p>
            <div class="code">${data.resetUrl}</div>
            
            <p><strong>This password reset link will expire in 1 hour.</strong></p>
            
            <p>If you didn't request a password reset, you can safely ignore this email. Your password will remain unchanged.</p>
            
            <p>Best regards,<br>The InventSight Team</p>
        </div>
        <div class="footer">
            <p>© 2024 InventSight. All rights reserved.</p>
            <p>This is an automated email. Please do not reply to this message.</p>
        </div>
    </body>
    </html>
    `;
  }

  /**
   * Generate plain text content for password reset email
   */
  private generatePasswordResetEmailText(data: PasswordResetData): string {
    return `
Password Reset Request

Hello ${data.name},

We received a request to reset your InventSight account password. If you made this request, use the link below to reset your password:

Reset Link: ${data.resetUrl}

This password reset link will expire in 1 hour.

If you didn't request a password reset, you can safely ignore this email. Your password will remain unchanged.

Best regards,
The InventSight Team

© 2024 InventSight. All rights reserved.
This is an automated email. Please do not reply to this message.
    `;
  }

  /**
   * Test email configuration
   */
  async testConnection(): Promise<boolean> {
    if (!this.transporter) {
      console.log('📧 Email service not configured');
      return false;
    }

    try {
      await this.transporter.verify();
      console.log('✅ Email service connection verified');
      return true;
    } catch (error) {
      console.error('❌ Email service connection failed:', error);
      return false;
    }
  }
}

export const emailService = new EmailService();