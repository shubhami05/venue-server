const jwt = require("jsonwebtoken")
const { dbConnect } = require("../config/db.config")

async function VerifySession(req, res, next) {
    try {
        const UserSession = await req.session.user;

        if (!UserSession) {
            return res.status(401).json({
                success: false,
                message: "Session not found, please Login!"
            })
        }
        req.user = UserSession;
        next();

    }
    catch (error) {
        console.log(error)
        return res.status(500).json({
            success: false,
            message: "Something went wrong"
        })
    }
}

async function VerifyAdmin(req, res, next) {
    try {
        const UserSession = await req.session.user;
        if (!UserSession.role === "admin") {
            return res.status(401).json({
                success: false,
                message: "Unauthorized user!"
            })
        }
        next();

    }
    catch (error) {
        console.log(error)
        return res.status(500).json({
            success: false,
            message: "Something went wrong"
        })
    }
}

module.exports = {
    VerifySession,
    VerifyAdmin
}