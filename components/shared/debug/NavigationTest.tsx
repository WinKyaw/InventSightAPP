import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '../../context/AuthContext';

export function NavigationTest() {
  const router = useRouter();
  const { user } = useAuth();

  const testRoutes = [
    { name: 'Dashboard', route: '/(tabs)/dashboard' },
    { name: 'Items', route: '/(tabs)/items' },
    { name: 'Login', route: '/(auth)/login' },
    { name: 'Index', route: '/' },
  ];

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Navigation Test Panel</Text>
      <Text style={styles.info}>
        Current User: {user?.name || 'None'}{'\n'}
        Time: 2025-08-25 08:39:32
      </Text>
      
      {testRoutes.map((item, index) => (
        <TouchableOpacity
          key={index}
          style={styles.button}
          onPress={() => {
            console.log(`Testing navigation to: ${item.route}`);
            router.push(item.route as any);
          }}
        >
          <Text style={styles.buttonText}>Go to {item.name}</Text>
        </TouchableOpacity>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 100,
    right: 10,
    backgroundColor: 'rgba(0,0,0,0.8)',
    padding: 10,
    borderRadius: 8,
    zIndex: 1000,
  },
  title: {
    color: 'white',
    fontSize: 12,
    fontWeight: 'bold',
    marginBottom: 5,
  },
  info: {
    color: 'white',
    fontSize: 10,
    marginBottom: 10,
  },
  button: {
    backgroundColor: '#007AFF',
    padding: 8,
    borderRadius: 4,
    marginVertical: 2,
  },
  buttonText: {
    color: 'white',
    fontSize: 10,
    textAlign: 'center',
  },
});