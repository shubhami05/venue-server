const { UserModel } = require("../models/user.model");
const { VenueModel } = require("../models/venue.model");
const { dbConnect } = require("../config/db.config");
const { OwnerApplicationModel } = require("../models/ownerForm.model");
const { sendEmail } = require("../utils/email");
const { InquiryModel } = require("../models/inquiry.model");
const { BookingModel } = require("../models/booking.model");
const { ContactModel } = require("../models/contact.model");
const { ReviewModel } = require("../models/review.model");

// Fetch all users
const getAllUsers = async (req, res) => {
    try {
        await dbConnect();
        
        // Get all users with selected fields
        const users = await UserModel.find()
            .select('fullname email role createdAt mobile')
            .sort({ createdAt: -1 });

        // Format the response
        const formattedUsers = users.map(user => ({
            _id: user._id,
            name: user.fullname,
            email: user.email,
            role: user.role,
            phone: user.mobile || 'N/A',
            joinedDate: user.createdAt.toISOString().split('T')[0]
        }));

        return res.status(200).json({
            success: true,
            users: formattedUsers
        });
    } catch (error) {
        console.error("Error fetching users:", error);
        return res.status(500).json({
            success: false,
            message: "Failed to fetch users",
            error: error.message
        });
    }
};

// Fetch all owners
const getAllOwners = async (req, res) => {
    try {
        await dbConnect();
        
        // Get all owners
        const owners = await UserModel.find({ role: 'owner' })
            .select('fullname email mobile role createdAt')
            .sort({ createdAt: -1 });

        // Get venue counts for each owner
        const ownersWithVenueCount = await Promise.all(owners.map(async (owner) => {
            const venueCount = await VenueModel.countDocuments({ ownerId: owner._id });
            return {
                ...owner.toObject(),
                venueCount,
                joinedDate: owner.createdAt.toISOString().split('T')[0]
            };
        }));

        return res.status(200).json({
            success: true,
            owners: ownersWithVenueCount
        });
    } catch (error) {
        console.error("Error fetching owners:", error);
        return res.status(500).json({
            success: false,
            message: "Failed to fetch owners",
            error: error.message
        });
    }
};

// Change Venue Status
const changeVenueStatus = async (req, res) => {
    try {
        const { venueId } = req.params;
        const { status } = req.body;

        // Validate status
        if (!['accepted', 'rejected', 'pending'].includes(status)) {
            return res.status(400).json({
                success: false,
                message: "Invalid status. Status must be one of: accepted, rejected, pending"
            });
        }

        await dbConnect();
        
        // First get the venue with ownerId
        const venue = await VenueModel.findById(venueId);
        
        if (!venue) {
            return res.status(404).json({
                success: false,
                message: "Venue not found"
            });
        }

        // Get owner details from UserModel
        const owner = await UserModel.findById(venue.ownerId);
        if (!owner) {
            return res.status(404).json({
                success: false,
                message: "Owner not found"
            });
        }

        // Update venue status
        venue.status = status;
        await venue.save();

        // Prepare email content based on status
        let emailSubject, emailContent;
        if (status === 'accepted') {
            emailSubject = 'Your Venue Has Been Accepted!';
            emailContent = `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
                    <h2 style="color: #2ecc71; margin-bottom: 20px;">🎉 Congratulations! Your Venue Has Been Accepted!</h2>
                    
                    <p>Dear <strong>${owner.fullname}</strong>,</p>
                    
                    <p>We are pleased to inform you that your venue has been <span style="background-color: #e8f5e9; padding: 2px 5px; border-radius: 3px;">accepted</span> and is now live on our platform.</p>
                    
                    <div style="background-color: #f8f9fa; padding: 15px; border-radius: 5px; margin: 20px 0;">
                        <h3 style="color: #2c3e50; margin-top: 0;">Venue Details:</h3>
                        <ul style="list-style: none; padding: 0;">
                            <li style="margin: 10px 0;"><strong>Name:</strong> ${venue.name}</li>
                            <li style="margin: 10px 0;"><strong>Location:</strong> ${venue.address}, ${venue.city}</li>
                            <li style="margin: 10px 0;"><strong>Type:</strong> ${venue.type}</li>
                        </ul>
                    </div>
                    
                    <p>Your venue is now <span style="color: #2ecc71; font-weight: bold;">visible to users</span> and can receive bookings. You can manage your venue through your dashboard.</p>
                    
                    <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #eee;">
                        <p style="color: #7f8c8d;">Best regards,<br>VenueServ Team</p>
                    </div>
                </div>
            `;
        } else if (status === 'rejected') {
            emailSubject = 'Venue Application Status Update';
            emailContent = `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
                    <h2 style="color: #e74c3c; margin-bottom: 20px;">Venue Application Status Update</h2>
                    
                    <p>Dear <strong>${owner.fullname}</strong>,</p>
                    
                    <p>We regret to inform you that your venue has been <span style="background-color: #fde8e8; padding: 2px 5px; border-radius: 3px;">not approved</span> at this time.</p>
                    
                    <div style="background-color: #f8f9fa; padding: 15px; border-radius: 5px; margin: 20px 0;">
                        <h3 style="color: #2c3e50; margin-top: 0;">Venue Details:</h3>
                        <ul style="list-style: none; padding: 0;">
                            <li style="margin: 10px 0;"><strong>Name:</strong> ${venue.name}</li>
                            <li style="margin: 10px 0;"><strong>Location:</strong> ${venue.address}, ${venue.city}</li>
                            <li style="margin: 10px 0;"><strong>Type:</strong> ${venue.type}</li>
                        </ul>
                    </div>
                    
                    <p>If you have any questions about this decision, please <span style="color: #3498db; font-weight: bold;">contact our support team</span>.</p>
                    
                    <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #eee;">
                        <p style="color: #7f8c8d;">Best regards,<br>VenueServ Team</p>
                    </div>
                </div>
            `;
        }

        // Send email notification
        try {
            await sendEmail({
                to: owner.email,
                subject: emailSubject,
                html: emailContent
            });
        } catch (emailError) {
            console.error('Error sending email notification:', emailError);
            // Continue with the response even if email fails
        }

        return res.status(200).json({
            success: true,
            message: `Venue status updated to ${status} successfully`,
            venue
        });
    } catch (error) {
        console.error("Error changing venue status:", error);
        return res.status(500).json({
            success: false,
            message: "Error changing venue status",
            error: error.message
        });
    }
};

