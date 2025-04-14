const express = require("express");
const { 
    SignupApi, 
    LoginApi, 
    FetchUserData, 
    LogoutApi, 
    ChangePasswordApi,
    ForgotPasswordApi,
    ResetPasswordApi
} = require("../controllers/auth.controller");
const { VerifyCookie } = require("../middlewares/auth.middleware");

const authRouter = express.Router();

// Public routes
authRouter.post('/signup', SignupApi);
authRouter.post('/login', LoginApi);
authRouter.post('/forgot-password', ForgotPasswordApi);
authRouter.post('/reset-password', ResetPasswordApi);

// Protected routes
authRouter.post('/change-password', VerifyCookie, ChangePasswordApi);
authRouter.get('/logout', VerifyCookie, LogoutApi);
authRouter.get('/fetch-session', VerifyCookie, FetchUserData);

module.exports = { authRouter };