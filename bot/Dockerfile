# Build stage
FROM node:20-alpine AS builder

WORKDIR /app

# Copy package files
COPY package*.json ./
COPY shared/package.json ./shared/
COPY bot/package.json ./bot/

# Install dependencies
RUN npm ci --workspace=bot --workspace=shared

# Copy source code
COPY shared/ ./shared/
COPY bot/ ./bot/

# Build
RUN npm run build --workspace=bot

# Production stage
FROM node:20-alpine

WORKDIR /app

# Copy package files
COPY package*.json ./
COPY shared/package.json ./shared/
COPY bot/package.json ./bot/

# Install only production dependencies
RUN npm ci --workspace=bot --workspace=shared --omit=dev

# Copy built files
COPY --from=builder /app/bot/dist ./bot/dist
COPY --from=builder /app/shared/types ./shared/types

# Set working directory to bot
WORKDIR /app/bot

# Start bot
CMD ["npm", "start"]
