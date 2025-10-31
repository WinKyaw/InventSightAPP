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
