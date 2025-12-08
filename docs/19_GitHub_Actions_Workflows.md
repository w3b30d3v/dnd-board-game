# D&D Digital Board Game Platform
# Document 19: GitHub Actions CI/CD Workflows

---

# 1. Overview

This document contains GitHub Actions workflow files for CI/CD. Create these files in the `.github/workflows/` directory.

---

# 2. Main CI Workflow (.github/workflows/ci.yml)

```yaml
name: CI

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main, develop]

concurrency:
  group: ${{ github.workflow }}-${{ github.ref }}
  cancel-in-progress: true

env:
  NODE_VERSION: '20'
  PNPM_VERSION: '8'
  RUST_VERSION: '1.75'

jobs:
  # ==========================================
  # Lint and Type Check
  # ==========================================
  lint:
    name: Lint & Type Check
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: Setup pnpm
        uses: pnpm/action-setup@v2
        with:
          version: ${{ env.PNPM_VERSION }}

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: ${{ env.NODE_VERSION }}
          cache: 'pnpm'

      - name: Install dependencies
        run: pnpm install --frozen-lockfile

      - name: Run ESLint
        run: pnpm lint

      - name: Run TypeScript type check
        run: pnpm typecheck

      - name: Check formatting
        run: pnpm format:check

  # ==========================================
  # Unit Tests (TypeScript)
  # ==========================================
  test-ts:
    name: TypeScript Tests
    runs-on: ubuntu-latest
    needs: lint
    steps:
      - uses: actions/checkout@v4

      - name: Setup pnpm
        uses: pnpm/action-setup@v2
        with:
          version: ${{ env.PNPM_VERSION }}

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: ${{ env.NODE_VERSION }}
          cache: 'pnpm'

      - name: Install dependencies
        run: pnpm install --frozen-lockfile

      - name: Run unit tests
        run: pnpm test:unit

      - name: Upload coverage
        uses: codecov/codecov-action@v3
        with:
          files: ./coverage/lcov.info
          flags: typescript
          fail_ci_if_error: false

  # ==========================================
  # Rust Tests
  # ==========================================
  test-rust:
    name: Rust Tests
    runs-on: ubuntu-latest
    needs: lint
    defaults:
      run:
        working-directory: services
    steps:
      - uses: actions/checkout@v4

      - name: Setup Rust
        uses: dtolnay/rust-toolchain@stable
        with:
          toolchain: ${{ env.RUST_VERSION }}
          components: clippy, rustfmt

      - name: Cache cargo
        uses: Swatinem/rust-cache@v2
        with:
          workspaces: services

      - name: Check formatting
        run: cargo fmt --all -- --check

      - name: Run clippy
        run: cargo clippy --all-targets --all-features -- -D warnings

      - name: Run tests
        run: cargo test --all

  # ==========================================
  # Golden Scene Tests
  # ==========================================
  test-golden:
    name: Golden Scene Tests
    runs-on: ubuntu-latest
    needs: [test-ts, test-rust]
    services:
      postgres:
        image: postgres:16-alpine
        env:
          POSTGRES_USER: postgres
          POSTGRES_PASSWORD: postgres
          POSTGRES_DB: dnd_test
        ports:
          - 5432:5432
        options: >-
          --health-cmd pg_isready
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5

      redis:
        image: redis:7-alpine
        ports:
          - 6379:6379
        options: >-
          --health-cmd "redis-cli ping"
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5

    steps:
      - uses: actions/checkout@v4

      - name: Setup pnpm
        uses: pnpm/action-setup@v2
        with:
          version: ${{ env.PNPM_VERSION }}

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: ${{ env.NODE_VERSION }}
          cache: 'pnpm'

      - name: Setup Rust
        uses: dtolnay/rust-toolchain@stable
        with:
          toolchain: ${{ env.RUST_VERSION }}

      - name: Cache cargo
        uses: Swatinem/rust-cache@v2
        with:
          workspaces: services

      - name: Install dependencies
        run: pnpm install --frozen-lockfile

      - name: Build Rust services
        run: cargo build --release
        working-directory: services

      - name: Start Rust services
        run: |
          ./services/target/release/rules-engine &
          ./services/target/release/grid-solver &
          sleep 5

      - name: Setup database
        run: |
          pnpm db:generate
          pnpm db:migrate
          pnpm content:seed
        env:
          DATABASE_URL: postgresql://postgres:postgres@localhost:5432/dnd_test

      - name: Run golden tests
        run: pnpm test:golden
        env:
          DATABASE_URL: postgresql://postgres:postgres@localhost:5432/dnd_test
          REDIS_URL: redis://localhost:6379
          RULES_ENGINE_URL: localhost:50051
          GRID_SOLVER_URL: localhost:50052

  # ==========================================
  # Integration Tests
  # ==========================================
  test-integration:
    name: Integration Tests
    runs-on: ubuntu-latest
    needs: [test-ts, test-rust]
    services:
      postgres:
        image: postgres:16-alpine
        env:
          POSTGRES_USER: postgres
          POSTGRES_PASSWORD: postgres
          POSTGRES_DB: dnd_test
        ports:
          - 5432:5432
        options: >-
          --health-cmd pg_isready
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5

      redis:
        image: redis:7-alpine
        ports:
          - 6379:6379

    steps:
      - uses: actions/checkout@v4

      - name: Setup pnpm
        uses: pnpm/action-setup@v2
        with:
          version: ${{ env.PNPM_VERSION }}

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: ${{ env.NODE_VERSION }}
          cache: 'pnpm'

      - name: Install dependencies
        run: pnpm install --frozen-lockfile

      - name: Setup database
        run: |
          pnpm db:generate
          pnpm db:migrate
        env:
          DATABASE_URL: postgresql://postgres:postgres@localhost:5432/dnd_test

      - name: Run integration tests
        run: pnpm test:integration
        env:
          DATABASE_URL: postgresql://postgres:postgres@localhost:5432/dnd_test
          REDIS_URL: redis://localhost:6379

  # ==========================================
  # Build
  # ==========================================
  build:
    name: Build
    runs-on: ubuntu-latest
    needs: [test-golden, test-integration]
    steps:
      - uses: actions/checkout@v4

      - name: Setup pnpm
        uses: pnpm/action-setup@v2
        with:
          version: ${{ env.PNPM_VERSION }}

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: ${{ env.NODE_VERSION }}
          cache: 'pnpm'

      - name: Setup Rust
        uses: dtolnay/rust-toolchain@stable
        with:
          toolchain: ${{ env.RUST_VERSION }}

      - name: Cache cargo
        uses: Swatinem/rust-cache@v2
        with:
          workspaces: services

      - name: Install dependencies
        run: pnpm install --frozen-lockfile

      - name: Build TypeScript packages
        run: pnpm build

      - name: Build Rust services
        run: cargo build --release
        working-directory: services

      - name: Upload build artifacts
        uses: actions/upload-artifact@v4
        with:
          name: build
          path: |
            apps/web/.next
            services/target/release/rules-engine
            services/target/release/grid-solver

  # ==========================================
  # E2E Tests (on main only)
  # ==========================================
  test-e2e:
    name: E2E Tests
    runs-on: ubuntu-latest
    needs: build
    if: github.ref == 'refs/heads/main'
    steps:
      - uses: actions/checkout@v4

      - name: Setup pnpm
        uses: pnpm/action-setup@v2
        with:
          version: ${{ env.PNPM_VERSION }}

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: ${{ env.NODE_VERSION }}
          cache: 'pnpm'

      - name: Install dependencies
        run: pnpm install --frozen-lockfile

      - name: Install Playwright browsers
        run: pnpm exec playwright install --with-deps chromium

      - name: Download build artifacts
        uses: actions/download-artifact@v4
        with:
          name: build

      - name: Start services
        run: |
          docker-compose up -d postgres redis
          sleep 5
          pnpm db:migrate
          pnpm content:seed
          pnpm dev &
          sleep 10
        env:
          DATABASE_URL: postgresql://postgres:postgres@localhost:5432/dnd_dev

      - name: Run E2E tests
        run: pnpm test:e2e

      - name: Upload E2E results
        uses: actions/upload-artifact@v4
        if: failure()
        with:
          name: playwright-report
          path: playwright-report/
```

