const express = require('express');
const { RegisterOwner } = require('../controllers/user.controller');
const { VerifySession } = require('../middlewares/auth.middleware');
const userRouter = express.Router();

userRouter.post("/register-for-owner", VerifySession, RegisterOwner)
module.exports = { userRouter }