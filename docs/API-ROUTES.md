# Eqence API Routes (Vercel Serverless Functions)

All API routes are deployed as Vercel serverless functions in the `api/` directory.

## Authentication

### POST /api/auth/register
Register a new merchant account.

**Request:**
```json
{
  "email": "merchant@example.com",
  "password": "SecurePassword123!",
  "name": "My Store",
  "plan": "starter"
}
```

**Response:**
```json
{
  "user": {
    "id": "uuid",
    "email": "merchant@example.com",
    "name": "My Store",
    "plan": "starter"
  },
  "token": "jwt_token"
}
```

### POST /api/auth/login
Login to merchant account.

**Request:**
```json
{
  "email": "merchant@example.com",
  "password": "SecurePassword123!"
}
```

**Response:**
```json
{
  "user": { ... },
  "token": "jwt_token"
}
```

### POST /api/auth/forgot-password
Request password reset link.

**Request:**
```json
{
  "email": "merchant@example.com"
}
```

**Response:**
```json
{
  "message": "If email exists, password reset link has been sent"
}
```

### POST /api/auth/reset-password
Reset password with token.

**Request:**
```json
{
  "token": "reset_token",
  "newPassword": "NewPassword123!"
}
```

**Response:**
```json
{
  "message": "Password reset successfully"
}
```

## Reviews

### GET /api/reviews
List reviews for authenticated user.

**Query Parameters:**
- `platform` (optional): Filter by platform (shopify, google, etc.)
- `sentiment` (optional): Filter by sentiment (positive, negative, neutral)
- `page` (default: 1): Page number
- `limit` (default: 20): Results per page

**Headers:**
```
Authorization: Bearer <jwt_token>
```

**Response:**
```json
{
  "reviews": [...],
  "total": 1247,
  "page": 1,
  "limit": 20
}
```

### GET /api/reviews/stats
Get review statistics and reputation score.

**Headers:**
```
Authorization: Bearer <jwt_token>
```

**Response:**
```json
{
  "total": 1247,
  "avgRating": 4.5,
  "reputationScore": 87,
  "responseRate": 94,
  "sentimentBreakdown": {
    "positive": 1100,
    "neutral": 120,
    "negative": 27
  },
  "platformBreakdown": {
    "shopify": 800,
    "google": 300,
    "facebook": 147
  }
}
```

## Billing

### POST /api/billing/create-charge
Create a payment charge for plan upgrade.

**Request:**
```json
{
  "plan": "premium",
  "amount": 99,
  "currency": "USD"
}
```

**Headers:**
```
Authorization: Bearer <jwt_token>
```

**Response:**
```json
{
  "chargeId": "ch_xxx",
  "status": "pending",
  "amount": 99,
  "currency": "USD",
  "plan": "premium"
}
```

## GDPR

### GET /api/gdpr/export
Export all user data (GDPR right to data portability).

**Headers:**
```
Authorization: Bearer <jwt_token>
```

**Response:**
```json
{
  "exportDate": "2026-05-31T15:30:00Z",
  "user": { ... },
  "reviews": [...],
  "subscriptions": [...],
  "notifications": [...]
}
```

### DELETE /api/gdpr/delete
Delete all user data (GDPR right to be forgotten).

**Headers:**
```
Authorization: Bearer <jwt_token>
```

**Response:**
```json
{
  "message": "All data has been permanently deleted"
}
```

## Health

### GET /api/health
Check API health and database connectivity.

**Response:**
```json
{
  "status": "ok",
  "timestamp": "2026-05-31T15:30:00Z"
}
```

## Environment Variables Required

Set these in Vercel project settings:

- `DATABASE_URL` - PostgreSQL connection string
- `JWT_SECRET` - JWT signing secret (min 32 chars)
- `RESEND_API_KEY` - Resend email API key
- `TAP_API_KEY` - Tap Payments API key
- `OPENAI_API_KEY` - OpenAI API key (for AI responses)

## Error Responses

All errors follow this format:

```json
{
  "error": "Error message"
}
```

Common status codes:
- `400` - Bad Request (missing fields, invalid input)
- `401` - Unauthorized (missing/invalid token)
- `405` - Method Not Allowed
- `409` - Conflict (user already exists)
- `500` - Internal Server Error
