# Hazem Soussi Portfolio — Production Deployment Guide
# Domain: hazem-soussi.com

## Architecture
```
                    ┌─────────────────────┐
                    │   Cloudflare DNS    │
                    │  (SSL + Proxy +     │
                    │   WAF + Cache)      │
                    └──────────┬──────────┘
                               │
                    ┌──────────▼──────────┐
                    │   GitHub Pages      │
                    │  (Static hosting)   │
                    │  hazem-soussi-HA/   │
                    │  portfolio_final    │
                    └─────────────────────┘
```

## Step 1: Purchase Domain
1. Go to https://dash.cloudflare.com → Register domain
2. Search: `hazem-soussi.com`
3. Purchase (at-cost, ~$9.77/year for .com)
4. Enable Cloudflare DNS (automatic)

## Step 2: Configure DNS Records
In Cloudflare DNS dashboard, add:

| Type | Name | Content | Proxy | TTL |
|------|------|---------|-------|-----|
| A | @ | 185.199.108.153 | Proxied | Auto |
| A | @ | 185.199.109.153 | Proxied | Auto |
| A | @ | 185.199.110.153 | Proxied | Auto |
| A | @ | 185.199.111.153 | Proxied | Auto |
| AAAA | @ | 2606:50c0:8000::153 | Proxied | Auto |
| AAAA | @ | 2606:50c0:8001::153 | Proxied | Auto |
| AAAA | @ | 2606:50c0:8002::153 | Proxied | Auto |
| AAAA | @ | 2606:50c0:8003::153 | Proxied | Auto |
| CNAME | www | hazem-soussi-ha.github.io | Proxied | Auto |

## Step 3: GitHub Pages Custom Domain
1. Go to repo Settings → Pages
2. Under "Custom domain", enter: `hazem-soussi.com`
3. Check "Enforce HTTPS"
4. Wait for DNS propagation (5-30 minutes)

## Step 4: Cloudflare SSL/TLS
1. SSL/TLS → Overview → Set to "Full (Strict)"
2. SSL/TLS → Edge Certificates → Enable "Always Use HTTPS"
3. SSL/TLS → Edge Certificates → Enable "HTTP Strict Transport Security (HSTS)"
4. SSL/TLS → Edge Certificates → Minimum TLS Version: TLS 1.2

## Step 5: Cloudflare Security
1. Security → WAF → Enable managed rules
2. Security → Bots → Enable bot fight mode
3. Security → Settings → Security Level: Medium
4. Speed → Optimization → Auto Minify: HTML, CSS, JS
5. Speed → Optimization → Brotli: On

## Step 6: Cloudflare Page Rules (optional)
1. `hazem-soussi.com/*` → Cache Level: Standard, Edge Cache TTL: 4 hours
2. `hazem-soussi.com/assets/*` → Cache Level: Cache Everything, Edge Cache TTL: 1 year

## Step 7: Verify
```bash
# Check DNS propagation
dig hazem-soussi.com +short
dig www.hazem-soussi.com +short

# Check SSL
curl -I https://hazem-soussi.com

# Check headers
curl -I https://hazem-soussi.com | grep -i "strict-transport\|x-frame\|x-content\|content-security"
```

## Docker (Local Development)
```bash
# Build and run locally
docker-compose up --build

# Or just build
docker build -t hazem-soussi-portfolio .

# Run
docker run -p 80:80 hazem-soussi-portfolio
```

## Maintenance
- Domain auto-renews on Cloudflare
- GitHub Pages auto-deploys on push to main
- SSL auto-renews via Cloudflare
- No server to manage, no containers to maintain
- GitHub Actions CI/CD handles build + security scan + deploy
