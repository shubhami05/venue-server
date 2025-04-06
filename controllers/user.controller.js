const { dbConnect } = require("../config/db.config");
const { UserModel } = require("../models/user.model");
const { uploadToCloudinary } = require("../config/cloudinary.config");
const { OwnerApplicationModel } = require("../models/ownerForm.model");
const { InquiryModel } = require("../models/inquiry.model");
const { ContactModel } = require("../models/contact.model");

async function RegisterOwner(req, res) {
    try {
        const UserSession = await req.user;
        if (!UserSession) {
            return res.status(404).json({
                success: false,
                message: 'User session not found'
            });
        }

        await dbConnect();
        const UserData = await UserModel.findById(UserSession._id);

        if (!UserData) {
            return res.status(404).json({
                success: false,
                message: "User not found!"
            });
        }

        // Check if user has already submitted an application
        const existingApplication = await OwnerApplicationModel.findOne({ userId: UserData._id });
        if (existingApplication) {
            return res.status(400).json({
                success: false,
                message: "You have already submitted a registration request"
            });
        }

        // Upload Aadhar card to Cloudinary
        if (!req.file) {
            return res.status(400).json({
                success: false,
                message: "Please upload your Aadhar card"
            });
        }

        const [aadharCardUrl] = await uploadToCloudinary([req.file]);

        // Create owner application
        const response = new OwnerApplicationModel({
            userId: UserData._id,
            adharCard: aadharCardUrl,
            status: 'pending'
        });
        await response.save();

        // Clean up temporary file
        if (req.cleanupFiles) {
            await req.cleanupFiles();
        }

        return res.status(200).json({
            success: true,
            message: "Owner Application Submitted Successfully!"
        });

    } catch (error) {
        console.error('Owner registration error:', error);
        // Clean up temporary file in case of error
        if (req.cleanupFiles) {
            await req.cleanupFiles();
        }
        return res.status(500).json({
            success: false,
            message: "Something went wrong!",
            error: error.message
        });
    }
}

async function sendInquiry(req, res) {
    try {
        // Verify user session
        const UserSession = await req.user;
        if (!UserSession) {
            return res.status(401).json({
                success: false,
                message: 'Authentication required. Please login.'
            });
        }

        await dbConnect();

        // Extract inquiry details from request body
        const { venueId, eventType, date, message } = req.body;

        // Validate required fields
        if (!venueId) {
            return res.status(400).json({
                success: false,
                message: 'Venue ID is required'
            });
        }

        if (!eventType) {
            return res.status(400).json({
                success: false,
                message: 'Event type is required'
            });
        }

        if (!date) {
            return res.status(400).json({
                success: false,
                message: 'Event date is required'
            });
        }

        if (!message) {
            return res.status(400).json({
                success: false,
                message: 'Inquiry message is required'
            });
        }

        // Create new inquiry
        const newInquiry = new InquiryModel({
            userId: UserSession._id,
            venueId,
            eventType,
            date,
            message
        });

        // Save the inquiry
        await newInquiry.save();

        return res.status(200).json({
            success: true,
            message: 'Inquiry sent successfully, Venue Owner will contact you soon!'
        });
    } catch (error) {
        console.error('Send inquiry error:', error);
        return res.status(500).json({
            success: false,
            message: 'Failed to send inquiry',
            error: error.message
        });
    }
}

async function submitContactForm(req, res) {
    try {
        // Get user if authenticated (optional)
        let userId = null;
        if (req.user) {
            userId = req.user._id;
        }

        await dbConnect();

        // Extract contact details from request body
        const { fullname, email, mobile, message } = req.body;

        // Validate required fields
        if (!fullname) {
            return res.status(400).json({
                success: false,
                message: 'Full name is required'
            });
        }

        if (!email) {
            return res.status(400).json({
                success: false,
                message: 'Email is required'
            });
        }

        if (!mobile) {
            return res.status(400).json({
                success: false,
                message: 'Mobile number is required'
            });
        }

        if (!message) {
            return res.status(400).json({
                success: false,
                message: 'Message is required'
            });
        }

        // Create new contact entry
        const newContact = new ContactModel({
            userId: userId, // Could be null for non-authenticated users
            fullname,
            email,
            mobile,
            message
        });

        // Save the contact submission
        await newContact.save();

        return res.status(200).json({
            success: true,
            message: 'Thank you for contacting us. We will get back to you shortly!'
        });
    } catch (error) {
        console.error('Contact form submission error:', error);
        return res.status(500).json({
            success: false,
            message: 'Failed to submit contact form',
            error: error.message
        });
    }
}

module.exports = { RegisterOwner, sendInquiry, submitContactForm };