// Fetch pending venues
const getPendingVenues = async (req, res) => {
    try {
        await dbConnect();
        
        // Get all pending venues with owner details
        const pendingVenues = await VenueModel.find({ status: 'pending' })
            .populate('ownerId', 'fullname email mobile')
            .sort({ createdAt: -1 });

        // Format the response
        const formattedVenues = pendingVenues.map(venue => ({
            _id: venue._id,
            name: venue.name,
            type: venue.type,
            address: venue.address,
            city: venue.city,
            owner: {
                name: venue.ownerId.fullname,
                email: venue.ownerId.email,
                phone: venue.ownerId.mobile || 'N/A'
            },
            photos: venue.photos,
            bookingPay: venue.bookingPay,
            rooms: venue.rooms ,
            halls: venue.halls,
            submittedAt: venue.createdAt.toISOString().split('T')[0],
            status: venue.status
        }));

        return res.status(200).json({
            success: true,
            message: "Pending venues fetched successfully",
            venues: formattedVenues
        });
    } catch (error) {
        console.error("Error fetching pending venues:", error);
        return res.status(500).json({
            success: false,
            message: "Failed to fetch pending venues",
            error: error.message
        });
    }
};

const getPendingOwnerApplications = async (req, res) => {
    try {
        await dbConnect();
        
        // Get pending applications with user details using aggregation pipeline
        const pendingApplications = await OwnerApplicationModel.aggregate([
            {
                $match: { status: 'pending' }
            },
            {
                $lookup: {
                    from: 'users',
                    localField: 'userId',
                    foreignField: '_id',
                    as: 'userDetails'
                }
            },
            {
                $unwind: '$userDetails'
            },
            {
                $project: {
                    _id: 1,
                    name: '$userDetails.fullname',
                    email: '$userDetails.email',
                    phone: { $ifNull: ['$userDetails.mobile', 'N/A'] },
                    adharCard: 1,
                    submittedAt: {
                        $dateToString: {
                            format: '%Y-%m-%d',
                            date: '$createdAt'
                        }
                    },
                    status: 1
                }
            },
            {
                $sort: { submittedAt: -1 }
            }
        ]);

        if(pendingApplications.length === 0){
            return res.status(200).json({
                success: true,
                message: "No pending owner applications found",
                applications: []
            });
        }
        return res.status(200).json({
            success: true,
            message: "Pending owner applications fetched successfully",
            applications: pendingApplications
        });
    } catch (error) {
        console.error("Error fetching pending owner applications:", error);
        return res.status(500).json({
            success: false,
            message: "Failed to fetch pending owner applications",
            error: error.message
        });
    }
};

