const express = require('express');
const { VerifyOwner } = require('../middlewares/auth.middleware');
const { ListNewVenue, getOwnerVenues, getVenue, editVenue, deleteVenue } = require('../controllers/venue.controller');
const { upload, uploadRequired } = require('../middlewares/multer.middleware');
const { getOwnerVenuesBookings, getBookingById,  deleteBooking,  confirmPayment } = require('../controllers/booking.controller');
const { fetchInquiryForOwner, getDashboardAnalytics, createSupport } = require('../controllers/owner.controller');
const { getOwnerVenueReviews, replyToReview } = require('../controllers/review.controller');
const { getConfig } = require('../controllers/config.controller');
const { checkStripeAccount } = require('../middlewares/stripe.middleware');
const { createOwnerReservation, removeOwnerReservation, getOwnerReservations } = require('../controllers/booking.controller');

const ownerRouter = express.Router();



ownerRouter.use(VerifyOwner); // Verify owner for all routes   

// Dashboard routes
ownerRouter.get("/dashboard/analytics", getDashboardAnalytics); // Get dashboard analytics

// Venue routes
ownerRouter.post("/venue/send", upload, uploadRequired, checkStripeAccount, ListNewVenue);
ownerRouter.get("/venue/fetch", getOwnerVenues); // fetch only owner's venues
ownerRouter.get("/venue/fetch/:venueId", getVenue); // fetch single venue 
ownerRouter.put("/venue/edit/:venueId", upload, checkStripeAccount, editVenue); // Images optional for editing
ownerRouter.delete("/venue/delete/:venueId", deleteVenue); // can delete only his venue

// Booking routes
// ownerRouter.post('/booking/create', checkStripeAccount, BookVenue);
// ownerRouter.post('/booking/confirm-payment', checkStripeAccount, confirmPayment);
ownerRouter.get('/booking/fetch', getOwnerVenuesBookings);
ownerRouter.get('/booking/fetch/:id', getBookingById);
ownerRouter.delete('/booking/delete/:id', deleteBooking);
ownerRouter.post("/reservation/create", createOwnerReservation);
ownerRouter.delete("/reservation/:reservationId", removeOwnerReservation);
ownerRouter.get("/reservation/fetch", getOwnerReservations);

// Review routes
ownerRouter.get("/review/fetch", getOwnerVenueReviews); // all reviews for owner's venues
ownerRouter.get("/review/fetch/:venueId", getOwnerVenueReviews); // fetch all reviews of a specific venue
ownerRouter.post("/review/reply/:reviewId", replyToReview); // for replying to review

// Inquiry routes
ownerRouter.get("/inquiry/fetch", fetchInquiryForOwner); // fetch all inquiries

// Config routes
ownerRouter.get("/config", getConfig);

// Support routes
ownerRouter.post('/support', createSupport);

module.exports = { ownerRouter }