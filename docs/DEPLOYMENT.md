# D&D Board Game - Deployment Guide

This guide covers deploying the D&D Board Game platform to a public server with password protection.

## Quick Start with Railway (Recommended)

Railway is the easiest way to deploy. It provides free PostgreSQL and Redis.

### Step 1: Create Railway Account
1. Go to [railway.app](https://railway.app)
2. Sign up with GitHub

### Step 2: Create New Project
1. Click "New Project"
2. Choose "Deploy from GitHub repo"
3. Select your `dnd-board-game` repository

### Step 3: Add Services
Railway will auto-detect the project. Add these services:

1. **PostgreSQL Database**
   - Click "New" → "Database" → "PostgreSQL"
   - Railway auto-provides `DATABASE_URL`

2. **Redis**
   - Click "New" → "Database" → "Redis"
   - Railway auto-provides `REDIS_URL`

### Step 4: Configure Environment Variables
Click on your app service and add these variables:

```env
# Required
JWT_SECRET=generate-a-32-char-random-string
NODE_ENV=production

# Password Protection
ENABLE_BASIC_AUTH=true
SITE_USERNAME=admin
SITE_PASSWORD=your-secure-password

# NanoBanana AI
NANOBANANA_API_KEY=your-api-key
CALLBACK_BASE_URL=https://your-app.up.railway.app
```

**Important:** Set `CALLBACK_BASE_URL` to your Railway app's public URL (shown in Settings → Domains).

### Step 5: Deploy
Railway auto-deploys on every git push. Your app will be live at:
- `https://your-app.up.railway.app`

---

## Alternative: Deploy with Render

### Step 1: Create Render Account
1. Go to [render.com](https://render.com)
2. Sign up with GitHub

### Step 2: Create Services

**Create PostgreSQL:**
1. New → PostgreSQL
2. Name: `dnd-postgres`
3. Copy the Internal Database URL

**Create Redis:**
1. New → Redis
2. Name: `dnd-redis`
3. Copy the Internal URL

**Create Web Service (API):**
1. New → Web Service
2. Connect your repo
3. Build Command: `pnpm install && pnpm db:generate && pnpm --filter @dnd/api-gateway build`
4. Start Command: `node --import tsx services/api-gateway/src/index.ts`
5. Add environment variables (see below)

**Create Web Service (Frontend):**
1. New → Web Service
2. Connect your repo
3. Build Command: `pnpm install && pnpm --filter @dnd/web build`
4. Start Command: `cd apps/web && npm start`

### Environment Variables for Render

```env
DATABASE_URL=your-postgres-internal-url
REDIS_URL=your-redis-internal-url
JWT_SECRET=your-secret
NODE_ENV=production
ENABLE_BASIC_AUTH=true
SITE_USERNAME=admin
SITE_PASSWORD=your-password
NANOBANANA_API_KEY=your-key
CALLBACK_BASE_URL=https://your-api.onrender.com
NEXT_PUBLIC_API_URL=https://your-api.onrender.com
```

---

## Alternative: Deploy with Docker Compose

For VPS deployment (DigitalOcean, Linode, AWS EC2, etc.)

### Step 1: SSH into your server
```bash
ssh user@your-server-ip
```

### Step 2: Install Docker
```bash
curl -fsSL https://get.docker.com | sh
sudo usermod -aG docker $USER
```

### Step 3: Clone the repo
```bash
git clone https://github.com/your-username/dnd-board-game.git
cd dnd-board-game
```

### Step 4: Create .env file
```bash
cp .env.production.example .env
nano .env  # Edit with your values
```

### Step 5: Deploy
```bash
docker-compose -f docker-compose.prod.yml up -d --build
```

### Step 6: Run database migrations
```bash
docker exec dnd-api-prod npx prisma migrate deploy
```

---

## Password Protection

The staging site is protected with HTTP Basic Auth.

### How it works:
- When `ENABLE_BASIC_AUTH=true`, all routes require username/password
- Exception: `/health` and `/api/media/webhook/*` (for NanoBanana callbacks)

### Accessing the protected site:
1. Open the site URL in browser
2. Enter username and password when prompted
3. Browser remembers credentials for the session

### Disabling for production:
When ready to go live, set:
```env
ENABLE_BASIC_AUTH=false
```

---

## Verifying NanoBanana Integration

After deployment, test AI portrait generation:

1. Log in to the protected site
2. Go to Create Character
3. Select a race and class
4. Click "✨ AI Portrait"
5. Wait 30-60 seconds for image generation

Check logs if it fails:
```bash
# Railway
railway logs

# Docker
docker logs dnd-api-prod
```

---

## Troubleshooting

### "Callback URL not configured"
- Ensure `CALLBACK_BASE_URL` is set to your public URL
- URL must be HTTPS and publicly accessible

### "NanoBanana API error: 404"
- Verify your API key is correct
- Check API key has credits remaining

### Database connection errors
- Ensure `DATABASE_URL` is correct
- Run `npx prisma migrate deploy` if tables don't exist

### Basic auth not working
- Verify `ENABLE_BASIC_AUTH=true` (string, not boolean)
- Check `SITE_PASSWORD` is set

---

## Environment Variable Reference

| Variable | Required | Description |
|----------|----------|-------------|
| `DATABASE_URL` | Yes | PostgreSQL connection string |
| `REDIS_URL` | Yes | Redis connection string |
| `JWT_SECRET` | Yes | Secret for JWT signing (min 32 chars) |
| `ENABLE_BASIC_AUTH` | No | Enable password protection (`true`/`false`) |
| `SITE_USERNAME` | No | Basic auth username (default: `admin`) |
| `SITE_PASSWORD` | No* | Basic auth password (*required if auth enabled) |
| `NANOBANANA_API_KEY` | No | NanoBanana API key for AI images |
| `CALLBACK_BASE_URL` | No* | Public URL for webhooks (*required for AI images) |
| `NEXT_PUBLIC_API_URL` | Yes | API URL for frontend |
| `NODE_ENV` | No | Environment (`production`/`development`) |
| `PORT` | No | API port (default: 4000) |
