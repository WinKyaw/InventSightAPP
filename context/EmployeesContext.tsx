import React, { createContext, useContext, useState, ReactNode, useEffect, useCallback } from 'react';
import { Employee } from '../types';
import { initialEmployees } from '../constants/Data';
import { EmployeeService, CreateEmployeeRequest, DEFAULT_STORE_ID } from '../services';
import { useAuthenticatedAPI, useApiReadiness } from '../hooks';

interface EmployeesContextType {
  employees: Employee[];
  setEmployees: React.Dispatch<React.SetStateAction<Employee[]>>;
  addEmployee: (employee: Omit<Employee, 'id' | 'expanded'>) => void;
  updateEmployee: (id: number, updates: Partial<Employee>) => void;
  deleteEmployee: (id: number) => void;
  // New API-related properties
  loading: boolean;
  error: string | null;
  refreshEmployees: () => Promise<void>;
  searchEmployees: (query: string) => Promise<Employee[]>;
  getCheckedInEmployees: () => Promise<Employee[]>;
  useApiIntegration: boolean;
  setUseApiIntegration: (use: boolean) => void;
}

const EmployeesContext = createContext<EmployeesContextType | undefined>(undefined);

export function EmployeesProvider({ children }: { children: ReactNode }) {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [useApiIntegration, setUseApiIntegration] = useState<boolean>(true);

  // Authentication readiness check
  const { canMakeApiCalls } = useApiReadiness();

  // API integration using useAuthenticatedAPI hook
  const {
    data: apiEmployees,
    loading,
    error,
    execute: fetchEmployees,
    reset,
  } = useAuthenticatedAPI(EmployeeService.getAllEmployees, { immediate: false });

  // Effect to sync API data with local state when API integration is enabled
  useEffect(() => {
    if (useApiIntegration && apiEmployees && Array.isArray(apiEmployees)) {
      // Empty arrays are valid responses - set them without error
      setEmployees(apiEmployees);
    } else if (!useApiIntegration) {
      // Only fallback to mock data when API integration is explicitly disabled
      setEmployees(initialEmployees);
    }
  }, [useApiIntegration, apiEmployees]);

  // ✅ LAZY LOADING: Don't auto-fetch - let screens control when to fetch
  // Removed automatic loading on mount
  // Screens will use useFocusEffect to load employees when focused

  const fallbackAddEmployee = useCallback((newEmployee: Omit<Employee, 'id' | 'expanded'>) => {
    const employee: Employee = {
      ...newEmployee,
      id: Date.now(),
      expanded: false,
      totalCompensation: newEmployee.hourlyRate * 2080, // 40 hours * 52 weeks
    };
    setEmployees(prev => [...prev, employee]);
  }, []);

  const addEmployee = useCallback(async (newEmployee: Omit<Employee, 'id' | 'expanded'> & { storeId?: string }) => {
    if (useApiIntegration && canMakeApiCalls) {
      try {
        const createData: CreateEmployeeRequest = {
          firstName: newEmployee.firstName,
          lastName: newEmployee.lastName,
          phone: newEmployee.phone,
          hourlyRate: newEmployee.hourlyRate,
          title: newEmployee.title,
          startDate: newEmployee.startDate,
          status: newEmployee.status,
          bonus: newEmployee.bonus,
          storeId: newEmployee.storeId || DEFAULT_STORE_ID, // Use constant for fallback UUID
        };
        
        const createdEmployee = await EmployeeService.createEmployee(createData);
        setEmployees(prev => [...prev, createdEmployee]);
      } catch (error) {
        console.error('Failed to create employee via API:', error);
        // Wrap error in user-friendly message before re-throwing
        const userMessage = error instanceof Error 
          ? error.message 
          : 'Failed to create employee. Please check your connection and try again.';
        throw new Error(userMessage);
      }
    } else {
      fallbackAddEmployee(newEmployee);
    }
  }, [useApiIntegration, canMakeApiCalls, fallbackAddEmployee]);

  const updateEmployee = useCallback(async (id: number, updates: Partial<Employee>) => {
    if (useApiIntegration && canMakeApiCalls) {
      try {
        const updatedEmployee = await EmployeeService.updateEmployee(id, updates);
        setEmployees(prev => prev.map(employee => 
          employee.id === id ? updatedEmployee : employee
        ));
      } catch (error) {
        console.error('Failed to update employee via API:', error);
        // Fallback to local update if API fails
        setEmployees(prev => prev.map(employee => 
          employee.id === id ? { ...employee, ...updates } : employee
        ));
      }
    } else {
      setEmployees(prev => prev.map(employee => 
        employee.id === id ? { ...employee, ...updates } : employee
      ));
    }
  }, [useApiIntegration, canMakeApiCalls]);

  const deleteEmployee = useCallback(async (id: number) => {
    if (useApiIntegration && canMakeApiCalls) {
      try {
        await EmployeeService.deleteEmployee(id);
        setEmployees(prev => prev.filter(employee => employee.id !== id));
      } catch (error) {
        console.error('Failed to delete employee via API:', error);
        // Fallback to local deletion if API fails
        setEmployees(prev => prev.filter(employee => employee.id !== id));
      }
    } else {
      setEmployees(prev => prev.filter(employee => employee.id !== id));
    }
  }, [useApiIntegration, canMakeApiCalls]);

  const refreshEmployees = useCallback(async (): Promise<void> => {
    if (useApiIntegration && canMakeApiCalls) {
      await fetchEmployees();
    }
  }, [useApiIntegration, canMakeApiCalls, fetchEmployees]);

  const searchEmployees = useCallback(async (query: string): Promise<Employee[]> => {
    if (useApiIntegration && canMakeApiCalls) {
      try {
        return await EmployeeService.searchEmployees({ query });
      } catch (error) {
        console.error('Failed to search employees via API:', error);
        // Fallback to local search
        return employees.filter(employee => 
          employee.firstName.toLowerCase().includes(query.toLowerCase()) ||
          employee.lastName.toLowerCase().includes(query.toLowerCase()) ||
          employee.title.toLowerCase().includes(query.toLowerCase())
        );
      }
    } else {
      // Local search
      return employees.filter(employee => 
        employee.firstName.toLowerCase().includes(query.toLowerCase()) ||
        employee.lastName.toLowerCase().includes(query.toLowerCase()) ||
        employee.title.toLowerCase().includes(query.toLowerCase())
      );
    }
  }, [useApiIntegration, canMakeApiCalls, employees]);

  const getCheckedInEmployees = useCallback(async (): Promise<Employee[]> => {
    if (useApiIntegration && canMakeApiCalls) {
      try {
        return await EmployeeService.getCheckedInEmployees();
      } catch (error) {
        console.error('Failed to get checked-in employees via API:', error);
        // Fallback to local filter
        return employees.filter(employee => 
          employee.checkInTime !== 'Not checked in'
        );
      }
    } else {
      return employees.filter(employee => 
        employee.checkInTime !== 'Not checked in'
      );
    }
  }, [useApiIntegration, canMakeApiCalls, employees]);

  return (
    <EmployeesContext.Provider value={{
      employees,
      setEmployees,
      addEmployee,
      updateEmployee,
      deleteEmployee,
      loading,
      error,
      refreshEmployees,
      searchEmployees,
      getCheckedInEmployees,
      useApiIntegration,
      setUseApiIntegration,
    }}>
      {children}
    </EmployeesContext.Provider>
  );
}

export function useEmployees() {
  const context = useContext(EmployeesContext);
  if (context === undefined) {
    throw new Error('useEmployees must be used within an EmployeesProvider');
  }
  return context;
}