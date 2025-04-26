const { dbConnect } = require("../config/db.config");
const { ReviewModel } = require("../models/review.model");
const { VenueModel } = require("../models/venue.model");

// Create a new review for a venue
const createReview = async (req, res) => {
    try {
        await dbConnect();
        const userId = req.user._id; // Get user ID from auth middleware
        const { venueId, rating, message } = req.body;
        
        // Validate required fields
        if (!venueId) {
            return res.status(400).json({
                success: false,
                message: "Venue ID is required"
            });
        }
        
        if (!rating) {
            return res.status(400).json({
                success: false,
                message: "Rating is required"
            });
        }
        
        if (!message) {
            return res.status(400).json({
                success: false,
                message: "Review message is required"
            });
        }

        // Check if venue exists
        const venue = await VenueModel.findById(venueId);
        if (!venue) {
            return res.status(404).json({
                success: false,
                message: "Venue not found"
            });
        }

        // Check if user already reviewed this venue
        const existingReview = await ReviewModel.findOne({ userId, venueId });
        if (existingReview) {
            return res.status(400).json({
                success: false,
                message: "You have already reviewed this venue"
            });
        }

        // Create new review
        const newReview = new ReviewModel({
            userId,
            venueId,
            rating,
            message
        });

        await newReview.save();

        // Update venue's average rating
        const allVenueReviews = await ReviewModel.find({ venueId });
        const totalRating = allVenueReviews.reduce((sum, review) => sum + review.rating, 0);
        const averageRating = totalRating / allVenueReviews.length;

        await VenueModel.findByIdAndUpdate(venueId, {
            rating: averageRating.toFixed(1),
            reviewCount: allVenueReviews.length
        });

        return res.status(201).json({
            success: true,
            message: "Review submitted successfully",
            review: newReview
        });
    } catch (error) {
        console.error("Error in createReview:", error);
        return res.status(500).json({
            success: false,
            message: "Internal server error",
            error: error.message
        });
    }
};

// Get all reviews for a specific venue
const getVenueReviews = async (req, res) => {
    try {
        await dbConnect();
        const { venueId } = req.params;
        
        if (!venueId) {
            return res.status(400).json({
                success: false,
                message: "Venue ID is required"
            });
        }

        // Check if venue exists
        const venue = await VenueModel.findById(venueId);
        if (!venue) {
            return res.status(404).json({
                success: false,
                message: "Venue not found"
            });
        }

        // Get all reviews for this venue with populated user details
        const reviews = await ReviewModel.find({ venueId })
            .populate('userId', 'fullname email profilePic')
            .sort({ createdAt: -1 }); // Sort by newest first
        
        // Format the reviews for easier frontend consumption
        const formattedReviews = reviews.map(review => ({
            _id: review._id,
            user: {
                _id: review.userId._id,
                name: review.userId.fullname,
                email: review.userId.email,
                profilePic: review.userId.profilePic
            },
            rating: review.rating,
            message: review.message,
            ownerReply: review.ownerReply || null,
            createdAt: review.createdAt
        }));

        return res.status(200).json({
            success: true,
            message: "Reviews fetched successfully",
            reviews: formattedReviews,
            totalReviews: formattedReviews.length,
            averageRating: venue.rating || 0
        });
    } catch (error) {
        console.error("Error in getVenueReviews:", error);
        return res.status(500).json({
            success: false,
            message: "Internal server error",
            error: error.message
        });
    }
};

