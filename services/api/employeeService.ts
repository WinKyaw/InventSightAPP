import { Employee } from '../../types';
import { apiClient } from './apiClient';
import { API_ENDPOINTS, EmployeeSearchParams, CreateEmployeeRequest } from './config';
import { requestDeduplicator } from '../../utils/requestDeduplicator';
import { responseCache } from '../../utils/responseCache';
import { retryWithBackoff } from '../../utils/retryWithBackoff';
import { CacheManager } from '../../utils/cacheManager';
import axios from 'axios';

const CACHE_TTL = 30000; // 30 seconds

/**
 * Employee API Client - Simple HTTP client for employee operations
 */
export class EmployeeService {
  /**
   * Get all active employees with caching and deduplication
   */
  static async getAllEmployees(): Promise<Employee[]> {
    const cacheKey = 'employees:all';
    
    // Check cache first
    const cached = responseCache.get<Employee[]>(cacheKey);
    if (cached !== null) {
      return cached;
    }

    // Deduplicate concurrent requests
    return requestDeduplicator.execute(cacheKey, async () => {
      // Retry with exponential backoff on rate limit
      return retryWithBackoff(async () => {
        try {
          const employees = await apiClient.get<Employee[]>(API_ENDPOINTS.EMPLOYEES.ALL);
          const data = employees || [];
          
          if (data.length === 0) {
            console.log('📭 No employees found');
          }
          
          // Cache successful response
          responseCache.set(cacheKey, data, CACHE_TTL);
          
          return data;
        } catch (error: unknown) {
          if (axios.isAxiosError(error) && error.response?.status === 404) {
            console.log('📭 No employees found - returning empty array');
            const emptyArray: Employee[] = [];
            responseCache.set(cacheKey, emptyArray, CACHE_TTL);
            return emptyArray;
          }
          throw error;
        }
      });
    });
  }

  /**
   * Get employee by ID
   */
  static async getEmployeeById(id: string | number): Promise<Employee> {
    return await apiClient.get<Employee>(API_ENDPOINTS.EMPLOYEES.BY_ID(id));
  }

  /**
   * Get currently checked-in employees
   */
  static async getCheckedInEmployees(): Promise<Employee[]> {
    return await apiClient.get<Employee[]>(API_ENDPOINTS.EMPLOYEES.CHECKED_IN);
  }

  /**
   * Search employees by query parameters
   */
  static async searchEmployees(params: EmployeeSearchParams): Promise<Employee[]> {
    const searchParams = new URLSearchParams();
    
    if (params.query) searchParams.append('query', params.query);
    if (params.department) searchParams.append('department', params.department);
    if (params.status) searchParams.append('status', params.status);
    if (params.limit) searchParams.append('limit', params.limit.toString());
    if (params.offset) searchParams.append('offset', params.offset.toString());

    const queryString = searchParams.toString();
    const url = queryString ? `${API_ENDPOINTS.EMPLOYEES.SEARCH}?${queryString}` : API_ENDPOINTS.EMPLOYEES.SEARCH;
    
    return await apiClient.get<Employee[]>(url);
  }

  /**
   * Create a new employee and invalidate cache
   */
  static async createEmployee(employeeData: CreateEmployeeRequest): Promise<Employee> {
    try {
      const employee = await apiClient.post<Employee>(API_ENDPOINTS.EMPLOYEES.CREATE, employeeData);
      
      // Invalidate employees and dashboard cache
      CacheManager.invalidateEmployees();
      CacheManager.invalidateDashboard();
      
      return employee;
    } catch (error: unknown) {
      console.error('❌ Failed to create employee:', error);
      throw error;
    }
  }

  /**
   * Update an existing employee and invalidate cache
   */
  static async updateEmployee(id: number, updates: Partial<Employee>): Promise<Employee> {
    const employee = await apiClient.put<Employee>(API_ENDPOINTS.EMPLOYEES.BY_ID(id), updates);
    
    // Invalidate employees and dashboard cache
    CacheManager.invalidateEmployees();
    CacheManager.invalidateDashboard();
    
    return employee;
  }

  /**
   * Delete an employee and invalidate cache
   */
  static async deleteEmployee(id: number): Promise<void> {
    await apiClient.delete<void>(API_ENDPOINTS.EMPLOYEES.BY_ID(id));
    
    // Invalidate employees and dashboard cache
    CacheManager.invalidateEmployees();
    CacheManager.invalidateDashboard();
  }

  /**
   * Check-in an employee
   */
  static async checkInEmployee(id: number): Promise<Employee> {
    return await apiClient.post<Employee>(`${API_ENDPOINTS.EMPLOYEES.BY_ID(id)}/check-in`);
  }

  /**
   * Check-out an employee
   */
  static async checkOutEmployee(id: number): Promise<Employee> {
    return await apiClient.post<Employee>(`${API_ENDPOINTS.EMPLOYEES.BY_ID(id)}/check-out`);
  }
}

export default EmployeeService;