# InventSight API Backend

A comprehensive, production-ready backend API for the InventSight App with complete user registration and authentication system.

## 🚀 Features

### Core Authentication & Registration
- **JWT Token Management**: Secure access and refresh tokens
- **User Registration**: Complete sign-up flow with validation
- **Email Verification**: Optional email verification system
- **Login System**: Secure user authentication
- **Password Security**: bcrypt hashing with configurable salt rounds
- **Token Refresh**: Automatic token refresh mechanism

### Security Features
- **Rate Limiting**: Protection against brute force attacks
- **Input Validation**: Comprehensive server-side validation
- **SQL Injection Protection**: Parameterized queries via Sequelize
- **CORS Configuration**: Proper cross-origin resource sharing
- **Helmet Security**: Security headers protection
- **Password Strength**: Enforced password complexity requirements

### Database Integration
- **SQLite Support**: In-memory and file-based database support
- **Sequelize ORM**: Database abstraction layer
- **Auto Migrations**: Database schema synchronization
- **Proper Indexes**: Optimized database performance
- **Transaction Support**: Data consistency guarantees

### Production Ready
- **Error Handling**: Comprehensive error responses
- **Logging**: Detailed request/response logging
- **Environment Config**: Flexible configuration management
- **Health Checks**: API monitoring endpoints
- **Testing**: Complete test suite with Jest
- **TypeScript**: Type-safe development
- **Documentation**: API documentation ready

## 📋 API Endpoints

### Authentication Endpoints
- `POST /api/v1/auth/register` - User registration
- `POST /api/v1/auth/login` - User login
- `POST /api/v1/auth/verify-email` - Email verification
- `GET /api/v1/auth/check-email` - Check email existence
- `POST /api/v1/auth/resend-verification` - Resend verification email
- `POST /api/v1/auth/refresh` - Refresh access token
- `GET /api/v1/auth/profile` - Get user profile (authenticated)
- `POST /api/v1/auth/logout` - User logout

### System Endpoints
- `GET /api/v1/health` - Health check
- `GET /api/v1/` - API information

## 🛠️ Installation & Setup

### Prerequisites
- Node.js (v18+)
- npm or yarn

### Installation
```bash
# Navigate to backend directory
cd backend

# Install dependencies
npm install

# Set up environment variables
cp .env.example .env

# Edit .env with your configuration
nano .env
```

### Environment Configuration
```env
# Server Configuration
NODE_ENV=development
PORT=8080

# Database Configuration
DB_DIALECT=sqlite
DB_NAME=inventsight.db

# JWT Configuration (CHANGE IN PRODUCTION!)
JWT_SECRET=your-super-secret-jwt-key
JWT_REFRESH_SECRET=your-super-secret-refresh-key
JWT_EXPIRES_IN=1h
JWT_REFRESH_EXPIRES_IN=7d

# Email Configuration (Optional)
ENABLE_EMAIL_VERIFICATION=false
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your-email@gmail.com
EMAIL_PASSWORD=your-app-password

# CORS Configuration
FRONTEND_URL=exp://localhost:8081,http://localhost:8081
```

## 🚀 Running the Server

### Development Mode
```bash
npm run dev
```

### Production Mode
```bash
# Build the project
npm run build

# Start production server
npm start
```

### Testing
```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Run tests with coverage
npm test -- --coverage
```

## 📝 Usage Examples

### User Registration
```bash
curl -X POST http://localhost:8080/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "name": "John Doe",
    "email": "john.doe@example.com",
    "password": "SecurePass123"
  }'
```

### User Login
```bash
curl -X POST http://localhost:8080/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "john.doe@example.com",
    "password": "SecurePass123"
  }'
```

### Check Email Existence
```bash
curl -X GET "http://localhost:8080/api/v1/auth/check-email?email=john.doe@example.com"
```

