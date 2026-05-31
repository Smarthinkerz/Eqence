# Eqence.com — Online Reputation Management for Shopify

AI-powered reputation management platform that helps Shopify merchants monitor, analyze, and respond to customer reviews across all platforms — automatically.

## Architecture

```
┌─────────────────────────────────────────────────────┐
│                    Nginx (SSL)                        │
├─────────────────────────────────────────────────────┤
│  Frontend (React/Vite)  │  Backend API (Express)     │
│  Port 3000              │  Port 4000                 │
├─────────────────────────────────────────────────────┤
│  PostgreSQL             │  Redis                     │
│  Port 5432              │  Port 6379                 │
└─────────────────────────────────────────────────────┘
```

## Tech Stack

**Frontend:**
- React 19 + TypeScript + Vite 7
- Tailwind CSS v4 + shadcn/ui
- Wouter (client-side routing)
- PWA (service worker, manifest)

**Backend:**
- Node.js + Express + TypeScript
- PostgreSQL 16 (database)
- Redis 7 (caching, rate limiting)
- JWT authentication

**Integrations:**
- Tap Payments (subscription billing)
- Resend (transactional emails)
- OpenAI (AI auto-responses)
- Shopify API (store integration)

**Infrastructure:**
- Docker + Docker Compose
- Nginx reverse proxy + SSL (Let's Encrypt)
- GitHub Actions CI/CD

## Quick Start (Development)

```bash
# 1. Start database services
docker compose up -d postgres redis

# 2. Install backend dependencies
cd backend && npm install

# 3. Set up environment
cp ../docs/env-variables.md .env  # Create .env from template

# 4. Run database migrations
npm run migrate

# 5. Start backend
npm run dev

# 6. In another terminal, start frontend
cd .. && pnpm install && pnpm run dev
```

## Production Deployment

```bash
# 1. Set environment variables in .env
# 2. Build and start all services
docker compose -f docker-compose.prod.yml up -d --build

# 3. Initialize SSL certificates
./scripts/init-letsencrypt.sh
```

## Project Structure

```
├── client/                 # React frontend (Vite)
│   ├── src/
│   │   ├── pages/         # Page components
│   │   ├── components/    # Reusable UI components
│   │   ├── contexts/      # React contexts (i18n, theme)
│   │   └── index.css      # Global styles + Tailwind
│   └── index.html         # Entry HTML
├── backend/               # Express API server
│   ├── src/
│   │   ├── routes/        # API routes (auth, billing, reviews, gdpr)
│   │   ├── middleware/    # Auth, security, error handling
│   │   ├── db/            # Database client + schema
│   │   └── index.ts       # Server entry point
│   ├── Dockerfile
│   └── package.json
├── docs/                  # Documentation
├── docker-compose.yml     # Development services
├── docker-compose.prod.yml # Production deployment
├── nginx.conf             # Nginx configuration
└── .gitignore
```

## Features

### Public Frontpage
- Hero section with dashboard mockup
- Features showcase (6 capabilities)
- Pricing (6 tiers: Free → Enterprise)
- How It Works (3 steps)
- Testimonials
- Trust/Security badges
- Multilingual (EN/JA/AR + auto-translate)

### Merchant Dashboard
- Reputation score overview
- Review aggregation (multi-platform)
- Sentiment analysis
- Auto-response engine (AI-powered)
- Trend charts
- Notification center

### Admin CMS
- Frontpage Editor with live preview
- App Editor with live preview
- Analytics dashboard
- User management
- Settings (API keys, credentials, brand assets)

### Authentication
- Self-hosted JWT auth
- Register → Plan selection → Payment
- Forgot/Reset password (Resend email)
- Admin login (separate credentials)

### Internationalization
- IP-based auto-detection (JP → Japanese)
- Hand-crafted: English, Japanese, Arabic
- Auto-translate: All other languages (Google Translate)
- Searchable language dropdown

## Admin Access

- URL: `/admin` (linked from footer)
- Default credentials: `admin@eqence.com` / `Admin@2026!`
- Changeable from CMS Settings tab

## API Endpoints

| Method | Path | Description |
|--------|------|-------------|
| POST | /api/auth/register | Register new merchant |
| POST | /api/auth/login | Login |
| POST | /api/auth/forgot-password | Request password reset |
| POST | /api/auth/reset-password | Reset password with token |
| GET | /api/auth/me | Get current user |
| GET | /api/reviews | List reviews (paginated) |
| GET | /api/reviews/stats | Get review statistics |
| POST | /api/reviews/:id/respond | Respond to review |
| POST | /api/reviews/:id/auto-respond | AI auto-respond |
| POST | /api/billing/create-charge | Create Tap payment |
| POST | /api/billing/webhook | Tap webhook callback |
| GET | /api/billing/subscription | Get subscription status |
| GET | /api/gdpr/export | Export all user data |
| DELETE | /api/gdpr/delete | Delete all user data |
| GET | /api/health | Health check |

## License

Proprietary — All rights reserved.
