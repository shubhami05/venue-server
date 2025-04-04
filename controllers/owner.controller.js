const { UserModel } = require("../models/user.model");
const { VenueModel } = require("../models/venue.model");
const { InquiryModel } = require("../models/inquiry.model");

async function fetchInquiryForOwner(req, res) {
    try {
        const ownerId = req.user._id;
        
        // Find all venues owned by this owner
        const venues = await VenueModel.find({ ownerId });
        const venueIds = venues.map(venue => venue._id);

        // Find all inquiries for these venues
        const inquiries = await InquiryModel.find({ venueId: { $in: venueIds } })
            .populate('userId', 'fullname email mobile')
            .populate('venueId', 'name type city');
        // Format the inquiries data for better frontend consumption
        const formattedInquiries = inquiries.map(inquiry => ({
            _id: inquiry._id,
            user: {
                _id: inquiry.userId._id,
                name: inquiry.userId.fullname,
                email: inquiry.userId.email,
                phone: inquiry.userId.mobile
            },
            venue: {
                _id: inquiry.venueId._id,
                name: inquiry.venueId.name,
                type: inquiry.venueId.type,
                city: inquiry.venueId.city
            },
            date: inquiry.date,
            eventType: inquiry.eventType,
            message: inquiry.message,
            createdAt: inquiry.createdAt,
            status: inquiry.status
        }));

        return res.status(200).json({
            success: true,
            formattedInquiries
        });
    } catch (error) {
        console.error('Error fetching inquiries:', error);
        return res.status(500).json({
            success: false,
            message: 'Failed to fetch inquiries'
        });
    }
}

module.exports = { fetchInquiryForOwner };