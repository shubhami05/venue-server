const { Schema, default: mongoose } = require("mongoose");

const ContactSchema = new Schema({
    userId: {
        type: Schema.Types.ObjectId,
        ref: "User"
    },
    fullname: {
        type: String,
        required: [true, "Please enter your fullname!"]
    },
    email: {
        type: String,
        required: [true, "Please insert your email"]
    },
    mobile: {
        type: String,
        required: [true, "Please insert your mobile"]
    },
    message: {
        type: String,
        required: [true, "Please insert your Message"]
    },
}, { timestamps: true })

const ContactModel = (mongoose.models.Contact) || mongoose.model("Contact", ContactSchema)

module.exports = { ContactModel }
