const { Schema, default: mongoose } = require("mongoose");

const BookingSchema = new Schema({
    venueId: {
        type: Schema.Types.ObjectId,
        required: true,
        ref: "Venue"
    },
    userId: {
        type: Schema.Types.ObjectId,
        required: true,
        ref: "User"
    },
    date: {
        type: Date,
        required: true
    },
    timeslot: {
        // 0-morning, 1-evening, 2-fullday
        type: Number,
        required: true,
        enum:[0,1,2]
    },
    numberOfGuest:{
        type:Number,
        required:true
    },
    confirmed: {
        type: Boolean,
        default: false,
        required: true
    },
    paymentStatus: {
        type: String,
        enum: ['pending', 'completed', 'failed'],
        default: 'pending'
    },
    stripePaymentId: {
        type: String
    },
    amount: {
        type: Number,
        required: true
    }
}, { timestamps: true })

const BookingModel = (mongoose.models.Booking) || mongoose.model("Booking", BookingSchema)

module.exports = { BookingModel }
