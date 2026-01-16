import nodemailer from 'nodemailer';
import { promises as fs } from 'fs';
import path from 'path';
import logger from '../utils/logger.js';

class EmailService {
    constructor() {
        this.transporter = nodemailer.createTransport({
            host: process.env.SMTP_HOST || 'smtp.gmail.com',
            port: process.env.SMTP_PORT || 587,
            secure: false,
            auth: {
                user: process.env.SMTP_USER,
                pass: process.env.SMTP_PASS
            }
        });

        this.defaultLanguage = 'en';
        this.supportedLanguages = ['en', 'si', 'ta']; // English, Sinhala, Tamil
    }

    /**
     * Send order notification email
     */
    async sendOrderNotification(email, order, action, language = 'en') {
        try {
            const template = await this.getEmailTemplate('order-notification', language);
            const subject = this.getLocalizedText(action, language, 'order');

            const emailData = {
                customerName: order.customer?.fullName || 'Valued Customer',
                orderNumber: order.orderNumber,
                orderValue: `Rs. ${order.finalAmount?.toLocaleString() || '0'}`,
                orderDate: order.createdAt?.toLocaleDateString() || new Date().toLocaleDateString(),
                action: action,
                orderItems: order.items?.map(item => ({
                    name: item.name || item.inventory?.name,
                    quantity: item.quantity,
                    unit: item.unit || 'units',
                    price: `Rs. ${item.totalPrice?.toLocaleString() || '0'}`
                })) || [],
                deliveryAddress: this.formatAddress(order.shippingAddress),
                estimatedDelivery: order.delivery?.estimatedDate ?
                    new Date(order.delivery.estimatedDate).toLocaleDateString() : 'To be confirmed',
                trackingNumber: order.delivery?.trackingNumber || 'Will be provided',
                supportEmail: process.env.SUPPORT_EMAIL || 'support@toollink.lk',
                supportPhone: process.env.SUPPORT_PHONE || '+94 11 234 5678',
                companyName: 'ToolLink Sri Lanka',
                companyAddress: 'No. 123, Industrial Zone, Colombo 10, Sri Lanka'
            };

            const htmlContent = this.renderTemplate(template, emailData);

            await this.sendEmail({
                to: email,
                subject,
                html: htmlContent,
                attachments: action === 'created' ? [await this.generateOrderPDF(order)] : []
            });

            logger.info(`Order notification sent to ${email} for order ${order.orderNumber}`);

        } catch (error) {
            logger.error(`Failed to send order notification: ${error.message}`);
            throw error;
        }
    }

    /**
     * Send delivery notification email
     */
    async sendDeliveryNotification(email, delivery, status, language = 'en') {
        try {
            const template = await this.getEmailTemplate('delivery-notification', language);
            const subject = this.getLocalizedText(status, language, 'delivery');

            const emailData = {
                customerName: delivery.customerName,
                orderNumber: delivery.orderId?.orderNumber || 'N/A',
                trackingNumber: delivery.trackingNumber || 'N/A',
                status: status,
                statusMessage: this.getDeliveryStatusMessage(status, language),
                deliveryAddress: delivery.deliveryAddress,
                scheduledDate: delivery.scheduledDate ?
                    new Date(delivery.scheduledDate).toLocaleDateString() : 'To be scheduled',
                driverName: delivery.driverId?.fullName || 'To be assigned',
                driverPhone: delivery.driverId?.phone || 'Will be provided',
                specialInstructions: delivery.specialInstructions || 'None',
                estimatedTime: delivery.estimatedDeliveryTime ?
                    new Date(delivery.estimatedDeliveryTime).toLocaleTimeString() : 'Will be updated'
            };

            const htmlContent = this.renderTemplate(template, emailData);

            await this.sendEmail({
                to: email,
                subject,
                html: htmlContent
            });

            logger.info(`Delivery notification sent to ${email} for delivery ${delivery._id}`);

        } catch (error) {
            logger.error(`Failed to send delivery notification: ${error.message}`);
            throw error;
        }
    }

