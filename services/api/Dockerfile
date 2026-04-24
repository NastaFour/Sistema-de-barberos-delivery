# Build stage
FROM node:20-alpine AS builder

WORKDIR /app

# Install openssl (required for Prisma)
RUN apk add --no-cache openssl

# Copy package files
COPY package*.json ./
COPY tsconfig.json ./

# Copy source and prisma schema
COPY src ./src
COPY prisma ./prisma

# Install dependencies
RUN npm ci

# Generate Prisma Client
RUN npx prisma generate

# Build TypeScript code
RUN npm run build

# Production stage
FROM node:20-alpine

WORKDIR /app

# Install openssl for production
RUN apk add --no-cache openssl

COPY --from=builder /app/package*.json ./
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/prisma ./prisma

# Set production environment
ENV NODE_ENV=production
ENV PORT=3001

EXPOSE 3001

# Start the application, running migrations first
CMD ["sh", "-c", "npx prisma migrate deploy && npm start"]
