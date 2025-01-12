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
// const TimingSchema = new Schema({
//     morning: {
//         from: {
//             type: String
//         },
//         to: {
//             type: String
//         }
//     },
//     evening: {
//         from: {
//             type: String
//         },
//         to: {
//             type: String
//         }
//     }
// })
const FoodSchema = new Schema({
    outsideAllowed: {
        type: Boolean,
        required: true
    },
    providedByVenue: {
        type: Boolean,
        required: true
    },
    foodMenu:{
        type:String,
        required:this.providedByVenue
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
    capactiy: {
        type: Number,
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
    // TODO: Add Rs. to pay at advance booking online 
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
    // timing: TimingSchema,
    food: FoodSchema,
    decoration: DecorationSchema,
    parking: ParkingSchema,

}, { timestamps: true })

const VenueModel = (mongoose.models.Venue) || mongoose.model("Venue", VenueSchema)

module.exports = { VenueModel }