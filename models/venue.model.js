const { Schema, default: mongoose } = require("mongoose")

const VenueSchema = new Schema({
    name: {
        type: String,
        required: [true, "Venue name is required!"]
    },
    ownerId: {
        type: Schema.Types.ObjectId,
        required: true,
        ref: "User"
    },
    mobile: {
        type: String,
        required: true
    },
    email: {
        type: String,
        required: true
    },
    type: {
        type: String,
        required: true
    },
    address: {
        type: String,
        required: true
    },
    city: {
        type: String,
        required: true
    },
    price: {
        type: Number,
        required: true
    },
    LocationURL: {
        type: String
    },
    foodType: {
        type: String,
        required: true
    },
    parkingSpace: {
        type: Boolean,
        required: true
    }
})

const VenueModel = (mongoose.models.Venue) || mongoose.model("Venue", VenueSchema)

module.exports = { VenueModel }