    /**
     * Send low stock alert email
     */
    async sendLowStockAlert(email, inventory, language = 'en') {
        try {
            const template = await this.getEmailTemplate('low-stock-alert', language);
            const subject = this.getLocalizedText('low_stock', language, 'alert');

            const emailData = {
                itemName: inventory.name,
                sku: inventory.sku,
                currentStock: inventory.current_stock,
                minimumLevel: inventory.min_stock_level,
                unit: inventory.unit,
                category: inventory.category,
                location: inventory.location,
                stockPercentage: Math.round((inventory.current_stock / inventory.min_stock_level) * 100),
                supplierName: inventory.supplier_info?.name || 'Not specified',
                supplierContact: inventory.supplier_info?.phone || 'Not available',
                urgencyLevel: inventory.current_stock <= (inventory.min_stock_level * 0.5) ? 'Critical' : 'Low',
                recommendedAction: this.getRestockRecommendation(inventory, language)
            };

            const htmlContent = this.renderTemplate(template, emailData);

            await this.sendEmail({
                to: email,
                subject,
                html: htmlContent,
                priority: inventory.current_stock === 0 ? 'high' : 'normal'
            });

            logger.info(`Low stock alert sent to ${email} for ${inventory.name}`);

        } catch (error) {
            logger.error(`Failed to send low stock alert: ${error.message}`);
            throw error;
        }
    }

    /**
     * Send out of stock alert email
     */
    async sendOutOfStockAlert(email, inventory, language = 'en') {
        try {
            const template = await this.getEmailTemplate('out-of-stock-alert', language);
            const subject = this.getLocalizedText('out_of_stock', language, 'alert');

            const emailData = {
                itemName: inventory.name,
                sku: inventory.sku,
                category: inventory.category,
                location: inventory.location,
                lastStockDate: inventory.movements?.length > 0 ?
                    new Date(inventory.movements[inventory.movements.length - 1].timestamp).toLocaleDateString() : 'Unknown',
                supplierName: inventory.supplier_info?.name || 'Not specified',
                supplierContact: inventory.supplier_info?.phone || 'Not available',
                urgentActions: [
                    'Contact supplier immediately for emergency restock',
                    'Check alternative suppliers',
                    'Notify sales team to manage customer expectations',
                    'Review pending orders that may be affected'
                ]
            };

            const htmlContent = this.renderTemplate(template, emailData);

            await this.sendEmail({
                to: email,
                subject,
                html: htmlContent,
                priority: 'high'
            });

            logger.info(`Out of stock alert sent to ${email} for ${inventory.name}`);

        } catch (error) {
            logger.error(`Failed to send out of stock alert: ${error.message}`);
            throw error;
        }
    }

    /**
     * Send customer registration welcome email
     */
    async sendWelcomeEmail(email, customerData, language = 'en') {
        try {
            const template = await this.getEmailTemplate('welcome', language);
            const subject = this.getLocalizedText('welcome', language, 'customer');

            const emailData = {
                customerName: customerData.fullName,
                email: customerData.email,
                phone: customerData.phone,
                registrationDate: new Date().toLocaleDateString(),
                loginUrl: `${process.env.FRONTEND_URL}/login`,
                catalogUrl: `${process.env.FRONTEND_URL}/catalog`,
                supportEmail: process.env.SUPPORT_EMAIL || 'support@toollink.lk',
                supportPhone: process.env.SUPPORT_PHONE || '+94 11 234 5678',
                benefits: [
                    'Access to wholesale prices',
                    'Priority delivery scheduling',
                    'Dedicated customer support',
                    'Real-time order tracking',
                    'Credit facility options'
                ]
            };

            const htmlContent = this.renderTemplate(template, emailData);

            await this.sendEmail({
                to: email,
                subject,
                html: htmlContent
            });

            logger.info(`Welcome email sent to ${email}`);

        } catch (error) {
            logger.error(`Failed to send welcome email: ${error.message}`);
            throw error;
        }
    }

