const { UserModel } = require("../models/user.model");
const { VenueModel } = require("../models/venue.model");
const { InquiryModel } = require("../models/inquiry.model");
const { BookingModel } = require("../models/booking.model");
const { ReviewModel } = require("../models/review.model");
const {OwnerSupportModel} = require("../models/ownersupport.model");

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
        const bookings = await BookingModel.find({ venueId: { $in: venueIds }, isOwnerReservation: false });
        const totalBookings = bookings.length;
        
        // Calculate total rebookings (bookings by the same user for the same venue)
        const rebookings = bookings.filter(booking => {
            // Find if this user has booked this venue before
            const previousBookings = bookings.filter(b => 
                b.userId.toString() === booking.userId.toString() && 
                b.venueId.toString() === booking.venueId.toString() &&
                b._id.toString() !== booking._id.toString() &&
                new Date(b.createdAt) < new Date(booking.createdAt)
            );
            return previousBookings.length > 0;
        });
        const totalRebookings = rebookings.length;
        
        // Get bookings revenue
        const totalRevenue = bookings.reduce((total, booking) => {
            if (booking.paymentStatus === 'completed') {
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
        const pendingVenues = venues.filter(venue => venue.status === 'pending').length;
        const acceptedVenues = venues.filter(venue => venue.status === 'accepted').length;
        const rejectedVenues = venues.filter(venue => venue.status === 'rejected').length;
        // Get pending reviews (not replied to yet)
        const pendingReviews = reviews.filter(review => !review.ownerReply || !review.ownerReply.message).length;
        
        // Get pending bookings
        const cancelledBookings = bookings.filter(booking => booking.isCancelled).length;
        
        // Get confirmed bookings
        const confirmedBookings = bookings.filter(booking => booking.paymentStatus === 'completed').length;
        
        // Monthly bookings and revenue statistics (last 6 months)
        const today = new Date();
        const sixMonthsAgo = new Date(today.getFullYear(), today.getMonth() - 5, 1);
        
        const monthlyBookings = [];
        const revenueTrend = [];
        
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
            
            const monthRevenue = monthBookings.reduce((sum, booking) => {
                if (booking.paymentStatus === 'completed') {
                    return sum + booking.amount;
                }
                return sum;
            }, 0);
            
            monthlyBookings.push({
                month: monthName,
                monthYear,
                count: monthBookings.length,
                revenue: monthRevenue
            });
            
            revenueTrend.push({
                month: monthName,
                amount: monthRevenue
            });
        }
        
        // Reverse to get chronological order
        monthlyBookings.reverse();
        revenueTrend.reverse();
        
        // Calculate rating distribution (1-5 stars)
        const ratingDistribution = {
            1: 0,
            2: 0,
            3: 0,
            4: 0,
            5: 0
        };
        
        reviews.forEach(review => {
            if (review.rating >= 1 && review.rating <= 5) {
                ratingDistribution[review.rating]++;
            }
        });
        
        // Calculate venue ratings
        const venueRatings = [];
        
        for (const venue of venues) {
            const venueReviews = reviews.filter(review => 
                review.venueId.toString() === venue._id.toString()
            );
            
            let venueRating = 0;
            if (venueReviews.length > 0) {
                const sumRatings = venueReviews.reduce((sum, review) => sum + review.rating, 0);
                venueRating = sumRatings / venueReviews.length;
            }
            
            venueRatings.push({
                id: venue._id,
                name: venue.name,
                rating: venueRating
            });
        }
        
        return res.status(200).json({
            success: true,
            data: {
                totalVenues,
                totalBookings,
                totalRebookings,
                totalRevenue,
                totalInquiries,
                totalReviews,
                averageRating,
                pendingReviews,
                cancelledBookings,
                confirmedBookings,
                monthlyBookings,
                pendingVenues,
                acceptedVenues,
                rejectedVenues,
                ratingDistribution,
                venueRatings,
                revenueTrend
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

// Create support request
async function createSupport (req, res) {
    try {
        const { subject, message } = req.body;
        const ownerId = req.user._id;

        // Validate input
        if (!subject || !message) {
            return res.status(400).json({
                success: false,
                message: "Please provide subject and message"
            });
        }

        // Create support request
        const supportRequest = await OwnerSupportModel.create({
            ownerId,
            subject,
            message,
            status: 'pending'
        });

        return res.status(201).json({
            success: true,
            message: "Support request created successfully",
            supportRequest
        });
    } catch (error) {
        console.error("Error in createSupport:", error);
        return res.status(500).json({
            success: false,
            message: "Internal server error",
            error: error.message
        });
    }
};

module.exports = { 
    fetchInquiryForOwner, 
    getDashboardAnalytics,
    createSupport 
};