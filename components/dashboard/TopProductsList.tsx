import React from 'react';
import { View, Text, StyleSheet, FlatList } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface TopProduct {
  name: string;
  quantity: number;
  revenue: number;
  category: string;
}

interface TopProductsListProps {
  products: TopProduct[];
}

export const TopProductsList: React.FC<TopProductsListProps> = ({ products }) => {
  if (!products || products.length === 0) {
    return (
      <View style={styles.emptyContainer}>
        <Text style={styles.emptyText}>No sales data available</Text>
      </View>
    );
  }

  const renderProduct = ({ item, index }: { item: TopProduct; index: number }) => {
    const medalColors = ['#FFD700', '#C0C0C0', '#CD7F32'];
    const medalColor = index < 3 ? medalColors[index] : '#6B7280';

    return (
      <View style={styles.productCard}>
        <View style={styles.rankContainer}>
          <Text style={[styles.rank, { color: medalColor }]}>
            #{index + 1}
          </Text>
        </View>
        
        <View style={styles.productInfo}>
          <Text style={styles.productName}>{item.name}</Text>
          <Text style={styles.category}>
            <Ionicons name="pricetag-outline" size={12} color="#6B7280" />
            {' '}{item.category}
          </Text>
        </View>
        
        <View style={styles.statsContainer}>
          <Text style={styles.quantity}>{item.quantity} sold</Text>
          <Text style={styles.revenue}>${item.revenue.toLocaleString()}</Text>
        </View>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>🏆 Top Selling Products</Text>
      <FlatList
        data={products}
        renderItem={renderProduct}
        keyExtractor={(item, index) => `${item.name}-${index}`}
        scrollEnabled={false}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginVertical: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 16,
  },
  productCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    backgroundColor: '#F9FAFB',
    borderRadius: 8,
    marginBottom: 8,
  },
  rankContainer: {
    width: 40,
    alignItems: 'center',
  },
  rank: {
    fontSize: 18,
    fontWeight: '700',
  },
  productInfo: {
    flex: 1,
    marginLeft: 12,
  },
  productName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 4,
  },
  category: {
    fontSize: 12,
    color: '#6B7280',
  },
  statsContainer: {
    alignItems: 'flex-end',
  },
  quantity: {
    fontSize: 12,
    color: '#6B7280',
    marginBottom: 4,
  },
  revenue: {
    fontSize: 16,
    fontWeight: '600',
    color: '#10B981',
  },
  emptyContainer: {
    padding: 20,
    alignItems: 'center',
  },
  emptyText: {
    color: '#9CA3AF',
    fontSize: 14,
  },
});
