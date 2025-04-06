const { UserModel } = require("../models/user.model");
const { VenueModel } = require("../models/venue.model");
const { InquiryModel } = require("../models/inquiry.model");
const { BookingModel } = require("../models/booking.model");
const { ReviewModel } = require("../models/review.model");

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

async function getDashboardAnalytics(req, res) {
    try {
        const ownerId = req.user._id;
        
        // Find all venues owned by this owner
        const venues = await VenueModel.find({ ownerId });
        const venueIds = venues.map(venue => venue._id);
        
        // Get total number of venues
        const totalVenues = venues.length;
        
        // Get bookings count
        const bookings = await BookingModel.find({ venueId: { $in: venueIds } });
        const totalBookings = bookings.length;
        
        // Get bookings revenue
        const totalRevenue = bookings.reduce((total, booking) => {
            if (booking.status === 'confirmed') {
                return total + booking.amount;
            }
            return total;
        }, 0);
        
        // Get inquiries count
        const inquiries = await InquiryModel.find({ venueId: { $in: venueIds } });
        const totalInquiries = inquiries.length;
        
        // Get reviews count and average rating
        const reviews = await ReviewModel.find({ venueId: { $in: venueIds } });
        const totalReviews = reviews.length;
        
        // Calculate average rating (if there are reviews)
        let averageRating = 0;
        if (totalReviews > 0) {
            const sumRatings = reviews.reduce((sum, review) => sum + review.rating, 0);
            averageRating = (sumRatings / totalReviews).toFixed(1);
        }
        
        // Get pending reviews (not replied to yet)
        const pendingReviews = reviews.filter(review => !review.ownerReply || !review.ownerReply.message).length;
        
        // Get pending bookings
        const pendingBookings = bookings.filter(booking => booking.status === 'pending').length;
        
        // Get confirmed bookings
        const confirmedBookings = bookings.filter(booking => booking.status === 'confirmed').length;
        
        // Monthly bookings statistics (last 6 months)
        const today = new Date();
        const sixMonthsAgo = new Date(today.getFullYear(), today.getMonth() - 5, 1);
        
        const monthlyBookings = [];
        for (let i = 0; i < 6; i++) {
            const month = new Date(today.getFullYear(), today.getMonth() - i, 1);
            const monthName = month.toLocaleString('default', { month: 'short' });
            const monthYear = month.toLocaleString('default', { month: 'short', year: 'numeric' });
            
            const startOfMonth = new Date(month.getFullYear(), month.getMonth(), 1);
            const endOfMonth = new Date(month.getFullYear(), month.getMonth() + 1, 0, 23, 59, 59);
            
            const monthBookings = bookings.filter(booking => {
                const bookingDate = new Date(booking.createdAt);
                return bookingDate >= startOfMonth && bookingDate <= endOfMonth;
            });
            
            monthlyBookings.push({
                month: monthName,
                monthYear,
                count: monthBookings.length,
                revenue: monthBookings.reduce((sum, booking) => sum + (booking.amount || 0), 0)
            });
        }
        
        // Reverse to get chronological order
        monthlyBookings.reverse();
        
        return res.status(200).json({
            success: true,
            data: {
                totalVenues,
                totalBookings,
                totalRevenue,
                totalInquiries,
                totalReviews,
                averageRating,
                pendingReviews,
                pendingBookings,
                confirmedBookings,
                monthlyBookings
            }
        });
    } catch (error) {
        console.error('Error fetching dashboard analytics:', error);
        return res.status(500).json({
            success: false,
            message: 'Failed to fetch dashboard analytics'
        });
    }
}

module.exports = { fetchInquiryForOwner, getDashboardAnalytics };