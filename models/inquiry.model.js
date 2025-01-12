const { Schema, default: mongoose } = require("mongoose");

const InquirySchema = new Schema({
    userId: {
        type: Schema.Types.ObjectId,
        required: true,
        ref: "User"
    },
    venueId: {
        type: Schema.Types.ObjectId,
        required: true,
        ref: "Venue"
    },
    rating: {
        type: Number,
        min:0,
        max:5,
        required: [true, "Please insert your rating"]
    },
    message: {
        type: String,
        required: [true, "Please insert your Message"]
    }
}, { timestamps: true })

const InquiryMode = (mongoose.models.Inquiry) || mongoose.model("Inquiry", InquirySchema)

module.exports = { InquiryMode }
