import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import { Alert } from 'react-native';
import ProductService from '../services/api/productService';
import CategoryService from '../services/api/categoryService';
import { useAuthenticatedAPI, useApiReadiness } from '../hooks';
import { 
  Product,
  CreateProductRequest,
  UpdateProductRequest,
  UpdateStockRequest,
  SearchProductsParams,
  Category
} from '../services/api/config';

interface ItemsApiContextType {
  // Products state
  products: Product[];
  totalProducts: number;
  currentPage: number;
  totalPages: number;
  hasMore: boolean;
  loading: boolean;
  error: string | null;
  refreshing: boolean;
  isInitialized: boolean;  // Track if initial load has been attempted
  
  // Categories state
  categories: Category[];
  categoriesLoading: boolean;
  
  // Search and filter state
  searchQuery: string;
  selectedCategoryId: number | null;
  sortBy: string;
  sortOrder: 'asc' | 'desc';
  
  // Actions
  loadProducts: (page?: number, refresh?: boolean) => Promise<void>;
  searchProducts: (query: string, filters?: Partial<SearchProductsParams>) => Promise<void>;
  createProduct: (productData: CreateProductRequest) => Promise<Product | null>;
  updateProduct: (id: number, updates: UpdateProductRequest) => Promise<Product | null>;
  deleteProduct: (id: number) => Promise<boolean>;
  updateProductStock: (id: number, stockData: UpdateStockRequest) => Promise<Product | null>;
  loadCategories: () => Promise<void>;
  refreshProducts: () => Promise<void>;
  
  // Filter and sort actions
  setSearchQuery: (query: string) => void;
  setSelectedCategoryId: (categoryId: number | null) => void;
  setSortBy: (sortBy: string) => void;
  setSortOrder: (order: 'asc' | 'desc') => void;
  clearFilters: () => void;
  
  // Utility functions
  getProductById: (id: number) => Product | undefined;
  getTotalValue: () => number;
  getLowStockProducts: () => Product[];
}

const ItemsApiContext = createContext<ItemsApiContextType | undefined>(undefined);

const DEFAULT_SORT = 'name';
const DEFAULT_SORT_ORDER = 'asc';
const DEFAULT_PAGE_SIZE = 20;

