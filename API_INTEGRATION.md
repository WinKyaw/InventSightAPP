# InventSightApp API Integration Documentation

## Overview

The InventSightApp frontend has been successfully integrated with the InventSight backend APIs to enable real-time communication and data synchronization. This integration maintains backward compatibility while providing seamless API connectivity.

## 🚀 Quick Start

1. **Start the InventSight Backend**
   ```bash
   # Ensure your InventSight backend is running on port 8080
   # or update the API_BASE_URL in .env.local
   ```

2. **Configure Environment**
   ```bash
   # Update .env.local with your backend URL
   API_BASE_URL=http://localhost:8080
   API_TIMEOUT=10000
   USER_LOGIN=WinKyaw
   ```

3. **Test API Integration**
   ```bash
   npm run test:api
   ```

4. **Launch the App**
   ```bash
   npm start
   ```

5. **Enable API Integration**
   - Navigate to Dashboard
   - Tap the "API Integration: OFF" button to toggle ON
   - Watch console logs for API requests

## 📁 Project Structure

```
InventSightAPP/
├── services/
│   └── api/
│       ├── config.ts          # API endpoints and interfaces
│       ├── httpClient.ts      # Axios client with logging
│       ├── employeeService.ts # Employee CRUD operations
│       └── reportService.ts   # Reports and dashboard data
├── hooks/
│   └── useApi.ts             # Generic API state management
├── context/
│   ├── EmployeesContext.tsx  # Enhanced with API integration
│   └── ReportsContext.tsx    # New - Dashboard data management
├── scripts/
│   └── test-api-integration.js # API integration test suite
└── .env.local                # Environment configuration
```

## 🔧 API Configuration

### Environment Variables
```env
API_BASE_URL=http://localhost:8080  # InventSight backend URL
API_TIMEOUT=10000                   # Request timeout in milliseconds
USER_LOGIN=WinKyaw                  # Current user identifier
```

### API Endpoints
- `GET /reports/daily` - Daily business report
- `GET /reports/weekly` - Weekly analytics
- `GET /reports/inventory` - Inventory status report  
- `GET /reports/business-intelligence` - Comprehensive BI data
- `GET /employees` - All active employees
- `GET /employees/{id}` - Specific employee
- `GET /employees/checked-in` - Currently checked-in employees
- `GET /employees/search?query=` - Search employees
- `POST /employees` - Create new employee

## 📊 Dashboard Integration

### API Toggle Feature
The Dashboard includes a toggle button to switch between:
- **API Integration ON**: Live data from InventSight backend
- **API Integration OFF**: Local mock data

### Data Sources
- **Local Mode**: Uses existing mock data from `constants/Data.ts`
- **API Mode**: Fetches real-time data from backend APIs
- **Fallback**: Automatically falls back to local data if API fails

### Features
- Real-time KPI updates
- Employee status tracking
- Business intelligence metrics
- Error handling with retry functionality
- Loading states and progress indicators

## 🔗 Service Layer

### HTTP Client (`services/api/httpClient.ts`)
- Axios-based with request/response interceptors
- Automatic logging in required format
- Error handling and timeout configuration
- Session information headers

### Employee Service (`services/api/employeeService.ts`)
```typescript
class EmployeeService {
  static async getAllEmployees(): Promise<Employee[]>
  static async getEmployeeById(id: string | number): Promise<Employee>
  static async searchEmployees(params: EmployeeSearchParams): Promise<Employee[]>
  static async createEmployee(data: CreateEmployeeRequest): Promise<Employee>
  static async updateEmployee(id: number, updates: Partial<Employee>): Promise<Employee>
  static async deleteEmployee(id: number): Promise<void>
  static async checkInEmployee(id: number): Promise<Employee>
  static async checkOutEmployee(id: number): Promise<Employee>
}
```

