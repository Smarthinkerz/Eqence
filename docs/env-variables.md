# Environment Variables

Copy these to a `.env` file in the `backend/` directory before running.

## Database
| Variable | Description | Example |
|----------|-------------|---------|
| DATABASE_URL | PostgreSQL connection string | postgresql://eqence:password@localhost:5432/eqence |
| DB_USER | Database username | eqence |
| DB_PASSWORD | Database password | your_secure_password |
| DB_NAME | Database name | eqence |

## Redis
| Variable | Description | Example |
|----------|-------------|---------|
| REDIS_URL | Redis connection string | redis://localhost:6379 |
| REDIS_PASSWORD | Redis password (production) | your_redis_password |

## Authentication
| Variable | Description | Example |
|----------|-------------|---------|
| JWT_SECRET | JWT signing secret (min 32 chars) | your-jwt-secret-min-32-chars |

## Server
| Variable | Description | Example |
|----------|-------------|---------|
| PORT | Backend server port | 4000 |
| NODE_ENV | Environment | development / production |
| FRONTEND_URL | Frontend URL | http://localhost:3000 |
| BACKEND_URL | Backend URL | http://localhost:4000 |

## Third-Party APIs
| Variable | Description | Example |
|----------|-------------|---------|
| RESEND_API_KEY | Resend email API key | re_... |
| TAP_API_KEY | Tap Payments API key | sk_live_... |
| OPENAI_API_KEY | OpenAI API key (for AI responses) | sk-... |
| SHOPIFY_API_KEY | Shopify API key | shpat_... |
| SHOPIFY_API_SECRET | Shopify API secret | ... |

## Important Notes
- NEVER commit `.env` files to Git
- All API keys are configurable from the Admin CMS Settings tab
- For production, use Docker secrets or a secrets manager
