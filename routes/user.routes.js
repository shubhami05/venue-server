const express = require('express');
const { RegisterOwner, sendInquiry, submitContactForm } = require('../controllers/user.controller');
const { VerifyCookie } = require('../middlewares/auth.middleware');
const { uploadPdf } = require('../middlewares/multer.middleware');
const { getVenue, getAllVenues } = require('../controllers/venue.controller');
const { createBooking, checkAvailability, getUserBookings, cancelBooking, confirmPayment } = require('../controllers/booking.controller');
const { createReview, getVenueReviews, getUserReviews, deleteReview } = require('../controllers/review.controller');
const userRouter = express.Router();

userRouter.post("/register-for-owner", VerifyCookie, uploadPdf, RegisterOwner);

userRouter.get("/booking/fetch", VerifyCookie, getUserBookings); //user's all bookings
userRouter.post("/booking/create", VerifyCookie, createBooking); // create new booking
userRouter.post("/booking/cancel/:bookingId", VerifyCookie, cancelBooking);
userRouter.post("/booking/confirm", VerifyCookie, confirmPayment); //confirm booking after payment

userRouter.post("/review/create", VerifyCookie, createReview); //send review
userRouter.get("/review/fetch/venue/:venueId", getVenueReviews); //get venue reviews (public)
userRouter.get("/review/fetch", VerifyCookie, getUserReviews); //get user's reviews
userRouter.delete("/review/delete/:reviewId", VerifyCookie, deleteReview); //delete review only if it is from user

userRouter.get("/venue/fetch", getAllVenues); //list available venues with status true
userRouter.get("/venue/fetch/:venueId", getVenue); //single venue data
userRouter.post("/venue/check-availability", VerifyCookie, checkAvailability); //check venue availability
userRouter.post("/inquiry/send", VerifyCookie, sendInquiry); //send inquiry
userRouter.post("/contact/send", submitContactForm); //send contact form (no auth required)

module.exports = { userRouter };