import nodemailer from 'nodemailer';
import logger from './logger.js';

// Create email transporter
const createTransporter = () => {
    if (process.env.NODE_ENV === 'production') {
        return nodemailer.createTransport({
            host: process.env.SMTP_HOST,
            port: process.env.SMTP_PORT,
            secure: process.env.SMTP_PORT === '465',
            auth: {
                user: process.env.SMTP_USER,
                pass: process.env.SMTP_PASS
            }
        });
    } else {
        // For development, use ethereal email
        return nodemailer.createTransport({
            host: 'smtp.ethereal.email',
            port: 587,
            auth: {
                user: 'ethereal.user@ethereal.email',
                pass: 'ethereal.pass'
            }
        });
    }
};

const transporter = createTransporter();

// Email templates
const emailTemplates = {
    'email-verification': {
        subject: 'Verify your email address',
        html: (data) => `
      <h2>Welcome to ToolLink, ${data.fullName}!</h2>
      <p>Please verify your email address by clicking the link below:</p>
      <a href="${data.verificationUrl}" style="background-color: #007bff; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">
        Verify Email
      </a>
      <p>If you didn't create an account, please ignore this email.</p>
    `
    },
    'password-reset': {
        subject: 'Reset your password',
        html: (data) => `
      <h2>Password Reset Request</h2>
      <p>Hello ${data.fullName},</p>
      <p>You requested to reset your password. Click the link below to reset it:</p>
      <a href="${data.resetUrl}" style="background-color: #dc3545; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">
        Reset Password
      </a>
      <p>This link will expire in 10 minutes.</p>
      <p>If you didn't request this, please ignore this email.</p>
    `
    },
    'order-confirmation': {
        subject: 'Order Confirmation',
        html: (data) => `
      <h2>Order Confirmation</h2>
      <p>Hello ${data.customerName},</p>
      <p>Your order ${data.orderNumber} has been confirmed!</p>
      <p><strong>Order Details:</strong></p>
      <ul>
        ${data.items.map(item => `<li>${item.name} - Quantity: ${item.quantity}</li>`).join('')}
      </ul>
      <p><strong>Total: $${data.total}</strong></p>
      <p>We'll notify you when your order is ready for delivery.</p>
    `
    }
};

// Send email function
export const sendEmail = async ({ to, subject, template, data, html, text }) => {
    try {
        let emailSubject = subject;
        let emailHtml = html;
        let emailText = text;

        // Use template if provided
        if (template && emailTemplates[template]) {
            emailSubject = emailTemplates[template].subject;
            emailHtml = emailTemplates[template].html(data);
        }

        const mailOptions = {
            from: `${process.env.FROM_NAME || 'ToolLink'} <${process.env.FROM_EMAIL || 'noreply@toollink.com'}>`,
            to,
            subject: emailSubject,
            html: emailHtml,
            text: emailText
        };

        const result = await transporter.sendMail(mailOptions);

        logger.info('Email sent successfully', {
            to,
            subject: emailSubject,
            messageId: result.messageId
        });

        return result;
    } catch (error) {
        logger.error('Email sending failed', {
            error: error.message,
            to,
            subject
        });
        throw error;
    }
};

// Send bulk emails
export const sendBulkEmails = async (emails) => {
    const results = [];

    for (const email of emails) {
        try {
            const result = await sendEmail(email);
            results.push({ success: true, email: email.to, result });
        } catch (error) {
            results.push({ success: false, email: email.to, error: error.message });
        }
    }

    return results;
};
