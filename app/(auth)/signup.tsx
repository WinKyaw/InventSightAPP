import React, { useState } from 'react';
import { View, Text, Alert, SafeAreaView, StatusBar, TouchableOpacity } from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../context/AuthContext';
import { Input } from '../../components/ui/Input';
import { Button } from '../../components/ui/Button';
import { styles } from '../../constants/Styles';

export default function SignUpScreen() {
  const [formData, setFormData] = useState({
    name: '', email: '', password: '', confirmPassword: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { signup } = useAuth();

  const handleSignUp = async () => {
    if (!formData.email || !formData.password || !formData.name) {
      Alert.alert('Error', 'Please fill all required fields');
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      Alert.alert('Error', 'Passwords do not match');
      return;
    }

    setIsSubmitting(true);
    try {
      await signup(formData.email, formData.password, formData.name);
      // Navigation will be handled by the index.tsx redirect
    } catch (error) {
      Alert.alert('Error', 'Signup failed. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar backgroundColor="#10B981" barStyle="light-content" />
      <View style={[styles.loginContainer, { backgroundColor: '#10B981' }]}>
        <View style={styles.loginCard}>
          <View style={styles.logoContainer}>
            <View style={[styles.logo, { backgroundColor: '#10B981' }]}>
              <Ionicons name="person-add" size={32} color="white" />
            </View>
            <Text style={styles.title}>Create Account</Text>
            <Text style={styles.subtitle}>Join us and start managing your inventory.</Text>
          </View>
          
          <View style={styles.inputContainer}>
            <Input
              placeholder="Full Name"
              value={formData.name}
              onChangeText={(text) => setFormData({...formData, name: text})}
              editable={!isSubmitting}
            />
            
            <Input
              placeholder="Email"
              value={formData.email}
              onChangeText={(text) => setFormData({...formData, email: text})}
              keyboardType="email-address"
              autoCapitalize="none"
              editable={!isSubmitting}
            />
            
            <Input
              placeholder="Password"
              value={formData.password}
              onChangeText={(text) => setFormData({...formData, password: text})}
              secureTextEntry
              editable={!isSubmitting}
            />
            
            <Input
              placeholder="Confirm Password"
              value={formData.confirmPassword}
              onChangeText={(text) => setFormData({...formData, confirmPassword: text})}
              secureTextEntry
              editable={!isSubmitting}
            />
            
            <Button 
              title={isSubmitting ? "Creating Account..." : "Create Account"} 
              onPress={handleSignUp} 
              color="#10B981" 
              disabled={isSubmitting}
            />
            
            <View style={styles.linkContainer}>
              <Text style={styles.linkText}>Already have an account? </Text>
              <TouchableOpacity 
                onPress={() => router.push('/(auth)/login')}
                disabled={isSubmitting}
              >
                <Text style={[styles.link, { color: '#10B981' }]}>Sign In</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </View>
    </SafeAreaView>
  );
}