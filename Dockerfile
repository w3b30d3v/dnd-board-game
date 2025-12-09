# D&D Board Game API - Production Dockerfile
FROM node:20-alpine AS base

# Install pnpm
RUN corepack enable && corepack prepare pnpm@9.15.0 --activate

# Set working directory
WORKDIR /app

# Copy package files
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY turbo.json ./

# Copy workspace packages
COPY packages/ ./packages/
COPY services/api-gateway/ ./services/api-gateway/
COPY prisma/ ./prisma/

# Install dependencies
RUN pnpm install --frozen-lockfile

# Generate Prisma client
RUN pnpm db:generate

# Build the API gateway
RUN pnpm --filter @dnd/api-gateway build || true

# Expose port
EXPOSE 4000

# Set environment
ENV NODE_ENV=production
ENV PORT=4000

# Run migrations and start the server
CMD ["sh", "-c", "npx prisma migrate deploy --schema=prisma/schema.prisma && node --import tsx services/api-gateway/src/index.ts"]