const changeOwnerStatus = async (req, res) => {
    try {
        const { appId } = req.params;
        const { status } = req.body;

        // Validate status
        if (!['accepted', 'rejected', 'pending'].includes(status)) {
            
            return res.status(400).json({
                success: false,
                message: "Invalid status. Status must be one of: accepted, rejected, pending"
            });
        }

        await dbConnect();
        
        // Get the owner application with user details
        const owner = await OwnerApplicationModel.findById(appId)
            .populate('userId', 'fullname email mobile');

        if (!owner) {
            return res.status(404).json({
                success: false,
                message: "Owner application not found"
            });
        }

        // Update status
        owner.status = status;
        await owner.save();

        // If accepted, update user role to owner
        if (status === 'accepted') {
            await UserModel.findByIdAndUpdate(owner.userId, { role: 'owner' });
        }
        if (status === 'rejected') {
            await OwnerApplicationModel.findByIdAndDelete(appId);
        }

        // Prepare email content based on status
        let emailSubject, emailContent;
        if (status === 'accepted') {
            emailSubject = 'Your Owner Application Has Been Accepted!';
            emailContent = `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
                    <h2 style="color: #2ecc71; margin-bottom: 20px;">🎉 Congratulations! Your Owner Application Has Been Accepted!</h2>
                    
                    <p>Dear <strong>${owner.userId.fullname}</strong>,</p>
                    
                    <p>We are pleased to inform you that your owner application has been <span style="background-color: #e8f5e9; padding: 2px 5px; border-radius: 3px;">accepted</span> and you are now an official venue owner on our platform.</p>
                    
                    <div style="background-color: #f8f9fa; padding: 15px; border-radius: 5px; margin: 20px 0;">
                        <h3 style="color: #2c3e50; margin-top: 0;">Account Details:</h3>
                        <ul style="list-style: none; padding: 0;">
                            <li style="margin: 10px 0;"><strong>Name:</strong> ${owner.userId.fullname}</li>
                            <li style="margin: 10px 0;"><strong>Email:</strong> ${owner.userId.email}</li>
                            <li style="margin: 10px 0;"><strong>Phone:</strong> ${owner.userId.mobile || 'N/A'}</li>
                        </ul>
                    </div>
                    
                    <p>You can now <span style="color: #2ecc71; font-weight: bold;">add and manage your venues</span> through your dashboard. We look forward to having you as part of our venue owner community!</p>
                    
                    <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #eee;">
                        <p style="color: #7f8c8d;">Best regards,<br>VenueServ Team</p>
                    </div>
                </div>
            `;
        } else if (status === 'rejected') {
            emailSubject = 'Owner Application Status Update';
            emailContent = `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
                    <h2 style="color: #e74c3c; margin-bottom: 20px;">Owner Application Status Update</h2>
                    
                    <p>Dear <strong>${owner.userId.fullname}</strong>,</p>
                    
                    <p>We regret to inform you that your owner application has been <span style="background-color: #fde8e8; padding: 2px 5px; border-radius: 3px;">not approved</span> at this time.</p>
                    
                    <div style="background-color: #f8f9fa; padding: 15px; border-radius: 5px; margin: 20px 0;">
                        <h3 style="color: #2c3e50; margin-top: 0;">Application Details:</h3>
                        <ul style="list-style: none; padding: 0;">
                            <li style="margin: 10px 0;"><strong>Name:</strong> ${owner.userId.fullname}</li>
                            <li style="margin: 10px 0;"><strong>Email:</strong> ${owner.userId.email}</li>
                            <li style="margin: 10px 0;"><strong>Phone:</strong> ${owner.userId.mobile || 'N/A'}</li>
                        </ul>
                    </div>
                    
                    <p>If you have any questions about this decision or would like to submit a new application, please <span style="color: #3498db; font-weight: bold;">contact our support team</span>.</p>
                    
                    <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #eee;">
                        <p style="color: #7f8c8d;">Best regards,<br>VenueServ Team</p>
                    </div>
                </div>
            `;
        }

        // Send email notification
        try {
            await sendEmail({
                to: owner.userId.email,
                subject: emailSubject,
                html: emailContent
            });
        } catch (emailError) {
            console.error('Error sending email notification:', emailError);
            // Continue with the response even if email fails
        }

        return res.status(200).json({
            success: true,
            message: "Owner application status updated successfully",
            owner
        });
    } catch (error) {
        console.error("Error changing owner status:", error);
        return res.status(500).json({
            success: false,
            message: "Failed to change owner status",
            error: error.message
        });
    }
};

