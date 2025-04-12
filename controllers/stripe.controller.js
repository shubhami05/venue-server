const { stripe, PLATFORM_FEE_DECIMAL } = require('../config/stripe.config');
const { VenueModel } = require('../models/venue.model');
const { BookingModel } = require('../models/booking.model');
const { UserModel } = require('../models/user.model');
const { StripeAccountModel } = require('../models/stripeAccount.model');
const { dbConnect } = require("../config/db.config");

/**
 * Create a Stripe Connect account for a venue owner
 */
async function createConnectAccount(req, res) {
    try {
        const { email, name } = req.body;
        console.log('Creating Stripe account for:', email, name);
        
        // Validate required fields
        if (!email || !name) {
            return res.status(400).json({
                success: false,
                message: 'Email and name are required'
            });
        }
        
        // Create a Stripe Connect account with minimal required fields
        const account = await stripe.accounts.create({
            type: 'express',
            email,
            business_type: 'individual',
            capabilities: {
                card_payments: { requested: true },
                transfers: { requested: true }
            }
        });
        
        console.log('Stripe account created:', account.id);
        
        // Create an account link for onboarding
        const accountLink = await stripe.accountLinks.create({
            account: account.id,
            refresh_url: `${process.env.FRONTEND_URI || 'http://localhost:5173'}/owner/profile?tab=payment&returned=false`,
            return_url: `${process.env.FRONTEND_URI || 'http://localhost:5173'}/owner/profile?tab=payment&returned=true`,
            type: 'account_onboarding'
        });
        
        console.log('Account link created:', accountLink.url);
        
        // Create a new Stripe account record
        const stripeAccount = await StripeAccountModel.create({
            userId: req.user._id,
            stripeAccountId: account.id,
            chargesEnabled: account.charges_enabled,
            payoutsEnabled: account.payouts_enabled,
            detailsSubmitted: account.details_submitted,
            requirements: account.requirements,
            accountStatus: account.charges_enabled ? 'active' : 'pending'
        });
        
        console.log('Stripe account record created:', stripeAccount._id);
        
        return res.status(200).json({
            success: true,
            accountId: account.id,
            accountLink: accountLink.url
        });
    } catch (error) {
        console.error('Error creating Stripe Connect account:', error);
        
        // Check for specific Stripe errors
        if (error.type === 'StripeInvalidRequestError') {
            return res.status(400).json({
                success: false,
                message: 'Invalid request to Stripe',
                error: error.message
            });
        }
        
        return res.status(500).json({
            success: false,
            message: 'Failed to create Stripe Connect account',
            error: error.message
        });
    }
}

/**
 * Create a payment intent for a venue booking
 */
async function createPaymentIntent(req, res) {
    try {
        const { amount, venueId, userId, date, timeslot, numberOfGuest } = req.body;

        // Calculate platform fee and owner earnings
        const platformFee = Math.round(amount * PLATFORM_FEE_DECIMAL);
        const ownerEarnings = amount - platformFee;

        // Create payment intent
        const paymentIntent = await stripe.paymentIntents.create({
            amount: amount * 100, // Convert to cents
            currency: 'inr',
            metadata: {
                venueId,
                userId,
                date,
                timeslot,
                numberOfGuest,
                amount,
                platformFee,
                ownerEarnings
            }
        });

        return res.status(200).json({
            success: true,
            clientSecret: paymentIntent.client_secret
        });
    } catch (error) {
        console.error("Error creating payment intent:", error);
        return res.status(500).json({
            success: false,
            message: "Error creating payment intent",
            error: error.message
        });
    }
}

/**
 * Handle Stripe webhook events
 */
async function handleWebhook(req, res) {
    const sig = req.headers['stripe-signature'];
    const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET;
    
    let event;
    
    try {
        event = stripe.webhooks.constructEvent(req.body, sig, endpointSecret);
    } catch (err) {
        console.error('Webhook signature verification failed:', err.message);
        return res.status(400).send(`Webhook Error: ${err.message}`);
    }
    
    // Handle the event
    switch (event.type) {
        case 'payment_intent.succeeded':
            const paymentIntent = event.data.object;
            await handlePaymentIntentSucceeded(paymentIntent);
            break;
        case 'payment_intent.payment_failed':
            const failedPaymentIntent = event.data.object;
            await handlePaymentIntentFailed(failedPaymentIntent);
            break;
        case 'account.updated':
            const account = event.data.object;
            await handleAccountUpdated(account);
            break;
        default:
            console.log(`Unhandled event type: ${event.type}`);
    }
    
    // Return a 200 response to acknowledge receipt of the event
    res.status(200).json({ received: true });
}

