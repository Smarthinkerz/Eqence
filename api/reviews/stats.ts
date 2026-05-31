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
    const [totalResult, sentimentResult, platformResult, responseResult] = await Promise.all([
      pool.query('SELECT COUNT(*), AVG(rating) as avg_rating FROM reviews WHERE user_id = $1', [decoded.userId]),
      pool.query('SELECT sentiment, COUNT(*) FROM reviews WHERE user_id = $1 GROUP BY sentiment', [decoded.userId]),
      pool.query('SELECT platform, COUNT(*) FROM reviews WHERE user_id = $1 GROUP BY platform', [decoded.userId]),
      pool.query(
        'SELECT COUNT(*) FILTER (WHERE responded = true) as responded, COUNT(*) as total FROM reviews WHERE user_id = $1',
        [decoded.userId]
      ),
    ]);

    const total = parseInt(totalResult.rows[0].count);
    const avgRating = parseFloat(totalResult.rows[0].avg_rating) || 0;
    const responseRate = total > 0 ? (parseInt(responseResult.rows[0].responded) / parseInt(responseResult.rows[0].total)) * 100 : 0;

    const sentimentBreakdown: Record<string, number> = {};
    sentimentResult.rows.forEach((row: any) => {
      sentimentBreakdown[row.sentiment] = parseInt(row.count);
    });

    const platformBreakdown: Record<string, number> = {};
    platformResult.rows.forEach((row: any) => {
      platformBreakdown[row.platform] = parseInt(row.count);
    });

    const positiveCount = sentimentBreakdown.positive || 0;
    const reputationScore = total > 0 ? Math.round((positiveCount / total) * 100 * 0.6 + avgRating * 20 * 0.4) : 0;

    res.status(200).json({
      total,
      avgRating: Math.round(avgRating * 10) / 10,
      reputationScore,
      responseRate: Math.round(responseRate),
      sentimentBreakdown,
      platformBreakdown,
    });
  } catch (err) {
    console.error('[Reviews Stats] Error:', err);
    res.status(500).json({ error: 'Failed to fetch stats' });
  }
}
