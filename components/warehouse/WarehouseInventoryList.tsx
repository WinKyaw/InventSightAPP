import React from 'react';
import { View, Text, FlatList, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { WarehouseInventoryRow } from '../../types/warehouse';
import { Colors } from '../../constants/Colors';

interface WarehouseInventoryListProps {
  inventory: WarehouseInventoryRow[];
  onItemPress?: (item: WarehouseInventoryRow) => void;
}

export function WarehouseInventoryList({ inventory, onItemPress }: WarehouseInventoryListProps) {
  const renderItem = ({ item }: { item: WarehouseInventoryRow }) => {
    const isLowStock = item.lowStockThreshold 
      ? item.availableQuantity <= item.lowStockThreshold 
      : item.availableQuantity < 10;

    return (
      <TouchableOpacity
        style={styles.itemContainer}
        onPress={() => onItemPress?.(item)}
        disabled={!onItemPress}
      >
        <View style={styles.itemHeader}>
          <View style={styles.itemTitleRow}>
            <Text style={styles.itemName}>{item.productName}</Text>
            {isLowStock && (
              <View style={styles.lowStockBadge}>
                <Ionicons name="warning" size={12} color="#fff" style={styles.lowStockIcon} />
                <Text style={styles.lowStockText}>Low</Text>
              </View>
            )}
          </View>
          {item.sku && (
            <Text style={styles.itemSku}>SKU: {item.sku}</Text>
          )}
        </View>

        <View style={styles.itemDetails}>
          <View style={styles.detailRow}>
            <View style={styles.detailItem}>
              <Text style={styles.detailLabel}>Available</Text>
              <Text style={[styles.detailValue, isLowStock && styles.lowStockValue]}>
                {item.availableQuantity}
              </Text>
            </View>
            
            {item.price !== undefined && (
              <View style={styles.detailItem}>
                <Text style={styles.detailLabel}>Price</Text>
                <Text style={styles.detailValue}>
                  {item.currency || '$'}{item.price.toFixed(2)}
                </Text>
              </View>
            )}
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  const renderEmptyState = () => (
    <View style={styles.emptyState}>
      <Ionicons name="cube-outline" size={64} color={Colors.lightGray} />
      <Text style={styles.emptyText}>No inventory items found</Text>
      <Text style={styles.emptySubtext}>
        Try selecting a different warehouse or adjusting your search
      </Text>
    </View>
  );

  return (
    <FlatList
      data={inventory}
      renderItem={renderItem}
      keyExtractor={(item) => item.id}
      contentContainerStyle={styles.listContainer}
      ListEmptyComponent={renderEmptyState}
      ItemSeparatorComponent={() => <View style={styles.separator} />}
    />
  );
}

const styles = StyleSheet.create({
  listContainer: {
    padding: 16,
    flexGrow: 1,
  },
  itemContainer: {
    backgroundColor: Colors.white,
    borderRadius: 8,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  itemHeader: {
    marginBottom: 12,
  },
  itemTitleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  itemName: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.text,
    flex: 1,
  },
  itemSku: {
    fontSize: 14,
    color: Colors.textSecondary,
  },
  lowStockBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.warning,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  lowStockIcon: {
    marginRight: 4,
  },
  lowStockText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
  itemDetails: {
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    paddingTop: 12,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  detailItem: {
    flex: 1,
  },
  detailLabel: {
    fontSize: 12,
    color: Colors.textSecondary,
    marginBottom: 4,
  },
  detailValue: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.text,
  },
  lowStockValue: {
    color: Colors.warning,
  },
  separator: {
    height: 12,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 64,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.text,
    marginTop: 16,
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 14,
    color: Colors.textSecondary,
    textAlign: 'center',
    paddingHorizontal: 32,
  },
});
