import nodemailer from 'nodemailer';
import fs from 'fs';
import path from 'path';
import MailerLite from '@mailerlite/mailerlite-nodejs';

/**
 * Sends an email with the report as the body using nodemailer
 * @param {string} subject - Email subject
 * @param {string} htmlFilePath - Path to the HTML report file
 * @returns {Promise<boolean>} - Whether the email was sent successfully
 */
async function sendNodemailerEmail(subject, htmlFilePath) {
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

/**
 * Sends a campaign using MailerLite
 * @param {string} subject - Campaign subject
 * @param {string} htmlFilePath - Path to the HTML report file
 * @returns {Promise<boolean>} - Whether the campaign was sent successfully
 */
async function sendMailerLiteCampaign(subject, htmlFilePath) {
  try {
    // Get MailerLite configuration from environment variables
    const apiKey = process.env.MAILERLITE_API_KEY;
    const groupId = process.env.MAILERLITE_GROUP_ID;
    const fromEmail = process.env.MAILERLITE_FROM_EMAIL;
    const fromName = process.env.MAILERLITE_FROM_NAME;
    
    // Check if all required environment variables are set
    if (!apiKey || !groupId || !fromEmail || !fromName) {
      console.error('\x1b[33m[MAILERLITE ERROR]\x1b[0m Missing required environment variables (MAILERLITE_API_KEY, MAILERLITE_GROUP_ID, MAILERLITE_FROM_EMAIL, MAILERLITE_FROM_NAME)');
      return false;
    }
    
    // Read the HTML content of the report
    const htmlContent = fs.readFileSync(htmlFilePath, 'utf8');
    
    // Initialize MailerLite client
    const mailerlite = new MailerLite({
      api_key: apiKey
    });
    
    // Create campaign parameters
    const params = {
      name: subject,
      language_id: 1, // English
      type: "regular",
      emails: [{
        subject: subject,
        from_name: fromName,
        from: fromEmail,
        content: htmlContent
      }],
      groups: [groupId]
    };
    
    // Create and send campaign
    const response = await mailerlite.campaigns.create(params);
    console.log(`\x1b[33m[${new Date().toISOString()}] MailerLite campaign created: ${response.data.id}\x1b[0m`);
    return true;
  } catch (error) {
    console.error('\x1b[33m[MAILERLITE ERROR]\x1b[0m', error);
    return false;
  }
}

/**
 * Sends an email with the report as the body using the configured method(s)
 * @param {string} subject - Email subject
 * @param {string} htmlFilePath - Path to the HTML report file
 * @returns {Promise<boolean>} - Whether the email was sent successfully
 */
export async function sendReportEmail(subject, htmlFilePath) {
  const results = [];
  
  // Send via nodemailer if configured
  if (process.env.SOURCE_EMAIL && process.env.GOOGLE_APP_PASSWORD && process.env.TARGET_EMAIL) {
    const nodemailerResult = await sendNodemailerEmail(subject, htmlFilePath);
    results.push(nodemailerResult);
  }
  
  // Send via MailerLite if configured
  if (process.env.MAILERLITE_API_KEY && process.env.MAILERLITE_GROUP_ID) {
    const mailerliteResult = await sendMailerLiteCampaign(subject, htmlFilePath);
    results.push(mailerliteResult);
  }
  
  // Return true if at least one method succeeded
  return results.some(result => result === true);
} 