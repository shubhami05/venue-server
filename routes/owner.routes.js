const express = require('express');
const { VerifyOwner } = require('../middlewares/auth.middleware');
const { ListNewVenue } = require('../controllers/venue.controller');
const ownerRouter = express.Router();

ownerRouter.post("/venue/add", VerifyOwner, ListNewVenue);
ownerRouter.get("/venue/fetch");
ownerRouter.get("/venue/fetch/:id");
ownerRouter.put("/venue/edit/:id");
ownerRouter.delete("/venue/delete/:id");

ownerRouter.get("/venue/bookings/:id");
ownerRouter.get("/venue/reviews/:id");

ownerRouter.get("/booking/fetch");
ownerRouter.get("/booking/fetch/:id");

ownerRouter.get("/review/fetch");
ownerRouter.post("/review/reply/add/:id");
ownerRouter.delete("/review/reply/delete/:id");

ownerRouter.get("/profile");
ownerRouter.put("/profile/edit");

module.exports = { ownerRouter }