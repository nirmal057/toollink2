import nodemailer from 'nodemailer';
import logger from './logger.js';

// Create email transporter
const createTransporter = () => {
    // Use Gmail SMTP for ToolLink admin email
    return nodemailer.createTransport({
        service: 'gmail',
        host: 'smtp.gmail.com',
        port: 587,
        secure: false, // true for 465, false for other ports
        auth: {
            user: process.env.TOOLLINK_EMAIL || 'toollink1234@gmail.com',
            pass: process.env.TOOLLINK_EMAIL_PASSWORD || 'yyyr loge fmgf qyag'
        },
        tls: {
            rejectUnauthorized: false
        }
    });
};

const transporter = createTransporter();

// Email templates
const emailTemplates = {
    'email-verification': {
        subject: 'Welcome to ToolLink - Please verify your email',
        html: (data) => `
      <div style="max-width: 600px; margin: 0 auto; font-family: Arial, sans-serif; color: #333;">
        <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; text-align: center; color: white;">
          <h1 style="margin: 0; font-size: 28px;">Welcome to ToolLink!</h1>
          <p style="margin: 10px 0 0 0; font-size: 16px;">Your account has been created successfully</p>
        </div>

        <div style="padding: 30px; background: white;">
          <h2 style="color: #333; margin-bottom: 20px;">Hello ${data.fullName}!</h2>

          <p style="font-size: 16px; line-height: 1.6; margin-bottom: 20px;">
            Thank you for joining ToolLink! We're excited to have you as part of our community.
          </p>

          <p style="font-size: 16px; line-height: 1.6; margin-bottom: 25px;">
            To complete your registration and start using all features, please verify your email address by clicking the button below:
          </p>

          <div style="text-align: center; margin: 30px 0;">
            <a href="${data.verificationUrl}" style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 15px 30px; text-decoration: none; border-radius: 25px; font-weight: bold; font-size: 16px; display: inline-block;">
              ✅ Verify Email Address
            </a>
          </div>

          <p style="font-size: 14px; color: #666; margin-top: 25px;">
            If the button above doesn't work, copy and paste this link into your browser:<br>
            <a href="${data.verificationUrl}" style="color: #667eea; word-break: break-all;">${data.verificationUrl}</a>
          </p>

          <div style="margin-top: 30px; padding: 20px; background: #f8f9fa; border-radius: 8px;">
            <h3 style="color: #333; margin-top: 0;">What's Next?</h3>
            <ul style="margin: 0; padding-left: 20px;">
              <li>Verify your email address</li>
              <li>Complete your profile setup</li>
              <li>Explore our services and features</li>
              <li>Start managing your tools and inventory</li>
            </ul>
          </div>
        </div>

        <div style="background: #f8f9fa; padding: 20px; text-align: center; color: #666; font-size: 12px;">
          <p style="margin: 0;">If you didn't create this account, please ignore this email.</p>
          <p style="margin: 5px 0 0 0;">© ${new Date().getFullYear()} ToolLink. All rights reserved.</p>
        </div>
      </div>
    `
    },
    'customer-registration-pending': {
        subject: 'Welcome to ToolLink - Registration Received',
        html: (data) => `
      <div style="max-width: 600px; margin: 0 auto; font-family: Arial, sans-serif; color: #333;">
        <div style="background: linear-gradient(135deg, #f39c12 0%, #e67e22 100%); padding: 30px; text-align: center; color: white;">
          <h1 style="margin: 0; font-size: 28px;">Welcome to ToolLink!</h1>
          <p style="margin: 10px 0 0 0; font-size: 16px;">Your registration has been received</p>
        </div>

        <div style="padding: 30px; background: white;">
          <h2 style="color: #333; margin-bottom: 20px;">Hello ${data.fullName}!</h2>

          <p style="font-size: 16px; line-height: 1.6; margin-bottom: 20px;">
            Thank you for choosing ToolLink! We've received your customer registration and it's currently being reviewed.
          </p>

          <div style="background: #fff3cd; border: 1px solid #ffeaa7; border-radius: 8px; padding: 20px; margin: 25px 0;">
            <h3 style="color: #856404; margin-top: 0; display: flex; align-items: center;">
              ⏳ Account Status: Pending Approval
            </h3>
            <p style="color: #856404; margin: 10px 0;">
              Your account is currently under review by our administrators. This process typically takes 1-2 business days.
            </p>
          </div>

          <div style="margin: 25px 0; padding: 20px; background: #f8f9fa; border-radius: 8px;">
            <h3 style="color: #333; margin-top: 0;">Registration Details:</h3>
            <ul style="margin: 10px 0; padding-left: 20px; line-height: 1.8;">
              <li><strong>Email:</strong> ${data.email}</li>
              <li><strong>Full Name:</strong> ${data.fullName}</li>
              <li><strong>Registration Date:</strong> ${new Date(data.submittedAt).toLocaleDateString()}</li>
              <li><strong>Status:</strong> Pending Administrator Approval</li>
            </ul>
          </div>

          <div style="margin: 25px 0; padding: 20px; background: #e8f5e8; border-radius: 8px; border-left: 4px solid #28a745;">
            <h3 style="color: #155724; margin-top: 0;">What happens next?</h3>
            <ol style="margin: 10px 0; padding-left: 20px; line-height: 1.8; color: #155724;">
              <li>Our administrators will review your registration</li>
              <li>You'll receive an email notification once approved</li>
              <li>After approval, you can login and start using ToolLink</li>
              <li>You'll have access to all customer features and services</li>
            </ol>
          </div>

          <p style="font-size: 16px; line-height: 1.6; margin: 25px 0;">
            We appreciate your patience during the approval process. If you have any questions, please don't hesitate to contact our support team.
          </p>
        </div>

        <div style="background: #f8f9fa; padding: 20px; text-align: center; color: #666; font-size: 12px;">
          <p style="margin: 0;">Questions? Contact us at support@toollink.com</p>
          <p style="margin: 5px 0 0 0;">© ${new Date().getFullYear()} ToolLink. All rights reserved.</p>
        </div>
      </div>
    `
    },
    'customer-approved': {
        subject: '🎉 Your ToolLink account has been approved!',
        html: (data) => `
      <div style="max-width: 600px; margin: 0 auto; font-family: Arial, sans-serif; color: #333;">
        <div style="background: linear-gradient(135deg, #28a745 0%, #20c997 100%); padding: 30px; text-align: center; color: white;">
          <h1 style="margin: 0; font-size: 28px;">🎉 Account Approved!</h1>
          <p style="margin: 10px 0 0 0; font-size: 16px;">You can now access your ToolLink account</p>
        </div>

        <div style="padding: 30px; background: white;">
          <h2 style="color: #333; margin-bottom: 20px;">Congratulations ${data.fullName}!</h2>

          <p style="font-size: 16px; line-height: 1.6; margin-bottom: 20px;">
            Great news! Your ToolLink customer account has been approved and is now active.
          </p>

          <div style="background: #d4edda; border: 1px solid #c3e6cb; border-radius: 8px; padding: 20px; margin: 25px 0;">
            <h3 style="color: #155724; margin-top: 0;">✅ Account Status: Active</h3>
            <p style="color: #155724; margin: 10px 0;">
              You can now login and start using all ToolLink features and services.
            </p>
          </div>

          <div style="text-align: center; margin: 30px 0;">
            <a href="${data.loginUrl || process.env.FRONTEND_URL + '/auth/login'}" style="background: linear-gradient(135deg, #28a745 0%, #20c997 100%); color: white; padding: 15px 30px; text-decoration: none; border-radius: 25px; font-weight: bold; font-size: 16px; display: inline-block;">
              🚀 Login to Your Account
            </a>
          </div>

          <div style="margin: 25px 0; padding: 20px; background: #f8f9fa; border-radius: 8px;">
            <h3 style="color: #333; margin-top: 0;">Your Login Credentials:</h3>
            <ul style="margin: 10px 0; padding-left: 20px; line-height: 1.8;">
              <li><strong>Email:</strong> ${data.email}</li>
              <li><strong>Password:</strong> Use the password you created during registration</li>
            </ul>
          </div>

          <div style="margin: 25px 0; padding: 20px; background: #e3f2fd; border-radius: 8px; border-left: 4px solid #2196f3;">
            <h3 style="color: #0d47a1; margin-top: 0;">What you can do now:</h3>
            <ul style="margin: 10px 0; padding-left: 20px; line-height: 1.8; color: #0d47a1;">
              <li>Browse and order tools and materials</li>
              <li>Track your order status and delivery</li>
              <li>Manage your account and preferences</li>
              <li>Access customer support</li>
              <li>View your order history</li>
            </ul>
          </div>
        </div>

        <div style="background: #f8f9fa; padding: 20px; text-align: center; color: #666; font-size: 12px;">
          <p style="margin: 0;">Welcome to ToolLink! We're here to help you succeed.</p>
          <p style="margin: 5px 0 0 0;">© ${new Date().getFullYear()} ToolLink. All rights reserved.</p>
        </div>
      </div>
    `
    },
    'admin-new-customer-pending': {
        subject: '🔔 New Customer Registration Pending Approval',
        html: (data) => `
      <div style="max-width: 600px; margin: 0 auto; font-family: Arial, sans-serif; color: #333;">
        <div style="background: linear-gradient(135deg, #6c757d 0%, #495057 100%); padding: 30px; text-align: center; color: white;">
          <h1 style="margin: 0; font-size: 24px;">🔔 New Customer Registration</h1>
          <p style="margin: 10px 0 0 0; font-size: 16px;">Approval Required</p>
        </div>

        <div style="padding: 30px; background: white;">
          <h2 style="color: #333; margin-bottom: 20px;">New Customer Awaiting Approval</h2>

          <p style="font-size: 16px; line-height: 1.6; margin-bottom: 20px;">
            A new customer has registered and is waiting for approval to access ToolLink.
          </p>

          <div style="margin: 25px 0; padding: 20px; background: #f8f9fa; border-radius: 8px;">
            <h3 style="color: #333; margin-top: 0;">Customer Details:</h3>
            <ul style="margin: 10px 0; padding-left: 20px; line-height: 1.8;">
              <li><strong>Name:</strong> ${data.customerName}</li>
              <li><strong>Email:</strong> ${data.customerEmail}</li>
              <li><strong>Registration Date:</strong> ${new Date().toLocaleDateString()}</li>
            </ul>
          </div>

          <div style="text-align: center; margin: 30px 0;">
            <a href="${data.approvalUrl}" style="background: linear-gradient(135deg, #007bff 0%, #0056b3 100%); color: white; padding: 15px 30px; text-decoration: none; border-radius: 25px; font-weight: bold; font-size: 16px; display: inline-block;">
              👤 Review & Approve
            </a>
          </div>
        </div>

        <div style="background: #f8f9fa; padding: 20px; text-align: center; color: #666; font-size: 12px;">
          <p style="margin: 0;">ToolLink Admin Notification System</p>
        </div>
      </div>
    `
    },
    'password-reset': {
        subject: 'Reset your ToolLink password',
        html: (data) => `
      <div style="max-width: 600px; margin: 0 auto; font-family: Arial, sans-serif; color: #333;">
        <div style="background: linear-gradient(135deg, #dc3545 0%, #c82333 100%); padding: 30px; text-align: center; color: white;">
          <h1 style="margin: 0; font-size: 28px;">🔒 Password Reset</h1>
          <p style="margin: 10px 0 0 0; font-size: 16px;">Reset your ToolLink password</p>
        </div>

        <div style="padding: 30px; background: white;">
          <h2 style="color: #333; margin-bottom: 20px;">Hello ${data.fullName},</h2>

          <p style="font-size: 16px; line-height: 1.6; margin-bottom: 20px;">
            You requested to reset your password for your ToolLink account. Click the button below to create a new password:
          </p>

          <div style="text-align: center; margin: 30px 0;">
            <a href="${data.resetUrl}" style="background: linear-gradient(135deg, #dc3545 0%, #c82333 100%); color: white; padding: 15px 30px; text-decoration: none; border-radius: 25px; font-weight: bold; font-size: 16px; display: inline-block;">
              🔑 Reset Password
            </a>
          </div>

          <div style="background: #fff3cd; border: 1px solid #ffeaa7; border-radius: 8px; padding: 20px; margin: 25px 0;">
            <p style="color: #856404; margin: 0;">
              ⏰ <strong>Important:</strong> This link will expire in 10 minutes for security reasons.
            </p>
          </div>

          <p style="font-size: 14px; color: #666; margin-top: 25px;">
            If the button above doesn't work, copy and paste this link into your browser:<br>
            <a href="${data.resetUrl}" style="color: #dc3545; word-break: break-all;">${data.resetUrl}</a>
          </p>

          <p style="font-size: 16px; line-height: 1.6; margin: 25px 0;">
            If you didn't request this password reset, please ignore this email. Your password will remain unchanged.
          </p>
        </div>

        <div style="background: #f8f9fa; padding: 20px; text-align: center; color: #666; font-size: 12px;">
          <p style="margin: 0;">For security reasons, never share this email with others.</p>
          <p style="margin: 5px 0 0 0;">© ${new Date().getFullYear()} ToolLink. All rights reserved.</p>
        </div>
      </div>
    `
    },
    'order-confirmation': {
        subject: '✅ Order Confirmation - ToolLink',
        html: (data) => `
      <div style="max-width: 600px; margin: 0 auto; font-family: Arial, sans-serif; color: #333;">
        <div style="background: linear-gradient(135deg, #28a745 0%, #20c997 100%); padding: 30px; text-align: center; color: white;">
          <h1 style="margin: 0; font-size: 28px;">✅ Order Confirmed!</h1>
          <p style="margin: 10px 0 0 0; font-size: 16px;">Your order has been received</p>
        </div>

        <div style="padding: 30px; background: white;">
          <h2 style="color: #333; margin-bottom: 20px;">Hello ${data.customerName}!</h2>

          <p style="font-size: 16px; line-height: 1.6; margin-bottom: 20px;">
            Thank you for your order! Your order <strong>#${data.orderNumber}</strong> has been confirmed and is being processed.
          </p>

          <div style="margin: 25px 0; padding: 20px; background: #f8f9fa; border-radius: 8px;">
            <h3 style="color: #333; margin-top: 0;">📦 Order Details:</h3>
            <ul style="margin: 10px 0; padding-left: 20px; line-height: 1.8;">
              ${data.items.map(item => `<li><strong>${item.name}</strong> - Quantity: ${item.quantity}</li>`).join('')}
            </ul>
            <p style="margin: 15px 0 0 0; font-size: 18px; font-weight: bold; color: #28a745;">
              💰 Total: $${data.total}
            </p>
          </div>

          <p style="font-size: 16px; line-height: 1.6; margin: 25px 0;">
            We'll notify you when your order is ready for delivery. You can track your order status in your account dashboard.
          </p>
        </div>

        <div style="background: #f8f9fa; padding: 20px; text-align: center; color: #666; font-size: 12px;">
          <p style="margin: 0;">Thank you for choosing ToolLink!</p>
          <p style="margin: 5px 0 0 0;">© ${new Date().getFullYear()} ToolLink. All rights reserved.</p>
        </div>
      </div>
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
            from: `${process.env.FROM_NAME || 'ToolLink Admin'} <${process.env.TOOLLINK_EMAIL || 'toollink1234@gmail.com'}>`,
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
