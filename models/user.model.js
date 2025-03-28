const { Schema, default: mongoose } = require("mongoose")
const jwt = require("jsonwebtoken")

const UserSchema = new Schema({
    fullname: {
        type: String,
        required: [true, "Please enter your fullname!"]
    },
    email: {
        type: String,
        unique: [true, "Email is already registered"],
        required: [true, "Please insert your email"]
    },
    mobile: {
        type: String,
        unique: [true, "Mobile number is already registered"],
        required: [true, "Please insert your mobile"]
    },
    password: {
        type: String,
        required: [true, "Please insert your password"]
    },
    role: {
        type: String,
        default: 'user',
        enum:["admin","owner","user"]
    }
},
    {
        timestamps: true
    }
)

const UserModel = (mongoose.models.User) || mongoose.model("User", UserSchema)

module.exports = { UserModel }