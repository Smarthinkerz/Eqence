import { VercelRequest, VercelResponse } from '@vercel/node';
import { Pool } from 'pg';
import bcryptjs from 'bcryptjs';

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
});

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { token, newPassword } = req.body;

    if (!token || !newPassword) {
      return res.status(400).json({ error: 'Token and new password required' });
    }

    // Find valid reset token
    const tokenResult = await pool.query(
      'SELECT user_id FROM password_resets WHERE token = $1 AND expires_at > NOW() AND used = false',
      [token]
    );

    if (tokenResult.rows.length === 0) {
      return res.status(400).json({ error: 'Invalid or expired token' });
    }

    const userId = tokenResult.rows[0].user_id;

    // Hash new password
    const passwordHash = await bcryptjs.hash(newPassword, 10);

    // Update user password
    await pool.query('UPDATE users SET password_hash = $1 WHERE id = $2', [passwordHash, userId]);

    // Mark token as used
    await pool.query('UPDATE password_resets SET used = true WHERE token = $1', [token]);

    res.status(200).json({ message: 'Password reset successfully' });
  } catch (err) {
    console.error('[Reset Password] Error:', err);
    res.status(500).json({ error: 'Failed to reset password' });
  }
}