### Reports Service (`services/api/reportService.ts`)
```typescript
class ReportService {
  static async getDailyReport(date?: string): Promise<DailyReportData>
  static async getWeeklyReport(startDate?: string, endDate?: string): Promise<WeeklyReportData>
  static async getBusinessIntelligence(): Promise<BusinessIntelligenceData>
  static async getInventoryReport(): Promise<InventoryReportData>
  static async getDashboardData(): Promise<DashboardData>
  static async getKPIs(): Promise<KPIData>
}
```

## 🎣 Custom Hooks

### useApi Hook
Generic hook for API state management:
```typescript
const { data, loading, error, execute, reset } = useApi(apiFunction, options);
```

### useApiWithParams Hook
For API calls with parameters:
```typescript
const { data, loading, error, execute } = useApiWithParams(apiFunction);
await execute(params);
```

### useMultipleApi Hook
For managing multiple concurrent API calls:
```typescript
const { data, loading, error, loadingStates, execute } = useMultipleApi({
  employees: EmployeeService.getAllEmployees,
  reports: ReportService.getDailyReport
});
```

## 📝 Logging Format

All API requests follow the required logging format:

```
🔄 InventSightApp API Request: GET /employees
📅 Current Date and Time (UTC): 2025-08-27 08:54:52
👤 Current User's Login: WinKyaw
✅ InventSightApp API Response: 200 - /employees
```

## 🔄 Context Integration

### Enhanced EmployeesContext
- **API Toggle**: Switch between API and local data
- **Fallback Mechanism**: Automatic fallback to local operations if API fails
- **Real-time Sync**: Keeps local state in sync with API data
- **Search & Filter**: Enhanced search capabilities

### New ReportsContext
- **Dashboard Data**: Manages all dashboard-related API calls
- **Concurrent Loading**: Fetches multiple reports simultaneously
- **Error Handling**: Graceful error handling with user feedback
- **Caching**: Smart data caching and refresh mechanisms

## 🧪 Testing

### Test Suite
Run the comprehensive test suite:
```bash
npm run test:api
```

### Manual Testing
1. Launch the app: `npm start`
2. Navigate to Dashboard
3. Toggle API integration ON
4. Verify console logs show API requests
5. Check data displays correctly
6. Test error scenarios by stopping backend

## 🛠️ Troubleshooting

### Common Issues
1. **API Connection Failed**
   - Verify backend is running
   - Check `API_BASE_URL` in `.env.local`
   - Ensure CORS is configured on backend

2. **Environment Variables Not Loaded**
   - Restart Expo development server
   - Verify `.env.local` file exists
   - Check environment variable names

3. **TypeScript Errors**
   - Run `npx tsc --noEmit` to check types
   - Ensure all interfaces match backend models
   - Update imports if necessary

### Debug Mode
Enable debug logging by setting:
```env
DEBUG=true
```

## 📈 Performance Considerations

- **Concurrent API Calls**: Multiple endpoints loaded simultaneously
- **Smart Fallbacks**: Automatic fallback to local data prevents UI freezing
- **Loading States**: Progressive loading with individual component states
- **Error Boundaries**: Comprehensive error handling prevents app crashes
- **Memory Management**: Proper cleanup of API subscriptions and timers

## 🔒 Security

- **Environment Variables**: Sensitive configuration stored in `.env.local`
- **Request Headers**: Session information included in API headers
- **Error Handling**: API errors sanitized before display
- **Timeout Protection**: Request timeouts prevent hanging operations

## 🚀 Future Enhancements

- **Offline Support**: Cache API responses for offline functionality
- **Real-time Updates**: WebSocket integration for live data updates
- **Background Sync**: Sync data in background when app regains connectivity
- **Advanced Caching**: Implement Redis or AsyncStorage caching layer
- **Push Notifications**: Integration with backend notification system

## 📞 Support

For issues or questions regarding the API integration:
1. Check the test suite output: `npm run test:api`
2. Review console logs for detailed error messages
3. Verify backend API endpoints are accessible
4. Check environment configuration

The integration maintains full backward compatibility, so the app will continue working with local data even if API integration is disabled.