/**
 * Handle successful payment intent
 */
async function handlePaymentIntentSucceeded(paymentIntent) {
    try {
        const { bookingId } = paymentIntent.metadata;
        
        // Update the booking status
        await BookingModel.findByIdAndUpdate(bookingId, {
            paymentStatus: 'completed'
        });
        
        // You can add additional logic here, such as sending notifications
    } catch (error) {
        console.error('Error handling payment intent succeeded:', error);
    }
}

/**
 * Handle failed payment intent
 */
async function handlePaymentIntentFailed(paymentIntent) {
    try {
        const { bookingId } = paymentIntent.metadata;
        
        // Update the booking status
        await BookingModel.findByIdAndUpdate(bookingId, {
            paymentStatus: 'failed'
        });
        
        // You can add additional logic here, such as sending notifications
    } catch (error) {
        console.error('Error handling payment intent failed:', error);
    }
}

/**
 * Handle updated Connect account
 */
async function handleAccountUpdated(account) {
    try {
        // Find the Stripe account with this Stripe account ID
        const stripeAccount = await StripeAccountModel.findOne({ stripeAccountId: account.id });
        
        if (stripeAccount) {
            // Update the Stripe account status
            await StripeAccountModel.findByIdAndUpdate(stripeAccount._id, {
                chargesEnabled: account.charges_enabled,
                payoutsEnabled: account.payouts_enabled,
                detailsSubmitted: account.details_submitted,
                requirements: account.requirements,
                accountStatus: account.charges_enabled ? 'active' : 'pending'
            });
        }
    } catch (error) {
        console.error('Error handling account updated:', error);
    }
}

/**
 * Get the status of a Connect account
 */
async function  getConnectAccountStatus(req, res) {
    try {
        const stripeAccount = await StripeAccountModel.findOne({ userId: req.user._id });
        
        if (!stripeAccount) {
            return res.status(404).json({
                success: false,
                message: 'Stripe Connect account not found'
            });
        }
        
        // Retrieve the latest account information from Stripe
        const account = await stripe.accounts.retrieve(stripeAccount.stripeAccountId);
        
        // Update the local record with the latest information
        await StripeAccountModel.findByIdAndUpdate(stripeAccount._id, {
            chargesEnabled: account.charges_enabled,
            payoutsEnabled: account.payouts_enabled,
            detailsSubmitted: account.details_submitted,
            requirements: account.requirements,
            accountStatus: account.charges_enabled ? 'active' : 'pending'
        });
        
        return res.status(200).json({
            success: true,
            account: {
                id: account.id,
                chargesEnabled: account.charges_enabled,
                payoutsEnabled: account.payouts_enabled,
                detailsSubmitted: account.details_submitted,
                requirements: account.requirements
            }
        });
    } catch (error) {
        console.error('Error getting Connect account status:', error);
        return res.status(500).json({
            success: false,
            message: 'Failed to get Connect account status'
        });
    }
}

/**
 * Create a new account link for an existing Connect account
 */
async function createAccountLink(req, res) {
    try {
        const stripeAccount = await StripeAccountModel.findOne({ userId: req.user._id });
        
        if (!stripeAccount) {
            return res.status(404).json({
                success: false,
                message: 'Stripe Connect account not found'
            });
        }
        
        const accountLink = await stripe.accountLinks.create({
            account: stripeAccount.stripeAccountId,
            refresh_url: `${process.env.FRONTEND_URI || 'http://localhost:5173'}/owner/profile?tab=payment&returned=false`,
            return_url: `${process.env.FRONTEND_URI || 'http://localhost:5173'}/owner/profile?tab=payment&returned=true`,
            type: 'account_onboarding'
        });
        
        return res.status(200).json({
            success: true,
            accountLink: accountLink.url
        });
    } catch (error) {
        console.error('Error creating account link:', error);
        return res.status(500).json({
            success: false,
            message: 'Failed to create account link',
            error: error.message
        });
    }
}

module.exports = {
    createConnectAccount,
    createPaymentIntent,
    handleWebhook,
    getConnectAccountStatus,
    createAccountLink
}; 