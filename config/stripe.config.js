const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

// Platform fee percentage (e.g., 10%)
const PLATFORM_FEE_PERCENTAGE = 10;

// Convert percentage to decimal (e.g., 10% -> 0.10)
const PLATFORM_FEE_DECIMAL = PLATFORM_FEE_PERCENTAGE / 100;

module.exports = {
    stripe,
    PLATFORM_FEE_PERCENTAGE,
    PLATFORM_FEE_DECIMAL
}; 