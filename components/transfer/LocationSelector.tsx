import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  ScrollView,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LocationType } from '../../types/transfer';
import { StoreService, Store } from '../../services/api/storeService';
import { getWarehouses } from '../../services/api/warehouse';
import { WarehouseSummary } from '../../types/warehouse';
import { Colors } from '../../constants/Colors';

interface LocationSelectorProps {
  locationType: LocationType;
  selectedId?: string;
  onSelect: (id: string, name: string) => void;
  excludeId?: string;
  label?: string;
  placeholder?: string;
}

export function LocationSelector({
  locationType,
  selectedId,
  onSelect,
  excludeId,
  label,
  placeholder,
}: LocationSelectorProps) {
  const [locations, setLocations] = useState<Array<Store | WarehouseSummary>>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showDropdown, setShowDropdown] = useState(false);

  useEffect(() => {
    loadLocations();
  }, [locationType]);

  const loadLocations = async () => {
    setLoading(true);
    setError(null);
    try {
      if (locationType === LocationType.STORE) {
        const stores = await StoreService.getUserStores();
        setLocations(stores);
      } else {
        const warehouses = await getWarehouses();
        setLocations(warehouses);
      }
    } catch (err) {
      console.error('Failed to load locations:', err);
      setError('Failed to load locations');
      setLocations([]);
    } finally {
      setLoading(false);
    }
  };

  const getLocationName = (location: Store | WarehouseSummary): string => {
    if ('storeName' in location) {
      return location.storeName;
    }
    return location.name;
  };

  const getLocationAddress = (location: Store | WarehouseSummary): string | undefined => {
    if ('storeName' in location) {
      return location.address;
    }
    return location.location;
  };

  const selectedLocation = locations.find((loc) => loc.id === selectedId);
  const selectedName = selectedLocation ? getLocationName(selectedLocation) : '';

  const filteredLocations = excludeId
    ? locations.filter((loc) => loc.id !== excludeId)
    : locations;

  return (
    <View style={styles.container}>
      {label && <Text style={styles.label}>{label}</Text>}
      
      <TouchableOpacity
        style={[styles.selector, error && styles.selectorError]}
        onPress={() => setShowDropdown(!showDropdown)}
        disabled={loading}
      >
        <View style={styles.selectorContent}>
          <View style={styles.selectorLeft}>
            <View style={styles.badge}>
              <Ionicons
                name={locationType === LocationType.STORE ? 'storefront' : 'business'}
                size={16}
                color={Colors.white}
              />
            </View>
            <Text
              style={[
                styles.selectorText,
                !selectedName && styles.placeholderText,
              ]}
            >
              {loading
                ? 'Loading...'
                : selectedName || placeholder || `Select ${locationType.toLowerCase()}`}
            </Text>
          </View>
          {loading ? (
            <ActivityIndicator size="small" color={Colors.primary} />
          ) : (
            <Ionicons
              name={showDropdown ? 'chevron-up' : 'chevron-down'}
              size={20}
              color={Colors.textSecondary}
            />
          )}
        </View>
      </TouchableOpacity>

      {error && <Text style={styles.errorText}>{error}</Text>}

      {showDropdown && !loading && (
        <View style={styles.dropdown}>
          <ScrollView style={styles.dropdownScroll} nestedScrollEnabled>
            {filteredLocations.length === 0 ? (
              <View style={styles.emptyState}>
                <Ionicons name="alert-circle-outline" size={24} color={Colors.lightGray} />
                <Text style={styles.emptyText}>
                  No {locationType.toLowerCase()}s available
                </Text>
              </View>
            ) : (
              filteredLocations.map((location) => {
                const isSelected = location.id === selectedId;
                const name = getLocationName(location);
                const address = getLocationAddress(location);

                return (
                  <TouchableOpacity
                    key={location.id}
                    style={[
                      styles.dropdownItem,
                      isSelected && styles.dropdownItemSelected,
                    ]}
                    onPress={() => {
                      onSelect(location.id, name);
                      setShowDropdown(false);
                    }}
                  >
                    <View style={styles.dropdownItemContent}>
                      <View style={styles.dropdownItemLeft}>
                        <Text style={styles.dropdownItemName}>{name}</Text>
                        {address && (
                          <Text style={styles.dropdownItemAddress}>{address}</Text>
                        )}
                      </View>
                      {isSelected && (
                        <Ionicons name="checkmark-circle" size={20} color={Colors.primary} />
                      )}
                    </View>
                  </TouchableOpacity>
                );
              })
            )}
          </ScrollView>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 16,
    position: 'relative',
    zIndex: 1,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.text,
    marginBottom: 8,
  },
  selector: {
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 12,
    backgroundColor: Colors.white,
  },
  selectorError: {
    borderColor: Colors.error,
  },
  selectorContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  selectorLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  badge: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  selectorText: {
    fontSize: 16,
    color: Colors.text,
    flex: 1,
  },
  placeholderText: {
    color: Colors.textSecondary,
  },
  errorText: {
    color: Colors.error,
    fontSize: 14,
    marginTop: 4,
    marginLeft: 4,
  },
  dropdown: {
    position: 'absolute',
    top: '100%',
    left: 0,
    right: 0,
    backgroundColor: Colors.white,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 8,
    marginTop: 4,
    maxHeight: 250,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.15,
        shadowRadius: 8,
      },
      android: {
        elevation: 8,
      },
    }),
  },
  dropdownScroll: {
    maxHeight: 250,
  },
  emptyState: {
    padding: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyText: {
    fontSize: 14,
    color: Colors.lightGray,
    marginTop: 8,
    textAlign: 'center',
  },
  dropdownItem: {
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  dropdownItemSelected: {
    backgroundColor: Colors.lightBlue,
  },
  dropdownItemContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  dropdownItemLeft: {
    flex: 1,
  },
  dropdownItemName: {
    fontSize: 16,
    fontWeight: '500',
    color: Colors.text,
    marginBottom: 2,
  },
  dropdownItemAddress: {
    fontSize: 13,
    color: Colors.textSecondary,
  },
});
