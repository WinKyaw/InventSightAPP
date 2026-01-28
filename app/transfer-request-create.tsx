import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  Alert,
  ActivityIndicator,
  TouchableOpacity,
  TextInput,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../context/AuthContext';
import { LocationSelector } from '../components/transfer';
import { Header } from '../components/shared/Header';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Colors } from '../constants/Colors';
import { LocationType, TransferPriority, CreateTransferRequestDTO } from '../types/transfer';
import { createTransferRequest } from '../services/api/transferRequestService';
import { ProductService } from '../services/api/productService';
import { SearchProductsForTransferParams } from '../services/api/config';

interface Product {
  id: string;
  name: string;
  sku: string;
  quantity: number;             // Total quantity
  availableForTransfer: number; // What can actually be transferred
  reserved?: number;            // Quantity in pending transfers
  inTransit?: number;           // Quantity currently being moved
  stockQuantity?: number;       // For backward compatibility
}

export default function TransferRequestCreateScreen() {
  const router = useRouter();
  const { user, isAuthenticated } = useAuth();
  
  // Form state
  const [fromLocationType, setFromLocationType] = useState<LocationType>(LocationType.STORE);
  const [fromLocationId, setFromLocationId] = useState<string>('');
  const [fromLocationName, setFromLocationName] = useState<string>('');
  
  const [toLocationType, setToLocationType] = useState<LocationType>(LocationType.WAREHOUSE);
  const [toLocationId, setToLocationId] = useState<string>('');
  const [toLocationName, setToLocationName] = useState<string>('');
  
  const [productId, setProductId] = useState<string>('');
  const [productName, setProductName] = useState<string>('');
  const [productSku, setProductSku] = useState<string>('');
  const [quantity, setQuantity] = useState<string>('');
  const [priority, setPriority] = useState<TransferPriority>(TransferPriority.MEDIUM);
  const [reason, setReason] = useState<string>('');
  const [notes, setNotes] = useState<string>('');
  
  // Product search
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [searchResults, setSearchResults] = useState<Product[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showSearchResults, setShowSearchResults] = useState(false);
  const searchTimeoutRef = React.useRef<ReturnType<typeof setTimeout> | null>(null);
  
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Check authentication
  React.useEffect(() => {
    if (!isAuthenticated) {
      router.replace('/(auth)/login');
    }
  }, [isAuthenticated, router]);

  // Cleanup on unmount
  React.useEffect(() => {
    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
    };
  }, []);

  // Search products
  const handleSearchProducts = useCallback((query: string) => {
    setSearchQuery(query);
    
    // Clear existing timeout
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }
    
    if (query.length < 2) {
      setSearchResults([]);
      setShowSearchResults(false);
      return;
    }

    // Validate source location is selected
    if (!fromLocationId) {
      setSearchResults([]);
      setShowSearchResults(false);
      Alert.alert(
        'Select Source Location', 
        'Please select a "From Location" first to search for available products.'
      );
      return;
    }

    // Debounce: Wait 300ms after user stops typing
    searchTimeoutRef.current = setTimeout(async () => {
      setIsSearching(true);
      setShowSearchResults(true);
      
      try {
        // Use transfer-specific search
        const searchParams: SearchProductsForTransferParams = {
          query,
          page: 0,  // Backend uses 0-based indexing
          size: 10,
        };
        
        // Add appropriate location filter
        if (fromLocationType === LocationType.STORE) {
          searchParams.fromStoreId = fromLocationId;
        } else {
          searchParams.fromWarehouseId = fromLocationId;
        }
        
        console.log(`[Transfer Search] Query: "${query}" in ${fromLocationType}: ${fromLocationId}`);
        
        const response = await ProductService.searchProductsForTransfer(searchParams);
        
        // Map response to match local Product interface
        const products: Product[] = response.products.map(p => ({
          id: p.id,
          name: p.name,
          sku: p.sku,
          quantity: p.quantity,
          availableForTransfer: p.availableForTransfer,
          reserved: p.reserved,
          inTransit: p.inTransit,
          stockQuantity: p.availableForTransfer,  // Fallback for components expecting stockQuantity
        }));
        
        console.log(`[Transfer Search] Found ${products.length} products available for transfer`);
        setSearchResults(products);
        
      } catch (error) {
        console.error('[Transfer Search] Error:', error);
        Alert.alert('Search Error', 'Failed to search products. Please try again.');
        setSearchResults([]);
      } finally {
        setIsSearching(false);
      }
    }, 300); // 300ms debounce delay
  }, [fromLocationId, fromLocationType]);

  const handleSelectProduct = (product: Product) => {
    setProductId(product.id);
    setProductName(product.name);
    setProductSku(product.sku);
    setSearchQuery(product.name);
    setShowSearchResults(false);
  };

  const handleSubmit = async () => {
    // Validation
    if (!fromLocationId) {
      Alert.alert('Validation Error', 'Please select a source location');
      return;
    }
    
    if (!toLocationId) {
      Alert.alert('Validation Error', 'Please select a destination location');
      return;
    }
    
    if (fromLocationId === toLocationId && fromLocationType === toLocationType) {
      Alert.alert('Validation Error', 'Source and destination locations must be different');
      return;
    }
    
    if (!productId) {
      Alert.alert('Validation Error', 'Please select a product');
      return;
    }
    
    const quantityNum = parseInt(quantity, 10);
    if (!quantity || isNaN(quantityNum) || quantityNum <= 0) {
      Alert.alert('Validation Error', 'Please enter a valid quantity greater than 0');
      return;
    }
    
    if (!reason.trim()) {
      Alert.alert('Validation Error', 'Please provide a reason for the transfer');
      return;
    }

    try {
      setIsSubmitting(true);
      
      const requestData: CreateTransferRequestDTO = {
        fromLocationId,
        fromLocationType,
        toLocationId,
        toLocationType,
        productId,
        requestedQuantity: quantityNum,
        priority,
        reason: reason.trim(),
        notes: notes.trim() || undefined,
      };
      
      const result = await createTransferRequest(requestData);
      
      Alert.alert(
        'Success',
        `Transfer request #${result.id} created successfully`,
        [
          {
            text: 'OK',
            onPress: () => router.back(),
          },
        ]
      );
    } catch (error) {
      console.error('Error creating transfer request:', error);
      Alert.alert(
        'Error',
        'Failed to create transfer request. Please try again.'
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isAuthenticated) {
    return null;
  }

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <Header title="Create Transfer Request" showBackButton />
      
      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
      >
        {/* Source Location */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>From Location</Text>
          
          <View style={styles.locationTypeButtons}>
            <TouchableOpacity
              style={[
                styles.locationTypeButton,
                fromLocationType === LocationType.STORE && styles.locationTypeButtonActive,
              ]}
              onPress={() => {
                setFromLocationType(LocationType.STORE);
                setFromLocationId('');
                setFromLocationName('');
              }}
            >
              <Ionicons 
                name="storefront" 
                size={20} 
                color={fromLocationType === LocationType.STORE ? Colors.white : Colors.primary} 
              />
              <Text style={[
                styles.locationTypeButtonText,
                fromLocationType === LocationType.STORE && styles.locationTypeButtonTextActive,
              ]}>Store</Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={[
                styles.locationTypeButton,
                fromLocationType === LocationType.WAREHOUSE && styles.locationTypeButtonActive,
              ]}
              onPress={() => {
                setFromLocationType(LocationType.WAREHOUSE);
                setFromLocationId('');
                setFromLocationName('');
              }}
            >
              <Ionicons 
                name="business" 
                size={20} 
                color={fromLocationType === LocationType.WAREHOUSE ? Colors.white : Colors.primary} 
              />
              <Text style={[
                styles.locationTypeButtonText,
                fromLocationType === LocationType.WAREHOUSE && styles.locationTypeButtonTextActive,
              ]}>Warehouse</Text>
            </TouchableOpacity>
          </View>
          
          <LocationSelector
            locationType={fromLocationType}
            selectedId={fromLocationId}
            onSelect={(id, name) => {
              setFromLocationId(id);
              setFromLocationName(name);
            }}
            excludeId={toLocationType === fromLocationType ? toLocationId : undefined}
          />
        </View>

        {/* Destination Location */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>To Location</Text>
          
          <View style={styles.locationTypeButtons}>
            <TouchableOpacity
              style={[
                styles.locationTypeButton,
                toLocationType === LocationType.STORE && styles.locationTypeButtonActive,
              ]}
              onPress={() => {
                setToLocationType(LocationType.STORE);
                setToLocationId('');
                setToLocationName('');
              }}
            >
              <Ionicons 
                name="storefront" 
                size={20} 
                color={toLocationType === LocationType.STORE ? Colors.white : Colors.primary} 
              />
              <Text style={[
                styles.locationTypeButtonText,
                toLocationType === LocationType.STORE && styles.locationTypeButtonTextActive,
              ]}>Store</Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={[
                styles.locationTypeButton,
                toLocationType === LocationType.WAREHOUSE && styles.locationTypeButtonActive,
              ]}
              onPress={() => {
                setToLocationType(LocationType.WAREHOUSE);
                setToLocationId('');
                setToLocationName('');
              }}
            >
              <Ionicons 
                name="business" 
                size={20} 
                color={toLocationType === LocationType.WAREHOUSE ? Colors.white : Colors.primary} 
              />
              <Text style={[
                styles.locationTypeButtonText,
                toLocationType === LocationType.WAREHOUSE && styles.locationTypeButtonTextActive,
              ]}>Warehouse</Text>
            </TouchableOpacity>
          </View>
          
          <LocationSelector
            locationType={toLocationType}
            selectedId={toLocationId}
            onSelect={(id, name) => {
              setToLocationId(id);
              setToLocationName(name);
            }}
            excludeId={fromLocationType === toLocationType ? fromLocationId : undefined}
          />
        </View>

        {/* Product Selection */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Product *</Text>
          
          <View style={styles.productSearchContainer}>
            <Input
              placeholder="Search for product..."
              value={searchQuery}
              onChangeText={handleSearchProducts}
              onFocus={() => searchQuery.length >= 2 && setShowSearchResults(true)}
              icon="search"
              showValidationIcon={false}
            />
            
            {isSearching && (
              <ActivityIndicator 
                size="small" 
                color={Colors.primary} 
                style={styles.searchingIndicator}
              />
            )}
            
            {showSearchResults && (
              <View style={styles.searchResults}>
                {searchResults.length === 0 ? (
                  <Text style={styles.noResults}>
                    {searchQuery.length < 2 ? 'Type at least 2 characters' : 'No products found'}
                  </Text>
                ) : (
                  searchResults.map((product) => (
                    <TouchableOpacity
                      key={product.id}
                      style={styles.searchResultItem}
                      onPress={() => handleSelectProduct(product)}
                    >
                      <Ionicons name="cube" size={20} color={Colors.primary} />
                      <View style={styles.searchResultInfo}>
                        <Text style={styles.searchResultName}>{product.name}</Text>
                        <Text style={styles.searchResultSku}>SKU: {product.sku}</Text>
                        {/* Show availability details */}
                        {((product.reserved !== undefined && product.reserved > 0) || 
                          (product.inTransit !== undefined && product.inTransit > 0)) ? (
                          <Text style={styles.searchResultDetails}>
                            Total: {product.quantity} | Available: {product.availableForTransfer}
                            {product.reserved !== undefined && product.reserved > 0 && ` | Reserved: ${product.reserved}`}
                            {product.inTransit !== undefined && product.inTransit > 0 && ` | In Transit: ${product.inTransit}`}
                          </Text>
                        ) : null}
                      </View>
                      <Text style={styles.searchResultStock}>
                        {product.availableForTransfer} available
                      </Text>
                    </TouchableOpacity>
                  ))
                )}
              </View>
            )}
          </View>
          
          {productId && (
            <View style={styles.selectedProduct}>
              <Ionicons name="checkmark-circle" size={20} color={Colors.success} />
              <Text style={styles.selectedProductText}>
                {productName} (SKU: {productSku})
              </Text>
            </View>
          )}
        </View>

        {/* Quantity */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Quantity *</Text>
          <Input
            placeholder="Enter quantity"
            value={quantity}
            onChangeText={setQuantity}
            keyboardType="number-pad"
            showValidationIcon={false}
          />
        </View>

        {/* Priority */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Priority *</Text>
          
          <View style={styles.priorityButtons}>
            <TouchableOpacity
              style={[
                styles.priorityButton,
                priority === TransferPriority.HIGH && styles.priorityButtonHighActive,
              ]}
              onPress={() => setPriority(TransferPriority.HIGH)}
            >
              <View style={[
                styles.priorityRadio,
                priority === TransferPriority.HIGH && styles.priorityRadioActive,
                priority === TransferPriority.HIGH && { borderColor: Colors.danger },
              ]}>
                {priority === TransferPriority.HIGH && (
                  <View style={[styles.priorityRadioInner, { backgroundColor: Colors.danger }]} />
                )}
              </View>
              <Text style={[
                styles.priorityButtonText,
                priority === TransferPriority.HIGH && styles.priorityButtonTextHigh,
              ]}>High Priority</Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={[
                styles.priorityButton,
                priority === TransferPriority.MEDIUM && styles.priorityButtonMediumActive,
              ]}
              onPress={() => setPriority(TransferPriority.MEDIUM)}
            >
              <View style={[
                styles.priorityRadio,
                priority === TransferPriority.MEDIUM && styles.priorityRadioActive,
                priority === TransferPriority.MEDIUM && { borderColor: Colors.warning },
              ]}>
                {priority === TransferPriority.MEDIUM && (
                  <View style={[styles.priorityRadioInner, { backgroundColor: Colors.warning }]} />
                )}
              </View>
              <Text style={[
                styles.priorityButtonText,
                priority === TransferPriority.MEDIUM && styles.priorityButtonTextMedium,
              ]}>Medium Priority</Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={[
                styles.priorityButton,
                priority === TransferPriority.LOW && styles.priorityButtonLowActive,
              ]}
              onPress={() => setPriority(TransferPriority.LOW)}
            >
              <View style={[
                styles.priorityRadio,
                priority === TransferPriority.LOW && styles.priorityRadioActive,
                priority === TransferPriority.LOW && { borderColor: Colors.success },
              ]}>
                {priority === TransferPriority.LOW && (
                  <View style={[styles.priorityRadioInner, { backgroundColor: Colors.success }]} />
                )}
              </View>
              <Text style={[
                styles.priorityButtonText,
                priority === TransferPriority.LOW && styles.priorityButtonTextLow,
              ]}>Low Priority</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Reason */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Reason *</Text>
          <TextInput
            style={styles.textarea}
            placeholder="Why is this transfer needed?"
            value={reason}
            onChangeText={setReason}
            multiline
            numberOfLines={4}
            maxLength={500}
            textAlignVertical="top"
            placeholderTextColor={Colors.lightGray}
          />
          <Text style={styles.characterCount}>{reason.length}/500</Text>
        </View>

        {/* Notes */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Notes (Optional)</Text>
          <TextInput
            style={styles.textarea}
            placeholder="Any additional notes or special instructions..."
            value={notes}
            onChangeText={setNotes}
            multiline
            numberOfLines={4}
            maxLength={500}
            textAlignVertical="top"
            placeholderTextColor={Colors.lightGray}
          />
          <Text style={styles.characterCount}>{notes.length}/500</Text>
        </View>

        {/* Submit Button */}
        <View style={styles.submitSection}>
          <Button
            title={isSubmitting ? 'Creating...' : 'Create Transfer Request'}
            onPress={handleSubmit}
            disabled={isSubmitting}
            icon={isSubmitting ? undefined : 'send'}
          />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: Colors.white,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 32,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.text,
    marginBottom: 12,
  },
  locationTypeButtons: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 12,
  },
  locationTypeButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 12,
    borderRadius: 8,
    borderWidth: 1.5,
    borderColor: Colors.primary,
    backgroundColor: Colors.white,
    gap: 8,
  },
  locationTypeButtonActive: {
    backgroundColor: Colors.primary,
  },
  locationTypeButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.primary,
  },
  locationTypeButtonTextActive: {
    color: Colors.white,
  },
  productSearchContainer: {
    position: 'relative',
  },
  searchingIndicator: {
    position: 'absolute',
    right: 12,
    top: 12,
  },
  searchResults: {
    marginTop: 8,
    backgroundColor: Colors.white,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: Colors.border,
    maxHeight: 300,
  },
  searchResultItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
    gap: 12,
  },
  searchResultInfo: {
    flex: 1,
  },
  searchResultName: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.text,
  },
  searchResultSku: {
    fontSize: 12,
    color: Colors.textSecondary,
  },
  searchResultDetails: {
    fontSize: 11,
    color: Colors.warning,
    marginTop: 2,
    fontStyle: 'italic',
  },
  searchResultStock: {
    fontSize: 12,
    color: Colors.success,
    fontWeight: '600',
  },
  noResults: {
    padding: 16,
    textAlign: 'center',
    color: Colors.textSecondary,
  },
  selectedProduct: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    backgroundColor: Colors.successLight,
    borderRadius: 8,
    marginTop: 8,
    gap: 8,
  },
  selectedProductText: {
    flex: 1,
    fontSize: 14,
    color: Colors.text,
    fontWeight: '600',
  },
  priorityButtons: {
    gap: 12,
  },
  priorityButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 8,
    borderWidth: 1.5,
    borderColor: Colors.border,
    backgroundColor: Colors.white,
    gap: 12,
  },
  priorityButtonHighActive: {
    borderColor: Colors.danger,
    backgroundColor: '#FEE2E2',
  },
  priorityButtonMediumActive: {
    borderColor: Colors.warning,
    backgroundColor: '#FEF3C7',
  },
  priorityButtonLowActive: {
    borderColor: Colors.success,
    backgroundColor: Colors.successLight,
  },
  priorityRadio: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: Colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  priorityRadioActive: {
    borderWidth: 2,
  },
  priorityRadioInner: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  priorityButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.text,
  },
  priorityButtonTextHigh: {
    color: Colors.danger,
  },
  priorityButtonTextMedium: {
    color: Colors.warning,
  },
  priorityButtonTextLow: {
    color: Colors.success,
  },
  textarea: {
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 8,
    padding: 12,
    fontSize: 14,
    color: Colors.text,
    backgroundColor: Colors.white,
    minHeight: 100,
  },
  characterCount: {
    fontSize: 12,
    color: Colors.textSecondary,
    textAlign: 'right',
    marginTop: 4,
  },
  submitSection: {
    marginTop: 8,
  },
});
