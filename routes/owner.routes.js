const express = require('express');
const { VerifyOwner } = require('../middlewares/auth.middleware');
const { ListNewVenue, getOwnerVenues, getVenue, editVenue, deleteVenue } = require('../controllers/venue.controller');
const ownerRouter = express.Router();

ownerRouter.post("/venue/send",VerifyOwner, ListNewVenue);
ownerRouter.get("/venue/fetch",VerifyOwner,getOwnerVenues); //fetch only owner's venue
ownerRouter.get("/venue/fetch/:venueId",VerifyOwner,getVenue); //fetch single venue 
ownerRouter.put("/venue/edit/:venueId",VerifyOwner,editVenue);  //edit venue
ownerRouter.delete("/venue/delete/:venueId",VerifyOwner,deleteVenue);//can delete only his venue

// ownerRouter.get("/venue/bookings/:venueId"); 
// ownerRouter.get("/venue/reviews/:venueId");

ownerRouter.get("/booking/fetch"); //fetch all bookings
ownerRouter.get("/booking/fetch/:venueId"); //fetch all bookings of a venue
ownerRouter.get("/booking/fetch/:bookingId"); //fetch single booking 

ownerRouter.get("/review/fetch"); // all reviews for owner's venues
ownerRouter.get("/review/fetch/:venueId"); //fetch all reviews of a venue
ownerRouter.post("/review/reply/:reviewId"); //for replying to review

ownerRouter.get("/profile"); //user data
ownerRouter.put("/profile/edit"); 

module.exports = { ownerRouter }