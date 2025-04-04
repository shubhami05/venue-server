const express = require("express")
const { VerifyAdmin } = require("../middlewares/auth.middleware");
const { getAllUsers, getAllOwners, changeVenueStatus, getPendingVenues, getPendingOwnerApplications, changeOwnerStatus } = require("../controllers/admin.controller");
const { getVenue, getAllVenues } = require("../controllers/venue.controller");
const { getAllBookings } = require("../controllers/booking.controller");
const adminRouter = express.Router();

// Apply VerifyAdmin middleware to all admin routes
adminRouter.use(VerifyAdmin);

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
adminRouter.get("/review/fetch");

// Booking management routes
adminRouter.get("/bookings/fetch", getAllBookings);

// Contact management routes
adminRouter.get("/contact/fetch");
adminRouter.post("/contact/reply");
adminRouter.delete("/contact/delete/:contactId");

//TODO: ADVANCE ONE, FOR ADMIN FUNCTIONALITIES
adminRouter.post("/config");
adminRouter.get("/config/fetch");
adminRouter.put("/config/edit");

module.exports = { adminRouter };