import { Pool } from 'pg';
import { drizzle } from 'drizzle-orm/node-postgres';
import * as schema from '../shared/schema';

async function main() {
  console.log('Initializing database...');
  
  if (!process.env.DATABASE_URL) {
    console.error('DATABASE_URL not set');
    process.exit(1);
  }
  
  const pool = new Pool({ connectionString: process.env.DATABASE_URL });
  const db = drizzle(pool, { schema });
  
  // Create tables based on schema
  try {
    console.log('Creating tables...');
    
    // Create users table first since it's referenced by other tables
    await pool.query(`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        username VARCHAR(255) NOT NULL UNIQUE,
        password VARCHAR(255) NOT NULL,
        "isAdmin" BOOLEAN NOT NULL DEFAULT FALSE,
        "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      )
    `);
    
    // Create businesses table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS businesses (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        description TEXT NOT NULL,
        category VARCHAR(255) NOT NULL,
        address VARCHAR(255) NOT NULL,
        phone VARCHAR(20),
        website VARCHAR(255),
        latitude DOUBLE PRECISION NOT NULL,
        longitude DOUBLE PRECISION NOT NULL,
        "imageUrl" VARCHAR(255),
        "createdBy" INTEGER NOT NULL REFERENCES users(id),
        "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      )
    `);
    
    // Create business_hours table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS business_hours (
        id SERIAL PRIMARY KEY,
        "businessId" INTEGER NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
        day INTEGER NOT NULL,
        "openTime" VARCHAR(10) NOT NULL,
        "closeTime" VARCHAR(10) NOT NULL,
        "isClosed" BOOLEAN NOT NULL DEFAULT FALSE,
        "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      )
    `);
    
    // Create issue_reports table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS issue_reports (
        id SERIAL PRIMARY KEY,
        "businessId" INTEGER NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
        "reportedBy" INTEGER NOT NULL REFERENCES users(id),
        "issueType" VARCHAR(255) NOT NULL,
        details TEXT NOT NULL,
        status VARCHAR(20) NOT NULL DEFAULT 'pending',
        "resolvedBy" INTEGER REFERENCES users(id),
        "adminNotes" TEXT,
        "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      )
    `);
    
    // Create ratings table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS ratings (
        id SERIAL PRIMARY KEY,
        "businessId" INTEGER NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
        "userId" INTEGER NOT NULL REFERENCES users(id),
        rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
        comment TEXT,
        "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        UNIQUE("businessId", "userId")
      )
    `);
    
    console.log('Tables created successfully');
    process.exit(0);
  } catch (error) {
    console.error('Error creating tables:', error);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

main().catch((error) => {
  console.error('Unhandled error:', error);
  process.exit(1);
});