### Get User Profile (Authenticated)
```bash
curl -X GET http://localhost:8080/api/v1/auth/profile \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

## 🔒 Security Features

### Password Requirements
- Minimum 8 characters
- At least 1 uppercase letter
- At least 1 lowercase letter
- At least 1 number
- Special characters recommended

### Rate Limiting
- General API: 100 requests per 15 minutes
- Registration: 5 attempts per 15 minutes
- Login: 10 attempts per 15 minutes
- Email verification: 3 attempts per 5 minutes

### Token Security
- JWT tokens with secure algorithms
- Automatic token expiration
- Refresh token mechanism
- Secure token storage recommendations

## 🧪 Testing

The API includes comprehensive test coverage:

- Unit tests for all authentication logic
- Integration tests for API endpoints
- Error scenario testing
- Security validation testing
- Database integration testing

### Running Tests
```bash
# Run all tests
npm test

# Run with detailed output
npm test -- --verbose

# Run specific test file
npm test -- auth.test.ts

# Run with coverage report
npm test -- --coverage
```

## 📊 API Response Format

### Success Response
```json
{
  "success": true,
  "data": {
    // Response data
  },
  "message": "Operation completed successfully",
  "timestamp": "2025-08-27T23:45:58.272Z"
}
```

### Error Response
```json
{
  "success": false,
  "message": "Error message",
  "error": {
    "code": "ERROR_CODE",
    "details": {
      // Error details
    }
  },
  "timestamp": "2025-08-27T23:45:58.272Z"
}
```

## 🔧 Configuration Options

### Database Configuration
- **SQLite**: File-based or in-memory database
- **PostgreSQL**: Production database support
- **MySQL**: Alternative database support

### Email Service Configuration
- **SMTP Support**: Standard email providers
- **Template System**: Customizable email templates
- **Verification System**: Optional email verification

### Security Configuration
- **Rate Limiting**: Configurable limits
- **CORS Settings**: Custom origin configuration
- **JWT Configuration**: Custom token expiration
- **Password Requirements**: Configurable strength

## 🚀 Deployment

### Production Checklist
- [ ] Update JWT secrets in production
- [ ] Configure production database
- [ ] Set up email service (if using verification)
- [ ] Configure CORS for production domain
- [ ] Set up HTTPS/SSL certificates
- [ ] Configure reverse proxy (nginx/Apache)
- [ ] Set up monitoring and logging
- [ ] Configure backup strategy

### Docker Support
```dockerfile
# Dockerfile example
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY dist ./dist
EXPOSE 8080
CMD ["npm", "start"]
```

## 🤝 Integration with Frontend

### Frontend Configuration
The API is designed to work seamlessly with the React Native frontend:

- **Compatible Response Format**: Matches frontend expectations
- **CORS Configuration**: Pre-configured for React Native
- **Token Format**: JWT tokens compatible with frontend auth system
- **Error Handling**: Consistent error codes and messages

### Frontend Environment Variables
```env
# Add to frontend .env.local
API_BASE_URL=http://localhost:8080
```

## 📈 Performance & Monitoring

### Performance Features
- **Database Indexing**: Optimized queries
- **Connection Pooling**: Efficient database connections
- **Compression**: Response compression
- **Caching Headers**: Browser caching optimization

### Monitoring
- **Health Check Endpoint**: `/api/v1/health`
- **Request Logging**: Detailed access logs
- **Error Tracking**: Comprehensive error logging
- **Performance Metrics**: Response time tracking

## 🛡️ Security Best Practices

### Development
- Use strong JWT secrets
- Enable HTTPS in production
- Implement proper CORS policies
- Regular security updates
- Input validation and sanitization

### Production
- Use environment variables for secrets
- Implement rate limiting
- Regular security audits
- Monitor for suspicious activity
- Backup and recovery procedures

## 📞 Support & Contributing

For issues, questions, or contributions:

1. **Issues**: Report bugs or feature requests
2. **Documentation**: Comprehensive API documentation
3. **Testing**: Run test suite before contributing
4. **Code Style**: Follow existing code patterns

---

## 🎉 Summary

This backend API provides a complete, production-ready authentication and registration system for the InventSight App with:

✅ **Complete Registration System**: User signup, login, email verification  
✅ **Security**: JWT tokens, password hashing, rate limiting, validation  
✅ **Database Integration**: SQLite/PostgreSQL support with Sequelize ORM  
✅ **Production Ready**: Error handling, logging, testing, documentation  
✅ **Frontend Compatible**: Seamless integration with React Native frontend  
✅ **Extensible**: Easy to customize and extend for additional features

The system follows modern security best practices and provides a solid foundation for user management in the InventSight application.