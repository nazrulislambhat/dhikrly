import { neon } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-http';
import * as schema from './schema';

const connectionString = process.env.DATABASE_URL;

export const hasDatabaseConfig = Boolean(
  connectionString &&
  !connectionString.includes('localhost') &&
  !connectionString.includes('postgres:postgres')
);

// Fallback dummy client for build time / when DATABASE_URL is not yet set
const sql = neon(connectionString || 'postgresql://placeholder:placeholder@ep-placeholder.neon.tech/dhikrly');

export const db = drizzle(sql, { schema });

export type Database = typeof db;
export * from './schema';
