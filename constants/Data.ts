import { Item, Employee, Reminder } from '../types';

// DEPRECATED: Mock stores removed - now using StoreService from services/api/storeService.ts
// Stores are fetched dynamically from backend API via StoreService.getUserStores()
// export const mockStores: Store[] = [...]  ← Removed

export const initialItems: Item[] = [
  { 
    id: 1, 
    name: 'Coffee', 
    price: 4.50, 
    quantity: 25, 
    total: 112.50, 
    expanded: false, 
    category: 'Beverages', 
    salesCount: 445 
  },
  { 
    id: 2, 
    name: 'Sandwich', 
    price: 8.99, 
    quantity: 15, 
    total: 134.85, 
    expanded: false, 
    category: 'Food', 
    salesCount: 298 
  },
  { 
    id: 3, 
    name: 'Croissant', 
    price: 3.75, 
    quantity: 20, 
    total: 75.00, 
    expanded: false, 
    category: 'Bakery', 
    salesCount: 245 
  },
  { 
    id: 4, 
    name: 'Tea', 
    price: 3.25, 
    quantity: 30, 
    total: 97.50, 
    expanded: false, 
    category: 'Beverages', 
    salesCount: 189 
  },
  { 
    id: 5, 
    name: 'Muffin', 
    price: 2.99, 
    quantity: 12, 
    total: 35.88, 
    expanded: false, 
    category: 'Bakery', 
    salesCount: 156 
  },
  { 
    id: 6, 
    name: 'Salad', 
    price: 6.50, 
    quantity: 8, 
    total: 52.00, 
    expanded: false, 
    category: 'Food', 
    salesCount: 134 
  }
];

export const initialEmployees: Employee[] = [
  { 
    id: 1, 
    firstName: 'John', 
    lastName: 'Doe', 
    checkInTime: '8:00 AM', 
    hourlyRate: 18.50, 
    phone: '(555) 123-4567',
    totalCompensation: 38480,
    startDate: '2023-03-15',
    status: 'Active',
    title: 'Barista',
    bonus: 1200,
    expanded: false
  },
  { 
    id: 2, 
    firstName: 'Sarah', 
    lastName: 'Johnson', 
    checkInTime: '9:30 AM', 
    hourlyRate: 22.00, 
    phone: '(555) 987-6543',
    totalCompensation: 45760,
    startDate: '2022-11-08',
    status: 'Active',
    title: 'Shift Manager',
    bonus: 2500,
    expanded: false
  },
  { 
    id: 3, 
    firstName: 'Mike', 
    lastName: 'Chen', 
    checkInTime: 'Not checked in', 
    hourlyRate: 16.75, 
    phone: '(555) 456-7890',
    totalCompensation: 34840,
    startDate: '2024-01-22',
    status: 'Active',
    title: 'Cashier',
    bonus: 500,
    expanded: false
  },
  { 
    id: 4, 
    firstName: 'Emma', 
    lastName: 'Williams', 
    checkInTime: '7:45 AM', 
    hourlyRate: 25.00, 
    phone: '(555) 321-0987',
    totalCompensation: 52000,
    startDate: '2021-08-30',
    status: 'Active',
    title: 'Assistant Manager',
    bonus: 3500,
    expanded: false
  }
];

export const initialReminders: Reminder[] = [
  { 
    id: 1, 
    title: 'Coffee Bean Delivery', 
    date: '2025-08-26', 
    type: 'order', 
    time: '10:00 AM', 
    description: 'Premium coffee beans from supplier' 
  },
  { 
    id: 2, 
    title: 'Staff Meeting', 
    date: '2025-08-27', 
    type: 'meeting', 
    time: '2:00 PM', 
    description: 'Monthly team meeting' 
  },
  { 
    id: 3, 
    title: 'Equipment Maintenance', 
    date: '2025-08-29', 
    type: 'maintenance', 
    time: '9:00 AM', 
    description: 'Espresso machine service' 
  },
  { 
    id: 4, 
    title: 'Inventory Restock', 
    date: '2025-08-30', 
    type: 'order', 
    time: '11:00 AM', 
    description: 'Pastries and bread delivery' 
  }
];

export const getCurrentDateTime = () => {
  return '2025-08-25 17:19:32';
};

export const getCurrentUser = () => {
  return 'TESTER';
};