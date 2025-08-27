import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useNavigation } from '../../context/NavigationContext';
import { Colors } from '../../constants/Colors';

export function NavigationDebug() {
  const { selectedNavItems, availableOptions } = useNavigation();
  
  return (
    <View style={styles.debugContainer}>
      <Text style={styles.debugTitle}>🔧 Navigation Debug Panel</Text>
      <Text style={styles.debugInfo}>
        📅 Current DateTime (UTC): 2025-08-25 10:32:56{'\n'}
        👤 Current User: WinKyaw{'\n'}
        🎯 Expected Layout: Dashboard | Items | {selectedNavItems[0]?.title} | {selectedNavItems[1]?.title} | Menu
      </Text>
      
      <Text style={styles.debugSubtitle}>Available Options:</Text>
      {availableOptions.map((option, index) => (
        <Text key={index} style={styles.debugOption}>
          • {option.title} ({option.key})
        </Text>
      ))}
      
      <Text style={styles.debugSubtitle}>Selected Items:</Text>
      {selectedNavItems.map((item, index) => (
        <Text key={index} style={styles.debugSelected}>
          Position {index + 3}: {item.title} ({item.key})
        </Text>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  debugContainer: {
    position: 'absolute',
    top: 50,
    left: 10,
    right: 10,
    backgroundColor: 'rgba(0,0,0,0.8)',
    padding: 10,
    borderRadius: 8,
    zIndex: 9999,
  },
  debugTitle: {
    color: 'white',
    fontSize: 14,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  debugInfo: {
    color: 'white',
    fontSize: 11,
    marginBottom: 8,
    fontFamily: 'monospace',
  },
  debugSubtitle: {
    color: '#FFD700',
    fontSize: 12,
    fontWeight: 'bold',
    marginTop: 8,
    marginBottom: 4,
  },
  debugOption: {
    color: 'white',
    fontSize: 10,
    marginBottom: 2,
  },
  debugSelected: {
    color: '#90EE90',
    fontSize: 10,
    marginBottom: 2,
    fontWeight: 'bold',
  },
});