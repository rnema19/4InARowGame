import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import dotenv from 'dotenv';
import * as schema from './schema.js';

dotenv.config();

// Create postgres connection
const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error('DATABASE_URL is not defined in environment variables');
}

// Serverless-optimized postgres connection
// prepare: false is important for serverless/edge functions
// max: 1 limits connection pool for serverless environments
const queryClient = postgres(connectionString, {
  prepare: false,
  max: 1,
});

export const db = drizzle(queryClient, { schema });

// Test connection
queryClient`SELECT 1`
  .then(() => {
    console.log('✅ Connected to Supabase PostgreSQL via Drizzle ORM');
  })
  .catch((err) => {
    console.error('❌ Database connection error:', err);
    process.exit(-1);
  });

export { schema };
