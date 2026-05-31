import { Router, Request, Response } from 'express';
import { query } from '../db/client.js';
import { authMiddleware } from '../middleware/auth.js';

export const reviewsRouter = Router();

// GET /api/reviews
reviewsRouter.get('/', authMiddleware, async (req: Request, res: Response) => {
  try {
    const userId = (req as any).userId;
    const { platform, sentiment, page = '1', limit = '20' } = req.query;

    let sql = 'SELECT * FROM reviews WHERE user_id = $1';
    const params: any[] = [userId];
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

    const result = await query(sql, params);

    // Get total count
    const countResult = await query('SELECT COUNT(*) FROM reviews WHERE user_id = $1', [userId]);
    const total = parseInt(countResult.rows[0].count);

    res.json({ reviews: result.rows, total, page: parseInt(page as string), limit: parseInt(limit as string) });
  } catch (err) {
    console.error('[Reviews] Fetch error:', err);
    res.status(500).json({ error: 'Failed to fetch reviews' });
  }
});

// GET /api/reviews/stats
reviewsRouter.get('/stats', authMiddleware, async (req: Request, res: Response) => {
  try {
    const userId = (req as any).userId;

    const [totalResult, sentimentResult, platformResult, responseResult] = await Promise.all([
      query('SELECT COUNT(*), AVG(rating) as avg_rating FROM reviews WHERE user_id = $1', [userId]),
      query('SELECT sentiment, COUNT(*) FROM reviews WHERE user_id = $1 GROUP BY sentiment', [userId]),
      query('SELECT platform, COUNT(*) FROM reviews WHERE user_id = $1 GROUP BY platform', [userId]),
      query('SELECT COUNT(*) FILTER (WHERE responded = true) as responded, COUNT(*) as total FROM reviews WHERE user_id = $1', [userId]),
    ]);

    const total = parseInt(totalResult.rows[0].count);
    const avgRating = parseFloat(totalResult.rows[0].avg_rating) || 0;
    const responseRate = total > 0 ? (parseInt(responseResult.rows[0].responded) / parseInt(responseResult.rows[0].total)) * 100 : 0;

    const sentimentBreakdown: Record<string, number> = {};
    sentimentResult.rows.forEach((row: any) => { sentimentBreakdown[row.sentiment] = parseInt(row.count); });

    const platformBreakdown: Record<string, number> = {};
    platformResult.rows.forEach((row: any) => { platformBreakdown[row.platform] = parseInt(row.count); });

    // Calculate reputation score (weighted average)
    const positiveCount = sentimentBreakdown.positive || 0;
    const reputationScore = total > 0 ? Math.round((positiveCount / total) * 100 * 0.6 + avgRating * 20 * 0.4) : 0;

    res.json({
      total,
      avgRating: Math.round(avgRating * 10) / 10,
      reputationScore,
      responseRate: Math.round(responseRate),
      sentimentBreakdown,
      platformBreakdown,
    });
  } catch (err) {
    console.error('[Reviews] Stats error:', err);
    res.status(500).json({ error: 'Failed to fetch stats' });
  }
});

// POST /api/reviews/:id/respond
reviewsRouter.post('/:id/respond', authMiddleware, async (req: Request, res: Response) => {
  try {
    const userId = (req as any).userId;
    const { id } = req.params;
    const { responseText } = req.body;

    if (!responseText) return res.status(400).json({ error: 'Response text required' });

    const result = await query(
      'UPDATE reviews SET responded = true, response_text = $1, response_date = NOW() WHERE id = $2 AND user_id = $3 RETURNING *',
      [responseText, id, userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Review not found' });
    }

    res.json({ review: result.rows[0] });
  } catch (err) {
    console.error('[Reviews] Respond error:', err);
    res.status(500).json({ error: 'Failed to respond to review' });
  }
});

// POST /api/reviews/:id/auto-respond
reviewsRouter.post('/:id/auto-respond', authMiddleware, async (req: Request, res: Response) => {
  try {
    const userId = (req as any).userId;
    const { id } = req.params;
    const openaiKey = process.env.OPENAI_API_KEY;

    if (!openaiKey) {
      return res.status(400).json({ error: 'OpenAI API key not configured. Set it in CMS Settings.' });
    }

    // Get the review
    const reviewResult = await query('SELECT * FROM reviews WHERE id = $1 AND user_id = $2', [id, userId]);
    if (reviewResult.rows.length === 0) {
      return res.status(404).json({ error: 'Review not found' });
    }

    const review = reviewResult.rows[0];

    // Generate response using OpenAI
    const aiResponse = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openaiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          { role: 'system', content: 'You are a professional customer service representative. Generate a brief, warm, and professional response to this customer review. Keep it under 100 words.' },
          { role: 'user', content: `Review (${review.rating}/5 stars): "${review.text}"` },
        ],
        max_tokens: 200,
      }),
    });

    const aiData = await aiResponse.json();
    const responseText = aiData.choices?.[0]?.message?.content || 'Thank you for your feedback!';

    // Save response
    await query(
      'UPDATE reviews SET responded = true, response_text = $1, response_date = NOW() WHERE id = $2',
      [responseText, id]
    );

    res.json({ responseText });
  } catch (err) {
    console.error('[Reviews] Auto-respond error:', err);
    res.status(500).json({ error: 'Failed to generate auto-response' });
  }
});