// Fetch all inquiries
const getAllInquiries = async (req, res) => {
    try {
        await dbConnect();
        
        // Get all inquiries with user and venue details
        const inquiries = await InquiryModel.find()
            .populate('userId', 'fullname email mobile')
            .populate('venueId', 'name city address')
            .sort({ createdAt: -1 });

        // Format the response
        const formattedInquiries = inquiries.map(inquiry => ({
            _id: inquiry._id,
            eventType: inquiry.eventType,
            date: inquiry.date,
            message: inquiry.message,
            createdAt: inquiry.createdAt,
            user: {
                name: inquiry.userId.fullname,
                email: inquiry.userId.email,
                phone: inquiry.userId.mobile || 'N/A'
            },
            venue: {
                name: inquiry.venueId.name,
                city: inquiry.venueId.city,
                address: inquiry.venueId.address
            }
        }));

        return res.status(200).json({
            success: true,
            message: "Inquiries fetched successfully",
            inquiries: formattedInquiries
        });
    } catch (error) {
        console.error("Error fetching inquiries:", error);
        return res.status(500).json({
            success: false,
            message: "Failed to fetch inquiries",
            error: error.message
        });
    }
};

// Dashboard statistics
const getDashboardStats = async (req, res) => {
    try {
        await dbConnect();

        // Fetch counts
        const totalUsers = await UserModel.countDocuments();
        const totalOwners = await UserModel.countDocuments({ role: 'owner' });
        const totalVenues = await VenueModel.countDocuments();
        const totalBookings = await BookingModel.countDocuments();
        
        // Venue status distribution
        const activeVenues = await VenueModel.countDocuments({ status: 'accepted' });
        const pendingVenues = await VenueModel.countDocuments({ status: 'pending' });
        const blockedVenues = await VenueModel.countDocuments({ status: 'rejected' });
        
        // Fetch pending owners count
        const pendingOwners = await OwnerApplicationModel.countDocuments({ status: 'pending' });
        
        // Fetch total reviews count
        const totalReviews = await ReviewModel.countDocuments();
        
        // Fetch total inquiries count
        const totalInquiries = await InquiryModel.countDocuments();
        
        // Fetch recent bookings
        const recentBookings = await BookingModel.find()
            .sort({ createdAt: -1 })
            .limit(5)
            .populate('userId', 'fullname')
            .populate('venueId', 'name');

        // Fetch recent reviews
        const recentReviews = await ReviewModel.find()
            .sort({ createdAt: -1 })
            .limit(5)
            .populate('userId', 'fullname')
            .populate('venueId', 'name');

        // Format recent reviews
        const formattedRecentReviews = recentReviews.map(review => ({
            _id: review._id,
            venueName: review.venueId.name,
            userName: review.userId.fullname,
            rating: review.rating,
            message: review.message,
            createdAt: review.createdAt
        }));

        // Format recent bookings
        const formattedRecentBookings = recentBookings.map(booking => ({
            _id: booking._id,
            venueName: booking.venueId.name,
            userName: booking.userId.fullname,
            date: booking.eventDate,
            amount: booking.amount,
            paymentStatus: booking.paymentStatus || 'pending'
        }));
        
        // Calculate total revenue from completed bookings only
        const completedBookings = await BookingModel.find({ paymentStatus: 'completed' });
        const totalRevenue = completedBookings.reduce((sum, booking) => sum + (booking.amount || 0), 0);
        
        // Generate revenue trend (last 6 months)
        const revenueTrend = await generateRevenueTrend();
        
        // Calculate payment statistics
        const paymentStats = {
            totalPayments: await BookingModel.countDocuments({ paymentStatus: { $in: ['completed', 'pending', 'failed'] } }),
            successfulPayments: await BookingModel.countDocuments({ paymentStatus: 'completed' }),
            failedPayments: await BookingModel.countDocuments({ paymentStatus: 'failed' }),
            averagePaymentAmount: totalBookings > 0 ? totalRevenue / totalBookings : 0
        };

        return res.status(200).json({
            success: true,
            totalUsers,
            totalOwners,
            totalVenues,
            totalBookings,
            totalRevenue,
            activeVenues,
            pendingVenues,
            blockedVenues,
            pendingOwners,
            totalReviews,
            totalInquiries,
            recentBookings: formattedRecentBookings,
            recentReviews: formattedRecentReviews,
            revenueTrend,
            paymentStats
        });
    } catch (error) {
        console.error("Error fetching dashboard stats:", error);
        return res.status(500).json({
            success: false,
            message: "Failed to fetch dashboard statistics",
            error: error.message
        });
    }
};

