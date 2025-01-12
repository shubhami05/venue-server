const { Schema, default: mongoose } = require("mongoose")

const OwnerApplicationSchema = new Schema({
    userId: {
        type: Schema.Types.ObjectId,
        ref: "User",
        required: true
    },
    status: {
        type: String,
        default: 'pending',
        enum:["accepted","rejected","pending"]
    },
    adharCard: {
        type: String,
        required: [true, "Please upload your Adhar Card"]
    }
},
    {
        timestamps: true
    }
)

const OwnerApplicationModel = (mongoose.models.OwnerApplication) || mongoose.model("OwnerApplication", OwnerApplicationSchema)

module.exports = { OwnerApplicationModel }