// Get all reviews for owner's venues
const getOwnerVenueReviews = async (req, res) => {
    try {
        await dbConnect();
        const ownerId = req.user._id;
        
        // First get all venues owned by this owner
        const venues = await VenueModel.find({ ownerId }, '_id name');
        
        if (venues.length === 0) {
            return res.status(200).json({
                success: true,
                message: "No venues found for this owner",
                reviews: []
            });
        }
        
        const venueIds = venues.map(venue => venue._id);
        
        // Get all reviews for these venues
        const reviews = await ReviewModel.find({ venueId: { $in: venueIds } })
            .populate('userId', 'fullname email profilePic')
            .populate('venueId', 'name city type')
            .sort({ createdAt: -1 });
        
        // Format the reviews
        const formattedReviews = reviews.map(review => ({
            _id: review._id,
            user: {
                _id: review.userId._id,
                name: review.userId.fullname,
                email: review.userId.email,
                profilePic: review.userId.profilePic
            },
            venue: {
                _id: review.venueId._id,
                name: review.venueId.name,
                city: review.venueId.city,
                type: review.venueId.type
            },
            ownerReply: review.ownerReply,
            rating: review.rating,
            message: review.message,
            createdAt: review.createdAt
        }));

        return res.status(200).json({
            success: true,
            message: "Owner venue reviews fetched successfully",
            reviews: formattedReviews
        });
    } catch (error) {
        console.error("Error in getOwnerVenueReviews:", error);
        return res.status(500).json({
            success: false,
            message: "Internal server error",
            error: error.message
        });
    }
};

// Get user's reviews
const getUserReviews = async (req, res) => {
    try {
        await dbConnect();
        const userId = req.user._id;
        
        // Get all reviews by this user
        const reviews = await ReviewModel.find({ userId })
            .populate('venueId', 'name city address type')
            .sort({ createdAt: -1 });
        
        // Format the reviews
        const formattedReviews = reviews.map(review => ({
            _id: review._id,
            venue: {
                _id: review.venueId._id,
                name: review.venueId.name,
                city: review.venueId.city,
                type: review.venueId.type
            },
            rating: review.rating,
            message: review.message,
            createdAt: review.createdAt
        }));

        return res.status(200).json({
            success: true,
            message: "User reviews fetched successfully",
            reviews: formattedReviews
        });
    } catch (error) {
        console.error("Error in getUserReviews:", error);
        return res.status(500).json({
            success: false,
            message: "Internal server error",
            error: error.message
        });
    }
};

// Owner reply to a review
const replyToReview = async (req, res) => {
    try {
        await dbConnect();
        const ownerId = req.user._id;
        const { reviewId } = req.params;
        const { message } = req.body;
        
        if (!reviewId) {
            return res.status(400).json({
                success: false,
                message: "Review ID is required"
            });
        }
        
        if (!message || message.trim() === '') {
            return res.status(400).json({
                success: false,
                message: "Reply message is required"
            });
        }

        // Find the review
        const review = await ReviewModel.findById(reviewId).populate('venueId');
        
        if (!review) {
            return res.status(404).json({
                success: false,
                message: "Review not found"
            });
        }
        
        // Check if this venue belongs to the current owner
        if (review.venueId.ownerId.toString() !== ownerId.toString()) {
            return res.status(403).json({
                success: false,
                message: "You are not authorized to reply to this review"
            });
        }
        
        // Update the review with owner's reply
        review.ownerReply = {
            message: message,
            createdAt: new Date()
        };
        
        await review.save();
        
        return res.status(200).json({
            success: true,
            message: "Reply added successfully",
            review
        });
    } catch (error) {
        console.error("Error in replyToReview:", error);
        return res.status(500).json({
            success: false,
            message: "Internal server error",
            error: error.message
        });
    }
};

// Delete a review
const deleteReview = async (req, res) => {
    try {
        await dbConnect();
        const userId = req.user._id;
        const { reviewId } = req.params;
        
        if (!reviewId) {
            return res.status(400).json({
                success: false,
                message: "Review ID is required"
            });
        }

        // Find the review
        const review = await ReviewModel.findById(reviewId);
        
        if (!review) {
            return res.status(404).json({
                success: false,
                message: "Review not found"
            });
        }
        
        // Check if this review belongs to the current user
        if (review.userId.toString() !== userId.toString()) {
            return res.status(403).json({
                success: false,
                message: "You are not authorized to delete this review"
            });
        }
        
        // Delete the review
        await ReviewModel.findByIdAndDelete(reviewId);
        
        // Update venue's average rating
        const venueId = review.venueId;
        const allVenueReviews = await ReviewModel.find({ venueId });
        
        // If there are still reviews, recalculate average
        if (allVenueReviews.length > 0) {
            const totalRating = allVenueReviews.reduce((sum, review) => sum + review.rating, 0);
            const averageRating = totalRating / allVenueReviews.length;
            
            await VenueModel.findByIdAndUpdate(venueId, {
                rating: averageRating.toFixed(1),
                reviewCount: allVenueReviews.length
            });
        } else {
            // If no reviews left, reset rating
            await VenueModel.findByIdAndUpdate(venueId, {
                rating: 0,
                reviewCount: 0
            });
        }
        
        return res.status(200).json({
            success: true,
            message: "Review deleted successfully"
        });
    } catch (error) {
        console.error("Error in deleteReview:", error);
        return res.status(500).json({
            success: false,
            message: "Internal server error",
            error: error.message
        });
    }
};

