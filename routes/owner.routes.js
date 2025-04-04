const express = require('express');
const { VerifyOwner } = require('../middlewares/auth.middleware');
const { ListNewVenue, getOwnerVenues, getVenue, editVenue, deleteVenue } = require('../controllers/venue.controller');
const { upload } = require('../middlewares/multer.middleware');
const { getOwnerVenuesBookings, getBookingById, confirmBooking, deleteBooking } = require('../controllers/booking.controller');
const { fetchInquiryForOwner } = require('../controllers/owner.controller');
const ownerRouter = express.Router();

ownerRouter.use(VerifyOwner); // Verify owner for all routes   
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
ownerRouter.get("/review/fetch"); // all reviews for owner's venues
ownerRouter.get("/review/fetch/:venueId"); // fetch all reviews of a venue
ownerRouter.post("/review/reply/:reviewId"); // for replying to review

// Inquiry routes
ownerRouter.get("/inquiry/fetch", fetchInquiryForOwner); // fetch all inquiries

// Profile routes
ownerRouter.get("/profile"); // user data
ownerRouter.put("/profile/edit"); 

module.exports = { ownerRouter }