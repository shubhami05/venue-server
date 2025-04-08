const express = require('express');
const router = express.Router();
const { 
    createConnectAccount, 
    createPaymentIntent, 
    handleWebhook,
    getConnectAccountStatus,
    createAccountLink
} = require('../controllers/stripe.controller');
const { VerifyCookie, VerifyOwner } = require('../middlewares/auth.middleware');

// Webhook endpoint - no authentication required
router.post('/webhook', express.raw({ type: 'application/json' }), handleWebhook);

// Connect account routes - require authentication and ownership
router.post('/connect/create', VerifyCookie, VerifyOwner, createConnectAccount);
router.get('/connect-account-status', VerifyCookie, VerifyOwner, getConnectAccountStatus);
router.post('/create-account-link', VerifyCookie, VerifyOwner, createAccountLink);

// Payment intent routes - require authentication
router.post('/create-payment-intent', VerifyCookie, createPaymentIntent);

module.exports = router; 