---

# 3. Deploy Workflow (.github/workflows/deploy.yml)

```yaml
name: Deploy

on:
  push:
    branches: [main]
  workflow_dispatch:
    inputs:
      environment:
        description: 'Environment to deploy to'
        required: true
        default: 'staging'
        type: choice
        options:
          - staging
          - production

env:
  REGISTRY: ghcr.io
  IMAGE_PREFIX: ${{ github.repository }}

jobs:
  # ==========================================
  # Build Docker Images
  # ==========================================
  build-images:
    name: Build Docker Images
    runs-on: ubuntu-latest
    permissions:
      contents: read
      packages: write
    strategy:
      matrix:
        service:
          - api-gateway
          - game-state
          - ws-gateway
          - rules-engine
          - grid-solver
          - web

    steps:
      - uses: actions/checkout@v4

      - name: Set up Docker Buildx
        uses: docker/setup-buildx-action@v3

      - name: Login to Container Registry
        uses: docker/login-action@v3
        with:
          registry: ${{ env.REGISTRY }}
          username: ${{ github.actor }}
          password: ${{ secrets.GITHUB_TOKEN }}

      - name: Extract metadata
        id: meta
        uses: docker/metadata-action@v5
        with:
          images: ${{ env.REGISTRY }}/${{ env.IMAGE_PREFIX }}/${{ matrix.service }}
          tags: |
            type=sha,prefix=
            type=ref,event=branch
            type=raw,value=latest,enable=${{ github.ref == 'refs/heads/main' }}

      - name: Build and push
        uses: docker/build-push-action@v5
        with:
          context: .
          file: ${{ matrix.service == 'rules-engine' || matrix.service == 'grid-solver' && format('services/{0}/Dockerfile', matrix.service) || matrix.service == 'web' && 'apps/web/Dockerfile' || format('services/{0}/Dockerfile', matrix.service) }}
          push: true
          tags: ${{ steps.meta.outputs.tags }}
          labels: ${{ steps.meta.outputs.labels }}
          cache-from: type=gha
          cache-to: type=gha,mode=max

  # ==========================================
  # Deploy to Staging
  # ==========================================
  deploy-staging:
    name: Deploy to Staging
    runs-on: ubuntu-latest
    needs: build-images
    if: github.ref == 'refs/heads/main' || github.event.inputs.environment == 'staging'
    environment:
      name: staging
      url: https://staging.dnd-platform.example.com
    steps:
      - uses: actions/checkout@v4

      - name: Setup kubectl
        uses: azure/setup-kubectl@v3

      - name: Configure kubectl
        run: |
          echo "${{ secrets.KUBE_CONFIG_STAGING }}" | base64 -d > kubeconfig
          export KUBECONFIG=kubeconfig

      - name: Deploy to Kubernetes
        run: |
          kubectl set image deployment/api-gateway api-gateway=${{ env.REGISTRY }}/${{ env.IMAGE_PREFIX }}/api-gateway:${{ github.sha }}
          kubectl set image deployment/game-state game-state=${{ env.REGISTRY }}/${{ env.IMAGE_PREFIX }}/game-state:${{ github.sha }}
          kubectl set image deployment/ws-gateway ws-gateway=${{ env.REGISTRY }}/${{ env.IMAGE_PREFIX }}/ws-gateway:${{ github.sha }}
          kubectl set image deployment/rules-engine rules-engine=${{ env.REGISTRY }}/${{ env.IMAGE_PREFIX }}/rules-engine:${{ github.sha }}
          kubectl set image deployment/grid-solver grid-solver=${{ env.REGISTRY }}/${{ env.IMAGE_PREFIX }}/grid-solver:${{ github.sha }}
          kubectl set image deployment/web web=${{ env.REGISTRY }}/${{ env.IMAGE_PREFIX }}/web:${{ github.sha }}
          kubectl rollout status deployment --timeout=5m

      - name: Run smoke tests
        run: |
          curl -f https://staging.dnd-platform.example.com/health || exit 1

  # ==========================================
  # Deploy to Production
  # ==========================================
  deploy-production:
    name: Deploy to Production
    runs-on: ubuntu-latest
    needs: deploy-staging
    if: github.event.inputs.environment == 'production'
    environment:
      name: production
      url: https://dnd-platform.example.com
    steps:
      - uses: actions/checkout@v4

      - name: Setup kubectl
        uses: azure/setup-kubectl@v3

      - name: Configure kubectl
        run: |
          echo "${{ secrets.KUBE_CONFIG_PRODUCTION }}" | base64 -d > kubeconfig
          export KUBECONFIG=kubeconfig

      - name: Deploy with canary
        run: |
          # Deploy canary (10% traffic)
          kubectl apply -f infra/k8s/canary/
          sleep 60
          
          # Check canary health
          ./scripts/check-canary-health.sh
          
          # Promote to full deployment
          kubectl set image deployment/api-gateway api-gateway=${{ env.REGISTRY }}/${{ env.IMAGE_PREFIX }}/api-gateway:${{ github.sha }}
          kubectl set image deployment/game-state game-state=${{ env.REGISTRY }}/${{ env.IMAGE_PREFIX }}/game-state:${{ github.sha }}
          kubectl set image deployment/ws-gateway ws-gateway=${{ env.REGISTRY }}/${{ env.IMAGE_PREFIX }}/ws-gateway:${{ github.sha }}
          kubectl set image deployment/rules-engine rules-engine=${{ env.REGISTRY }}/${{ env.IMAGE_PREFIX }}/rules-engine:${{ github.sha }}
          kubectl set image deployment/grid-solver grid-solver=${{ env.REGISTRY }}/${{ env.IMAGE_PREFIX }}/grid-solver:${{ github.sha }}
          kubectl set image deployment/web web=${{ env.REGISTRY }}/${{ env.IMAGE_PREFIX }}/web:${{ github.sha }}
          kubectl rollout status deployment --timeout=10m

      - name: Notify on success
        uses: slackapi/slack-github-action@v1
        with:
          payload: |
            {
              "text": "🚀 Production deployment complete: ${{ github.sha }}"
            }
        env:
          SLACK_WEBHOOK_URL: ${{ secrets.SLACK_WEBHOOK }}
```

