// API Services
export { default as EmployeeService } from './api/employeeService';
export { default as ReportService } from './api/reportService';
export { default as ProductService } from './api/productService';
export { default as CategoryService } from './api/categoryService';
export { default as ActivityService } from './api/activityService';
export { default as DashboardService } from './api/dashboardService';
export { default as ReceiptService } from './api/receiptService';
export { default as CalendarService } from './api/calendarService';

// HTTP Clients
export { httpClient } from './api/httpClient';
export { default as apiClient } from './api/apiClient';

// API Configuration and Types
export * from './api/config';

// Re-export for convenience
export {
  API_CONFIG,
  API_ENDPOINTS,
  getSessionInfo
} from './api/config';