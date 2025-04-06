const { Schema, default: mongoose } = require("mongoose");

const ReviewSchema = new Schema({
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
    },
    ownerReply: {
        message: {
            type: String,
            default: null
        },
        createdAt: {
            type: Date,
            default: null
        }
    }
}, { timestamps: true })

const ReviewModel = (mongoose.models.Review) || mongoose.model("Review", ReviewSchema)

module.exports = { ReviewModel }
