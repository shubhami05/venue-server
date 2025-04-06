const express = require('express');
const { VerifyOwner } = require('../middlewares/auth.middleware');
const { ListNewVenue, getOwnerVenues, getVenue, editVenue, deleteVenue } = require('../controllers/venue.controller');
const { upload } = require('../middlewares/multer.middleware');
const { getOwnerVenuesBookings, getBookingById, confirmBooking, deleteBooking } = require('../controllers/booking.controller');
const { fetchInquiryForOwner, getDashboardAnalytics } = require('../controllers/owner.controller');
const { getOwnerVenueReviews, replyToReview } = require('../controllers/review.controller');
const { getConfig } = require('../controllers/config.controller');
const ownerRouter = express.Router();

ownerRouter.use(VerifyOwner); // Verify owner for all routes   

// Dashboard routes
ownerRouter.get("/dashboard/analytics", getDashboardAnalytics); // Get dashboard analytics

// Venue routes
ownerRouter.post("/venue/send", upload, ListNewVenue);
ownerRouter.get("/venue/fetch", getOwnerVenues); // fetch only owner's venues
ownerRouter.get("/venue/fetch/:venueId", getVenue); // fetch single venue 
ownerRouter.put("/venue/edit/:venueId", upload, editVenue); // edit venue
ownerRouter.delete("/venue/delete/:venueId", deleteVenue); // can delete only his venue

// Booking routes
ownerRouter.get("/bookings/fetch", getOwnerVenuesBookings); // fetch all bookings
ownerRouter.get("/bookings/:bookingId", getBookingById); // fetch single booking
ownerRouter.patch("/bookings/:bookingId/confirm", confirmBooking); // confirm a booking
ownerRouter.delete("/bookings/:bookingId", deleteBooking); // delete a booking

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