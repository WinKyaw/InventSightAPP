// Test setup file
import { sequelize } from '../config/database';

process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = 'test-jwt-secret';
process.env.JWT_REFRESH_SECRET = 'test-refresh-secret';

// Set database to use in-memory for testing
process.env.DB_DIALECT = 'sqlite';
process.env.DB_NAME = 'test.db';

// Disable email verification for tests
process.env.ENABLE_EMAIL_VERIFICATION = 'false';

// Set test timeout
jest.setTimeout(30000);

// Initialize database before tests
beforeAll(async () => {
  await sequelize.sync({ force: true });
});

// Clean up after tests
afterAll(async () => {
  await sequelize.close();
});