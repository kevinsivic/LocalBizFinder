import { Pool } from 'pg';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

async function testMigration() {
  console.log('Testing SQL migration execution...');
  
  // Create a test connection to the database
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
  });
  
  try {
    // Read the SQL file
    const sqlPath = path.join(__dirname, '..', 'migrations', '0001_create_ratings_table.sql');
    console.log(`Reading SQL file from: ${sqlPath}`);
    
    const sql = fs.readFileSync(sqlPath, 'utf8');
    console.log('SQL content:');
    console.log(sql);
    
    // Execute the SQL
    console.log('Executing SQL...');
    const result = await pool.query(sql);
    console.log('SQL execution result:', result);
    
    console.log('Testing if ratings table exists...');
    const tableCheck = await pool.query("SELECT to_regclass('public.ratings') IS NOT NULL AS exists");
    console.log('Table exists check result:', tableCheck.rows[0]);
    
    return 'Test completed successfully';
  } catch (error) {
    console.error('Error in test migration:', error);
    throw error;
  } finally {
    await pool.end();
  }
}

// Run the test
testMigration()
  .then(result => console.log(result))
  .catch(err => {
    console.error('Test failed:', err);
    process.exit(1);
  });