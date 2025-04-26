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
    paymentStatus: {
        type: String,
        enum: ['pending', 'completed', 'failed', 'refunded'],
        default: 'pending'
    },
    stripePaymentId: {
        type: String
    },
    amount: {
        type: Number,
        required: true
    },
    platformFee: {
        type: Number,
        required: true
    },
    totalAmount: {
        type: Number,
        required: true
    },
    ownerEarnings: {
        type: Number,
        required: true,
        default: 0
    },
    // New fields for owner reservations
    isOwnerReservation: {
        type: Boolean,
        default: false
    },
    eventType: {
        type: String
    },
    isCancelled: {
        type: Boolean,
        default: false
    }
}, { timestamps: true })

const BookingModel = (mongoose.models.Booking) || mongoose.model("Booking", BookingSchema)

module.exports = { BookingModel }