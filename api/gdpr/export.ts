import { VercelRequest, VercelResponse } from '@vercel/node';
import { Pool } from 'pg';
import jwt from 'jsonwebtoken';

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
});

const JWT_SECRET = process.env.JWT_SECRET || 'eqence-jwt-secret-change-in-production';

function getAuthToken(req: VercelRequest): string | null {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith('Bearer ')) return null;
  return authHeader.split(' ')[1];
}

function verifyToken(token: string): { userId: string; email: string } | null {
  try {
    return jwt.verify(token, JWT_SECRET) as { userId: string; email: string };
  } catch {
    return null;
  }
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const token = getAuthToken(req);
  if (!token) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const decoded = verifyToken(token);
  if (!decoded) {
    return res.status(401).json({ error: 'Invalid token' });
  }

  try {
    const [userData, reviewsData, subscriptionData, notificationsData] = await Promise.all([
      pool.query('SELECT id, email, name, store_url, plan, created_at FROM users WHERE id = $1', [decoded.userId]),
      pool.query('SELECT * FROM reviews WHERE user_id = $1', [decoded.userId]),
      pool.query('SELECT * FROM subscriptions WHERE user_id = $1', [decoded.userId]),
      pool.query('SELECT * FROM notifications WHERE user_id = $1', [decoded.userId]),
    ]);

    const exportData = {
      exportDate: new Date().toISOString(),
      user: userData.rows[0],
      reviews: reviewsData.rows,
      subscriptions: subscriptionData.rows,
      notifications: notificationsData.rows,
    };

    // Audit log
    await pool.query('INSERT INTO audit_log (user_id, action, resource) VALUES ($1, $2, $3)', [
      decoded.userId,
      'gdpr.data_export',
      'users',
    ]);

    res.status(200).json(exportData);
  } catch (err) {
    console.error('[GDPR Export] Error:', err);
    res.status(500).json({ error: 'Failed to export data' });
  }
}