---

# 4. PR Check Workflow (.github/workflows/pr-check.yml)

```yaml
name: PR Check

on:
  pull_request:
    types: [opened, synchronize, reopened]

jobs:
  # ==========================================
  # Validate PR
  # ==========================================
  validate:
    name: Validate PR
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
        with:
          fetch-depth: 0

      - name: Check commit messages
        uses: wagoid/commitlint-github-action@v5

      - name: Check PR title
        uses: amannn/action-semantic-pull-request@v5
        env:
          GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}

  # ==========================================
  # Size Check
  # ==========================================
  size-check:
    name: Bundle Size Check
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: Setup pnpm
        uses: pnpm/action-setup@v2
        with:
          version: '8'

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'pnpm'

      - name: Install dependencies
        run: pnpm install --frozen-lockfile

      - name: Build
        run: pnpm build

      - name: Check bundle size
        uses: preactjs/compressed-size-action@v2
        with:
          repo-token: ${{ secrets.GITHUB_TOKEN }}
          pattern: './apps/web/.next/static/**/*.js'
          exclude: '{**/*.map,**/node_modules/**}'

  # ==========================================
  # Security Scan
  # ==========================================
  security:
    name: Security Scan
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: Run Trivy vulnerability scanner
        uses: aquasecurity/trivy-action@master
        with:
          scan-type: 'fs'
          scan-ref: '.'
          severity: 'CRITICAL,HIGH'

      - name: Run npm audit
        run: pnpm audit --audit-level=high
        continue-on-error: true
```

