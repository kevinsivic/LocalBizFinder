import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { Pool } from 'pg';
import { drizzle } from 'drizzle-orm/node-postgres';
import { migrate } from 'drizzle-orm/node-postgres/migrator';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Database connection
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

async function runMigrations() {
  console.log('Starting database migrations...');
  
  try {
    // First, try to use drizzle-orm's migrate function
    const db = drizzle(pool);
    await migrate(db, { migrationsFolder: __dirname });
    console.log('Migration complete using drizzle-orm migrate.');
  } catch (err) {
    console.error('Error using drizzle-orm migrate:', err);
    
    // If that fails, try manual SQL execution of migration files
    console.log('Attempting manual SQL migration execution...');
    try {
      // Get all .sql files in the migrations directory
      const migrationFiles = fs.readdirSync(__dirname)
        .filter(file => file.endsWith('.sql'))
        .sort(); // Execute in alphanumeric order
      
      if (migrationFiles.length === 0) {
        console.log('No SQL migration files found.');
        return;
      }
      
      // Execute each SQL file
      for (const file of migrationFiles) {
        const filePath = path.join(__dirname, file);
        const sql = fs.readFileSync(filePath, 'utf8');
        
        console.log(`Executing migration: ${file}`);
        await pool.query(sql);
        console.log(`Migration ${file} executed successfully.`);
      }
      
      console.log('All migrations executed successfully.');
    } catch (sqlErr) {
      console.error('Error executing manual SQL migrations:', sqlErr);
      throw sqlErr;
    }
  } finally {
    // Close the pool connection
    await pool.end();
  }
}

runMigrations().catch(err => {
  console.error('Migration failed:', err);
  process.exit(1);
});