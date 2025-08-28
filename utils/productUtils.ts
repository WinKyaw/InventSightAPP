import { Product, CreateProductRequest } from '../services/api/config';
import { Item } from '../types';

/**
 * Convert API Product to UI Item
 */
export function productToItem(product: Product): Item {
  return {
    id: product.id,
    name: product.name,
    price: product.price,
    quantity: product.quantity,
    total: product.price * product.quantity,
    expanded: false,
    category: product.category,
    salesCount: 0, // This would need to come from sales/analytics API
    description: product.description,
    sku: product.sku,
    minStock: product.minStock,
    maxStock: product.maxStock,
    createdAt: product.createdAt,
    updatedAt: product.updatedAt,
  };
}

/**
 * Convert UI Item to API CreateProductRequest
 */
export function itemToCreateProductRequest(item: Partial<Item>): CreateProductRequest {
  return {
    name: item.name || '',
    price: item.price || 0,
    quantity: item.quantity || 0,
    category: item.category || '',
    description: item.description,
    sku: item.sku,
    minStock: item.minStock,
    maxStock: item.maxStock,
  };
}

/**
 * Convert array of API Products to UI Items
 */
export function productsToItems(products: Product[]): Item[] {
  return products.map(productToItem);
}

/**
 * Calculate total value for a list of products
 */
export function calculateTotalValue(products: Product[]): number {
  return products.reduce((total, product) => total + (product.price * product.quantity), 0);
}

/**
 * Filter products by low stock
 */
export function filterLowStockProducts(products: Product[], threshold = 10): Product[] {
  return products.filter(product => {
    const minStock = product.minStock || threshold;
    return product.quantity <= minStock;
  });
}

/**
 * Group products by category
 */
export function groupProductsByCategory(products: Product[]): Record<string, Product[]> {
  return products.reduce((groups, product) => {
    const category = product.category || 'Uncategorized';
    if (!groups[category]) {
      groups[category] = [];
    }
    groups[category].push(product);
    return groups;
  }, {} as Record<string, Product[]>);
}

/**
 * Sort products by given criteria
 */
export function sortProducts(
  products: Product[], 
  sortBy: string, 
  sortOrder: 'asc' | 'desc' = 'asc'
): Product[] {
  const sorted = [...products].sort((a, b) => {
    let aValue: any, bValue: any;
    
    switch (sortBy) {
      case 'name':
        aValue = a.name.toLowerCase();
        bValue = b.name.toLowerCase();
        break;
      case 'price':
        aValue = a.price;
        bValue = b.price;
        break;
      case 'quantity':
        aValue = a.quantity;
        bValue = b.quantity;
        break;
      case 'total':
        aValue = a.price * a.quantity;
        bValue = b.price * b.quantity;
        break;
      case 'category':
        aValue = a.category.toLowerCase();
        bValue = b.category.toLowerCase();
        break;
      case 'createdAt':
      case 'updatedAt':
        aValue = new Date(a[sortBy] || 0).getTime();
        bValue = new Date(b[sortBy] || 0).getTime();
        break;
      default:
        aValue = a.name.toLowerCase();
        bValue = b.name.toLowerCase();
    }

    if (aValue < bValue) return sortOrder === 'asc' ? -1 : 1;
    if (aValue > bValue) return sortOrder === 'asc' ? 1 : -1;
    return 0;
  });

  return sorted;
}

/**
 * Search products by query
 */
export function searchProducts(products: Product[], query: string): Product[] {
  if (!query.trim()) return products;
  
  const searchTerm = query.toLowerCase().trim();
  
  return products.filter(product => 
    product.name.toLowerCase().includes(searchTerm) ||
    product.category.toLowerCase().includes(searchTerm) ||
    (product.description && product.description.toLowerCase().includes(searchTerm)) ||
    (product.sku && product.sku.toLowerCase().includes(searchTerm))
  );
}