const { testConnection } = require('../config/database');

// Global test setup
beforeAll(async () => {
  // Test database connection
  const connected = await testConnection();
  if (!connected) {
    console.warn('⚠️  Database connection failed - tests may not work properly');
  }
});

// Global test teardown
afterAll(async () => {
  // Clean up any global resources
  console.log('✅ Tests completed');
});

// Increase timeout for database operations
jest.setTimeout(30000);
