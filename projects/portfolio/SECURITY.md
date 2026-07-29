# Security Policy

## Supported Versions

| Version | Supported |
|---------|-----------|
| 2.0.x   | ✅ Active  |

## Security Measures

This portfolio is built with security as a first-class concern:

- **Zero production dependencies** with known vulnerabilities (audited via `npm audit`)
- **Content Security Policy (CSP)** headers restrict script/style sources
- **X-Frame-Options: DENY** prevents clickjacking
- **X-Content-Type-Options: nosniff** prevents MIME sniffing
- **Strict-Transport-Security** enforces HTTPS
- **No external trackers, analytics, or telemetry** — zero data collection
- **No eval() or unsafe patterns** in build output (CI-enforced)
- **Secret scanning** in CI pipeline prevents credential leakage
- **Subresource Integrity** for all external resources

## Reporting a Vulnerability

If you find a security issue, please email hazem.soussi@gmail.com.
