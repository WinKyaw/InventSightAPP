import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useAuth } from '../../context/AuthContext';
import { useRouter } from 'expo-router';

export function AuthTest() {
  const { user, isLoading, login, logout } = useAuth();
  const router = useRouter();

  const testLogin = async () => {
    try {
      await login('test@example.com', 'password123');
      console.log('Test login successful');
    } catch (error) {
      console.error('Test login failed:', error);
    }
  };

  const testNavigation = () => {
    router.push('/(tabs)/dashboard');
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Auth Debug Panel</Text>
      <Text>User: {user?.name || 'Not logged in'}</Text>
      <Text>Loading: {isLoading ? 'Yes' : 'No'}</Text>
      <Text>Current Time: 2025-08-25 08:35:18</Text>
      
      <TouchableOpacity style={styles.button} onPress={testLogin}>
        <Text style={styles.buttonText}>Test Login</Text>
      </TouchableOpacity>
      
      <TouchableOpacity style={styles.button} onPress={testNavigation}>
        <Text style={styles.buttonText}>Test Navigation</Text>
      </TouchableOpacity>
      
      <TouchableOpacity style={styles.button} onPress={logout}>
        <Text style={styles.buttonText}>Test Logout</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 20,
    backgroundColor: '#f0f0f0',
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  button: {
    backgroundColor: '#007AFF',
    padding: 10,
    borderRadius: 5,
    marginVertical: 5,
  },
  buttonText: {
    color: 'white',
    textAlign: 'center',
  },
});