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
    status:{
        type:Boolean,
        required:true,
        default:false
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
    //per person rent
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
    timing:{
        morning:{
            from:{
                type:String
            },
            to:{
                type:String
            }
        },
        evening:{
            from:{
                type:String
            },
            to:{
                type:String
            }
        }
    },
    locationURL: {
        type: String
    },
    foodType: {
        type: String,
        required: true
    },
    outsideFood:{
        type:Boolean,
        required:true
    },
    outsideDecoration:{
        type:Boolean,
        required:true
    },
    decorProvided:{
        type:Boolean,
        required:true
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
    cancellation:{
        type:Boolean,
        required:true
    },
    additionFacilities:[{
        type:String
    }],
    restrications:[{
        type:String
    }],
    photos: [{
        type: String
    }]

}, { timestamps: true })

const VenueModel = (mongoose.models.Venue) || mongoose.model("Venue", VenueSchema)

module.exports = { VenueModel }