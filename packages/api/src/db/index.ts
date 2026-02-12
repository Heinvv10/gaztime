// ============================================================================
// Database Connection - Neon PostgreSQL
// ============================================================================

import { config } from 'dotenv';
import { drizzle } from 'drizzle-orm/neon-http';
import { neon } from '@neondatabase/serverless';
import * as schema from './schema.js';

// Load environment variables
config();

// Get database URL from environment
const databaseUrl = process.env.DATABASE_URL;

if (!databaseUrl) {
  throw new Error('DATABASE_URL environment variable is required');
}

// Create Neon connection
const sql = neon(databaseUrl);

// Create Drizzle instance
export const db = drizzle(sql as any, { schema });

// Export schema
export * from './schema.js';

// Helper to close database (for tests - no-op for serverless)
export function closeDb() {
  // Neon serverless driver doesn't require closing
}
