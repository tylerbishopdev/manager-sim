import { neon } from '@neondatabase/serverless';

export function getDb() {
  const databaseUrl =
    process.env.DATABASE_URL ??
    process.env.STORAGE_DATABASE_URL ??
    process.env.STORAGE_POSTGRES_URL;
  if (!databaseUrl) {
    throw new Error(
      'No database URL found. Set DATABASE_URL, STORAGE_DATABASE_URL, or STORAGE_POSTGRES_URL.',
    );
  }
  return neon(databaseUrl);
}
