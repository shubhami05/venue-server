const mongoose = require('mongoose');

const ownerSupportSchema = new mongoose.Schema({
    ownerId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    subject: {
        type: String,
        required: true,
        trim: true
    },
    message: {
        type: String,
        required: true,
        trim: true
    },
    status: {
        type: String,
        enum: ['pending', 'resolved'],
        default: 'pending'
    },
}, {
    timestamps: true
});

const OwnerSupportModel = mongoose.model('OwnerSupport', ownerSupportSchema);

module.exports = {OwnerSupportModel};
