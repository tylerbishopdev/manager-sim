import type { VercelRequest, VercelResponse } from '@vercel/node';
import { getDb } from '../lib/db';

const BUNDLE_ID = 'default';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    const sql = getDb();

    if (req.method === 'GET') {
      const rows = await sql`
        SELECT content, version, updated_at
        FROM admin_bundles
        WHERE id = ${BUNDLE_ID}
      `;

      if (rows.length === 0) {
        return res.status(404).json({ error: 'No bundle found' });
      }

      return res.status(200).json({
        content: rows[0].content,
        version: rows[0].version,
        updatedAt: rows[0].updated_at,
      });
    }

    if (req.method === 'PUT') {
      const { content, version } = req.body;

      if (!content) {
        return res.status(400).json({ error: 'content is required' });
      }

      const contentStr = JSON.stringify(content);

      await sql`
        INSERT INTO admin_bundles (id, content, version, updated_at)
        VALUES (${BUNDLE_ID}, ${contentStr}::jsonb, ${version ?? 2}, NOW())
        ON CONFLICT (id) DO UPDATE SET
          content = ${contentStr}::jsonb,
          version = ${version ?? 2},
          updated_at = NOW()
      `;

      return res.status(200).json({ ok: true });
    }

    return res.status(405).json({ error: 'Method not allowed' });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    return res.status(500).json({ error: message });
  }
}
