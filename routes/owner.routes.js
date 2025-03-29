const express = require('express');
const { VerifyOwner } = require('../middlewares/auth.middleware');
const { ListNewVenue, getOwnerVenues, getVenue, editVenue, deleteVenue } = require('../controllers/venue.controller');
const { upload } = require('../middlewares/multer.middleware');
const ownerRouter = express.Router();

ownerRouter.use(VerifyOwner); // Verify owner for all routes   
// Venue routes
ownerRouter.post("/venue/send", upload, ListNewVenue);
ownerRouter.get("/venue/fetch", getOwnerVenues); // fetch only owner's venues
ownerRouter.get("/venue/fetch/:venueId", getVenue); // fetch single venue 
ownerRouter.put("/venue/edit/:venueId", upload, editVenue); // edit venue
ownerRouter.delete("/venue/delete/:venueId", deleteVenue); // can delete only his venue

// Booking routes
ownerRouter.get("/booking/fetch"); // fetch all bookings
ownerRouter.get("/booking/fetch/:venueId"); // fetch all bookings of a venue
ownerRouter.get("/booking/fetch/:bookingId"); // fetch single booking 

// Review routes
ownerRouter.get("/review/fetch"); // all reviews for owner's venues
ownerRouter.get("/review/fetch/:venueId"); // fetch all reviews of a venue
ownerRouter.post("/review/reply/:reviewId"); // for replying to review

// Profile routes
ownerRouter.get("/profile"); // user data
ownerRouter.put("/profile/edit"); 

module.exports = { ownerRouter }