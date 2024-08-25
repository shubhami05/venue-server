const express = require("express");
const { SignupApi, LoginApi, FetchUserData, LogoutApi } = require("../controllers/user.controller");
const { VerifySession } = require("../middlewares/auth.middleware");

const userRouter = express.Router();

userRouter.post('/signup', SignupApi);
userRouter.post('/login', LoginApi);

userRouter.get('/logout',VerifySession,LogoutApi)
userRouter.get('/fetch-session', VerifySession, FetchUserData)

module.exports = { userRouter }