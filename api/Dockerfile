# Build stage
FROM node:20-alpine AS builder

WORKDIR /app

# Copy package files
COPY package*.json ./
COPY shared/package.json ./shared/
COPY api/package.json ./api/

# Install dependencies
RUN npm ci --workspace=api --workspace=shared

# Copy source code
COPY shared/ ./shared/
COPY api/ ./api/

# Build
RUN npm run build --workspace=api

# Production stage
FROM node:20-alpine

WORKDIR /app

# Copy package files
COPY package*.json ./
COPY shared/package.json ./shared/
COPY api/package.json ./api/

# Install only production dependencies
RUN npm ci --workspace=api --workspace=shared --omit=dev

# Copy built files
COPY --from=builder /app/api/dist ./api/dist
COPY --from=builder /app/api/migrations ./api/migrations
COPY --from=builder /app/shared/types ./shared/types

# Set working directory to api
WORKDIR /app/api

# Expose port
EXPOSE 3000

# Run migrations and start server
CMD ["sh", "-c", "npm run migrate && npm start"]
