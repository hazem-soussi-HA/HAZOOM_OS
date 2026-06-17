/**
 * HAZOOM OS V3 — Crypto Payment Gateway
 * Creator: Hazem Soussi
 *
 * Supports:
 * - Binance Pay (API integration)
 * - On-chain wallet (BTC, ETH, USDT)
 * - P2P transaction tracking
 * - Webhook payment verification
 */

const crypto = require('crypto');
const https = require('https');
const fs = require('fs');
const path = require('path');

class CryptoPaymentGateway {
    constructor(config = {}) {
        this.binanceApiKey = config.binanceApiKey || process.env.BINANCE_API_KEY;
        this.binanceApiSecret = config.binanceApiSecret || process.env.BINANCE_API_SECRET;
        this.binanceApiUrl = 'https://bpay.binanceapi.com';
        this.wallets = config.wallets || {
            btc: process.env.BTC_WALLET || '',
            eth: process.env.ETH_WALLET || '',
            usdt_trc20: process.env.USDT_TRC20_WALLET || '',
            usdt_erc20: process.env.USDT_ERC20_WALLET || '',
        };
        this.transactions = new Map();
        this.webhooks = [];
    }

    // Generate HMAC signature for Binance Pay
    signRequest(timestamp, nonce, payload) {
        const signature = crypto
            .createHmac('sha512', this.binanceApiSecret)
            .update(`${timestamp}\n${nonce}\n${payload}\n`)
            .digest('hex')
            .toUpperCase();
        return signature;
    }

    // Create Binance Pay order
    async createBinanceOrder(order) {
        const { merchantId, amount, currency, description, returnUrl } = order;

        const timestamp = Date.now();
        const nonce = crypto.randomBytes(16).toString('hex');
        const payload = JSON.stringify({
            merchantId,
            merchantTradeNo: `HAZOOM-${Date.now()}-${crypto.randomBytes(4).toString('hex')}`,
            totalAmount: amount.toString(),
            currency: currency || 'USDT',
            description: description || 'HAZOOM OS Payment',
            returnUrl: returnUrl || '',
            orderExpireTime: 900, // 15 minutes
        });

        const signature = this.signRequest(timestamp, nonce, payload);

        return this._request('POST', '/binancepay/openapi/v2/order', {
            'Content-Type': 'application/json',
            'BinancePay-Timestamp': timestamp,
            'BinancePay-Nonce': nonce,
            'BinancePay-Certificate-SN': this.binanceApiKey,
            'BinancePay-Signature': signature,
        }, payload);
    }

    // Query Binance Pay order status
    async queryOrder(merchantTradeNo) {
        const timestamp = Date.now();
        const nonce = crypto.randomBytes(16).toString('hex');
        const payload = JSON.stringify({ merchantTradeNo });

        const signature = this.signRequest(timestamp, nonce, payload);

        return this._request('POST', '/binancepay/openapi/v2/order/status', {
            'Content-Type': 'application/json',
            'BinancePay-Timestamp': timestamp,
            'BinancePay-Nonce': nonce,
            'BinancePay-Certificate-SN': this.binanceApiKey,
            'BinancePay-Signature': signature,
        }, payload);
    }

    // Generate crypto payment address for direct wallet transfer
    generatePaymentAddress(currency, amount) {
        const wallet = this.wallets[currency.toLowerCase()];
        if (!wallet) {
            throw new Error(`Unsupported currency: ${currency}`);
        }

        const transactionId = `HAZOOM-${Date.now()}-${crypto.randomBytes(4).toString('hex')}`;
        const paymentData = {
            id: transactionId,
            currency: currency.toUpperCase(),
            address: wallet,
            amount: amount,
            status: 'pending',
            createdAt: new Date().toISOString(),
            expiresAt: new Date(Date.now() + 3600000).toISOString(), // 1 hour
        };

        this.transactions.set(transactionId, paymentData);
        return paymentData;
    }

    // Verify on-chain payment (simplified — integrate with blockchain explorer API)
    async verifyOnChainPayment(transactionId, txHash) {
        const payment = this.transactions.get(transactionId);
        if (!payment) {
            throw new Error('Transaction not found');
        }

        // In production, query blockchain explorer (blockchain.info, etherscan, etc.)
        // This is a placeholder for the actual verification logic
        payment.txHash = txHash;
        payment.status = 'verifying';
        this.transactions.set(transactionId, payment);

        return { status: 'verifying', message: 'Payment verification in progress' };
    }

    // Get transaction status
    getTransactionStatus(transactionId) {
        return this.transactions.get(transactionId) || null;
    }

    // List all transactions
    listTransactions() {
        return Array.from(this.transactions.values());
    }

    // Register webhook for payment notifications
    onPayment(callback) {
        this.webhooks.push(callback);
    }

    // Emit payment event
    _emitPaymentEvent(event) {
        this.webhooks.forEach(cb => cb(event));
    }

    // Internal HTTPS request helper
    _request(method, endpoint, headers, body) {
        return new Promise((resolve, reject) => {
            const url = new URL(endpoint, this.binanceApiUrl);
            const options = {
                hostname: url.hostname,
                path: url.pathname,
                method,
                headers,
            };

            const req = https.request(options, (res) => {
                let data = '';
                res.on('data', chunk => data += chunk);
                res.on('end', () => {
                    try {
                        resolve(JSON.parse(data));
                    } catch (e) {
                        resolve({ raw: data });
                    }
                });
            });

            req.on('error', reject);
            if (body) req.write(body);
            req.end();
        });
    }
}

module.exports = CryptoPaymentGateway;
