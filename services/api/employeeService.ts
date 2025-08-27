import { Employee } from '../../types';
import { get, post, put, del } from './httpClient';
import { API_ENDPOINTS, EmployeeSearchParams, CreateEmployeeRequest, ApiResponse } from './config';

export class EmployeeService {
  /**
   * Get all active employees
   */
  static async getAllEmployees(): Promise<Employee[]> {
    try {
      const response = await get<Employee[]>(API_ENDPOINTS.EMPLOYEES.ALL);
      return response.data;
    } catch (error) {
      console.error('Failed to fetch employees:', error);
      throw error;
    }
  }

  /**
   * Get employee by ID
   */
  static async getEmployeeById(id: string | number): Promise<Employee> {
    try {
      const response = await get<Employee>(API_ENDPOINTS.EMPLOYEES.BY_ID(id));
      return response.data;
    } catch (error) {
      console.error(`Failed to fetch employee ${id}:`, error);
      throw error;
    }
  }

  /**
   * Get currently checked-in employees
   */
  static async getCheckedInEmployees(): Promise<Employee[]> {
    try {
      const response = await get<Employee[]>(API_ENDPOINTS.EMPLOYEES.CHECKED_IN);
      return response.data;
    } catch (error) {
      console.error('Failed to fetch checked-in employees:', error);
      throw error;
    }
  }

  /**
   * Search employees by query parameters
   */
  static async searchEmployees(params: EmployeeSearchParams): Promise<Employee[]> {
    try {
      const searchParams = new URLSearchParams();
      
      if (params.query) searchParams.append('query', params.query);
      if (params.department) searchParams.append('department', params.department);
      if (params.status) searchParams.append('status', params.status);
      if (params.limit) searchParams.append('limit', params.limit.toString());
      if (params.offset) searchParams.append('offset', params.offset.toString());

      const queryString = searchParams.toString();
      const url = queryString ? `${API_ENDPOINTS.EMPLOYEES.SEARCH}?${queryString}` : API_ENDPOINTS.EMPLOYEES.SEARCH;
      
      const response = await get<Employee[]>(url);
      return response.data;
    } catch (error) {
      console.error('Failed to search employees:', error);
      throw error;
    }
  }

  /**
   * Create a new employee
   */
  static async createEmployee(employeeData: CreateEmployeeRequest): Promise<Employee> {
    try {
      // Calculate total compensation based on hourly rate (assuming 40 hours/week * 52 weeks)
      const totalCompensation = employeeData.hourlyRate * 2080;
      
      const newEmployeeData = {
        ...employeeData,
        totalCompensation,
        status: employeeData.status || 'Active',
        bonus: employeeData.bonus || 0,
        checkInTime: 'Not checked in',
        expanded: false,
      };

      const response = await post<Employee>(API_ENDPOINTS.EMPLOYEES.CREATE, newEmployeeData);
      return response.data;
    } catch (error) {
      console.error('Failed to create employee:', error);
      throw error;
    }
  }

  /**
   * Update an existing employee
   */
  static async updateEmployee(id: number, updates: Partial<Employee>): Promise<Employee> {
    try {
      // Recalculate total compensation if hourly rate is updated
      if (updates.hourlyRate) {
        updates.totalCompensation = updates.hourlyRate * 2080;
      }

      const response = await put<Employee>(API_ENDPOINTS.EMPLOYEES.BY_ID(id), updates);
      return response.data;
    } catch (error) {
      console.error(`Failed to update employee ${id}:`, error);
      throw error;
    }
  }

  /**
   * Delete an employee
   */
  static async deleteEmployee(id: number): Promise<void> {
    try {
      await del(API_ENDPOINTS.EMPLOYEES.BY_ID(id));
    } catch (error) {
      console.error(`Failed to delete employee ${id}:`, error);
      throw error;
    }
  }

  /**
   * Check-in an employee
   */
  static async checkInEmployee(id: number): Promise<Employee> {
    try {
      const currentTime = new Date().toLocaleTimeString('en-US', { 
        hour: 'numeric', 
        minute: '2-digit',
        hour12: true 
      });
      
      return await this.updateEmployee(id, { 
        checkInTime: currentTime 
      });
    } catch (error) {
      console.error(`Failed to check-in employee ${id}:`, error);
      throw error;
    }
  }

  /**
   * Check-out an employee
   */
  static async checkOutEmployee(id: number): Promise<Employee> {
    try {
      return await this.updateEmployee(id, { 
        checkInTime: 'Not checked in' 
      });
    } catch (error) {
      console.error(`Failed to check-out employee ${id}:`, error);
      throw error;
    }
  }
}

export default EmployeeService;