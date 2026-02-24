import type { VercelRequest, VercelResponse } from '@vercel/node';
import { getDb } from '../lib/db.js';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    const sql = getDb();

    if (req.method === 'GET') {
      const limit = Math.min(Number(req.query.limit) || 50, 200);

      const rows = await sql`
        SELECT id, action, entity_type, entity_id, entity_name, details, created_at
        FROM admin_activity_log
        ORDER BY created_at DESC
        LIMIT ${limit}
      `;

      return res.status(200).json({ entries: rows });
    }

    if (req.method === 'POST') {
      const { action, entityType, entityId, entityName, details } = req.body;

      if (!action) {
        return res.status(400).json({ error: 'action is required' });
      }

      const detailsStr = details ? JSON.stringify(details) : null;

      await sql`
        INSERT INTO admin_activity_log (action, entity_type, entity_id, entity_name, details)
        VALUES (${action}, ${entityType ?? null}, ${entityId ?? null}, ${entityName ?? null}, ${detailsStr ? `${detailsStr}::jsonb` : null})
      `;

      return res.status(201).json({ ok: true });
    }

    return res.status(405).json({ error: 'Method not allowed' });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    return res.status(500).json({ error: message });
  }
}
