// Drizzle Kit configuration for Cloudflare D1
// This configures how Drizzle generates and manages migrations

import { defineConfig } from 'drizzle-kit'

export default defineConfig({
  // SQLite dialect for Cloudflare D1
  dialect: 'sqlite',

  // Path to the schema definition
  schema: './src/db/schema.ts',

  // Output directory for generated migrations
  out: './drizzle',

  // Cloudflare D1 driver for remote operations
  // Note: For local development, we'll use wrangler commands
  driver: 'd1-http',

  // Database credentials (only needed for remote D1 operations)
  // For local development, these are not required
  dbCredentials: {
    accountId: process.env.CLOUDFLARE_ACCOUNT_ID || '',
    databaseId: process.env.CLOUDFLARE_DATABASE_ID || '',
    token: process.env.CLOUDFLARE_D1_TOKEN || '',
  },
})
