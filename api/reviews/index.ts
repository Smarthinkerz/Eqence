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
  const token = getAuthToken(req);
  if (!token) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const decoded = verifyToken(token);
  if (!decoded) {
    return res.status(401).json({ error: 'Invalid token' });
  }

  try {
    if (req.method === 'GET') {
      const { platform, sentiment, page = '1', limit = '20' } = req.query;

      let sql = 'SELECT * FROM reviews WHERE user_id = $1';
      const params: any[] = [decoded.userId];
      let paramCount = 1;

      if (platform) {
        paramCount++;
        sql += ` AND platform = $${paramCount}`;
        params.push(platform);
      }
      if (sentiment) {
        paramCount++;
        sql += ` AND sentiment = $${paramCount}`;
        params.push(sentiment);
      }

      sql += ' ORDER BY review_date DESC';

      const offset = (parseInt(page as string) - 1) * parseInt(limit as string);
      paramCount++;
      sql += ` LIMIT $${paramCount}`;
      params.push(parseInt(limit as string));
      paramCount++;
      sql += ` OFFSET $${paramCount}`;
      params.push(offset);

      const result = await pool.query(sql, params);
      const countResult = await pool.query('SELECT COUNT(*) FROM reviews WHERE user_id = $1', [decoded.userId]);

      res.status(200).json({
        reviews: result.rows,
        total: parseInt(countResult.rows[0].count),
        page: parseInt(page as string),
        limit: parseInt(limit as string),
      });
    } else {
      res.status(405).json({ error: 'Method not allowed' });
    }
  } catch (err) {
    console.error('[Reviews] Error:', err);
    res.status(500).json({ error: 'Failed to fetch reviews' });
  }
}