// Helper function to generate revenue trend for the last 6 months
const generateRevenueTrend = async () => {
    const now = new Date();
    const months = [];
    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    
    // Generate last 6 months
    for (let i = 5; i >= 0; i--) {
        const month = new Date(now.getFullYear(), now.getMonth() - i, 1);
        months.push({
            month: monthNames[month.getMonth()],
            year: month.getFullYear(),
            startDate: new Date(month.getFullYear(), month.getMonth(), 1),
            endDate: new Date(month.getFullYear(), month.getMonth() + 1, 0)
        });
    }
    
    // Calculate revenue for each month (only completed bookings)
    const revenueTrend = [];
    
    for (const monthData of months) {
        const bookings = await BookingModel.find({
            paymentStatus: 'completed',
            createdAt: {
                $gte: monthData.startDate,
                $lte: monthData.endDate
            }
        });
        
        const amount = bookings.reduce((sum, booking) => sum + (booking.amount || 0), 0);
        
        revenueTrend.push({
            month: monthData.month,
            amount
        });
    }
    
    return revenueTrend;
};

// Fetch all contacts
const getAllContacts = async (req, res) => {
    try {
        await dbConnect();
        
        // Get all contacts with user details
        const contacts = await ContactModel.find()
            .populate('userId', 'fullname email mobile')
            .sort({ createdAt: -1 });

        // Format the response
        const formattedContacts = contacts.map(contact => ({
            _id: contact._id,
            fullname: contact.fullname,
            email: contact.email,
            mobile: contact.mobile,
            message: contact.message,
            createdAt: contact.createdAt,
            user: contact.userId ? {
                id: contact.userId._id,
                name: contact.userId.fullname,
                email: contact.userId.email,
                phone: contact.userId.mobile || 'N/A'
            } : null
        }));

        return res.status(200).json({
            success: true,
            message: "Contacts fetched successfully",
            contacts: formattedContacts
        });
    } catch (error) {
        console.error("Error fetching contacts:", error);
        return res.status(500).json({
            success: false,
            message: "Failed to fetch contacts",
            error: error.message
        });
    }
};

// Reply to a contact
const replyToContact = async (req, res) => {
    try {
        const { contactId } = req.params;
        const { subject, message } = req.body;
        
        if (!contactId) {
            return res.status(400).json({
                success: false,
                message: "Contact ID is required"
            });
        }
        
        if (!subject || !message) {
            return res.status(400).json({
                success: false,
                message: "Subject and message are required"
            });
        }
        
        await dbConnect();
        
        // Find the contact
        const contact = await ContactModel.findById(contactId);
        
        if (!contact) {
            return res.status(404).json({
                success: false,
                message: "Contact not found"
            });
        }
        
        // Format the email body
        const emailBody = `Dear ${contact.fullname},

Thank you for contacting us. Here's our response to your inquiry:

${message}

If you have any further questions, please don't hesitate to contact us again.

Best regards,
VenueServ Team`;

        // Return email data for client to open mail app
        return res.status(200).json({
            success: true,
            message: "Reply data prepared",
            emailData: {
                to: contact.email,
                subject: subject,
                body: emailBody
            }
        });
    } catch (error) {
        console.error("Error preparing reply:", error);
        return res.status(500).json({
            success: false,
            message: "Failed to prepare reply",
            error: error.message
        });
    }
};

// Delete a contact
const deleteContact = async (req, res) => {
    try {
        const { contactId } = req.params;
        
        if (!contactId) {
            return res.status(400).json({
                success: false,
                message: "Contact ID is required"
            });
        }
        
        await dbConnect();
        
        // Find and delete the contact
        const contact = await ContactModel.findByIdAndDelete(contactId);
        
        if (!contact) {
            return res.status(404).json({
                success: false,
                message: "Contact not found"
            });
        }
        
        return res.status(200).json({
            success: true,
            message: "Contact deleted successfully"
        });
    } catch (error) {
        console.error("Error deleting contact:", error);
        return res.status(500).json({
            success: false,
            message: "Failed to delete contact",
            error: error.message
        });
    }
};

module.exports = {
    getAllUsers,
    getAllOwners,
    getPendingVenues,
    changeVenueStatus,
    getPendingOwnerApplications,
    changeOwnerStatus,
    getAllInquiries,
    getDashboardStats,
    getAllContacts,
    replyToContact,
    deleteContact
}; 