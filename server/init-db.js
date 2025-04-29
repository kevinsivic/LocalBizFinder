// Simple script to initialize the database tables
// This can be run directly with Node.js from the entrypoint script
const { Pool } = require('pg');
const { drizzle } = require('drizzle-orm/node-postgres');
const { migrate } = require('drizzle-orm/node-postgres/migrator');
const path = require('path');

async function main() {
  try {
    console.log('🔄 Starting database initialization...');
    
    if (!process.env.DATABASE_URL) {
      throw new Error('DATABASE_URL environment variable is not set');
    }

    console.log('🔄 Connecting to database...');
    const pool = new Pool({
      connectionString: process.env.DATABASE_URL
    });

    // Test the connection
    await pool.query('SELECT NOW()');
    console.log('✅ Connected to database');

    // Initialize Drizzle
    const db = drizzle(pool);
    
    // Path to migrations folder
    const migrationsFolder = path.join(__dirname, '../migrations');
    
    console.log(`🔄 Running migrations from ${migrationsFolder}...`);
    
    // Run migrations
    try {
      await migrate(db, { migrationsFolder });
      console.log('✅ Migrations completed successfully');
    } catch (migrateError) {
      console.error('❌ Migration error:', migrateError);
      console.log('🔄 Attempting to create tables manually...');
      
      // Manually create tables if migration fails
      const createUserTable = `
        CREATE TABLE IF NOT EXISTS users (
          id SERIAL PRIMARY KEY,
          username VARCHAR(100) UNIQUE NOT NULL,
          password VARCHAR(255) NOT NULL,
          is_admin BOOLEAN NOT NULL DEFAULT FALSE
        );
      `;
      
      const createBusinessTable = `
        CREATE TABLE IF NOT EXISTS businesses (
          id SERIAL PRIMARY KEY,
          name VARCHAR(100) NOT NULL,
          description TEXT NOT NULL,
          category VARCHAR(50) NOT NULL,
          address VARCHAR(255) NOT NULL,
          phone VARCHAR(20),
          website VARCHAR(255),
          latitude DECIMAL(10, 7) NOT NULL,
          longitude DECIMAL(10, 7) NOT NULL,
          image_url VARCHAR(255),
          created_by INTEGER NOT NULL REFERENCES users(id)
        );
      `;
      
      const createBusinessHoursTable = `
        CREATE TABLE IF NOT EXISTS business_hours (
          id SERIAL PRIMARY KEY,
          business_id INTEGER NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
          day_of_week INTEGER NOT NULL,
          open_time TIME,
          close_time TIME
        );
      `;
      
      try {
        await pool.query(createUserTable);
        console.log('✅ Users table created');
        
        await pool.query(createBusinessTable);
        console.log('✅ Businesses table created');
        
        await pool.query(createBusinessHoursTable);
        console.log('✅ Business_hours table created');
        
        // Create initial admin user for testing
        const createAdminQuery = `
          INSERT INTO users (username, password, is_admin)
          VALUES ('admin', 'password_hash_here', TRUE)
          ON CONFLICT (username) DO NOTHING;
        `;
        
        await pool.query(createAdminQuery);
        console.log('✅ Initial admin user created');
        
      } catch (manualError) {
        console.error('❌ Failed to create tables manually:', manualError);
        throw manualError;
      }
    }
    
    await pool.end();
    console.log('✅ Database initialization completed successfully');
    
  } catch (error) {
    console.error('❌ Database initialization failed:', error);
    process.exit(1);
  }
}

main();