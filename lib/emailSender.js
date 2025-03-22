import nodemailer from 'nodemailer';
import fs from 'fs';
import path from 'path';

/**
 * Sends an email with the report as the body
 * @param {string} subject - Email subject
 * @param {string} htmlFilePath - Path to the HTML report file
 * @returns {Promise<boolean>} - Whether the email was sent successfully
 */
export async function sendReportEmail(subject, htmlFilePath) {
  try {
    // Get email configuration from environment variables
    const sourceEmail = process.env.SOURCE_EMAIL;
    const appPassword = process.env.GOOGLE_APP_PASSWORD;
    const targetEmail = process.env.TARGET_EMAIL;
    
    // Check if all required environment variables are set
    if (!sourceEmail || !appPassword || !targetEmail) {
      console.error('\x1b[33m[EMAIL ERROR]\x1b[0m Missing required environment variables (SOURCE_EMAIL, GOOGLE_APP_PASSWORD, TARGET_EMAIL)');
      return false;
    }
    
    // Read the HTML content of the report
    const htmlContent = fs.readFileSync(htmlFilePath, 'utf8');
    
    // Create transporter for Gmail
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: sourceEmail,
        pass: appPassword
      }
    });
    
    // Email options
    const mailOptions = {
      from: sourceEmail,
      to: targetEmail,
      subject: subject,
      html: htmlContent
    };
    
    // Send email
    const info = await transporter.sendMail(mailOptions);
    console.log(`\x1b[33m[${new Date().toISOString()}] Email sent: ${info.messageId}\x1b[0m`);
    return true;
  } catch (error) {
    console.error('\x1b[33m[EMAIL ERROR]\x1b[0m', error);
    return false;
  }
} 