import React, { createContext, useContext, useState, ReactNode, useEffect } from 'react';
import { Employee } from '../types';
import { initialEmployees } from '../constants/Data';
import { EmployeeService, CreateEmployeeRequest } from '../services';
import { useApi } from '../hooks';

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
}

const EmployeesContext = createContext<EmployeesContextType | undefined>(undefined);

export function EmployeesProvider({ children }: { children: ReactNode }) {
  const [employees, setEmployees] = useState<Employee[]>([]);

  // API integration using useApi hook
  const {
    data: apiEmployees,
    loading,
    error,
    execute: fetchEmployees,
    reset,
  } = useApi(EmployeeService.getAllEmployees, { immediate: true });

  // Effect to sync API data with local state
  useEffect(() => {
    if (apiEmployees) {
      setEmployees(apiEmployees);
    }
  }, [apiEmployees]);

  const addEmployee = async (newEmployee: Omit<Employee, 'id' | 'expanded'>) => {
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
      };
      
      const createdEmployee = await EmployeeService.createEmployee(createData);
      setEmployees(prev => [...prev, createdEmployee]);
    } catch (error) {
      console.error('Failed to create employee via API:', error);
      throw error; // Let the UI handle the error
    }
  };

  const updateEmployee = async (id: number, updates: Partial<Employee>) => {
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
  };

  const deleteEmployee = async (id: number) => {
    try {
      await EmployeeService.deleteEmployee(id);
      setEmployees(prev => prev.filter(employee => employee.id !== id));
    } catch (error) {
      console.error('Failed to delete employee via API:', error);
      throw error; // Let the UI handle the error
    }
  };

  const refreshEmployees = async (): Promise<void> => {
    await fetchEmployees();
  };

  const searchEmployees = async (query: string): Promise<Employee[]> => {
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
  };

  const getCheckedInEmployees = async (): Promise<Employee[]> => {
    try {
      return await EmployeeService.getCheckedInEmployees();
    } catch (error) {
      console.error('Failed to get checked-in employees via API:', error);
      // Fallback to local filter
      return employees.filter(employee => 
        employee.checkInTime !== 'Not checked in'
      );
    }
  };

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