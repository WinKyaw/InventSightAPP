import React, { Component, ReactNode, ErrorInfo } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
}

interface State {
  hasError: boolean;
  error?: Error;
}

/**
 * Authentication Error Boundary
 * Catches and handles authentication-related errors gracefully
 */
export class AuthErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): State {
    // Update state so the next render will show the fallback UI
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('🚨 AuthErrorBoundary caught an error:', error);
    console.error('Error Info:', errorInfo);
    
    // Call optional error handler
    if (this.props.onError) {
      this.props.onError(error, errorInfo);
    }

    // Log authentication-specific errors
    if (error.message?.includes('authentication') || error.message?.includes('token')) {
      console.error('🔐 Authentication Error Details:', {
        message: error.message,
        stack: error.stack,
        componentStack: errorInfo.componentStack,
      });
    }
  }

  handleRetry = () => {
    this.setState({ hasError: false, error: undefined });
  };

  handleReportError = () => {
    const error = this.state.error;
    if (error) {
      Alert.alert(
        'Error Report',
        `Error: ${error.message}\n\nWould you like to reset the app?`,
        [
          { text: 'Cancel', style: 'cancel' },
          { 
            text: 'Reset App', 
            style: 'destructive',
            onPress: () => {
              // Clear any cached data and restart
              this.setState({ hasError: false, error: undefined });
            }
          }
        ]
      );
    }
  };

  render() {
    if (this.state.hasError) {
      // Render custom fallback UI
      if (this.props.fallback) {
        return this.props.fallback;
      }

      // Default error UI
      return (
        <View style={styles.container}>
          <View style={styles.errorCard}>
            <Ionicons name="warning" size={48} color="#EF4444" />
            <Text style={styles.title}>Authentication Error</Text>
            <Text style={styles.message}>
              {this.state.error?.message || 'Something went wrong with authentication.'}
            </Text>
            
            <View style={styles.buttonContainer}>
              <TouchableOpacity 
                style={styles.retryButton} 
                onPress={this.handleRetry}
                accessibilityRole="button"
                accessibilityLabel="Try again"
                accessibilityHint="Attempt to reload the authentication system"
              >
                <Ionicons name="refresh" size={20} color="white" />
                <Text style={styles.retryButtonText}>Try Again</Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={styles.reportButton} 
                onPress={this.handleReportError}
                accessibilityRole="button"
                accessibilityLabel="Report error"
                accessibilityHint="Report this error and reset the app"
              >
                <Ionicons name="bug" size={20} color="#6B7280" />
                <Text style={styles.reportButtonText}>Report Error</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      );
    }

    return this.props.children;
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
    padding: 20,
  },
  errorCard: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
    maxWidth: 400,
    width: '100%',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1F2937',
    marginTop: 16,
    marginBottom: 8,
    textAlign: 'center',
  },
  message: {
    fontSize: 16,
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 24,
  },
  buttonContainer: {
    width: '100%',
    gap: 12,
  },
  retryButton: {
    backgroundColor: '#3B82F6',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    gap: 8,
  },
  retryButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  reportButton: {
    backgroundColor: 'transparent',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#D1D5DB',
    gap: 8,
  },
  reportButtonText: {
    color: '#6B7280',
    fontSize: 16,
    fontWeight: '600',
  },
});