import React, { useState, useRef } from 'react';
import { View, Text, ScrollView, StatusBar, TouchableOpacity, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useEmployees } from '../../context/EmployeesContext';
import { useAuth } from '../../context/AuthContext';
import { Header } from '../../components/shared/Header';
import { SearchBar } from '../../components/shared/SearchBar';
import { AddEmployeeModal } from '../../components/modals/AddEmployeeModal';
import { EditEmployeeModal } from '../../components/modals/EditEmployeeModal';
import { Employee } from '../../types';
import { styles } from '../../constants/Styles';
import { PermissionService } from '../../services/api/permissionService';

export default function EmployeesScreen() {
  // ✅ SECURITY FIX: Add authentication check
  const { isAuthenticated, isInitialized, user } = useAuth();
  const router = useRouter();

  React.useEffect(() => {
    if (isInitialized && !isAuthenticated) {
      console.log('🔐 Employees: Unauthorized access blocked, redirecting to login');
      router.replace('/(auth)/login');
    }
  }, [isAuthenticated, isInitialized, router]);

  // Early return if not authenticated
  if (!isAuthenticated) {
    return null;
  }

  const [canAdd, setCanAdd] = useState(false);

  const { 
    employees, 
    loading, 
    error, 
    updateEmployee, 
    deleteEmployee,
    refreshEmployees,
    useApiIntegration,
    setUseApiIntegration
  } = useEmployees();
  const [searchTerm, setSearchTerm] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingEmployee, setEditingEmployee] = useState<Employee | null>(null);
  const [showEditModal, setShowEditModal] = useState(false);
  
  // ✅ FIX: Local state for expand/collapse (no API calls)
  const [expandedEmployees, setExpandedEmployees] = useState<Set<number>>(new Set());

  // ✅ INFINITE LOOP FIX: Track loaded state to prevent repeated loads
  const loadedRef = useRef(false);

  // ✅ LAZY LOADING: Load employees only when Employees screen is focused
  useFocusEffect(
    React.useCallback(() => {
      // Prevent loading if already loaded or currently loading
      if (loadedRef.current || loading) {
        console.log('⏭️  Employees: Skipping load (already loaded or loading)');
        return;
      }

      console.log('👥 Employees screen focused - loading employees');
      loadedRef.current = true;
      refreshEmployees();

      // Check permissions
      PermissionService.canAddItem()
        .then(setCanAdd)
        .catch((error) => {
          console.error('Failed to check add employee permission:', error);
          setCanAdd(false);
        });
    }, [refreshEmployees, loading])
  );

  // ✅ FIX: Toggle expand/collapse in local state only (no API call)
  const toggleEmployeeExpansion = (id: number) => {
    setExpandedEmployees(prev => {
      const newSet = new Set(prev);
      if (newSet.has(id)) {
        newSet.delete(id);
      } else {
        newSet.add(id);
      }
      return newSet;
    });
  };

  // Helper to check if employee is expanded
  const isEmployeeExpanded = (id: number): boolean => {
    return expandedEmployees.has(id);
  };

  const handleEditEmployee = (employee: Employee) => {
    setEditingEmployee(employee);
    setShowEditModal(true);
  };

  const handleDeleteEmployee = (employee: Employee) => {
    Alert.alert(
      'Delete Employee',
      `Are you sure you want to delete ${employee.firstName} ${employee.lastName}? This action cannot be undone.`,
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Delete', 
          style: 'destructive',
          onPress: () => {
            deleteEmployee(employee.id);
            Alert.alert('Success', `${employee.firstName} ${employee.lastName} has been deleted.`);
          }
        }
      ]
    );
  };

  const filteredEmployees = employees.filter(employee =>
    employee.firstName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    employee.lastName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    employee.title.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar backgroundColor="#8B5CF6" barStyle="light-content" />
      
      <Header 
        title="Team Management"
        backgroundColor="#8B5CF6"
        rightComponent={
          canAdd ? (
            <TouchableOpacity 
              style={styles.headerButton} 
              onPress={() => setShowAddModal(true)}
            >
              <Text style={styles.headerButtonText}>Add Employee</Text>
            </TouchableOpacity>
          ) : null
        }
      />

      <SearchBar
        placeholder="Search employees..."
        value={searchTerm}
        onChangeText={setSearchTerm}
      />

      <View style={styles.employeeStats}>
        <View style={styles.employeeStatCard}>
          <Text style={styles.employeeStatLabel}>Total Employees</Text>
          <Text style={styles.employeeStatValue}>{employees.length}</Text>
        </View>
        <View style={styles.employeeStatCard}>
          <Text style={styles.employeeStatLabel}>Checked In</Text>
          <Text style={[styles.employeeStatValue, { color: '#10B981' }]}>
            {employees.filter(emp => emp.checkInTime !== 'Not checked in').length}
          </Text>
        </View>
      </View>

      <ScrollView 
        style={styles.employeesList} 
        showsVerticalScrollIndicator={true}
        nestedScrollEnabled={true}
      >
        {/* Loading State */}
        {loading && (
          <View style={styles.loadingContainer}>
            <Text style={styles.loadingText}>Loading employees...</Text>
          </View>
        )}

        {/* Error State - Show when there's an API error */}
        {error && !loading && (
          <View style={styles.errorContainer}>
            <View style={styles.errorHeader}>
              <Ionicons name="alert-circle" size={16} color="#EF4444" />
              <Text style={styles.errorText}>{error}</Text>
            </View>
            <TouchableOpacity 
              style={styles.retryButton}
              onPress={refreshEmployees}
            >
              <Text style={styles.retryButtonText}>Retry</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* API Integration Toggle for Development */}
        {__DEV__ && (
          <TouchableOpacity 
            style={styles.apiToggleButton}
            onPress={() => setUseApiIntegration(!useApiIntegration)}
          >
            <Text style={styles.apiToggleText}>
              API Integration: {useApiIntegration ? 'ON' : 'OFF'}
            </Text>
          </TouchableOpacity>
        )}

        <View style={styles.employeesCard}>
          {!loading && filteredEmployees.length === 0 && searchTerm.length > 0 && (
            <View style={styles.emptySearchContainer}>
              <Ionicons name="search" size={64} color="#D1D5DB" />
              <Text style={styles.emptySearchTitle}>No Results Found</Text>
              <Text style={styles.emptySearchText}>
                No employees match your search for "{searchTerm}"
              </Text>
            </View>
          )}

          {!loading && !error && filteredEmployees.length === 0 && searchTerm.length === 0 && (
            <View style={styles.emptyStateContainer}>
              <Ionicons name="people-outline" size={64} color="#D1D5DB" />
              <Text style={styles.emptyStateTitle}>No Employees Yet</Text>
              <Text style={styles.emptyStateText}>
                Add your first employee to get started with team management
              </Text>
              <TouchableOpacity 
                style={[styles.headerButton, { marginTop: 16, backgroundColor: '#8B5CF6' }]}
                onPress={() => setShowAddModal(true)}
              >
                <Text style={styles.headerButtonText}>Add Employee</Text>
              </TouchableOpacity>
            </View>
          )}

          {filteredEmployees.map((employee, index) => (
            <View key={employee.id}>
              {index > 0 && <View style={styles.itemSeparator} />}
              <TouchableOpacity
                style={styles.employeeRow}
                onPress={() => toggleEmployeeExpansion(employee.id)}
              >
                <View style={styles.employeeInfo}>
                  <Text style={styles.employeeName}>{employee.firstName}</Text>
                  <Text style={styles.employeeTitle}>{employee.title}</Text>
                </View>
                <View style={styles.employeeStats}>
                  <View style={styles.employeeStat}>
                    <Text style={styles.employeeStatSmallLabel}>Check In</Text>
                    <Text style={[styles.employeeStatSmallValue, { 
                      color: employee.checkInTime === 'Not checked in' ? '#EF4444' : '#10B981' 
                    }]}>
                      {employee.checkInTime === 'Not checked in' ? 'Out' : employee.checkInTime}
                    </Text>
                  </View>
                  <View style={styles.employeeStat}>
                    <Text style={styles.employeeStatSmallLabel}>Rate</Text>
                    <Text style={[styles.employeeStatSmallValue, { color: '#3B82F6' }]}>
                      ${employee.hourlyRate}/hr
                    </Text>
                  </View>
                </View>
              </TouchableOpacity>
              
              {isEmployeeExpanded(employee.id) && (
                <View style={styles.employeeExpanded}>
                  <View style={styles.employeeExpandedItem}>
                    <Text style={styles.employeeExpandedLabel}>Full Name:</Text>
                    <Text style={styles.employeeExpandedValue}>
                      {employee.firstName} {employee.lastName}
                    </Text>
                  </View>
                  <View style={styles.employeeExpandedItem}>
                    <Text style={styles.employeeExpandedLabel}>Phone:</Text>
                    <Text style={styles.employeeExpandedValue}>{employee.phone}</Text>
                  </View>
                  <View style={styles.employeeExpandedItem}>
                    <Text style={styles.employeeExpandedLabel}>Total Compensation:</Text>
                    <Text style={[styles.employeeExpandedValue, { color: '#10B981' }]}>
                      ${employee.totalCompensation.toLocaleString()}/year
                    </Text>
                  </View>
                  <View style={styles.employeeExpandedItem}>
                    <Text style={styles.employeeExpandedLabel}>Annual Bonus:</Text>
                    <Text style={[styles.employeeExpandedValue, { color: '#3B82F6' }]}>
                      ${employee.bonus.toLocaleString()}
                    </Text>
                  </View>
                  <View style={styles.employeeExpandedItem}>
                    <Text style={styles.employeeExpandedLabel}>Start Date:</Text>
                    <Text style={styles.employeeExpandedValue}>
                      {new Date(employee.startDate).toLocaleDateString()}
                    </Text>
                  </View>
                  <View style={styles.employeeExpandedItem}>
                    <Text style={styles.employeeExpandedLabel}>Status:</Text>
                    <Text style={[styles.employeeExpandedValue, { color: '#10B981' }]}>
                      {employee.status}
                    </Text>
                  </View>
                  
                  {/* Action Buttons */}
                  <View style={styles.employeeStats}>
                    {/* View Receipts Button - GM+ only */}
                    {(user?.role === 'GENERAL_MANAGER' || user?.role === 'CEO' || user?.role === 'OWNER') && (
                      <TouchableOpacity 
                        style={[styles.headerButton, { backgroundColor: '#F59E0B' }]}
                        onPress={() => {
                          router.push({
                            pathname: '/employee-receipts',
                            params: {
                              employeeId: employee.id.toString(),
                              employeeName: `${employee.firstName} ${employee.lastName}`,
                            },
                          });
                        }}
                      >
                        <Ionicons name="receipt" size={16} color="white" />
                        <Text style={styles.headerButtonText}>Receipts</Text>
                      </TouchableOpacity>
                    )}
                    
                    <TouchableOpacity 
                      style={[styles.headerButton, { backgroundColor: '#3B82F6' }]}
                      onPress={() => handleEditEmployee(employee)}
                    >
                      <Ionicons name="pencil" size={16} color="white" />
                      <Text style={styles.headerButtonText}>Edit</Text>
                    </TouchableOpacity>
                    
                    <TouchableOpacity 
                      style={[styles.headerButton, { backgroundColor: '#EF4444' }]}
                      onPress={() => handleDeleteEmployee(employee)}
                    >
                      <Ionicons name="trash" size={16} color="white" />
                      <Text style={styles.headerButtonText}>Delete</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              )}
            </View>
          ))}
        </View>
      </ScrollView>

      <AddEmployeeModal 
        visible={showAddModal}
        onClose={() => setShowAddModal(false)}
      />
      
      <EditEmployeeModal 
        visible={showEditModal}
        employee={editingEmployee}
        onClose={() => {
          setShowEditModal(false);
          setEditingEmployee(null);
        }}
        onSave={(updatedEmployee) => {
          if (editingEmployee) {
            updateEmployee(editingEmployee.id, updatedEmployee);
            setShowEditModal(false);
            setEditingEmployee(null);
            Alert.alert('Success', 'Employee updated successfully');
          }
        }}
      />
    </SafeAreaView>
  );
}