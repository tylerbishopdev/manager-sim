/**
 * Admin API Client
 *
 * Wraps all fetch calls to the /api/admin/* Vercel serverless endpoints.
 * Every function catches errors and returns safe fallbacks (never throws).
 * When the API is unavailable (local dev without vercel dev), callers
 * fall back to localStorage-only mode.
 */

import type { AdminContentBundle } from '../types/admin';

// ── Types ──

export interface BundleResponse {
  content: AdminContentBundle;
  version: number;
  updatedAt: string;
}

export type FetchBundleResult =
  | { status: 'ok'; data: BundleResponse }
  | { status: 'empty' }
  | { status: 'offline' };

export interface ActivityEntry {
  id: number;
  action: string;
  entity_type: string | null;
  entity_id: string | null;
  entity_name: string | null;
  details: Record<string, unknown> | null;
  created_at: string;
}

export type SyncStatus = 'idle' | 'loading' | 'saving' | 'error' | 'offline';

// ── Bundle CRUD ──

export async function fetchBundle(): Promise<FetchBundleResult> {
  try {
    const res = await fetch('/api/admin/bundle', {
      headers: { 'Accept': 'application/json' },
    });
    if (res.status === 404) return { status: 'empty' };
    if (!res.ok) return { status: 'offline' };
    const data: BundleResponse = await res.json();
    return { status: 'ok', data };
  } catch {
    return { status: 'offline' };
  }
}

export async function saveBundle(bundle: AdminContentBundle): Promise<boolean> {
  try {
    const res = await fetch('/api/admin/bundle', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ content: bundle, version: bundle.version }),
    });
    if (res.status === 413) {
      console.warn('[adminApi] Bundle too large for API (>4.5MB). Consider removing large asset data URLs.');
    }
    return res.ok;
  } catch {
    return false;
  }
}

// ── Activity Log ──

export async function fetchActivity(limit = 50): Promise<ActivityEntry[]> {
  try {
    const res = await fetch(`/api/admin/activity?limit=${limit}`);
    if (!res.ok) return [];
    const data = await res.json();
    return data.entries ?? [];
  } catch {
    return [];
  }
}

export async function logActivity(entry: {
  action: string;
  entityType?: string;
  entityId?: string;
  entityName?: string;
  details?: Record<string, unknown>;
}): Promise<void> {
  try {
    await fetch('/api/admin/activity', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(entry),
    });
  } catch {
    // Activity logging is fire-and-forget
  }
}

// ── Schema Setup ──

export async function setupSchema(): Promise<boolean> {
  try {
    const res = await fetch('/api/admin/setup', { method: 'POST' });
    return res.ok;
  } catch {
    return false;
  }
}
