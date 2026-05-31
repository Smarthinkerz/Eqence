import { Request, Response, NextFunction } from 'express';
import { RateLimiterMemory } from 'rate-limiter-flexible';

const rateLimiterInstance = new RateLimiterMemory({
  points: 100, // requests
  duration: 60, // per 60 seconds
});

const authRateLimiter = new RateLimiterMemory({
  points: 5, // 5 attempts
  duration: 900, // per 15 minutes
  blockDuration: 900, // block for 15 minutes
});

export async function rateLimiter(req: Request, res: Response, next: NextFunction) {
  try {
    const key = req.ip || 'unknown';

    // Stricter rate limiting for auth endpoints
    if (req.path.includes('/auth/login') || req.path.includes('/auth/register')) {
      await authRateLimiter.consume(key);
    } else {
      await rateLimiterInstance.consume(key);
    }

    next();
  } catch (err) {
    res.status(429).json({ error: 'Too many requests. Please try again later.' });
  }
}
