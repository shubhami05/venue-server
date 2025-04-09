const { StripeAccountModel } = require("../models/stripeAccount.model");
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

// Middleware to check Stripe account status
const checkStripeAccount = async (req, res, next) => {
    try {
        const user = req.user;
        const localStripeAccount = await StripeAccountModel.findOne({ userId: user._id });
        if (!localStripeAccount) {
            return res.status(400).json({
                success: false,
                message: "Stripe account not connected"
            });
        }

        const stripeAccount = await stripe.accounts.retrieve(localStripeAccount.stripeAccountId);
        // if (!stripeAccount.chargesEnabled) {
        //     return res.status(400).json({
        //         success: false,
        //         message: "Stripe account not fully set up"
        //     });
        // }

        next();
    } catch (error) {
        console.log(error);
        return res.status(400).json({
            success: false,
            message: "Error checking Stripe account status"
        });
    }
};

module.exports = {
    checkStripeAccount
};