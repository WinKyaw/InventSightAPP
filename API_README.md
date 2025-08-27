# API Integration Quick Reference

## 🔄 Toggle API Integration

The InventSightApp includes a seamless API integration toggle in the Dashboard:

### To Enable API Integration:
1. Navigate to **Dashboard** screen
2. Tap the **"API Integration: OFF"** button (yellow/orange color)
3. Confirm the toggle action
4. The button will turn green showing **"API Integration: ON"**
5. Watch the console logs for API requests

### API Status Indicators:
- 🟠 **OFF**: Using local mock data
- 🟢 **ON**: Connected to InventSight Backend API
- 🔄 **Loading**: Fetching data from API
- ⚠️ **Error**: API connection failed, fallback to local data

## 🚀 Quick Test

```bash
# 1. Test API integration
npm run test:api

# 2. Start the app
npm start

# 3. Toggle API in Dashboard and check console
```

## 📡 Expected API Calls

When API integration is enabled, the app will make these requests:

```
🔄 InventSightApp API Request: GET /reports/business-intelligence
📅 Current Date and Time (UTC): 2025-08-27 08:54:52
👤 Current User's Login: WinKyaw
✅ InventSightApp API Response: 200 - /reports/business-intelligence
```

## ⚙️ Configuration

Update `.env.local`:
```env
API_BASE_URL=http://your-backend-url:8080
USER_LOGIN=YourUsername
```

## 📋 Features

- ✅ Seamless toggle between API and local data
- ✅ Automatic fallback if API fails
- ✅ Real-time employee status tracking
- ✅ Business intelligence dashboard
- ✅ Comprehensive error handling
- ✅ Loading states and progress indicators
- ✅ Proper logging format matching backend

For detailed documentation, see [API_INTEGRATION.md](./API_INTEGRATION.md)