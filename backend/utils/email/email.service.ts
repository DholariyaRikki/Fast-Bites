import transporter, { sender } from './email.config';
import dotenv from 'dotenv';

dotenv.config();

// HTML templates for emails
import { 
  generateVerificationEmailHtml, 
  generateWelcomeEmailHtml, 
  generatePasswordResetEmailHtml, 
  generateResetSuccessEmailHtml 
} from './email.templates';

// Send verification email with OTP
export const sendVerificationEmail = async (email: string, verificationToken: string) => {
  try {
    const htmlContent = generateVerificationEmailHtml(verificationToken);
    
    await transporter.sendMail({
      from: `"${sender.name}" <${sender.email}>`,
      to: email,
      subject: 'Verify your email - FAST-BITES',
      html: htmlContent,
    });
    return true;
  } catch (error) {
    console.error('Failed to send verification email:', error);
    throw new Error('Failed to send email verification');
  }
};

// Send welcome email after successful verification
export const sendWelcomeEmail = async (email: string, name: string) => {
  try {
    const htmlContent = generateWelcomeEmailHtml(name);
    
    await transporter.sendMail({
      from: `"${sender.name}" <${sender.email}>`,
      to: email,
      subject: 'Welcome to FAST-BITES',
      html: htmlContent,
    });
    return true;
  } catch (error) {
    console.error('Failed to send welcome email:', error);
    throw new Error('Failed to send welcome email');
  }
};

// Send password reset email with link
export const sendPasswordResetEmail = async (email: string, resetURL: string) => {
  try {
    const htmlContent = generatePasswordResetEmailHtml(resetURL);
    
    await transporter.sendMail({
      from: `"${sender.name}" <${sender.email}>`,
      to: email,
      subject: 'Reset your password - FAST-BITES',
      html: htmlContent,
    });
    return true;
  } catch (error) {
    console.error('Failed to send password reset email:', error);
    throw new Error('Failed to send password reset email');
  }
};

// Send password reset success confirmation
export const sendResetSuccessEmail = async (email: string) => {
  try {
    const htmlContent = generateResetSuccessEmailHtml();
    
    await transporter.sendMail({
      from: `"${sender.name}" <${sender.email}>`,
      to: email,
      subject: 'Password Reset Successfully - FAST-BITES',
      html: htmlContent,
    });
    return true;
  } catch (error) {
    console.error('Failed to send password reset success email:', error);
    throw new Error('Failed to send password reset success email');
  }
}; 