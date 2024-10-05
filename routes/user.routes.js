const express = require('express');
const { RegisterOwner } = require('../controllers/user.controller');
const { VerifySession } = require('../middlewares/auth.middleware');
const userRouter = express.Router();

userRouter.post("/register-for-owner", VerifySession, RegisterOwner);

userRouter.get("/booking/fetch");
userRouter.post("/booking/add");
userRouter.delete("/booking/cancel");

userRouter.post("/review/add");
userRouter.post("/review/delete");

userRouter.get("/venue/fetch");
userRouter.get("/venue/fetch/:id");

userRouter.post("/contact/add");


module.exports = { userRouter }