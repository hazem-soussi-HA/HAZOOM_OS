# VISA Dashboard Security Configuration
## Security Levels (Aligned with AlphaPony Existing Stack)

### Level 1: Authentication (Google OAuth)
- Reuses `src/auth/google_oauth.py` AuthManager
- Only authorized email (DASHBOARD_AUTHORIZED_EMAIL) can access
- Session validation on all `/api/visa/*` endpoints

### Level 2: Data Encryption (Fernet)
- Reuses `src/crypto/wallet_manager.py` Fernet implementation
- VISA card metadata encrypted at rest in `config/visa_card_encrypted.bin`
- Stripe keys stored in `.env` (never committed to git)

### Level 3: PCI Compliance (Stripe)
- No raw card data touches AlphaPony servers
- Stripe Elements/Checkout for secure card input
- Stripe handles all PCI DSS Level 1 compliance

### Level 4: Transport Security
- HTTPS only (uses existing SSL certs from `config/security/security/`)
- CSRF protection on all POST/PUT/DELETE requests
- Input validation on all API endpoints

### Level 5: Audit & Access Control
- All dashboard actions logged to `logs/visa_dashboard.log`
- Personal dashboard: no multi-user access
- Rate limiting on payout endpoints (1 payout per 24h)
