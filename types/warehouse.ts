// Warehouse-related types and interfaces

/**
 * Summary information about a warehouse
 */
export interface WarehouseSummary {
  id: string;
  name: string;
  location?: string;
  code?: string;
  isActive?: boolean;
}

/**
 * Inventory row for a specific warehouse
 */
export interface WarehouseInventoryRow {
  id: string;
  productId: string;
  productName: string;
  sku?: string;
  availableQuantity: number;
  price?: number;
  currency?: string;
  lowStockThreshold?: number;
  warehouseName?: string;
  lastUpdated?: string;
}

/**
 * Product availability across warehouses
 */
export interface ProductAvailability {
  productId: string;
  productName: string;
  sku?: string;
  warehouses: Array<{
    warehouseId: string;
    warehouseName: string;
    availableQuantity: number;
    location?: string;
  }>;
  totalAvailable: number;
}

/**
 * Warehouse restock record
 */
export interface WarehouseRestock {
  id: string;
  warehouseId: string;
  productId: string;
  productName: string;
  quantity: number;
  restockDate?: string;
  createdAt?: string;
  createdBy?: string;
  transactionType?: string;
  notes?: string;
  sku?: string;
}

/**
 * Warehouse sale record
 */
export interface WarehouseSale {
  id: string;
  warehouseId?: string;
  productId?: string;
  productName?: string;
  quantity?: number;
  receiptNumber?: string;
  totalAmount?: number; // Optional for withdrawals that aren't traditional sales
  saleDate?: string;
  withdrawalDate?: string;
  createdAt?: string;
  createdBy?: string;
  transactionType?: string;
  customerName?: string;
  items?: number;
  notes?: string;
}

/**
 * Employee warehouse assignment
 */
export interface WarehouseAssignment {
  id: string;
  userId: string;
  employeeId?: string; // ✅ Employee ID from the new endpoint
  warehouseId: string;
  warehouseName?: string;
  isPermanent: boolean;
  expiresAt?: string;
  notes?: string;
  createdAt?: string;
  createdBy?: string;
  permissionType?: 'READ' | 'READ_WRITE'; // ✅ NEW: Permission level for the warehouse
}

/**
 * Employee warehouse response from API
 * ✅ NEW: Response structure from getEmployeeWarehouses endpoint
 */
export interface EmployeeWarehouseResponse {
  userId: string | null;
  employeeId: string;
  employeeName?: string;
  username?: string;
  warehouses: WarehouseAssignment[];
  count: number;
}

/**
 * Warehouse permissions for a user
 */
export interface WarehousePermissions {
  canRead: boolean;
  canWrite: boolean;
  canAddInventory: boolean;
  canWithdrawInventory: boolean;
  isGMPlus: boolean;
}

/**
 * Warehouse permission response
 */
export interface WarehousePermissionResponse {
  success: boolean;
  permissions: WarehousePermissions;
}

/**
 * Warehouse user with permission
 */
export interface WarehouseUser {
  userId: string;
  username: string;
  email?: string;
  permission: 'READ' | 'READ_WRITE';
}
