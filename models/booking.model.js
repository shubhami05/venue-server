const { Schema } = require("mongoose");

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
    price: {
        type: Number,
        required: true
    },
    numberOfGuest:{
        type:Number,
        required:true
    },
    foodType:{
        type:Number,
        requied:true
    }


}, { timestamps: true })

const BookingModel = (mongoose.models.Booking) || mongoose.model("Booking", BookingSchema)

module.exports = { BookingModel }
