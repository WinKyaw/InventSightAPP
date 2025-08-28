import { Employee } from '../../types';
import { apiClient } from './apiClient';
import { API_ENDPOINTS, EmployeeSearchParams, CreateEmployeeRequest } from './config';

/**
 * Employee API Client - Simple HTTP client for employee operations
 */
export class EmployeeService {
  /**
   * Get all active employees
   */
  static async getAllEmployees(): Promise<Employee[]> {
    return await apiClient.get<Employee[]>(API_ENDPOINTS.EMPLOYEES.ALL);
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
   * Create a new employee
   */
  static async createEmployee(employeeData: CreateEmployeeRequest): Promise<Employee> {
    return await apiClient.post<Employee>(API_ENDPOINTS.EMPLOYEES.CREATE, employeeData);
  }

  /**
   * Update an existing employee
   */
  static async updateEmployee(id: number, updates: Partial<Employee>): Promise<Employee> {
    return await apiClient.put<Employee>(API_ENDPOINTS.EMPLOYEES.BY_ID(id), updates);
  }

  /**
   * Delete an employee
   */
  static async deleteEmployee(id: number): Promise<void> {
    await apiClient.delete<void>(API_ENDPOINTS.EMPLOYEES.BY_ID(id));
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