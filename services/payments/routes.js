/**
 * HAZOOM OS V3 — Payment API Routes
 * Creator: Hazem Soussi
 */

const express = require('express');
const CryptoPaymentGateway = require('./crypto-gateway');

const router = express.Router();

// Initialize payment gateway
const gateway = new CryptoPaymentGateway({
    wallets: {
        btc: process.env.BTC_WALLET || '',
        eth: process.env.ETH_WALLET || '',
        usdt_trc20: process.env.USDT_TRC20_WALLET || '',
        usdt_erc20: process.env.USDT_ERC20_WALLET || '',
    },
});

// Create crypto payment
router.post('/create', (req, res) => {
    try {
        const { currency, amount, description } = req.body;
        if (!currency || !amount) {
            return res.status(400).json({ error: 'currency and amount required' });
        }
        const payment = gateway.generatePaymentAddress(currency, amount);
        res.json({ success: true, payment });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Check payment status
router.get('/status/:id', (req, res) => {
    const payment = gateway.getTransactionStatus(req.params.id);
    if (!payment) {
        return res.status(404).json({ error: 'Transaction not found' });
    }
    res.json({ success: true, payment });
});

// List all transactions
router.get('/transactions', (req, res) => {
    res.json({ success: true, transactions: gateway.listTransactions() });
});

// Verify on-chain payment
router.post('/verify', (req, res) => {
    const { transactionId, txHash } = req.body;
    if (!transactionId || !txHash) {
        return res.status(400).json({ error: 'transactionId and txHash required' });
    }
    gateway.verifyOnChainPayment(transactionId, txHash)
        .then(result => res.json({ success: true, ...result }))
        .catch(err => res.status(500).json({ error: err.message }));
});

// Binance Pay webhook
router.post('/binance/webhook', (req, res) => {
    const { bizType, data } = req.body;
    console.log(`[Binance Webhook] ${bizType}:`, data);
    gateway._emitPaymentEvent({ type: bizType, data });
    res.json({ success: true });
});

// Get supported currencies
router.get('/currencies', (req, res) => {
    res.json({
        success: true,
        currencies: [
            { code: 'BTC', name: 'Bitcoin', network: 'Bitcoin' },
            { code: 'ETH', name: 'Ethereum', network: 'ERC-20' },
            { code: 'USDT', name: 'Tether', networks: ['TRC-20', 'ERC-20', 'BEP-20'] },
            { code: 'BNB', name: 'Binance Coin', network: 'BEP-20' },
        ],
    });
});

module.exports = router;
module.exports.gateway = gateway;
