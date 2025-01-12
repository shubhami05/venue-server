const express = require('express');
const { RegisterOwner } = require('../controllers/user.controller');
const { VerifySession } = require('../middlewares/auth.middleware');
const { getVenue, getAllVenues } = require('../controllers/venue.controller');
const userRouter = express.Router();

userRouter.post("/register-for-owner", VerifySession, RegisterOwner);

userRouter.get("/booking/fetch"); //user's all bookings
userRouter.post("/booking/send");// book new one
userRouter.delete("/booking/cancel");//cancel booking if more than 1 day remain

userRouter.post("/review/send"); //send review
userRouter.post("/review/delete/:reviewId"); //delete review only if it is from user

userRouter.get("/venue/fetch",getAllVenues); //list avaoilable venues with status true
userRouter.get("/venue/fetch/:venueId",getVenue); //single venue data
userRouter.get("/venue/availibility/:venueId"); //check venue availability

userRouter.post("/contact/send"); //send comtact


module.exports = { userRouter }