FROM node:20-alpine
WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci --omit=dev

COPY server.js start.sh ./
COPY core/ ./core/
COPY kernel/ ./kernel/
COPY memory/ ./memory/
COPY config/default.json ./config/
COPY services/planet-earth/hazoom-os-launch.sh ./services/planet-earth/

RUN mkdir -p /app/data/qlearner
EXPOSE 3000
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD wget -qO- http://localhost:3000/health || exit 1
CMD ["node", "server.js"]
