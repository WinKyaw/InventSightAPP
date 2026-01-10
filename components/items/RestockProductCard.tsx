import React, { useState } from 'react';
import { View, Text, TextInput, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Product } from '../../services/api/config';

interface RestockProductCardProps {
  product: Product;
  quantity: string;
  onQuantityChange: (quantity: string) => void;
  searchQuery?: string;
}

export const RestockProductCard: React.FC<RestockProductCardProps> = ({
  product,
  quantity,
  onQuantityChange,
  searchQuery = '',
}) => {
  const numQuantity = parseInt(quantity) || 0;

  const handleQuantityChange = (text: string) => {
    // Only allow numeric input
    const numericText = text.replace(/[^0-9]/g, '');
    onQuantityChange(numericText);
  };

  const incrementQuantity = () => {
    const newQty = numQuantity + 1;
    onQuantityChange(newQty.toString());
  };

  const decrementQuantity = () => {
    const newQty = Math.max(0, numQuantity - 1);
    onQuantityChange(newQty.toString());
  };

  // Highlight matching text
  const highlightText = (text: string, query: string) => {
    if (!query || !text) return <Text>{text}</Text>;
    
    const lowerText = text.toLowerCase();
    const lowerQuery = query.toLowerCase();
    const index = lowerText.indexOf(lowerQuery);
    
    if (index === -1) return <Text>{text}</Text>;
    
    const before = text.substring(0, index);
    const match = text.substring(index, index + query.length);
    const after = text.substring(index + query.length);
    
    return (
      <Text>
        {before}
        <Text style={styles.highlight}>{match}</Text>
        {after}
      </Text>
    );
  };

  const isLowStock = product.quantity <= (product.minStock || 5);

  return (
    <View style={[styles.card, numQuantity > 0 && styles.cardSelected]}>
      <View style={styles.productInfo}>
        <Text style={styles.productName}>
          {highlightText(product.name, searchQuery)}
        </Text>
        
        <View style={styles.metadataRow}>
          {product.sku && (
            <Text style={styles.metadata}>
              SKU: {highlightText(product.sku, searchQuery)}
            </Text>
          )}
          {product.category && (
            <Text style={styles.metadata}>
              {product.sku ? ' • ' : ''}{highlightText(product.category, searchQuery)}
            </Text>
          )}
        </View>

        <View style={styles.stockRow}>
          <Text style={styles.currentStock}>
            Current: {product.quantity || 0} units
          </Text>
          {isLowStock && (
            <View style={styles.lowStockBadge}>
              <Ionicons name="warning" size={12} color="#F57C00" />
              <Text style={styles.lowStockText}>Low Stock</Text>
            </View>
          )}
        </View>

        {product.price && (
          <Text style={styles.price}>
            ${parseFloat(product.price.toString()).toFixed(2)} per unit
          </Text>
        )}
      </View>

      <View style={styles.quantityControl}>
        <TouchableOpacity
          style={[styles.quantityButton, numQuantity === 0 && styles.quantityButtonDisabled]}
          onPress={decrementQuantity}
          disabled={numQuantity === 0}
        >
          <Ionicons name="remove" size={20} color={numQuantity === 0 ? '#CCC' : '#FFF'} />
        </TouchableOpacity>

        <TextInput
          style={styles.quantityInput}
          value={quantity}
          onChangeText={handleQuantityChange}
          keyboardType="number-pad"
          placeholder="0"
          selectTextOnFocus
        />

        <TouchableOpacity
          style={styles.quantityButton}
          onPress={incrementQuantity}
        >
          <Ionicons name="add" size={20} color="#FFF" />
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#FFF',
    borderRadius: 8,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  cardSelected: {
    borderColor: '#E67E22',
    borderWidth: 2,
    backgroundColor: '#FFF8F0',
  },
  productInfo: {
    flex: 1,
    marginRight: 16,
  },
  productName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 6,
  },
  highlight: {
    backgroundColor: '#FFF3CD',
    fontWeight: 'bold',
    color: '#E67E22',
  },
  metadataRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 6,
  },
  metadata: {
    fontSize: 12,
    color: '#666',
  },
  stockRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  currentStock: {
    fontSize: 13,
    color: '#555',
    fontWeight: '500',
  },
  lowStockBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF3CD',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 4,
    marginLeft: 8,
  },
  lowStockText: {
    fontSize: 11,
    color: '#F57C00',
    fontWeight: '600',
    marginLeft: 4,
  },
  price: {
    fontSize: 12,
    color: '#10B981',
    fontWeight: '600',
  },
  quantityControl: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  quantityButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#E67E22',
    justifyContent: 'center',
    alignItems: 'center',
  },
  quantityButtonDisabled: {
    backgroundColor: '#CCC',
  },
  quantityInput: {
    width: 60,
    height: 40,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 6,
    textAlign: 'center',
    marginHorizontal: 10,
    fontSize: 16,
    fontWeight: '600',
    backgroundColor: '#FFF',
  },
});