    /**
     * Send SMS notification (simplified for Sri Lankan carriers)
     */
    async sendSMS(phone, message, type = 'notification') {
        try {
            // Sri Lankan mobile number validation
            const cleanPhone = this.formatSriLankanPhone(phone);
            if (!cleanPhone) {
                throw new Error('Invalid Sri Lankan phone number');
            }

            // Integrate with Sri Lankan SMS providers (Dialog, Mobitel, Hutch)
            // This is a simplified implementation - in production, integrate with actual SMS gateway

            const smsData = {
                to: cleanPhone,
                message: this.truncateMessage(message, 160), // SMS character limit
                type,
                provider: this.detectProvider(cleanPhone),
                timestamp: new Date().toISOString()
            };

            // Log SMS for now (replace with actual SMS API call)
            logger.info(`SMS would be sent to ${cleanPhone}: ${message}`);

            // Mock SMS sending success
            return {
                success: true,
                messageId: `SMS_${Date.now()}`,
                provider: smsData.provider,
                cost: this.calculateSMSCost(message, smsData.provider)
            };

        } catch (error) {
            logger.error(`Failed to send SMS: ${error.message}`);
            throw error;
        }
    }

    /**
     * Send WhatsApp Business message
     */
    async sendWhatsAppMessage(phone, message, templateName = null) {
        try {
            const cleanPhone = this.formatSriLankanPhone(phone);
            if (!cleanPhone) {
                throw new Error('Invalid phone number for WhatsApp');
            }

            // Integrate with WhatsApp Business API
            // This is a simplified implementation

            const whatsappData = {
                to: cleanPhone,
                message,
                template: templateName,
                timestamp: new Date().toISOString()
            };

            // Log WhatsApp message for now
            logger.info(`WhatsApp message would be sent to ${cleanPhone}: ${message}`);

            return {
                success: true,
                messageId: `WA_${Date.now()}`,
                status: 'sent'
            };

        } catch (error) {
            logger.error(`Failed to send WhatsApp message: ${error.message}`);
            throw error;
        }
    }

    /**
     * Format Sri Lankan phone numbers
     */
    formatSriLankanPhone(phone) {
        if (!phone) return null;

        // Remove all non-digits
        const digits = phone.replace(/\D/g, '');

        // Sri Lankan mobile patterns
        if (digits.length === 10 && digits.startsWith('0')) {
            // Convert 0XXXXXXXXX to +94XXXXXXXXX
            return `+94${digits.substring(1)}`;
        } else if (digits.length === 9) {
            // Add +94 prefix
            return `+94${digits}`;
        } else if (digits.length === 12 && digits.startsWith('94')) {
            // Already has 94 prefix
            return `+${digits}`;
        }

        return null; // Invalid format
    }

    /**
     * Detect Sri Lankan mobile provider
     */
    detectProvider(phone) {
        const digits = phone.replace(/\D/g, '');
        const prefix = digits.substring(digits.length - 9, digits.length - 7);

        // Sri Lankan mobile prefixes
        if (['77', '76', '75'].includes(prefix)) return 'Dialog';
        if (['71', '70'].includes(prefix)) return 'Mobitel';
        if (['78', '72'].includes(prefix)) return 'Hutch';
        if (['74'].includes(prefix)) return 'Airtel';

        return 'Unknown';
    }

    /**
     * Calculate SMS cost based on provider
     */
    calculateSMSCost(message, provider) {
        const length = message.length;
        const segments = Math.ceil(length / 160);

        // Sri Lankan SMS rates (LKR)
        const rates = {
            'Dialog': 2.50,
            'Mobitel': 2.75,
            'Hutch': 2.50,
            'Airtel': 2.25
        };

        return (rates[provider] || 2.50) * segments;
    }

    /**
     * Get email template
     */
    async getEmailTemplate(templateName, language = 'en') {
        try {
            const templatePath = path.join(
                process.cwd(),
                'src',
                'templates',
                'email',
                language,
                `${templateName}.html`
            );

            try {
                return await fs.readFile(templatePath, 'utf8');
            } catch (error) {
                // Fallback to English if language template not found
                const fallbackPath = path.join(
                    process.cwd(),
                    'src',
                    'templates',
                    'email',
                    'en',
                    `${templateName}.html`
                );
                return await fs.readFile(fallbackPath, 'utf8');
            }
        } catch (error) {
            logger.error(`Failed to load email template ${templateName}:`, error);
            return this.getDefaultTemplate(templateName);
        }
    }

