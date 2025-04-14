const { dbConnect } = require("../config/db.config");
const { UserModel } = require("../models/user.model");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const nodemailer = require('nodemailer');

// JWT token generation function
const generateToken = (user) => {
    return jwt.sign(
        { id: user._id, role: user.role },
        process.env.COOKIE_SECRET,
        { expiresIn: "7d" }
    );
};
const generateResetToken = (user) => {
    return jwt.sign(
        { id: user._id, role: user.role },
        process.env.COOKIE_SECRET,
        { expiresIn: "5m" }
    );
};

// Set cookie function
const setCookie = (res, token) => {
    res.cookie("auth_token", token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
        maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
    });
};

async function SignupApi(req, res) {
    try {
        const { fullname, mobile, email, password } = await req.body;
        if (fullname === "" || mobile === "" || email === "" || password === "") {
            return res.status(412).json({
                success: false,
                message: "All fields are required!"
            })
        }

        await dbConnect();

        const isMobileExist = await UserModel.findOne({ mobile });
        if (isMobileExist) {
            return res.status(406).json({
                success: false,
                message: "Mobile number is already registered!"
            })
        }
        const isEmailExist = await UserModel.findOne({ email });
        if (isEmailExist) {
            return res.status(406).json({
                success: false,
                message: "Email address is already registered!"
            })
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        const user = new UserModel({
            fullname,
            email,
            mobile,
            password: hashedPassword
        })
        await user.save();

        // Generate JWT token for the new user
        const token = generateToken(user);

        // Set cookie with the token
        setCookie(res, token);

        return res.status(200).json({
            success: true,
            message: "User created successfully!",
            role: user.role
        })

    } catch (error) {
        return res.status(500).json({
            success: false,
            message: "Something went wrong, Please try again!"
        })
    }
}

async function LoginApi(req, res) {
    try {
        const { email, password } = await req.body;
        if (email === "" || password === "") {
            return res.status(412).json({
                success: false,
                message: "All fields are required!"
            })
        }

        await dbConnect();
        const isUserExist = await UserModel.findOne({
            $or: [
                { email: email },
                { mobile: email }
            ]
        })

        if (!isUserExist) {
            return res.status(404).json({
                success: false,
                message: "Invalid User!"
            })
        }

        const isAuthenticatedUser = await bcrypt.compare(password, isUserExist.password);
        if (!isAuthenticatedUser) {
            return res.status(401).json({
                success: false,
                message: "Invalid Credentials!"
            })
        }

        const UserInfo = await UserModel.findById(isUserExist._id).select("_id email mobile fullname role");

        // Generate JWT token
        const token = generateToken(UserInfo);

        // Set cookie with the token
        setCookie(res, token);

        return res.status(200).json({
            success: true,
            message: "User logged in successfully!",
            role: UserInfo.role
        })

    } catch (error) {
        return res.status(500).json({
            success: false,
            message: "Something went wrong, Please try again!"
        })
    }
}

async function LogoutApi(req, res) {
    try {
        // Clear the auth cookie
        res.clearCookie("auth_token");

        return res.status(200).json({
            success: true,
            message: "User logged out successfully!"
        })

    } catch (error) {
        return res.status(500).json({
            success: false,
            message: "Something went wrong!"
        })
    }
}

async function FetchUserData(req, res) {
    try {
        const UserData = req.user;

        if (!UserData) {
            return res.status(401).json({
                success: false,
                message: "User data not found, please login first!"
            });
        }

        return res.status(200).json({
            success: true,
            message: "User data fetched successfully!",
            userdata: UserData
        });
    }
    catch (error) {
        return res.status(500).json({
            success: false,
            message: "Something went wrong"
        });
    }
}

async function ChangePasswordApi(req, res) {
    try {
        const { currentPassword, newPassword } = req.body;
        const userId = req.user._id;

        if (!currentPassword || !newPassword) {
            return res.status(412).json({
                success: false,
                message: "All fields are required!"
            });
        }

        await dbConnect();
        const user = await UserModel.findById(userId);

        // Verify current password
        const isPasswordValid = await bcrypt.compare(currentPassword, user.password);
        if (!isPasswordValid) {
            return res.status(401).json({
                success: false,
                message: "Current password is incorrect!"
            });
        }

        // Hash new password
        const hashedNewPassword = await bcrypt.hash(newPassword, 10);

        // Update password
        await UserModel.findByIdAndUpdate(userId, {
            password: hashedNewPassword
        });

        return res.status(200).json({
            success: true,
            message: "Password updated successfully!"
        });

    } catch (error) {
        return res.status(500).json({
            success: false,
            message: "Something went wrong, Please try again!"
        });
    }
}

// Forgot Password
async function ForgotPasswordApi(req, res) {
    try {
        const { email } = req.body;
        
        if (!email) {
            return res.status(400).json({
                success: false,
                message: "Email is required"
            });
        }

        await dbConnect();
        
        // Check if user exists
        const user = await UserModel.findOne({ email });
        if (!user) {
            return res.status(404).json({
                success: false,
                message: "No account found with this email"
            });
        }

        // Generate reset token
        const resetToken = generateResetToken(user);

        // Create reset URL
        const resetUrl = `${process.env.FRONTEND_URI}/reset-password/${resetToken}`;


        // Create email transporter
        const transporter = nodemailer.createTransport({
            service: 'gmail',
            auth: {
                user: process.env.EMAIL_USER,
                pass: process.env.EMAIL_PASSWORD
            }
        });

        // Email content
        const mailOptions = {
            from: process.env.EMAIL_USER,
            to: email,
            subject: 'Password Reset Request - VenueServ',
            html: `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                    <h2 style="color: #ea580c;">Password Reset Request</h2>
                    <p>Hello ${user.fullname},</p>
                    <p>We received a request to reset your password for your VenueServ account.</p>
                    <p>Click the button below to reset your password:</p>
                    <div style="text-align: center; margin: 20px 0;">
                        <a href="${resetUrl}" style="background-color: #ea580c; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; display: inline-block;">
                            Reset Password
                        </a>
                    </div>
                    <p>This link will expire in 5 minutes.</p>
                    <p>If you didn't request this password reset, you can safely ignore this email.</p>
                    <p>Best regards,<br>VenueServ Team</p>
                </div>
            `
        };

        // Send email
        await transporter.sendMail(mailOptions);

        return res.status(200).json({
            success: true,
            message: "Password reset link sent to your email"
        });

    } catch (error) {
        console.error("Forgot password error:", error);
        return res.status(500).json({
            success: false,
            message: "Something went wrong. Please try again later."
        });
    }
};

// Reset Password
async function ResetPasswordApi(req, res) {
    try {
        const { token, newPassword } = await req.body;

        if (!token || !newPassword) {
            return res.status(400).json({
                success: false,
                message: "Token and new password are required"
            });
        }
        // Verify token
        const decoded = jwt.verify(token.token,process.env.COOKIE_SECRET);
       
        await dbConnect();
        
        // Find user
        const user = await UserModel.findById(decoded.id);
        // console.log(decoded);
        if (!user) {
            return res.status(404).json({
                success: false,
                message: "User not found"
            });
        }

        // Hash new password
        const hashedPassword = await bcrypt.hash(newPassword, 10);

        // Update password
        user.password = hashedPassword;
        await user.save();

        return res.status(200).json({
            success: true,
            message: "Password reset successfully"
        });

    } catch (error) {
        if (error.name === 'JsonWebTokenError' || error.name === 'TokenExpiredError') {
            return res.status(401).json({
                success: false,
                message: "Invalid or expired token"
            });
        }
        console.log(error);
        return res.status(500).json({
            success: false,
            message: "Something went wrong. Please try again later."
        });
    }
};

module.exports = { 
    SignupApi, 
    LoginApi, 
    LogoutApi, 
    FetchUserData, 
    ChangePasswordApi,
    ForgotPasswordApi,
    ResetPasswordApi
};