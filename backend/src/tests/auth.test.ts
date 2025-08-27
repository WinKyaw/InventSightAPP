import request from 'supertest';
import { app } from '../server';

describe('Authentication Endpoints', () => {
  describe('POST /api/v1/auth/register', () => {
    it('should register a new user successfully', async () => {
      const userData = {
        name: 'John Doe',
        email: 'john.doe@example.com',
        password: 'SecurePass123',
      };

      const response = await request(app)
        .post('/api/v1/auth/register')
        .send(userData)
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data.user.email).toBe(userData.email);
      expect(response.body.data.user.name).toBe(userData.name);
      expect(response.body.data.tokens.accessToken).toBeDefined();
      expect(response.body.data.tokens.refreshToken).toBeDefined();
    });

    it('should reject registration with duplicate email', async () => {
      const userData = {
        name: 'Jane Smith',
        email: 'john.doe@example.com', // Same email as previous test
        password: 'SecurePass123',
      };

      const response = await request(app)
        .post('/api/v1/auth/register')
        .send(userData)
        .expect(409);

      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('EMAIL_ALREADY_EXISTS');
    });

    it('should reject registration with invalid data', async () => {
      const invalidData = {
        name: '', // Invalid: too short
        email: 'invalid-email', // Invalid: not proper email format
        password: '123', // Invalid: too short
      };

      const response = await request(app)
        .post('/api/v1/auth/register')
        .send(invalidData)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('VALIDATION_ERROR');
      expect(response.body.error.details).toHaveLength(3);
    });
  });

  describe('POST /api/v1/auth/login', () => {
    beforeAll(async () => {
      // Register a test user
      await request(app)
        .post('/api/v1/auth/register')
        .send({
          name: 'Test Login User',
          email: 'login.test@example.com',
          password: 'LoginPass123',
        });
    });

    it('should login with valid credentials', async () => {
      const loginData = {
        email: 'login.test@example.com',
        password: 'LoginPass123',
      };

      const response = await request(app)
        .post('/api/v1/auth/login')
        .send(loginData)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.user.email).toBe(loginData.email);
      expect(response.body.data.tokens.accessToken).toBeDefined();
    });

    it('should reject login with invalid credentials', async () => {
      const invalidData = {
        email: 'login.test@example.com',
        password: 'WrongPassword',
      };

      const response = await request(app)
        .post('/api/v1/auth/login')
        .send(invalidData)
        .expect(401);

      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('INVALID_CREDENTIALS');
    });
  });

  describe('GET /api/v1/auth/check-email', () => {
    it('should return true for existing email', async () => {
      const response = await request(app)
        .get('/api/v1/auth/check-email')
        .query({ email: 'john.doe@example.com' })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.exists).toBe(true);
      expect(response.body.data.verified).toBe(true);
    });

    it('should return false for non-existing email', async () => {
      const response = await request(app)
        .get('/api/v1/auth/check-email')
        .query({ email: 'nonexistent@example.com' })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.exists).toBe(false);
    });
  });

  describe('GET /api/v1/auth/profile', () => {
    let accessToken: string;

    beforeAll(async () => {
      const response = await request(app)
        .post('/api/v1/auth/register')
        .send({
          name: 'Profile Test User',
          email: 'profile.test@example.com',
          password: 'ProfilePass123',
        });
      
      accessToken = response.body.data.tokens.accessToken;
    });

    it('should return user profile with valid token', async () => {
      const response = await request(app)
        .get('/api/v1/auth/profile')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.email).toBe('profile.test@example.com');
    });

    it('should reject request without token', async () => {
      const response = await request(app)
        .get('/api/v1/auth/profile')
        .expect(401);

      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('MISSING_TOKEN');
    });
  });

  describe('POST /api/v1/auth/refresh', () => {
    let refreshToken: string;

    beforeAll(async () => {
      const response = await request(app)
        .post('/api/v1/auth/register')
        .send({
          name: 'Refresh Test User',
          email: 'refresh.test@example.com',
          password: 'RefreshPass123',
        });
      
      refreshToken = response.body.data.tokens.refreshToken;
    });

    it('should refresh access token with valid refresh token', async () => {
      const response = await request(app)
        .post('/api/v1/auth/refresh')
        .send({ refreshToken })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.accessToken).toBeDefined();
      expect(response.body.data.expiresIn).toBe(3600);
    });

    it('should reject invalid refresh token', async () => {
      const response = await request(app)
        .post('/api/v1/auth/refresh')
        .send({ refreshToken: 'invalid-token' })
        .expect(401);

      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('TOKEN_REFRESH_ERROR');
    });
  });

  describe('API Health and Info', () => {
    it('should return health status', async () => {
      const response = await request(app)
        .get('/api/v1/health')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.status).toBe('OK');
    });

    it('should return API info', async () => {
      const response = await request(app)
        .get('/api/v1')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.name).toBe('InventSight API');
    });
  });
});