const { dbConnect } = require("../config/db.config");
const { UserModel } = require("../models/user.model");

async function RegisterOwner(req, res) {
    try {
        const UserSession = await req.user;
        if (!UserSession) {
            return res.status(404).json({
                success: false,
                message: 'User session not found'
            })
        }
        await dbConnect();
        const UserData = await UserModel.findById(UserSession._id);

        if (!UserData) {
            return res.status(404).json({
                success: false,
                message: "User not founded!"
            })
        }

        const { adharCard } = await req.body;
        const response = new OwnerApplicationModel({
            userId: UserData._id,
            adharCard: adharCard
        })
        await response.save();

        return res.status(200).json({
            success: true,
            message: "Owner Application Submitted Successfully!"
        })

    }
    catch (error) {
        console.log(error);
        return res.status(500).json({
            success: false,
            message: "Something went wrong!"
        })
    }
}

module.exports = { RegisterOwner };