    /**
     * Get localized text
     */
    getLocalizedText(key, language, category = 'general') {
        const translations = {
            en: {
                order: {
                    created: 'Order Confirmation - ToolLink',
                    updated: 'Order Updated - ToolLink',
                    cancelled: 'Order Cancelled - ToolLink',
                    delivered: 'Order Delivered - ToolLink'
                },
                delivery: {
                    pending: 'Delivery Scheduled - ToolLink',
                    assigned: 'Driver Assigned - ToolLink',
                    out_from_warehouse: 'Out for Delivery - ToolLink',
                    on_the_way: 'Delivery in Progress - ToolLink',
                    delivered: 'Delivery Completed - ToolLink',
                    failed: 'Delivery Failed - ToolLink'
                },
                alert: {
                    low_stock: '⚠️ Low Stock Alert - ToolLink',
                    out_of_stock: '🚨 OUT OF STOCK Alert - ToolLink'
                },
                customer: {
                    welcome: 'Welcome to ToolLink Sri Lanka!'
                }
            },
            si: {
                order: {
                    created: 'ඇණවුම් තහවුරුකිරීම - ටූල්ලින්ක්',
                    updated: 'ඇණවුම් යාවත්කාලීනය - ටූල්ලින්ක්',
                    cancelled: 'ඇණවුම් අවලංගුකිරීම - ටූල්ලින්ක්',
                    delivered: 'ඇණවුම් භාරදෙන ලදී - ටූල්ලින්ක්'
                },
                customer: {
                    welcome: 'ටූල්ලින්ක් ශ්‍රී ලංකාවට ආපසු සාදරයෙන් පිළිගනිමු!'
                }
            },
            ta: {
                order: {
                    created: 'ஆர்டர் உறுதிப்படுத்தல் - டூல்லிங்க்',
                    updated: 'ஆர்டர் புதுப்பிக்கப்பட்டது - டூல்லிங்க்',
                    cancelled: 'ஆர்டர் ரத்து செய்யப்பட்டது - டூல்லிங்க்',
                    delivered: 'ஆர்டர் வழங்கப்பட்டது - டூல்லிங்க்'
                },
                customer: {
                    welcome: 'டூல்லிங்க் இலங்கைக்கு வரவேற்கிறோம்!'
                }
            }
        };

        const langTexts = translations[language] || translations.en;
        const categoryTexts = langTexts[category] || langTexts.general || {};
        return categoryTexts[key] || translations.en[category]?.[key] || key;
    }

    /**
     * Get delivery status message
     */
    getDeliveryStatusMessage(status, language = 'en') {
        const messages = {
            en: {
                pending: 'Your delivery has been scheduled and will be processed soon.',
                assigned: 'A driver has been assigned to your delivery.',
                out_from_warehouse: 'Your order has left our warehouse and is on the way.',
                on_the_way: 'Your delivery is currently in progress.',
                delivered: 'Your order has been successfully delivered.',
                failed: 'We were unable to complete your delivery. We will contact you soon.'
            },
            si: {
                pending: 'ඔබගේ භාරදෙන කටයුතු සූදානම් කර අගාමීව ක්‍රියාත්මක කරනු ලැබේ.',
                delivered: 'ඔබගේ ඇණවුම සාර්ථකව භාරදෙන ලදී.'
            },
            ta: {
                pending: 'உங்கள் டெலிவரி திட்டமிடப்பட்டு விரைவில் செயலாக்கப்படும்.',
                delivered: 'உங்கள் ஆர்டர் வெற்றிகரமாக வழங்கப்பட்டது.'
            }
        };

        const langMessages = messages[language] || messages.en;
        return langMessages[status] || messages.en[status] || 'Status updated.';
    }

