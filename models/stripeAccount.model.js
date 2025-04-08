const { Schema, default: mongoose } = require("mongoose");

const StripeAccountSchema = new Schema({
    userId: {
        type: Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        unique: true
    },
    stripeAccountId: {
        type: String,
        required: true,
        unique: true
    },
    chargesEnabled: {
        type: Boolean,
        default: false
    },
    payoutsEnabled: {
        type: Boolean,
        default: false
    },
    detailsSubmitted: {
        type: Boolean,
        default: false
    },
    requirements: {
        type: Object,
        default: {}
    },
    accountStatus: {
        type: String,
        enum: ['pending', 'active', 'restricted', 'rejected'],
        default: 'pending'
    }
},
{
    timestamps: true
});

const StripeAccountModel = (mongoose.models.StripeAccount) || mongoose.model("StripeAccount", StripeAccountSchema);

module.exports = { StripeAccountModel }; 