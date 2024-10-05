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
    description: {
        type: String,
        required: true
    },
    rent: {
        morning: {
            type: Number,
            required: true
        },
        evening: {
            type: Number,
            required: true
        },
        fullday: {
            type: Number,
            required: true
        },
    },
    locationURL: {
        type: String
    },
    foodType: {
        type: String,
        required: true
    },
    parkingSpace: {
        type: Boolean,
        required: true
    },
    peopleCapacity: {
        type: Number,
        required: true
    },
    rooms: {
        type: Number,
        required: true
    },
    halls: {
        type: Number,
        required: true
    },
    photos: [{
        type: String
    }]

})

const VenueModel = (mongoose.models.Venue) || mongoose.model("Venue", VenueSchema)

module.exports = { VenueModel }