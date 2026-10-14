# Production Dockerfile for SmartFace Node.js API Gateway
FROM node:20-alpine AS builder

WORKDIR /app

COPY package*.json ./
RUN npm ci --no-audit --no-fund

COPY . .

FROM node:20-alpine AS runner

WORKDIR /app

ENV NODE_ENV=production
ENV PORT=5000

COPY package*.json ./
RUN npm ci --only=production --no-audit --no-fund

COPY --from=builder /app/src ./src
COPY --from=builder /app/public ./public

EXPOSE 5000

CMD ["node", "src/app.js"]
