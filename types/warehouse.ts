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
  totalAmount?: number;
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
  warehouseId: string;
  warehouseName?: string;
  isPermanent: boolean;
  expiresAt?: string;
  notes?: string;
  createdAt?: string;
  createdBy?: string;
}