// Get all reviews for admin
const getAllReviews = async (req, res) => {
    try {
        await dbConnect();
        
        // Get all reviews with populated user and venue details
        const reviews = await ReviewModel.find({})
            .populate('userId', 'fullname email profilePic')
            .populate('venueId', 'name city type ownerId')
            .sort({ createdAt: -1 });
        
        // Populate venue owners
        const populatedReviews = await Promise.all(
            reviews.map(async (review) => {
                // Get owner details for each venue
                const venue = review.venueId;
                let ownerName = "Unknown";
                
                if (venue && venue.ownerId) {
                    const ownerPopulated = await VenueModel.findById(venue._id)
                        .populate('ownerId', 'fullname email')
                        .select('ownerId');
                    
                    if (ownerPopulated && ownerPopulated.ownerId) {
                        ownerName = ownerPopulated.ownerId.fullname;
                    }
                }
                
                // Format the review
                return {
                    _id: review._id,
                    user: {
                        _id: review.userId._id,
                        name: review.userId.fullname,
                        email: review.userId.email,
                        profilePic: review.userId.profilePic
                    },
                    venue: {
                        _id: review.venueId._id,
                        name: review.venueId.name,
                        city: review.venueId.city,
                        type: review.venueId.type,
                        ownerName: ownerName
                    },
                    rating: review.rating,
                    message: review.message,
                    ownerReply: review.ownerReply,
                    createdAt: review.createdAt
                };
            })
        );

        return res.status(200).json({
            success: true,
            message: "All reviews fetched successfully",
            reviews: populatedReviews,
            totalCount: populatedReviews.length
        });
    } catch (error) {
        console.error("Error in getAllReviews:", error);
        return res.status(500).json({
            success: false,
            message: "Internal server error",
            error: error.message
        });
    }
};

// Admin delete review function
const adminDeleteReview = async (req, res) => {
    try {
        // Admin has authority to delete any review
        const { reviewId } = req.params;
        
        if (!reviewId) {
            return res.status(400).json({
                success: false,
                message: "Review ID is required"
            });
        }
        
        await dbConnect();
        
        // Find the review
        const review = await ReviewModel.findById(reviewId);
        
        if (!review) {
            return res.status(404).json({
                success: false,
                message: "Review not found"
            });
        }
        
        // Delete the review
        await ReviewModel.findByIdAndDelete(reviewId);
        
        // Update venue's average rating
        const venueId = review.venueId;
        const allVenueReviews = await ReviewModel.find({ venueId });
        
        // If there are still reviews, recalculate average
        if (allVenueReviews.length > 0) {
            const totalRating = allVenueReviews.reduce((sum, review) => sum + review.rating, 0);
            const averageRating = totalRating / allVenueReviews.length;
            
            await VenueModel.findByIdAndUpdate(venueId, {
                rating: averageRating.toFixed(1),
                reviewCount: allVenueReviews.length
            });
        } else {
            // If no reviews left, reset rating
            await VenueModel.findByIdAndUpdate(venueId, {
                rating: 0,
                reviewCount: 0
            });
        }
        
        return res.status(200).json({
            success: true,
            message: "Review deleted successfully by admin"
        });
    } catch (error) {
        console.error("Error in adminDeleteReview:", error);
        return res.status(500).json({
            success: false,
            message: "Internal server error",
            error: error.message
        });
    }
};

module.exports = {
    createReview,
    getVenueReviews,
    getOwnerVenueReviews,
    getUserReviews,
    replyToReview,
    deleteReview,
    getAllReviews,
    adminDeleteReview
};
