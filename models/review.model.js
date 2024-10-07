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
        required: [true, "Please insert your rating"]
    },
    message: {
        type: String,
        required: [true, "Please insert your Message"]
    }
}, { timestamps: true })

const ReviewModel = (mongoose.models.Review) || mongoose.model("Contact", ReviewSchema)

module.exports = { ReviewModel }
