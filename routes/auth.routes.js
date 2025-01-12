const express = require("express");
const { SignupApi, LoginApi, FetchUserData, LogoutApi } = require("../controllers/auth.controller");
const { VerifySession } = require("../middlewares/auth.middleware");

const authRouter = express.Router();

authRouter.post('/signup', SignupApi);
authRouter.post('/login', LoginApi);

authRouter.get('/logout',VerifySession,LogoutApi);
authRouter.get('/fetch-session', VerifySession, FetchUserData);

authRouter.put('forgot-password');

module.exports = { authRouter }