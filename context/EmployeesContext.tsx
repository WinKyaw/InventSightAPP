import React, { createContext, useContext, useState, ReactNode } from 'react';
import { Employee } from '../types';
import { initialEmployees } from '../constants/Data';

interface EmployeesContextType {
  employees: Employee[];
  setEmployees: React.Dispatch<React.SetStateAction<Employee[]>>;
  addEmployee: (employee: Omit<Employee, 'id' | 'expanded'>) => void;
  updateEmployee: (id: number, updates: Partial<Employee>) => void;
  deleteEmployee: (id: number) => void;
}

const EmployeesContext = createContext<EmployeesContextType | undefined>(undefined);

export function EmployeesProvider({ children }: { children: ReactNode }) {
  const [employees, setEmployees] = useState<Employee[]>(initialEmployees);

  const addEmployee = (newEmployee: Omit<Employee, 'id' | 'expanded'>) => {
    const employee: Employee = {
      ...newEmployee,
      id: Date.now(),
      expanded: false,
      totalCompensation: newEmployee.hourlyRate * 2080, // 40 hours * 52 weeks
    };
    setEmployees(prev => [...prev, employee]);
  };

  const updateEmployee = (id: number, updates: Partial<Employee>) => {
    setEmployees(prev => prev.map(employee => 
      employee.id === id ? { ...employee, ...updates } : employee
    ));
  };

  const deleteEmployee = (id: number) => {
    setEmployees(prev => prev.filter(employee => employee.id !== id));
  };

  return (
    <EmployeesContext.Provider value={{
      employees,
      setEmployees,
      addEmployee,
      updateEmployee,
      deleteEmployee
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