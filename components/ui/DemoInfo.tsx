import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Modal } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

/**
 * Demo Mode Information Component
 * Shows users how to use the demo authentication system
 */
export function DemoInfo() {
  const [isVisible, setIsVisible] = useState(false);

  return (
    <>
      <TouchableOpacity 
        style={styles.infoButton}
        onPress={() => setIsVisible(true)}
        accessibilityRole="button"
        accessibilityLabel="Demo information"
        accessibilityHint="View demo login credentials and instructions"
      >
        <Ionicons name="information-circle" size={20} color="#6B7280" />
        <Text style={styles.infoButtonText}>Demo Mode</Text>
      </TouchableOpacity>

      <Modal
        visible={isVisible}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setIsVisible(false)}
      >
        <View style={styles.overlay}>
          <View style={styles.modal}>
            <View style={styles.header}>
              <Text style={styles.title}>Demo Mode Information</Text>
              <TouchableOpacity 
                onPress={() => setIsVisible(false)}
                accessibilityRole="button"
                accessibilityLabel="Close demo information"
              >
                <Ionicons name="close" size={24} color="#6B7280" />
              </TouchableOpacity>
            </View>
            
            <View style={styles.content}>
              <Text style={styles.subtitle}>Demo Login Credentials:</Text>
              
              <View style={styles.credentialBox}>
                <Text style={styles.credentialLabel}>Admin User:</Text>
                <Text style={styles.credential}>Email: winkyaw@example.com</Text>
                <Text style={styles.credential}>Password: password123</Text>
              </View>
              
              <View style={styles.credentialBox}>
                <Text style={styles.credentialLabel}>Demo User:</Text>
                <Text style={styles.credential}>Email: demo@example.com</Text>
                <Text style={styles.credential}>Password: password123</Text>
              </View>
              
              <Text style={styles.note}>
                💡 In demo mode, you can also create new accounts with any email and password (minimum 6 characters).
              </Text>
              
              <Text style={styles.note}>
                🔒 All authentication features work exactly as they would in production, including secure token storage and automatic refresh.
              </Text>
              
              <Text style={styles.note}>
                🌐 To connect to a real backend, add your API_BASE_URL to the .env.local file.
              </Text>
            </View>
          </View>
        </View>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  infoButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    paddingHorizontal: 12,
    gap: 6,
    marginTop: 16,
  },
  infoButtonText: {
    color: '#6B7280',
    fontSize: 14,
  },
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modal: {
    backgroundColor: 'white',
    borderRadius: 16,
    width: '100%',
    maxWidth: 400,
    maxHeight: '80%',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1F2937',
  },
  content: {
    padding: 20,
  },
  subtitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 16,
  },
  credentialBox: {
    backgroundColor: '#F3F4F6',
    padding: 12,
    borderRadius: 8,
    marginBottom: 12,
  },
  credentialLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 4,
  },
  credential: {
    fontSize: 14,
    color: '#6B7280',
    fontFamily: 'monospace',
  },
  note: {
    fontSize: 14,
    color: '#6B7280',
    lineHeight: 20,
    marginBottom: 12,
  },
});