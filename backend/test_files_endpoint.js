/**
 * Quick test script for /api/files endpoint
 * Run: node test_files_endpoint.js
 */

require('dotenv').config();
const mysql = require('mysql2/promise');

async function testDatabaseConnection() {
  console.log('🔍 Testing database connection...');
  
  const config = {
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 3306,
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'task_insight'
  };

  console.log('📋 Config:', {
    host: config.host,
    port: config.port,
    user: config.user,
    database: config.database,
    password: config.password ? '***' : '(empty)'
  });

  try {
    const connection = await mysql.createConnection(config);
    console.log('✅ Database connection successful!');

    // Test 1: Check if files table exists
    console.log('\n🔍 Test 1: Checking if files table exists...');
    const [tables] = await connection.query(
      "SELECT COUNT(*) as count FROM information_schema.tables WHERE table_schema = ? AND table_name = 'files'",
      [config.database]
    );
    
    if (tables[0].count === 0) {
      console.log('❌ Files table does not exist!');
      await connection.end();
      return false;
    }
    console.log('✅ Files table exists');

    // Test 2: Check table structure
    console.log('\n🔍 Test 2: Checking table structure...');
    const [columns] = await connection.query(
      "SELECT column_name FROM information_schema.columns WHERE table_schema = ? AND table_name = 'files' AND column_name IN ('file_type', 'type')",
      [config.database]
    );
    
    const columnNames = columns.map(c => c.column_name);
    if (columnNames.includes('file_type')) {
      console.log('✅ Column "file_type" exists (correct)');
    } else {
      console.log('❌ Column "file_type" does not exist!');
    }
    
    if (columnNames.includes('type')) {
      console.log('⚠️  Column "type" exists (this might cause issues)');
    }

    // Test 3: Test the actual query
    console.log('\n🔍 Test 3: Testing files query...');
    const [files] = await connection.query(`
      SELECT f.*, u.first_name, u.last_name, u.email, 
             fo.name as folder_name, o.name as organization_name
      FROM files f 
      LEFT JOIN users u ON f.uploaded_by = u.id
      LEFT JOIN folders fo ON f.folder_id = fo.id
      LEFT JOIN organizations o ON f.organization_id = o.id
      WHERE f.status = "active"
      ORDER BY f.created_at DESC 
      LIMIT 10 OFFSET 0
    `);
    
    console.log(`✅ Query successful! Found ${files.length} files`);

    // Test 4: Test count query
    console.log('\n🔍 Test 4: Testing count query...');
    const [count] = await connection.query(`
      SELECT COUNT(*) as total 
      FROM files f 
      WHERE f.status = "active"
    `);
    
    console.log(`✅ Count query successful! Total: ${count[0].total}`);

    // Test 5: Check if user has organization_id
    console.log('\n🔍 Test 5: Checking user organization_id...');
    const [users] = await connection.query(
      "SELECT id, email, role, organization_id FROM users WHERE email = 'member@demo.com'"
    );
    
    if (users.length > 0) {
      const user = users[0];
      console.log(`✅ User found: ${user.email}, role: ${user.role}, org_id: ${user.organization_id}`);
      if (!user.organization_id) {
        console.log('⚠️  WARNING: User has no organization_id! This will cause errors.');
      }
    } else {
      console.log('⚠️  User member@demo.com not found');
    }

    await connection.end();
    console.log('\n✅ All tests passed!');
    return true;

  } catch (error) {
    console.error('\n❌ Error:', error.message);
    console.error('Error code:', error.code);
    console.error('SQL State:', error.sqlState);
    if (error.sqlMessage) {
      console.error('SQL Message:', error.sqlMessage);
    }
    return false;
  }
}

// Run the test
testDatabaseConnection()
  .then(success => {
    process.exit(success ? 0 : 1);
  })
  .catch(err => {
    console.error('Fatal error:', err);
    process.exit(1);
  });


