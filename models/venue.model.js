const { Schema, default: mongoose } = require("mongoose")

const WithoutFoodRentSchema = new Schema({
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
})
const WithFoodRentSchema = new Schema({
    morning: {
        type: Number,
    },
    evening: {
        type: Number,
    },
    fullday: {
        type: Number,
    },
})
const FoodSchema = new Schema({
    outsideAllowed: {
        type: Boolean,
        required: true
    },
    providedByVenue: {
        type: Boolean,
        required: true
    }
})
const DecorationSchema = new Schema({
    outsideAllowed: {
        type: Boolean,
        required: true
    },
    providedByVenue: {
        type: Boolean,
        required: true
    }
})
const ParkingSchema = new Schema({
    available: {
        type: Boolean,
        required: true
    },
    capacity: {
        type: String,
        required: this.available
    },
})

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
    status: {
        type: String,
        required: true,
        default: "pending",
        enum: ["accepted", "rejected", "pending"]
    },
    type: {
        type: String,
        required: true
    },
    bookingPay: {
        type: Number,
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
    locationURL: {
        type: String
    },
    rooms: {
        type: Number,
        required: true,
        default: 0
    },
    halls: {
        type: Number,
        required: true,
        default: 0
    },
    cancellation: {
        type: Boolean,
        required: true
    },
    otherFacilities: [{
        type: String
    }],
    restrictions: [{
        type: String
    }],
    photos: {
        type: [{
            type: String
        }],
        validate: {
            validator: function(v) {
                return v.length >= 1; // Check if the length of the array is at least 1
            },
            message: props => `At least one photo is required!`
        }
    },
    events: [{
        type: String //Suitable events list
    }],
    withoutFoodRent: WithoutFoodRentSchema,
    withFoodRent: WithFoodRentSchema,//per person rent
    food: FoodSchema,
    decoration: DecorationSchema,
    parking: ParkingSchema,
    amenities: [{
        type: String
    }],
    rules: {
        type: String,
        default: ''
    },
    cancellationPolicy: {
        type: String,
        default: ''
    },
    rating: {
        type: Number,
        default: 0
    },
    reviewCount: {
        type: Number,
        default: 0
    }
}, { timestamps: true })

const VenueModel = (mongoose.models.Venue) || mongoose.model("Venue", VenueSchema)

module.exports = { VenueModel }