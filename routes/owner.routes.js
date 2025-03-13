const express = require('express');
const { VerifyOwner } = require('../middlewares/auth.middleware');
const { ListNewVenue, getOwnerVenues, getVenue, editVenue, deleteVenue } = require('../controllers/venue.controller');
const { upload } = require('../middlewares/multer.middleware');
const ownerRouter = express.Router();

// Venue routes
ownerRouter.post("/venue/send", VerifyOwner, upload, ListNewVenue);
ownerRouter.get("/venue/fetch", VerifyOwner, getOwnerVenues); // fetch only owner's venues
ownerRouter.get("/venue/fetch/:venueId", VerifyOwner, getVenue); // fetch single venue 
ownerRouter.put("/venue/edit/:venueId", VerifyOwner, upload, editVenue); // edit venue
ownerRouter.delete("/venue/delete/:venueId", VerifyOwner, deleteVenue); // can delete only his venue

// Booking routes
ownerRouter.get("/booking/fetch", VerifyOwner); // fetch all bookings
ownerRouter.get("/booking/fetch/:venueId", VerifyOwner); // fetch all bookings of a venue
ownerRouter.get("/booking/fetch/:bookingId", VerifyOwner); // fetch single booking 

// Review routes
ownerRouter.get("/review/fetch", VerifyOwner); // all reviews for owner's venues
ownerRouter.get("/review/fetch/:venueId", VerifyOwner); // fetch all reviews of a venue
ownerRouter.post("/review/reply/:reviewId", VerifyOwner); // for replying to review

// Profile routes
ownerRouter.get("/profile", VerifyOwner); // user data
ownerRouter.put("/profile/edit", VerifyOwner); 

module.exports = { ownerRouter }