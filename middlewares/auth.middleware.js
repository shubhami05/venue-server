const jwt = require("jsonwebtoken")
const { dbConnect } = require("../config/db.config");
const { UserModel } = require("../models/user.model");

// Verify user authentication from cookie
async function VerifyCookie(req, res, next) {
    try {
        // Get token from cookie
        const token = req.cookies.auth_token;
        
        if (!token) {
            return res.status(401).json({
                success: false,
                message: "Authentication required. Please login."
            });
        }
        
        // Verify token
        const decoded = jwt.verify(token, process.env.JWT_SECRET || "venueserv-secret-key");
        
        // Connect to database
        await dbConnect();
        
        // Find user in database
        const user = await UserModel.findById(decoded.id).select("-password");
        
        if (!user) {
            res.clearCookie("auth_token");
            return res.status(401).json({
                success: false,
                message: "User not found. Please login again."
            });
        }
        
        // Set user in request object
        req.user = user;
        next();
    } catch (error) {
        console.log("Authentication error:", error);
        
        // Clear invalid cookie
        res.clearCookie("auth_token");
        
        if (error.name === "JsonWebTokenError") {
            return res.status(401).json({
                success: false,
                message: "Invalid token. Please login again."
            });
        } else if (error.name === "TokenExpiredError") {
            return res.status(401).json({
                success: false,
                message: "Session expired. Please login again."
            });
        }
        
        return res.status(500).json({
            success: false,
            message: "Authentication error. Please try again."
        });
    }
}

// Verify if user is admin
async function VerifyAdmin(req, res, next) {
    try {
        // First verify the cookie
        await VerifyCookie(req, res, async () => {
            const user = req.user;
            
            if (user.role !== "admin") {
                return res.status(403).json({
                    success: false,
                    message: "Access denied. Admin privileges required."
                });
            }
            
            next();
        });
    } catch (error) {
        return res.status(403).json({
            success: false,
            message: "Admin verification failed!"
        });
    }
}

// Verify if user is owner
async function VerifyOwner(req, res, next) {
    try {
        // First verify the cookie
        await VerifyCookie(req, res, async () => {
            const user = req.user;
            
            if (user.role !== "owner") {
                return res.status(403).json({
                    success: false,
                    message: "Access denied. Owner privileges required."
                });
            }
            
            next();
        });
    } catch (error) {
        return res.status(403).json({
            success: false,
            message: "Owner verification failed!"
        });
    }
}

// Legacy session verification (deprecated)
async function VerifySession(req, res, next) {
    console.warn("VerifySession is deprecated. Please use VerifyCookie instead.");
    try {
        if (!req.session || !req.session.user || !req.session.user.isAuth) {
            return res.status(401).json({
                success: false,
                message: "Please login first!"
            });
        }
        
        await dbConnect();
        const UserSessionFromDB = await UserModel.findById(req.session.user.session._id).select("-password");
        
        if (!UserSessionFromDB) {
            return res.status(401).json({
                success: false,
                message: "User not found. Please login again."
            });
        }
        
        req.user = UserSessionFromDB;
        next();
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: "Something went wrong!"
        });
    }
}

module.exports = {
    VerifyCookie,
    VerifyAdmin,
    VerifyOwner,
    VerifySession // For backward compatibility
};