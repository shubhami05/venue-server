const mongoose = require("mongoose");
const { Schema } = mongoose;

const ConfigSchema = new Schema({
    venueTypes:[{
        type:String
    }],
    eventTypes:[{
        type:String
    }],
    cities:[{
        type:String
    }],
    featuredVenues:[{
        type: Schema.Types.ObjectId,
        ref: "Venue"
    }],
    amenities:[{
        type:String
    }]
});

const ConfigModel = (mongoose.models.Config) || mongoose.model("Config", ConfigSchema)

module.exports = { ConfigModel }