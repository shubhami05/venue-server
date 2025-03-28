const express = require('express');
const { RegisterOwner } = require('../controllers/user.controller');
const { VerifyCookie } = require('../middlewares/auth.middleware');
const { getVenue, getAllVenues } = require('../controllers/venue.controller');
const userRouter = express.Router();

userRouter.post("/register-for-owner", VerifyCookie, RegisterOwner);

userRouter.get("/booking/fetch", VerifyCookie); //user's all bookings
userRouter.post("/booking/send", VerifyCookie);// book new one
userRouter.delete("/booking/cancel", VerifyCookie);//cancel booking if more than 1 day remain

userRouter.post("/review/send", VerifyCookie); //send review
userRouter.post("/review/delete/:reviewId", VerifyCookie); //delete review only if it is from user

userRouter.get("/venue/fetch", getAllVenues); //list available venues with status true
userRouter.get("/venue/fetch/:venueId", getVenue); //single venue data
userRouter.get("/venue/availibility/:venueId"); //check venue availability

userRouter.post("/contact/send"); //send contact


module.exports = { userRouter }