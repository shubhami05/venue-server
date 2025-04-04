const nodemailer = require('nodemailer');

// Validate email configuration
const validateEmailConfig = () => {
    if (!process.env.EMAIL_USER || !process.env.EMAIL_PASSWORD) {
        throw new Error('Email configuration is missing. Please check your environment variables.');
    }
};

// Create a transporter using SMTP
const createTransporter = () => {
    validateEmailConfig();
    
    return nodemailer.createTransport({
        service: 'gmail',
        auth: {
            user: process.env.EMAIL_USER,
            pass: process.env.EMAIL_PASSWORD
        }
    });
};

// Function to send email
const sendEmail = async ({ to, subject, text, html }) => {
    try {
        if (!to || !subject) {
            throw new Error('Recipient email and subject are required');
        }

        const transporter = createTransporter();
        
        const mailOptions = {
            from: `"VenueServ" <${process.env.EMAIL_USER}>`,
            to,
            subject,
            text: text || html?.replace(/<[^>]*>/g, ''), // Fallback to plain text if HTML is provided
            html: html || text
        };

        const info = await transporter.sendMail(mailOptions);
        console.log('Email sent successfully:', info.messageId);
        return true;
    } catch (error) {
        console.error('Error sending email:', error);
        // Log detailed error information
        if (error.code === 'ECONNREFUSED') {
            console.error('Connection refused. Please check your email service configuration.');
        } else if (error.code === 'EAUTH') {
            console.error('Authentication failed. Please check your email credentials.');
        }
        throw error;
    }
};

module.exports = { sendEmail }; 