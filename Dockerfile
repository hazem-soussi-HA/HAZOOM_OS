# HAZOOM OS v6.0 — Dockerfile
# Multi-stage build for production deployment

FROM node:22-alpine AS production
WORKDIR /app

# Copy package files
COPY package.json ./

# Install production dependencies
RUN npm ci --only=production

# Copy application server code
COPY server.js ./
COPY core/ ./core/
COPY kernel/ ./kernel/
COPY os.html os-v5.html landing.html ./

# Create data directory for Q-learning persistence
RUN mkdir -p /app/data/qlearner

# Expose port
EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD curl -sf http://localhost:3000/health || exit 1

# Start HAZOOM OS
CMD ["node", "server.js"]
