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
  if (req.method !== 'POST') {
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
    const { plan, amount, currency = 'USD' } = req.body;

    if (!plan || !amount) {
      return res.status(400).json({ error: 'Plan and amount required' });
    }

    // TODO: Call Tap Payments API to create charge
    // const tapResponse = await fetch('https://api.tap.company/v2/charges', {
    //   method: 'POST',
    //   headers: {
    //     'Authorization': `Bearer ${process.env.TAP_API_KEY}`,
    //     'Content-Type': 'application/json',
    //   },
    //   body: JSON.stringify({
    //     amount: amount * 100, // Convert to cents
    //     currency,
    //     source: { id: sourceId },
    //     metadata: { userId: decoded.userId, plan },
    //   }),
    // });

    // For now, return mock response
    res.status(200).json({
      chargeId: 'ch_' + Math.random().toString(36).substr(2, 9),
      status: 'pending',
      amount,
      currency,
      plan,
    });
  } catch (err) {
    console.error('[Billing] Error:', err);
    res.status(500).json({ error: 'Failed to create charge' });
  }
}