---

# 5. Database Migration Workflow (.github/workflows/db-migrate.yml)

```yaml
name: Database Migration

on:
  workflow_dispatch:
    inputs:
      environment:
        description: 'Environment to migrate'
        required: true
        type: choice
        options:
          - staging
          - production
      migration_name:
        description: 'Migration name (optional, for new migrations)'
        required: false

jobs:
  migrate:
    name: Run Migrations
    runs-on: ubuntu-latest
    environment: ${{ github.event.inputs.environment }}
    steps:
      - uses: actions/checkout@v4

      - name: Setup pnpm
        uses: pnpm/action-setup@v2
        with:
          version: '8'

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'pnpm'

      - name: Install dependencies
        run: pnpm install --frozen-lockfile

      - name: Generate Prisma Client
        run: pnpm db:generate

      - name: Run migrations
        run: pnpm db:migrate
        env:
          DATABASE_URL: ${{ secrets.DATABASE_URL }}

      - name: Verify migration
        run: |
          pnpm prisma migrate status
        env:
          DATABASE_URL: ${{ secrets.DATABASE_URL }}
```

---

# 6. Dependabot Configuration (.github/dependabot.yml)

```yaml
version: 2
updates:
  # NPM dependencies
  - package-ecosystem: npm
    directory: /
    schedule:
      interval: weekly
      day: monday
    open-pull-requests-limit: 10
    groups:
      dev-dependencies:
        patterns:
          - '@types/*'
          - 'eslint*'
          - 'prettier'
          - 'typescript'
      test-dependencies:
        patterns:
          - 'vitest'
          - '@testing-library/*'
          - 'playwright'

  # Rust dependencies
  - package-ecosystem: cargo
    directory: /services
    schedule:
      interval: weekly
      day: monday
    open-pull-requests-limit: 5

  # GitHub Actions
  - package-ecosystem: github-actions
    directory: /
    schedule:
      interval: weekly
      day: monday
    open-pull-requests-limit: 5
```

---

# 7. Code Owners (.github/CODEOWNERS)

```
# Default owners
* @team-leads

# Frontend
/apps/web/ @frontend-guild
/packages/ui/ @frontend-guild

# Backend
/services/api-gateway/ @backend-guild
/services/game-state/ @backend-guild
/services/ws-gateway/ @backend-guild

# Gameplay
/services/rules-engine/ @gameplay-guild
/services/grid-solver/ @gameplay-guild
/services/ai-service/ @gameplay-guild

# Infrastructure
/infra/ @platform-guild
/.github/ @platform-guild
/docker-compose*.yml @platform-guild

# Database
/prisma/ @backend-guild @platform-guild

# Proto files
/proto/ @backend-guild @gameplay-guild
```

---

# END OF DOCUMENT 19
