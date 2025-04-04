const express = require('express');
const { RegisterOwner, sendInquiry } = require('../controllers/user.controller');
const { VerifyCookie } = require('../middlewares/auth.middleware');
const { uploadPdf } = require('../middlewares/multer.middleware');
const { getVenue, getAllVenues } = require('../controllers/venue.controller');
const { BookVenue, checkAvailability, getUserBookings } = require('../controllers/booking.controller');
const userRouter = express.Router();

userRouter.post("/register-for-owner", VerifyCookie, uploadPdf, RegisterOwner);

userRouter.get("/booking/fetch", VerifyCookie, getUserBookings); //user's all bookings
userRouter.post("/booking/create", VerifyCookie, BookVenue);// book new one
// userRouter.delete("/booking/cancel");//cancel booking if more than 1 day remain

userRouter.post("/review/create"); //send review
userRouter.post("/review/delete/:reviewId"); //delete review only if it is from user

userRouter.get("/venue/fetch", getAllVenues); //list available venues with status true
userRouter.get("/venue/fetch/:venueId", getVenue); //single venue data
userRouter.post("/venue/check-availability",VerifyCookie,checkAvailability); //check venue availability
userRouter.post("/inquiry/send", VerifyCookie, sendInquiry); //send inquiry
userRouter.post("/contact/send"); //send contact

module.exports = { userRouter };