    /**
     * Get restock recommendation
     */
    getRestockRecommendation(inventory, language = 'en') {
        const urgency = inventory.current_stock <= (inventory.min_stock_level * 0.5) ? 'critical' : 'normal';

        const recommendations = {
            en: {
                critical: 'IMMEDIATE ACTION REQUIRED: Contact supplier urgently and arrange emergency delivery.',
                normal: 'Please review stock levels and consider placing a reorder soon.'
            },
            si: {
                critical: 'ක්ෂණික ක්‍රියාමාර්ගය අවශ්‍යයි: සැපයුම්කරු සමඟ වහාම සම්බන්ධ වී හදිසි සැපයුම් කටයුතු සලසන්න.',
                normal: 'කරුණාකර තොග මට්ටම් සමාලෝචනය කර අගාමීව නැවත ඇණවුම් කිරීම සලකා බලන්න.'
            }
        };

        const langRecommendations = recommendations[language] || recommendations.en;
        return langRecommendations[urgency];
    }

    /**
     * Render email template with data
     */
    renderTemplate(template, data) {
        let rendered = template;

        // Simple template rendering (replace {{key}} with values)
        Object.keys(data).forEach(key => {
            const placeholder = new RegExp(`{{${key}}}`, 'g');
            const value = Array.isArray(data[key]) ?
                this.renderArray(data[key]) :
                (data[key] || '');
            rendered = rendered.replace(placeholder, value);
        });

        return rendered;
    }

    /**
     * Render array data for templates
     */
    renderArray(array) {
        if (!Array.isArray(array)) return '';

        return array.map(item => {
            if (typeof item === 'object') {
                return Object.values(item).join(' - ');
            }
            return item.toString();
        }).join('<br>');
    }

    /**
     * Format address for display
     */
    formatAddress(address) {
        if (!address) return 'Not provided';

        if (typeof address === 'string') return address;

        const parts = [
            address.street,
            address.city,
            address.state,
            address.zipCode,
            address.country
        ].filter(Boolean);

        return parts.join(', ');
    }

    /**
     * Truncate message for SMS
     */
    truncateMessage(message, maxLength = 160) {
        if (message.length <= maxLength) return message;
        return message.substring(0, maxLength - 3) + '...';
    }

    /**
     * Generate order PDF attachment
     */
    async generateOrderPDF(order) {
        // Simplified PDF generation - in production, use proper PDF library
        return {
            filename: `order-${order.orderNumber}.pdf`,
            content: Buffer.from(`Order: ${order.orderNumber}\nTotal: Rs. ${order.finalAmount}`),
            contentType: 'application/pdf'
        };
    }

    /**
     * Get default template
     */
    getDefaultTemplate(templateName) {
        const templates = {
            'order-notification': `
                <h2>Order {{action}} - {{orderNumber}}</h2>
                <p>Dear {{customerName}},</p>
                <p>Your order has been {{action}}.</p>
                <p>Order Value: {{orderValue}}</p>
                <p>Delivery Address: {{deliveryAddress}}</p>
                <p>Thank you for choosing ToolLink!</p>
            `,
            'delivery-notification': `
                <h2>Delivery Update - {{trackingNumber}}</h2>
                <p>Dear {{customerName}},</p>
                <p>{{statusMessage}}</p>
                <p>Order: {{orderNumber}}</p>
                <p>Status: {{status}}</p>
            `,
            'low-stock-alert': `
                <h2>Low Stock Alert</h2>
                <p>{{itemName}} is running low:</p>
                <p>Current: {{currentStock}} {{unit}}</p>
                <p>Minimum: {{minimumLevel}} {{unit}}</p>
                <p>{{recommendedAction}}</p>
            `
        };

        return templates[templateName] || '<p>{{message}}</p>';
    }

    /**
     * Send email using configured transporter
     */
    async sendEmail(options) {
        try {
            const mailOptions = {
                from: `"ToolLink Sri Lanka" <${process.env.SMTP_USER}>`,
                to: options.to,
                subject: options.subject,
                html: options.html,
                attachments: options.attachments || [],
                priority: options.priority || 'normal'
            };

            const result = await this.transporter.sendMail(mailOptions);
            logger.info(`Email sent successfully to ${options.to}`);
            return result;

        } catch (error) {
            logger.error(`Email sending failed: ${error.message}`);
            throw error;
        }
    }
}

// Export singleton instance
export default new EmailService();
