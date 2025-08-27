# InventSightApp Authentication System

A comprehensive, production-ready authentication system for the React Native InventSightApp, featuring JWT token management, secure storage, and seamless user experience.

## 🚀 Features

### Core Authentication
- **JWT Token Management**: Secure token storage using expo-secure-store
- **Automatic Token Refresh**: Seamless token renewal with request queuing
- **Demo Mode**: Development-friendly mock authentication
- **Form Validation**: Comprehensive client-side validation
- **Error Handling**: Graceful error boundaries and user feedback

### Security Features
- **Secure Storage**: Tokens stored using device keychain/secure storage
- **Input Sanitization**: Protection against malicious input
- **Authentication Guards**: Route protection based on auth status
- **Session Management**: Persistent authentication state

### User Experience
- **Loading States**: Visual feedback during authentication
- **Error Messages**: Clear, actionable error messages  
- **Accessibility**: WCAG-compliant with screen reader support
- **Responsive Design**: Works across all device sizes

## 🏗️ Architecture

```
├── types/auth.ts              # Authentication type definitions
├── utils/
│   ├── tokenManager.ts        # Secure token storage utility
│   └── validation.ts          # Form validation functions
├── services/api/
│   ├── authService.ts         # Authentication API service
│   ├── config.ts              # API endpoints and configuration
│   └── httpClient.ts          # HTTP client with token interceptors
├── context/AuthContext.tsx    # Global authentication state
├── components/
│   ├── ProtectedRoute.tsx     # Route protection component
│   └── ui/
│       ├── AuthErrorBoundary.tsx  # Error boundary for auth errors
│       └── DemoInfo.tsx       # Demo credentials information
└── app/(auth)/
    ├── login.tsx              # Enhanced login screen
    └── signup.tsx             # Enhanced signup screen
```

## 🔧 Setup & Configuration

### 1. Environment Configuration

Create or update `.env.local`:

```bash
# Backend API Configuration
API_BASE_URL=http://localhost:8080
API_TIMEOUT=10000
USER_LOGIN=WinKyaw

# Authentication Configuration  
API_AUTH_TYPE=bearer
# API_AUTH_TOKEN=your_token_here
```

### 2. Dependencies

The system uses the following key dependencies (already installed):

```json
{
  "@react-native-async-storage/async-storage": "^2.x",
  "expo-secure-store": "^13.x",
  "axios": "^1.x"
}
```

### 3. Demo Mode

When `API_BASE_URL` is not set, the system automatically enters demo mode with these credentials:

- **Admin User**: `winkyaw@example.com` / `password123`
- **Demo User**: `demo@example.com` / `password123`
- **Custom Accounts**: Create new accounts with any email/password (6+ chars)

## 🔐 Authentication Flow

### Login Process
1. User enters credentials
2. Client-side validation
3. API call (real or demo)
4. Token storage in secure storage
5. User state update
6. Automatic navigation to dashboard

### Token Management
1. Access tokens stored securely
2. Automatic refresh before expiration
3. Request queuing during refresh
4. Fallback to login on refresh failure

### Route Protection
- Automatic redirects based on auth state
- Protected routes require authentication
- Smooth navigation transitions
- Preserved destination after login

## 🎯 Usage Examples

### Using Authentication Context

```tsx
import { useAuth } from '../context/AuthContext';

function MyComponent() {
  const { 
    user, 
    isAuthenticated, 
    isLoading, 
    login, 
    logout 
  } = useAuth();

  const handleLogin = async () => {
    try {
      await login({
        email: 'user@example.com',
        password: 'password123'
      });
    } catch (error) {
      console.error('Login failed:', error.message);
    }
  };

  if (isLoading) {
    return <LoadingSpinner />;
  }

  return (
    <View>
      {isAuthenticated ? (
        <Text>Welcome, {user?.name}!</Text>
      ) : (
        <Button title="Login" onPress={handleLogin} />
      )}
    </View>
  );
}
```

### Protected Routes

```tsx
import { ProtectedRoute } from '../components/ProtectedRoute';

function Dashboard() {
  return (
    <ProtectedRoute requireAuth={true}>
      <DashboardContent />
    </ProtectedRoute>
  );
}
```

### Form Validation

```tsx
import { validateLoginForm } from '../utils/validation';

const validation = validateLoginForm({
  email: 'user@example.com',
  password: 'password123'
});

if (!validation.isValid) {
  console.log('Validation errors:', validation.errors);
}
```

## 🧪 Testing

### Run Authentication Tests
```bash
npm run test:auth
```

### Test API Integration
```bash
npm run test:api
```

### Manual Testing Steps
1. Start the app: `npm start`
2. Navigate to login screen
3. Try demo credentials: `winkyaw@example.com` / `password123`
4. Create new account
5. Test logout and login persistence
6. Verify token refresh (check console logs)

## 🎨 Customization

### Custom Validation Rules

```tsx
// utils/validation.ts
export const validateCustomField = (value: string): ValidationError | null => {
  if (!value || value.length < 3) {
    return { field: 'custom', message: 'Field must be at least 3 characters' };
  }
  return null;
};
```

### Custom Error Handling

```tsx
// Custom error boundary
<AuthErrorBoundary
  onError={(error, errorInfo) => {
    // Log to crash reporting service
    console.error('Auth error:', error);
  }}
  fallback={<CustomErrorScreen />}
>
  <App />
</AuthErrorBoundary>
```

### Theme Integration

The authentication UI uses the app's existing style system defined in `constants/Styles.ts`.

## 🚦 Production Deployment

### Security Checklist
- [ ] Update API_BASE_URL to production backend
- [ ] Enable HTTPS for all API endpoints  
- [ ] Configure proper CORS policies
- [ ] Set up rate limiting on authentication endpoints
- [ ] Enable proper error logging
- [ ] Test token refresh edge cases

### Performance Optimization
- [ ] Implement biometric authentication (optional)
- [ ] Add offline authentication capability
- [ ] Optimize token refresh timing
- [ ] Implement remember me functionality

## 🐛 Troubleshooting

### Common Issues

**Authentication fails with network error**
- Check API_BASE_URL in .env.local
- Verify backend is running
- Check network connectivity

**Tokens not persisting**
- Ensure expo-secure-store is properly installed
- Check device storage permissions
- Verify keychain access on iOS

**Navigation not working**
- Check route protection configuration
- Verify AuthContext is properly wrapped
- Check for navigation timing issues

### Debug Mode

Enable debug logging by setting:
```tsx
// In development
console.log('Auth Debug Mode Enabled');
```

## 🤝 Contributing

The authentication system follows these patterns:
- TypeScript for type safety
- React Native best practices
- Secure storage patterns
- Accessibility guidelines
- Error boundary implementation

## 📄 API Integration

### Backend Requirements

The authentication system expects these endpoints:

```
POST /auth/login
POST /auth/signup  
POST /auth/refresh
GET  /auth/profile
POST /auth/logout
POST /auth/change-password
POST /auth/reset-password
```

### Request/Response Format

All requests include proper headers and session information as defined in the API integration documentation.

---

## 🎉 Summary

This authentication system provides a complete, production-ready solution with:

✅ **Security**: Secure token storage and proper authentication flow  
✅ **User Experience**: Smooth, accessible, and responsive interface  
✅ **Developer Experience**: TypeScript types, demo mode, comprehensive testing  
✅ **Production Ready**: Error handling, token refresh, route protection  
✅ **Extensible**: Easy to customize and extend for specific needs  

The system seamlessly integrates with the existing InventSightApp architecture while providing modern authentication patterns and security best practices.