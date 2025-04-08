const express = require('express');
const { VerifyOwner } = require('../middlewares/auth.middleware');
const { ListNewVenue, getOwnerVenues, getVenue, editVenue, deleteVenue } = require('../controllers/venue.controller');
const { upload } = require('../middlewares/multer.middleware');
const { getOwnerVenuesBookings, getBookingById, confirmBooking, deleteBooking, BookVenue, confirmPayment } = require('../controllers/booking.controller');
const { fetchInquiryForOwner, getDashboardAnalytics } = require('../controllers/owner.controller');
const { getOwnerVenueReviews, replyToReview } = require('../controllers/review.controller');
const { getConfig } = require('../controllers/config.controller');
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const { StripeAccountModel } = require('../models/stripeAccount.model');

const ownerRouter = express.Router();

// Middleware to check Stripe account status
const checkStripeAccount = async (req, res, next) => {
    try {
        const user = req.user;
        const localStripeAccount = await StripeAccountModel.findOne({ userId: user._id });
        if (!localStripeAccount) {
            return res.status(400).json({
                success: false,
                message: "Stripe account not connected"
            });
        }

        const stripeAccount = await stripe.accounts.retrieve(localStripeAccount.stripeAccountId);
        // if (!stripeAccount.chargesEnabled) {
        //     return res.status(400).json({
        //         success: false,
        //         message: "Stripe account not fully set up"
        //     });
        // }

        next();
    } catch (error) {
        console.log(error);
        return res.status(400).json({
            success: false,
            message: "Error checking Stripe account status"
        });
    }
};

ownerRouter.use(VerifyOwner); // Verify owner for all routes   

// Dashboard routes
ownerRouter.get("/dashboard/analytics", getDashboardAnalytics); // Get dashboard analytics

// Venue routes
ownerRouter.post("/venue/send", upload, checkStripeAccount, ListNewVenue);
ownerRouter.get("/venue/fetch", getOwnerVenues); // fetch only owner's venues
ownerRouter.get("/venue/fetch/:venueId", getVenue); // fetch single venue 
ownerRouter.put("/venue/edit/:venueId", upload, checkStripeAccount, editVenue); // edit venue
ownerRouter.delete("/venue/delete/:venueId", deleteVenue); // can delete only his venue

// Booking routes
ownerRouter.post('/booking/create', checkStripeAccount, BookVenue);
ownerRouter.post('/booking/confirm-payment', checkStripeAccount, confirmPayment);
ownerRouter.get('/booking/fetch', getOwnerVenuesBookings);
ownerRouter.get('/booking/fetch/:id', getBookingById);
ownerRouter.post('/booking/confirm/:id', confirmBooking);
ownerRouter.delete('/booking/delete/:id', deleteBooking);

// Review routes
ownerRouter.get("/review/fetch", getOwnerVenueReviews); // all reviews for owner's venues
ownerRouter.get("/review/fetch/:venueId", getOwnerVenueReviews); // fetch all reviews of a specific venue
ownerRouter.post("/review/reply/:reviewId", replyToReview); // for replying to review

// Inquiry routes
ownerRouter.get("/inquiry/fetch", fetchInquiryForOwner); // fetch all inquiries

// Profile routes
ownerRouter.get("/profile"); // user data
ownerRouter.put("/profile/edit");

// Config routes
ownerRouter.get("/config", getConfig);

module.exports = { ownerRouter }