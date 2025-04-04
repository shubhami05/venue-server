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
    eventType: {
        type: String,
        required: true
    },
    date: {
        type: Date,
        required: true
    },
    message: {
        type: String,
        required: true
    },
}, { timestamps: true })

const InquiryModel = (mongoose.models.Inquiry) || mongoose.model("Inquiry", InquirySchema)

module.exports = { InquiryModel }
