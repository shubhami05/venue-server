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
    }]
})


const ConfigModel = (mongoose.models.Config) || mongoose.model("Config", ConfigSchema)

module.exports = { ConfigModel }