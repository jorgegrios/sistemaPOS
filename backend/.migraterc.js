/**
 * node-pg-migrate configuration
 * Run migrations with: npm run migrate up
 */

require('dotenv').config();

module.exports = {
  databaseUrl: process.env.DATABASE_URL,
  migrationsTable: 'pgmigrations',
  migrationsDirectory: './migrations',
  direction: 'up',
  count: Infinity,
  timestamp: true,
  schema: 'public',
  verbose: true
};








