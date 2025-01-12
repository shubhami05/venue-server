const { Schema } = require("mongoose");

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
        type:Schema.Types.ObjectId,
        ref:"Venue"
    }]
})


const ConfigModel = (mongoose.models.Config) || mongoose.model("Config", ConfigSchema)

module.exports = { ConfigModel }