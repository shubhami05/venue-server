const express = require("express")
const { VerifyAdmin } = require("../middlewares/auth.middleware");
const adminRouter = express.Router();

// Apply VerifyAdmin middleware to all admin routes
adminRouter.use(VerifyAdmin);

adminRouter.get("/user/fetch"); //(name,role,email,mobile)
adminRouter.get("/user/fetch/:userId"); //single user with bookings/venues
// adminRouter.put("/user/change-role"); // change role from user to owner 

adminRouter.get("/owner-application/fetch"); //fetch all owner applications
adminRouter.put("/owner-application/verify/:id"); //accept or reject owner application


adminRouter.get("/venue/fetch"); //only status:true venues
adminRouter.get("/venue/fetch/:venueId"); //single venue with booking and reviews
adminRouter.get("/venue/request"); //req. from owner to add venue { status : false }
adminRouter.put("/venue/request/verify/:venueId"); // accept or reject venue req. by changing status
adminRouter.delete("/venue/unverify/:venueId"); //just change status to false

adminRouter.get("/review/fetch"); //fetch all reviews

adminRouter.get("/booking/fetch"); //fetch all bookings

adminRouter.get("/contact/fetch"); //fetch all contacts
adminRouter.post("/contact/reply"); //TODO: EMAIL INTERGRATION
adminRouter.delete("/contact/delete/:contactId");

//TODO: ADVANCE ONE, FOR ADMIN FUNCTIONALITIES
adminRouter.post("/config");
adminRouter.get("/config/fetch");
adminRouter.put("/config/edit");

module.exports = { adminRouter };