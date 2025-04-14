const express = require("express")
const { VerifyAdmin } = require("../middlewares/auth.middleware");
const { getAllUsers, getAllOwners, changeVenueStatus, getPendingVenues, getPendingOwnerApplications, changeOwnerStatus, getAllInquiries, getDashboardStats, getAllContacts, replyToContact, deleteContact, getPlatformEarnings, getAllOwnerSupport, updateOwnerSupport, deleteOwnerSupport } = require("../controllers/admin.controller");
const { getVenue, getAllVenues } = require("../controllers/venue.controller");
const { getAllBookings, deleteBooking } = require("../controllers/booking.controller");
const { getAllReviews, adminDeleteReview } = require("../controllers/review.controller");
const { getConfig, updateConfig } = require("../controllers/config.controller");
const adminRouter = express.Router();

// Apply VerifyAdmin middleware to all admin routes
adminRouter.use(VerifyAdmin);

// Dashboard route
adminRouter.get("/dashboard", getDashboardStats);

// User management routes

adminRouter.get("/user/fetch", getAllUsers);

// Owner management routes
adminRouter.get("/owner/fetch", getAllOwners);
adminRouter.get("/owner/pending", getPendingOwnerApplications);
adminRouter.put("/owner/status/:appId", changeOwnerStatus);

// Venue management routes
adminRouter.get("/venue/fetch", getAllVenues);
adminRouter.get("/venue/fetch/:venueId", getVenue);
adminRouter.get("/venue/pending", getPendingVenues);
adminRouter.put("/venue/status/:venueId", changeVenueStatus);

// Review management routes
adminRouter.get("/review/all", getAllReviews);
adminRouter.delete("/review/delete/:reviewId", adminDeleteReview);

// Booking management routes
adminRouter.get("/bookings/fetch", getAllBookings);
adminRouter.delete("/bookings/delete/:bookingId", deleteBooking);

// Inquiry management routes
adminRouter.get("/inquiries/fetch", getAllInquiries);

// Contact management routes
adminRouter.get("/contact/fetch", getAllContacts);
adminRouter.post("/contact/reply/:contactId", replyToContact);
adminRouter.delete("/contact/delete/:contactId", deleteContact);

// Configuration routes
adminRouter.get("/config", getConfig);
adminRouter.post("/config/update", updateConfig);

// Platform earnings route
adminRouter.get("/earnings", getPlatformEarnings);

// Owner support routes
adminRouter.get("/owner/support", getAllOwnerSupport);
adminRouter.put("/owner/support/:supportId", updateOwnerSupport);
adminRouter.delete("/owner/support/:supportId", deleteOwnerSupport);


module.exports = { adminRouter };