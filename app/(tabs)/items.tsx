import React, { useState } from 'react';
import { View, Text, ScrollView, SafeAreaView, StatusBar, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useItems } from '../../context/ItemsContext';
import { Header } from '../../components/shared/Header';
import { SearchBar } from '../../components/shared/SearchBar';
import { FilterSortBar } from '../../components/shared/FilterSortBar';
import { AddItemModal } from '../../components/modals/AddItemModal';
import { FilterModal } from '../../components/modals/FilterModal';
import { SortModal } from '../../components/modals/SortModal';
import { styles } from '../../constants/Styles';

export default function ItemsScreen() {
  const { items, updateItem } = useItems();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [sortBy, setSortBy] = useState('name');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  const [showAddModal, setShowAddModal] = useState(false);
  const [showFilterModal, setShowFilterModal] = useState(false);
  const [showSortModal, setShowSortModal] = useState(false);

  const toggleItemExpansion = (id: number) => {
    updateItem(id, { expanded: !items.find(item => item.id === id)?.expanded });
  };

  const getFilteredAndSortedItems = () => {
    let filtered = items.filter(item =>
      item.name.toLowerCase().includes(searchTerm.toLowerCase())
    );

    if (selectedCategory !== 'All') {
      filtered = filtered.filter(item => item.category === selectedCategory);
    }

    filtered.sort((a, b) => {
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
          aValue = a.total;
          bValue = b.total;
          break;
        case 'salesCount':
          aValue = a.salesCount || 0;
          bValue = b.salesCount || 0;
          break;
        default:
          aValue = a.name.toLowerCase();
          bValue = b.name.toLowerCase();
      }

      if (aValue < bValue) return sortOrder === 'asc' ? -1 : 1;
      if (aValue > bValue) return sortOrder === 'asc' ? 1 : -1;
      return 0;
    });

    return filtered;
  };

  const filteredItems = getFilteredAndSortedItems();

  const handleSortPress = (newSortBy: string) => {
    if (sortBy === newSortBy) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(newSortBy);
      setSortOrder('asc');
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar backgroundColor="#10B981" barStyle="light-content" />
      
      <Header 
        title="Inventory Management"
        backgroundColor="#10B981"
        rightComponent={
          <TouchableOpacity 
            style={styles.headerButton} 
            onPress={() => setShowAddModal(true)}
          >
            <Text style={styles.headerButtonText}>Add Item</Text>
          </TouchableOpacity>
        }
      />

      <SearchBar
        placeholder="Search inventory..."
        value={searchTerm}
        onChangeText={setSearchTerm}
      />

      <FilterSortBar
        selectedCategory={selectedCategory}
        sortBy={sortBy}
        sortOrder={sortOrder}
        onFilterPress={() => setShowFilterModal(true)}
        onSortPress={() => setShowSortModal(true)}
        onClearFilter={() => setSelectedCategory('All')}
      />

      <ScrollView style={styles.itemsList} showsVerticalScrollIndicator={false}>
        <View style={styles.itemsCard}>
          {filteredItems.length === 0 ? (
            <View style={styles.noItemsContainer}>
              <Ionicons name="cube-outline" size={48} color="#D1D5DB" />
              <Text style={styles.noItemsText}>No items found</Text>
              <Text style={styles.noItemsSubtext}>
                {searchTerm || selectedCategory !== 'All' 
                  ? 'Try adjusting your search or filters' 
                  : 'Add some items to get started'
                }
              </Text>
            </View>
          ) : (
            filteredItems.map((item, index) => (
              <View key={item.id}>
                {index > 0 && <View style={styles.itemSeparator} />}
                <TouchableOpacity
                  style={styles.itemRow}
                  onPress={() => toggleItemExpansion(item.id)}
                >
                  <View style={styles.itemInfo}>
                    <View style={styles.itemNameRow}>
                      <Text style={styles.itemName}>{item.name}</Text>
                      <View style={styles.categoryBadge}>
                        <Text style={styles.categoryBadgeText}>{item.category}</Text>
                      </View>
                    </View>
                  </View>
                  <View style={styles.itemStats}>
                    <Text style={styles.itemStat}>${item.price.toFixed(2)}</Text>
                    <Text style={styles.itemStat}>Qty: {item.quantity}</Text>
                    <Text style={[styles.itemStat, { color: '#3B82F6', fontWeight: '600' }]}>
                      Sold: {item.salesCount || 0}
                    </Text>
                    <Text style={[styles.itemStat, { color: '#10B981', fontWeight: '600' }]}>
                      ${item.total.toFixed(2)}
                    </Text>
                  </View>
                </TouchableOpacity>
                
                {item.expanded && (
                  <View style={styles.itemExpanded}>
                    <View style={styles.itemExpandedGrid}>
                      <View style={styles.itemExpandedItem}>
                        <Text style={styles.itemExpandedLabel}>Category:</Text>
                        <Text style={styles.itemExpandedValue}>{item.category}</Text>
                      </View>
                      <View style={styles.itemExpandedItem}>
                        <Text style={styles.itemExpandedLabel}>Unit Price:</Text>
                        <Text style={styles.itemExpandedValue}>${item.price.toFixed(2)}</Text>
                      </View>
                      <View style={styles.itemExpandedItem}>
                        <Text style={styles.itemExpandedLabel}>Stock:</Text>
                        <Text style={styles.itemExpandedValue}>{item.quantity} units</Text>
                      </View>
                      <View style={styles.itemExpandedItem}>
                        <Text style={styles.itemExpandedLabel}>Total Value:</Text>
                        <Text style={[styles.itemExpandedValue, { color: '#10B981' }]}>
                          ${item.total.toFixed(2)}
                        </Text>
                      </View>
                      <View style={styles.itemExpandedItem}>
                        <Text style={styles.itemExpandedLabel}>Total Sales:</Text>
                        <Text style={[styles.itemExpandedValue, { color: '#3B82F6' }]}>
                          {item.salesCount || 0} units sold
                        </Text>
                      </View>
                      <View style={styles.itemExpandedItem}>
                        <Text style={styles.itemExpandedLabel}>Status:</Text>
                        <Text style={[styles.itemExpandedValue, { color: item.quantity > 10 ? '#10B981' : '#F59E0B' }]}>
                          {item.quantity > 10 ? 'In Stock' : 'Low Stock'}
                        </Text>
                      </View>
                    </View>
                  </View>
                )}
              </View>
            ))
          )}
        </View>
      </ScrollView>

      <AddItemModal 
        visible={showAddModal} 
        onClose={() => setShowAddModal(false)} 
      />
      
      <FilterModal
        visible={showFilterModal}
        onClose={() => setShowFilterModal(false)}
        selectedCategory={selectedCategory}
        onSelectCategory={setSelectedCategory}
        categories={['All', ...new Set(items.map(item => item.category))]}
      />

      <SortModal
        visible={showSortModal}
        onClose={() => setShowSortModal(false)}
        sortBy={sortBy}
        sortOrder={sortOrder}
        onSelectSort={handleSortPress}
      />
    </SafeAreaView>
  );
}