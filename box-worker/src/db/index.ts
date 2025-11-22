// Database connection module for Drizzle ORM with Cloudflare D1
// This provides a helper function to initialize the Drizzle instance

import { drizzle } from 'drizzle-orm/d1'
import * as schema from './schema'

// Helper function to create a Drizzle database instance
// Usage: const db = getDb(env.DB)
export function getDb(d1Database: D1Database) {
  return drizzle(d1Database, { schema })
}

// Export schema for use in queries
export { schema }
export * from './schema'
