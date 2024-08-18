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
        default: 'user'
    }
},
    {
        timestamps: true
    }
)

// UserSchema.methods.generateToken = function () {
//     return jwt.sign(
//         {
//             _id: this._id,
//             role: this.role
//         },
//         process.env.TOKEN_SECRET,
//         {
//             expiresIn: '14d'
//         }
//     )
// }
const UserModel = (mongoose.models.User) || mongoose.model("User", UserSchema)

module.exports = { UserModel }