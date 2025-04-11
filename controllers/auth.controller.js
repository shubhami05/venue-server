const { dbConnect } = require("../config/db.config");
const { UserModel } = require("../models/user.model");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

// JWT token generation function
const generateToken = (user) => {
    return jwt.sign(
        { id: user._id, role: user.role },
        process.env.COOKIE_SECRET,
        { expiresIn: "7d" }
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

module.exports = { SignupApi, LoginApi, LogoutApi, FetchUserData, ChangePasswordApi }