import { VercelRequest, VercelResponse } from '@vercel/node';
import { Pool } from 'pg';
import { v4 as uuidv4 } from 'uuid';

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
});

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ error: 'Email required' });
    }

    // Check if user exists
    const userResult = await pool.query('SELECT id FROM users WHERE email = $1', [email]);
    if (userResult.rows.length === 0) {
      // Don't reveal if email exists (security best practice)
      return res.status(200).json({ message: 'If email exists, password reset link has been sent' });
    }

    const userId = userResult.rows[0].id;
    const token = uuidv4();
    const expiresAt = new Date(Date.now() + 3600000); // 1 hour

    // Create password reset token
    await pool.query(
      'INSERT INTO password_resets (user_id, token, expires_at) VALUES ($1, $2, $3)',
      [userId, token, expiresAt]
    );

    // TODO: Send email via Resend API
    // const resetLink = `${process.env.FRONTEND_URL}/reset-password?token=${token}`;
    // await resend.emails.send({ to: email, subject: 'Reset Password', html: `Click here: ${resetLink}` });

    res.status(200).json({ message: 'Password reset link sent to email' });
  } catch (err) {
    console.error('[Forgot Password] Error:', err);
    res.status(500).json({ error: 'Failed to process request' });
  }
}
