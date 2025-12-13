FROM node:20-slim

# Install pnpm
RUN npm install -g pnpm

# Set working directory to repo root
WORKDIR /app

# Copy root package files
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY tsconfig.base.json ./

# Copy shared package
COPY packages/shared ./packages/shared

# Copy ws-gateway service
COPY services/ws-gateway ./services/ws-gateway

# Install dependencies
RUN pnpm install --frozen-lockfile

# Build shared package first
RUN pnpm --filter @dnd/shared build

# Build ws-gateway
RUN pnpm --filter @dnd/ws-gateway build

# Set working directory to ws-gateway
WORKDIR /app/services/ws-gateway

# Expose port
EXPOSE 4001

# Start the server
CMD ["node", "dist/index.js"]
