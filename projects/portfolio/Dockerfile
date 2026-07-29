# Multi-stage build for Hazem Soussi Portfolio
FROM node:20-alpine AS builder

WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci --production=false
COPY . .
RUN npm run build

FROM nginx:alpine AS production

RUN rm /etc/nginx/conf.d/default.conf

COPY nginx.conf /etc/nginx/conf.d/portfolio.conf
COPY --from=builder /app/dist /usr/share/nginx/html

# Copy certs at build time (override with volume mount in production)
COPY certs/ /etc/nginx/certs/

HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider https://localhost:443/ --no-check-certificate || exit 1

EXPOSE 80 443

CMD ["nginx", "-g", "daemon off;"]
