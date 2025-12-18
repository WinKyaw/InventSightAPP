export interface Item {
  id: number;
  name: string;
  price: number;
  quantity: number;
  total: number;
  expanded: boolean;
  category: string;
  salesCount: number;
  description?: string;
  sku?: string;
  barcode?: string;
  minStock?: number;
  maxStock?: number;
  createdAt?: string;
  updatedAt?: string;
}

export interface Employee {
  id: number;
  firstName: string;
  lastName: string;
  checkInTime: string;
  hourlyRate: number;
  phone: string;
  totalCompensation: number;
  startDate: string;
  status: string;
  title: string;
  bonus: number;
  expanded: boolean;
}

export interface Reminder {
  id: number;
  title: string;
  date: string;
  type: 'order' | 'meeting' | 'maintenance';
  time: string;
  description: string;
}

export interface ReceiptItem {
  id: number;
  name: string;
  price: number;
  quantity: number;
  total: number;
  stock: number; // Available stock from product
}

export interface Receipt {
  id: number;
  receiptNumber: string;
  customerName: string;
  items: ReceiptItem[];
  subtotal: number;
  tax: number;
  total: number;
  dateTime: string;
  status: string;
}