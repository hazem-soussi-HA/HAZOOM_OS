# HAZOOM OS v6.0 — Dockerfile (optimized for local build)
FROM node:20-alpine AS production
WORKDIR /app

# Copy everything including pre-installed node_modules
COPY . .

# Create data directory for Q-learning persistence
RUN mkdir -p /app/data/qlearner

# Expose port
EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD wget -qO- http://localhost:3000/health || exit 1

# Start HAZOOM OS
CMD ["node", "server.js"]