export function ItemsApiProvider({ children }: { children: ReactNode }) {
  // Authentication readiness check
  const { canMakeApiCalls } = useApiReadiness();

  // Products state
  const [products, setProducts] = useState<Product[]>([]);
  const [totalProducts, setTotalProducts] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  const [hasMore, setHasMore] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);  // Track if initial load attempted
  
  // Categories state
  const [categories, setCategories] = useState<Category[]>([]);
  const [categoriesLoading, setCategoriesLoading] = useState(false);
  
  // Search and filter state
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategoryId, setSelectedCategoryId] = useState<number | null>(null);
  const [sortBy, setSortBy] = useState(DEFAULT_SORT);
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>(DEFAULT_SORT_ORDER);

  // Load products with pagination
  const loadProducts = useCallback(async (page = 1, refresh = false) => {
    if (!canMakeApiCalls) {
      console.warn('Cannot load products - not authenticated');
      return;
    }
    console.log("loading products...")
    try {
      if (refresh) {
        setRefreshing(true);
        setError(null);
      } else {
        setLoading(true);
        setError(null);
      }

      let response;
      
      // If we have search query or filters, use search endpoint
      if (searchQuery || selectedCategoryId) {
        const searchParams: SearchProductsParams = {
          query: searchQuery || undefined,
          categoryId: selectedCategoryId || undefined,
          page,
          limit: DEFAULT_PAGE_SIZE,
          sortBy: sortBy as any,
          sortOrder
        };
        
        const searchResponse = await ProductService.searchProducts(searchParams);
        console.log(searchResponse.toString());
        response = {
          products: searchResponse.products,
          totalCount: searchResponse.totalCount,
          currentPage: page,
          totalPages: Math.ceil(searchResponse.totalCount / DEFAULT_PAGE_SIZE),
          hasMore: page * DEFAULT_PAGE_SIZE < searchResponse.totalCount
        };
      } else {
        // Otherwise use regular getAllProducts
        response = await ProductService.getAllProducts(page, DEFAULT_PAGE_SIZE, sortBy, sortOrder);
        console.log(JSON.stringify(response));
      }

      if (refresh || page === 1) {
        setProducts(response.products);
      } else {
        // Append for pagination
        setProducts(prev => [...prev, ...response.products]);
      }

      setTotalProducts(response.totalItems || 0);
      setCurrentPage(response.currentPage);
      setTotalPages(response.totalPages);
      setHasMore(response.hasMore);
      setIsInitialized(true);  // Mark as initialized after successful load
    } catch (err) {
      console.error('Failed to load products:', err);
      setError(err instanceof Error ? err.message : 'Failed to load products');
      setIsInitialized(true);  // Mark as initialized even on error
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [searchQuery, selectedCategoryId, sortBy, sortOrder, canMakeApiCalls]);

  // Search products
  const searchProducts = useCallback(async (query: string, filters: Partial<SearchProductsParams> = {}) => {
    if (!canMakeApiCalls) {
      console.warn('Cannot search products - not authenticated');
      return;
    }

    try {
      setLoading(true);
      setError(null);
      
      const searchParams: SearchProductsParams = {
        query: query || undefined,
        ...filters,
        page: 1,
        limit: DEFAULT_PAGE_SIZE,
        sortBy: sortBy as any,
        sortOrder
      };

      const response = await ProductService.searchProducts(searchParams);
      
      setProducts(response.products);
      setTotalProducts(response.totalCount);
      setCurrentPage(1);
      setTotalPages(Math.ceil(response.totalCount / DEFAULT_PAGE_SIZE));
      setHasMore(DEFAULT_PAGE_SIZE < response.totalCount);
    } catch (err) {
      console.error('Failed to search products:', err);
      setError(err instanceof Error ? err.message : 'Failed to search products');
    } finally {
      setLoading(false);
    }
  }, [sortBy, sortOrder, canMakeApiCalls]);

  // Create product
  const createProduct = useCallback(async (productData: CreateProductRequest): Promise<Product | null> => {
    if (!canMakeApiCalls) {
      console.warn('Cannot create product - not authenticated');
      return null;
    }

    try {
      const newProduct = await ProductService.createProduct(productData);
      if (newProduct) {
        // Refresh the product list
        await loadProducts(1, true);
        Alert.alert('Success', `${newProduct.name} has been added to inventory!`);
      }
      return newProduct;
    } catch (err) {
      console.error('Failed to create product:', err);
      Alert.alert('Error', err instanceof Error ? err.message : 'Failed to create product');
      throw err;
    }
  }, [loadProducts, canMakeApiCalls]);

  // Update product
  const updateProduct = useCallback(async (id: number, updates: UpdateProductRequest): Promise<Product | null> => {
    if (!canMakeApiCalls) {
      console.warn('Cannot update product - not authenticated');
      return null;
    }

    try {
      const updatedProduct = await ProductService.updateProduct(id, updates);
      if (updatedProduct) {
        // Update the product in the local state
        setProducts(prev => prev.map(p => p.id === id ? updatedProduct : p));
        Alert.alert('Success', 'Product updated successfully!');
      }
      return updatedProduct;
    } catch (err) {
      console.error('Failed to update product:', err);
      Alert.alert('Error', err instanceof Error ? err.message : 'Failed to update product');
      throw err;
    }
  }, [canMakeApiCalls]);

  // Delete product
  const deleteProduct = useCallback(async (id: number): Promise<boolean> => {
    if (!canMakeApiCalls) {
      console.warn('Cannot delete product - not authenticated');
      return false;
    }

    try {
      const success = await ProductService.deleteProduct(id);
      if (success) {
        // Remove the product from local state
        setProducts(prev => prev.filter(p => p.id !== id));
        setTotalProducts(prev => prev - 1);
        Alert.alert('Success', 'Product deleted successfully!');
      }
      return success;
    } catch (err) {
      console.error('Failed to delete product:', err);
      Alert.alert('Error', err instanceof Error ? err.message : 'Failed to delete product');
      throw err;
    }
  }, [canMakeApiCalls]);

  // Update product stock
  const updateProductStock = useCallback(async (id: number, stockData: UpdateStockRequest): Promise<Product | null> => {
    if (!canMakeApiCalls) {
      console.warn('Cannot update product stock - not authenticated');
      return null;
    }

    try {
      const updatedProduct = await ProductService.updateProductStock(id, stockData);
      if (updatedProduct) {
        // Update the product in the local state
        setProducts(prev => prev.map(p => p.id === id ? updatedProduct : p));
        Alert.alert('Success', 'Stock updated successfully!');
      }
      return updatedProduct;
    } catch (err) {
      console.error('Failed to update product stock:', err);
      Alert.alert('Error', err instanceof Error ? err.message : 'Failed to update stock');
      throw err;
    }
  }, [canMakeApiCalls]);

  // Load categories
  const loadCategories = useCallback(async () => {
    if (!canMakeApiCalls) {
      console.warn('Cannot load categories - not authenticated');
      return;
    }

    try {
      setCategoriesLoading(true);
      const response = await CategoryService.getAllCategories();
      setCategories(response.categories);
    } catch (err) {
      console.error('Failed to load categories:', err);
    } finally {
      setCategoriesLoading(false);
    }
  }, [canMakeApiCalls]);

  // Refresh products
  const refreshProducts = useCallback(async () => {
    await loadProducts(1, true);
  }, [loadProducts]);

  // Clear filters
  const clearFilters = useCallback(() => {
    setSearchQuery('');
    setSelectedCategoryId(null);
    setSortBy(DEFAULT_SORT);
    setSortOrder(DEFAULT_SORT_ORDER);
  }, []);

  // Utility functions
  const getProductById = useCallback((id: number): Product | undefined => {
    return products.find(product => product.id === id);
  }, [products]);

  const getTotalValue = useCallback((): number => {
    return products.reduce((total, product) => total + (product.price * product.quantity), 0);
  }, [products]);

  const getLowStockProducts = useCallback((): Product[] => {
    return products.filter(product => {
      const minStock = product.minStock || 10; // Default low stock threshold
      return product.quantity <= minStock;
    });
  }, [products]);

  // ✅ LAZY LOADING: Don't load automatically - let screens control when to fetch
  // Removed automatic loading on mount
  // Screens will use useFocusEffect to load data when focused

  // Reload products when search/filter/sort changes (only if products already loaded)
  useEffect(() => {
    if (!canMakeApiCalls) {
      console.log('⚠️ ItemsApiContext: Skipping reload - not authenticated');
      return;
    }
    
    // Only reload if initial load has been attempted (user has visited the screen)
    if (!isInitialized) {
      console.log('📦 ItemsApiContext: Not initialized yet, waiting for screen focus');
      return;
    }
    
    if (searchQuery || selectedCategoryId) {
      searchProducts(searchQuery, { categoryId: selectedCategoryId || undefined });
    } else {
      loadProducts(1, true);
    }
  }, [searchQuery, selectedCategoryId, sortBy, sortOrder, canMakeApiCalls, isInitialized, searchProducts, loadProducts]);

  return (
    <ItemsApiContext.Provider value={{
      // Products state
      products,
      totalProducts,
      currentPage,
      totalPages,
      hasMore,
      loading,
      error,
      refreshing,
      isInitialized,
      
      // Categories state
      categories,
      categoriesLoading,
      
      // Search and filter state
      searchQuery,
      selectedCategoryId,
      sortBy,
      sortOrder,
      
      // Actions
      loadProducts,
      searchProducts,
      createProduct,
      updateProduct,
      deleteProduct,
      updateProductStock,
      loadCategories,
      refreshProducts,
      
      // Filter and sort actions
      setSearchQuery,
      setSelectedCategoryId,
      setSortBy,
      setSortOrder,
      clearFilters,
      
      // Utility functions
      getProductById,
      getTotalValue,
      getLowStockProducts,
    }}>
      {children}
    </ItemsApiContext.Provider>
  );
}

export function useItemsApi() {
  const context = useContext(ItemsApiContext);
  if (context === undefined) {
    throw new Error('useItemsApi must be used within an ItemsApiProvider');
  }
  return context;
}