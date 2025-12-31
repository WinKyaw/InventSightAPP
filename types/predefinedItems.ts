// Predefined Items types and interfaces

export interface PredefinedItem {
  id: string;
  name: string;
  sku?: string;
  category: string;
  unitType: string;
  description?: string;
  defaultPrice?: number;
  companyId: string;
  isActive: boolean;
  createdAt: string;
  createdBy: string;
  updatedAt?: string;
  deletedAt?: string;
}

export interface PredefinedItemRequest {
  name: string;
  sku?: string;
  category: string;
  unitType: string;
  description?: string;
  defaultPrice?: number;
  storeIds?: string[];
  warehouseIds?: string[];
}

export interface PredefinedItemsResponse {
  success: boolean;
  message?: string;
  data: {
    items: PredefinedItem[];
    totalElements: number;    // ← Backend uses "totalElements" not "totalItems"
    totalPages: number;
    currentPage: number;
    pageSize: number;
  };
}

export interface BulkCreateResponse {
  success: boolean;
  created: number;
  items: PredefinedItem[];
}

export interface ImportResponse {
  success: boolean;
  imported: number;
  skipped: number;
  errors: string[];
}
