import { Router, Request, Response } from 'express';
import { query } from '../db/client.js';
import { authMiddleware } from '../middleware/auth.js';

export const billingRouter = Router();

const TAP_API_URL = 'https://api.tap.company/v2';

// POST /api/billing/create-charge
billingRouter.post('/create-charge', authMiddleware, async (req: Request, res: Response) => {
  try {
    const { plan } = req.body;
    const userId = (req as any).userId;
    const tapKey = process.env.TAP_API_KEY;

    if (!tapKey) {
      return res.status(500).json({ error: 'Payment system not configured' });
    }

    const prices: Record<string, number> = {
      starter: 29, basic: 59, advance: 99, premium: 199, enterprise: 499,
    };

    const amount = prices[plan];
    if (!amount) return res.status(400).json({ error: 'Invalid plan' });

    // Get user info
    const userResult = await query('SELECT email, name FROM users WHERE id = $1', [userId]);
    const user = userResult.rows[0];

    // Create Tap charge
    const response = await fetch(`${TAP_API_URL}/charges`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${tapKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        amount,
        currency: 'USD',
        customer: {
          first_name: user.name.split(' ')[0],
          last_name: user.name.split(' ').slice(1).join(' ') || '',
          email: user.email,
        },
        source: { id: 'src_all' },
        redirect: { url: `${process.env.FRONTEND_URL}/dashboard?payment=success` },
        post: { url: `${process.env.BACKEND_URL || 'http://localhost:4000'}/api/billing/webhook` },
        description: `Eqence ${plan.charAt(0).toUpperCase() + plan.slice(1)} Plan - Monthly`,
        metadata: { user_id: userId, plan },
      }),
    });

    const data = await response.json();

    if (data.transaction?.url) {
      res.json({ checkout_url: data.transaction.url, charge_id: data.id });
    } else {
      res.status(400).json({ error: 'Failed to create payment', details: data });
    }
  } catch (err) {
    console.error('[Billing] Create charge error:', err);
    res.status(500).json({ error: 'Payment processing failed' });
  }
});

// POST /api/billing/webhook (Tap callback)
billingRouter.post('/webhook', async (req: Request, res: Response) => {
  try {
    const { id, status, metadata } = req.body;

    if (status === 'CAPTURED' && metadata?.user_id && metadata?.plan) {
      // Update user plan
      await query('UPDATE users SET plan = $1, updated_at = NOW() WHERE id = $2', [metadata.plan, metadata.user_id]);

      // Create/update subscription record
      await query(
        `INSERT INTO subscriptions (user_id, plan, status, tap_subscription_id, current_period_start, current_period_end)
         VALUES ($1, $2, 'active', $3, NOW(), NOW() + INTERVAL '30 days')
         ON CONFLICT (user_id) DO UPDATE SET plan = $2, status = 'active', tap_subscription_id = $3, current_period_end = NOW() + INTERVAL '30 days', updated_at = NOW()`,
        [metadata.user_id, metadata.plan, id]
      );

      // Audit log
      await query(
        'INSERT INTO audit_log (user_id, action, resource, details) VALUES ($1, $2, $3, $4)',
        [metadata.user_id, 'billing.payment_captured', 'subscriptions', JSON.stringify({ charge_id: id, plan: metadata.plan })]
      );
    }

    res.json({ received: true });
  } catch (err) {
    console.error('[Billing] Webhook error:', err);
    res.status(500).json({ error: 'Webhook processing failed' });
  }
});

// GET /api/billing/subscription
billingRouter.get('/subscription', authMiddleware, async (req: Request, res: Response) => {
  try {
    const userId = (req as any).userId;
    const result = await query('SELECT * FROM subscriptions WHERE user_id = $1 ORDER BY created_at DESC LIMIT 1', [userId]);
    res.json({ subscription: result.rows[0] || null });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch subscription' });
  }
});
