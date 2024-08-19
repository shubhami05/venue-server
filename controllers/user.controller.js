const { dbConnect } = require("../config/db.config");
const { UserModel } = require("../models/user.model");
const bcrypt = require("bcryptjs")

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

        return res.status(200).json({
            success: true,
            message: "User created successfully!"
        })

    } catch (error) {
        console.log(error)
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
                message: "All feilds are required!"
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
                message: "User not founded!"
            })
        }

        const isAuthenticatedUser = await bcrypt.compare(password, isUserExist.password);
        if (!isAuthenticatedUser) {
            return res.status(401).json({
                success: false,
                message: "Invalid credentials!"
            })
        }
        const UserInfo = await UserModel.findById(isUserExist._id).select("-password -__v")

        req.session.user = { session: UserInfo, isAuth: true };
        return res.status(200).json({
            success: true,
            message: "User logined successfully!"
        })

    } catch (error) {
        console.log(error)
        return res.status(500).json({
            success: false,
            message: "Something went wrong, Please try again!"
        })
    }
}


async function LogoutApi(req, res) {

}

async function FetchUserData(req, res) {
    try {
        const UserData = await req.user;

        if (!UserData) {
            return res.status(401).json({
                success: false,
                message: "User data not found, please login first!"
            })
        }

        return res.status(200).json({
            success: true,
            message: "User data fetched successfully!",
            userdata: UserData
        })
    }
    catch (error) {
        console.log(error)
        return res.status(500).json({
            success: false,
            message: "Something went wrong"
        })
    }
}


module.exports = { SignupApi, LoginApi, LogoutApi, FetchUserData }