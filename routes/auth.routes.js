const express = require("express");
const { SignupApi, LoginApi, FetchUserData, LogoutApi, ChangePasswordApi } = require("../controllers/auth.controller");
const { VerifyCookie } = require("../middlewares/auth.middleware");

const authRouter = express.Router();

authRouter.post('/signup', SignupApi);
authRouter.post('/login', LoginApi);
authRouter.post('/change-password', VerifyCookie, ChangePasswordApi);

authRouter.get('/logout', VerifyCookie, LogoutApi);
authRouter.get('/fetch-session', VerifyCookie, FetchUserData);

authRouter.put('/forgot-password', (req, res) => {
    res.status(501).json({
        success: false,
        message: "Not implemented yet"
    });
});

module.exports = { authRouter }