import { Router, Request, Response } from 'express';
import { query } from '../db/client.js';
import { authMiddleware } from '../middleware/auth.js';

export const gdprRouter = Router();

// GET /api/gdpr/export - Export all user data
gdprRouter.get('/export', authMiddleware, async (req: Request, res: Response) => {
  try {
    const userId = (req as any).userId;

    const [userData, reviewsData, subscriptionData, notificationsData] = await Promise.all([
      query('SELECT id, email, name, store_url, plan, created_at FROM users WHERE id = $1', [userId]),
      query('SELECT * FROM reviews WHERE user_id = $1', [userId]),
      query('SELECT * FROM subscriptions WHERE user_id = $1', [userId]),
      query('SELECT * FROM notifications WHERE user_id = $1', [userId]),
    ]);

    const exportData = {
      exportDate: new Date().toISOString(),
      user: userData.rows[0],
      reviews: reviewsData.rows,
      subscriptions: subscriptionData.rows,
      notifications: notificationsData.rows,
    };

    // Audit log
    await query(
      'INSERT INTO audit_log (user_id, action, resource) VALUES ($1, $2, $3)',
      [userId, 'gdpr.data_export', 'users']
    );

    res.json(exportData);
  } catch (err) {
    console.error('[GDPR] Export error:', err);
    res.status(500).json({ error: 'Failed to export data' });
  }
});

// DELETE /api/gdpr/delete - Delete all user data (right to be forgotten)
gdprRouter.delete('/delete', authMiddleware, async (req: Request, res: Response) => {
  try {
    const userId = (req as any).userId;

    // Delete in order (respecting foreign keys)
    await query('DELETE FROM notifications WHERE user_id = $1', [userId]);
    await query('DELETE FROM response_templates WHERE user_id = $1', [userId]);
    await query('DELETE FROM reviews WHERE user_id = $1', [userId]);
    await query('DELETE FROM subscriptions WHERE user_id = $1', [userId]);
    await query('DELETE FROM password_resets WHERE user_id = $1', [userId]);

    // Anonymize audit log (keep for compliance but remove PII)
    await query('UPDATE audit_log SET user_id = NULL WHERE user_id = $1', [userId]);

    // Delete user
    await query('DELETE FROM users WHERE id = $1', [userId]);

    res.json({ message: 'All data has been permanently deleted' });
  } catch (err) {
    console.error('[GDPR] Delete error:', err);
    res.status(500).json({ error: 'Failed to delete data' });
  }
});
