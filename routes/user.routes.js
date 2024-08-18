const express = require("express");
const { SignupApi, LoginApi } = require("../controllers/user.controller");

const userRouter = express.Router();

userRouter.post('/signup',SignupApi);
userRouter.post('/login',LoginApi);

module.exports = { userRouter }