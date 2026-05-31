import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import dotenv from 'dotenv';
import { authRouter } from './routes/auth.js';
import { billingRouter } from './routes/billing.js';
import { gdprRouter } from './routes/gdpr.js';
import { reviewsRouter } from './routes/reviews.js';
import { errorHandler } from './middleware/errorHandler.js';
import { rateLimiter } from './middleware/security.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 4000;

// Security middleware
app.use(helmet());
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true,
}));
app.use(express.json({ limit: '10mb' }));
app.use(rateLimiter);

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString(), version: '1.0.0' });
});

// Routes
app.use('/api/auth', authRouter);
app.use('/api/billing', billingRouter);
app.use('/api/gdpr', gdprRouter);
app.use('/api/reviews', reviewsRouter);

// Error handler
app.use(errorHandler);

app.listen(PORT, () => {
  console.log(`[Eqence API] Server running on port ${PORT}`);
  console.log(`[Eqence API] Environment: ${process.env.NODE_ENV || 'development'}`);
});

export default app;
