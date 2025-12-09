# API Gateway Dockerfile
FROM node:20-alpine AS base

# Install pnpm
RUN npm install -g pnpm

WORKDIR /app

# Copy workspace files
COPY pnpm-lock.yaml pnpm-workspace.yaml package.json ./
COPY packages/shared/package.json ./packages/shared/
COPY services/api-gateway/package.json ./services/api-gateway/

# Install dependencies
RUN pnpm install --frozen-lockfile

# Copy source code
COPY packages/shared ./packages/shared
COPY services/api-gateway ./services/api-gateway
COPY prisma ./prisma

# Build shared package
RUN pnpm --filter @dnd/shared build

# Generate Prisma client
RUN pnpm db:generate

# Production stage
FROM node:20-alpine AS production

RUN npm install -g pnpm

WORKDIR /app

# Copy from base
COPY --from=base /app/node_modules ./node_modules
COPY --from=base /app/packages ./packages
COPY --from=base /app/services/api-gateway ./services/api-gateway
COPY --from=base /app/prisma ./prisma
COPY --from=base /app/package.json ./package.json
COPY --from=base /app/pnpm-workspace.yaml ./pnpm-workspace.yaml

# Set environment
ENV NODE_ENV=production

EXPOSE 4000

# Start the API gateway
CMD ["node", "--import", "tsx", "services/api-gateway/src/index.ts"]
