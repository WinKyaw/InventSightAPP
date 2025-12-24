import React, { useState, useRef } from 'react';
import { View, Text, ScrollView, StatusBar, TouchableOpacity, Alert, Modal, TextInput, ActivityIndicator } from 'react-native';
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
import WarehouseService from '../../services/api/warehouse';
import { WarehouseAssignment } from '../../types/warehouse';
import { Colors } from '../../constants/Colors';

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

  // Warehouse assignment state
  const [showWarehouseModal, setShowWarehouseModal] = useState(false);
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null);
  const [employeeWarehouses, setEmployeeWarehouses] = useState<WarehouseAssignment[]>([]);
  const [availableWarehouses, setAvailableWarehouses] = useState<any[]>([]);
  const [loadingWarehouses, setLoadingWarehouses] = useState(false);
  const [newAssignment, setNewAssignment] = useState({
    warehouseId: '',
    isPermanent: true,
    expiresAt: '',
    notes: '',
    permissionType: 'READ' as 'READ' | 'READ_WRITE', // ✅ NEW: Permission type for warehouse access
  });

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

  // Load employee warehouses
  const loadEmployeeWarehouses = async (userId: number) => {
    try {
      setLoadingWarehouses(true);
      console.log('👤 Loading warehouse assignments for employee:', userId);
      const assignments = await WarehouseService.getEmployeeWarehouses(userId.toString());
      setEmployeeWarehouses(assignments);
      console.log(`✅ Loaded ${assignments.length} warehouse assignments`);
    } catch (error: any) {
      console.error('❌ Error loading employee warehouses:', error.message);
      setEmployeeWarehouses([]);
    } finally {
      setLoadingWarehouses(false);
    }
  };

  // Load available warehouses
  const loadAvailableWarehouses = async () => {
    try {
      console.log('🏢 Loading available warehouses...');
      const warehouses = await WarehouseService.getWarehouses();
      setAvailableWarehouses(warehouses);
      console.log(`✅ Loaded ${warehouses.length} warehouses`);
    } catch (error: any) {
      console.error('❌ Error loading warehouses:', error.message);
      setAvailableWarehouses([]);
    }
  };

  // Assign warehouse to employee
  const handleAssignWarehouse = async () => {
    if (!selectedEmployee || !newAssignment.warehouseId) {
      Alert.alert('Error', 'Please select a warehouse');
      return;
    }

    if (!newAssignment.isPermanent && !newAssignment.expiresAt) {
      Alert.alert('Error', 'Please select expiration date for temporary assignment');
      return;
    }

    try {
      console.log('🏢 Assigning warehouse to employee:');
      console.log('  Employee:', selectedEmployee.firstName, selectedEmployee.lastName);
      console.log('  Warehouse ID:', newAssignment.warehouseId);
      console.log('  Assignment Type:', newAssignment.isPermanent ? 'PERMANENT' : 'TEMPORARY');
      console.log('  Permission Type:', newAssignment.permissionType);
      console.log('  Notes:', newAssignment.notes);
      
      // Step 1: Assign warehouse (permanent/temporary)
      await WarehouseService.assignWarehouseToEmployee({
        userId: selectedEmployee.id.toString(),
        warehouseId: newAssignment.warehouseId,
        isPermanent: newAssignment.isPermanent,
        expiresAt: newAssignment.isPermanent ? undefined : newAssignment.expiresAt,
        notes: newAssignment.notes,
      });

      console.log('✅ Warehouse assigned, now granting permission...');

      // Step 2: Grant warehouse permission (READ or READ_WRITE)
      await WarehouseService.grantWarehousePermission(
        newAssignment.warehouseId,
        selectedEmployee.id.toString(),
        newAssignment.permissionType
      );

      console.log('✅ Permission granted successfully');

      Alert.alert('Success', 'Warehouse assigned and permissions granted successfully');
      setNewAssignment({ 
        warehouseId: '', 
        isPermanent: true, 
        expiresAt: '', 
        notes: '',
        permissionType: 'READ', // ✅ Reset to default
      });
      
      // Reload employee warehouses
      await loadEmployeeWarehouses(selectedEmployee.id);
    } catch (error: any) {
      console.error('❌ Error assigning warehouse:', error.message);
      Alert.alert('Error', `Failed to assign warehouse: ${error.message}`);
    }
  };

  // Remove warehouse assignment
  const handleRemoveAssignment = async (assignmentId: string) => {
    Alert.alert(
      'Remove Assignment',
      'Are you sure you want to remove this warehouse assignment?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: async () => {
            try {
              await WarehouseService.removeWarehouseAssignment(assignmentId);
              Alert.alert('Success', 'Warehouse assignment removed');
              
              // Reload employee warehouses
              if (selectedEmployee) {
                await loadEmployeeWarehouses(selectedEmployee.id);
              }
            } catch (error: any) {
              Alert.alert('Error', `Failed to remove assignment: ${error.message}`);
            }
          },
        },
      ]
    );
  };

  // Open warehouse assignment modal
  const openWarehouseModal = async (employee: Employee) => {
    setSelectedEmployee(employee);
    setShowWarehouseModal(true);
    await Promise.all([
      loadEmployeeWarehouses(employee.id),
      loadAvailableWarehouses(),
    ]);
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
                    {/* Assign Warehouse Button */}
                    {canAdd && (
                      <TouchableOpacity 
                        style={[styles.headerButton, { backgroundColor: '#8B5CF6' }]}
                        onPress={() => openWarehouseModal(employee)}
                      >
                        <Ionicons name="business" size={16} color="white" />
                        <Text style={styles.headerButtonText}>Warehouse</Text>
                      </TouchableOpacity>
                    )}
                    
                    {/* View Receipts Button - GM+ only */}
                    {(() => {
                      // Check if user is GM+ (case-insensitive)
                      const userRoleUpper = user?.role?.toUpperCase();
                      const isGMPlus = userRoleUpper === 'OWNER' ||
                                      userRoleUpper === 'GENERAL_MANAGER' || 
                                      userRoleUpper === 'CEO' || 
                                      userRoleUpper === 'FOUNDER' ||
                                      userRoleUpper === 'ADMIN';
                      
                      if (__DEV__ && isGMPlus) {
                        console.log('✅ Showing receipts button for:', `${employee.firstName} ${employee.lastName}`);
                      }
                      
                      if (!isGMPlus) {
                        return null;
                      }
                      
                      return (
                        <TouchableOpacity 
                          style={[styles.headerButton, { backgroundColor: '#F59E0B' }]}
                          onPress={() => {
                            if (__DEV__) {
                              console.log('📊 Navigating to employee receipts:', employee.id);
                            }
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
                      );
                    })()}
                    
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

      {/* Warehouse Assignment Modal */}
      <Modal
        visible={showWarehouseModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowWarehouseModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>🏢 Assign Warehouse</Text>
              <TouchableOpacity onPress={() => setShowWarehouseModal(false)}>
                <Ionicons name="close" size={24} color={Colors.text} />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalForm}>
              <Text style={styles.modalSubtitle}>
                Employee: {selectedEmployee?.firstName} {selectedEmployee?.lastName}
              </Text>

              {/* Current Assignments */}
              <View style={styles.assignmentsSection}>
                <Text style={styles.sectionTitle}>Current Assignments:</Text>
                {loadingWarehouses ? (
                  <ActivityIndicator size="small" color="#6366F1" />
                ) : employeeWarehouses.length === 0 ? (
                  <Text style={styles.noAssignments}>No warehouses assigned</Text>
                ) : (
                  employeeWarehouses.map((assignment) => (
                    <View key={assignment.id} style={styles.assignmentItem}>
                      <View style={styles.assignmentInfo}>
                        <Text style={styles.assignmentName}>
                          {assignment.warehouseName || 'Unknown Warehouse'}
                        </Text>
                        <Text style={styles.assignmentType}>
                          {assignment.isPermanent ? '🔒 Permanent' : '⏰ Temporary'}
                        </Text>
                        {!assignment.isPermanent && assignment.expiresAt && (
                          <Text style={styles.assignmentExpiry}>
                            Expires: {new Date(assignment.expiresAt).toLocaleDateString()}
                          </Text>
                        )}
                        {/* ✅ NEW: Show permission type if available */}
                        {assignment.permissionType && (
                          <Text style={styles.assignmentPermission}>
                            {assignment.permissionType === 'READ_WRITE' ? '✏️ Read/Write' : '📖 Read-Only'}
                          </Text>
                        )}
                      </View>
                      <TouchableOpacity
                        style={styles.removeButton}
                        onPress={() => handleRemoveAssignment(assignment.id)}
                      >
                        <Ionicons name="trash" size={20} color="#EF4444" />
                      </TouchableOpacity>
                    </View>
                  ))
                )}
              </View>

              {/* New Assignment Form */}
              <View style={styles.assignmentsSection}>
                <Text style={styles.sectionTitle}>Add New Assignment:</Text>

                {/* Warehouse Selection */}
                <Text style={styles.inputLabel}>Warehouse *</Text>
                <View style={styles.pickerContainer}>
                  <ScrollView style={styles.warehousePicker} nestedScrollEnabled>
                    {availableWarehouses.map((warehouse) => (
                      <TouchableOpacity
                        key={warehouse.id}
                        style={[
                          styles.warehouseOption,
                          newAssignment.warehouseId === warehouse.id && styles.warehouseOptionSelected,
                        ]}
                        onPress={() => {
                          setNewAssignment({ ...newAssignment, warehouseId: warehouse.id });
                        }}
                      >
                        <Text style={[
                          styles.warehouseOptionText,
                          newAssignment.warehouseId === warehouse.id && styles.warehouseOptionTextSelected,
                        ]}>
                          {warehouse.name} {warehouse.location ? `- ${warehouse.location}` : ''}
                        </Text>
                        {newAssignment.warehouseId === warehouse.id && (
                          <Ionicons name="checkmark-circle" size={20} color="#6366F1" />
                        )}
                      </TouchableOpacity>
                    ))}
                  </ScrollView>
                </View>

                {/* Assignment Type */}
                <Text style={styles.inputLabel}>Assignment Type *</Text>
                <View style={styles.assignmentTypeContainer}>
                  <TouchableOpacity
                    style={[
                      styles.typeButton,
                      newAssignment.isPermanent && styles.typeButtonActive,
                    ]}
                    onPress={() => setNewAssignment({ ...newAssignment, isPermanent: true, expiresAt: '' })}
                  >
                    <Ionicons 
                      name="lock-closed" 
                      size={20} 
                      color={newAssignment.isPermanent ? '#fff' : '#6366F1'} 
                    />
                    <Text style={[
                      styles.typeButtonText,
                      newAssignment.isPermanent && styles.typeButtonTextActive,
                    ]}>
                      Permanent
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[
                      styles.typeButton,
                      !newAssignment.isPermanent && styles.typeButtonActive,
                    ]}
                    onPress={() => setNewAssignment({ ...newAssignment, isPermanent: false })}
                  >
                    <Ionicons 
                      name="time" 
                      size={20} 
                      color={!newAssignment.isPermanent ? '#fff' : '#6366F1'} 
                    />
                    <Text style={[
                      styles.typeButtonText,
                      !newAssignment.isPermanent && styles.typeButtonTextActive,
                    ]}>
                      Temporary
                    </Text>
                  </TouchableOpacity>
                </View>

                {/* ✅ NEW: Permission Type (Read-Only/Read-Write) */}
                <Text style={styles.inputLabel}>Permission Type *</Text>
                <View style={styles.assignmentTypeContainer}>
                  <TouchableOpacity
                    style={[
                      styles.typeButton,
                      newAssignment.permissionType === 'READ' && styles.typeButtonActive,
                    ]}
                    onPress={() => setNewAssignment({ ...newAssignment, permissionType: 'READ' })}
                  >
                    <Ionicons 
                      name="eye" 
                      size={20} 
                      color={newAssignment.permissionType === 'READ' ? '#fff' : '#10B981'} 
                    />
                    <View>
                      <Text style={[
                        styles.typeButtonText,
                        newAssignment.permissionType === 'READ' && styles.typeButtonTextActive,
                      ]}>
                        📖 Read-Only
                      </Text>
                      <Text style={[
                        styles.permissionDescription,
                        newAssignment.permissionType === 'READ' && styles.permissionDescriptionActive,
                      ]}>
                        View inventory only
                      </Text>
                    </View>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[
                      styles.typeButton,
                      newAssignment.permissionType === 'READ_WRITE' && styles.typeButtonActive,
                    ]}
                    onPress={() => setNewAssignment({ ...newAssignment, permissionType: 'READ_WRITE' })}
                  >
                    <Ionicons 
                      name="create" 
                      size={20} 
                      color={newAssignment.permissionType === 'READ_WRITE' ? '#fff' : '#10B981'} 
                    />
                    <View>
                      <Text style={[
                        styles.typeButtonText,
                        newAssignment.permissionType === 'READ_WRITE' && styles.typeButtonTextActive,
                      ]}>
                        ✏️ Read/Write
                      </Text>
                      <Text style={[
                        styles.permissionDescription,
                        newAssignment.permissionType === 'READ_WRITE' && styles.permissionDescriptionActive,
                      ]}>
                        Add & withdraw inventory
                      </Text>
                    </View>
                  </TouchableOpacity>
                </View>

                {/* Expiration Date (if temporary) */}
                {!newAssignment.isPermanent && (
                  <>
                    <Text style={styles.inputLabel}>Expiration Date *</Text>
                    <TextInput
                      style={styles.input}
                      placeholder="YYYY-MM-DD"
                      value={newAssignment.expiresAt}
                      onChangeText={(text) =>
                        setNewAssignment({ ...newAssignment, expiresAt: text })
                      }
                    />
                  </>
                )}

                {/* Notes */}
                <Text style={styles.inputLabel}>Notes (optional)</Text>
                <TextInput
                  style={[styles.input, styles.textArea]}
                  placeholder="Add notes about this assignment"
                  value={newAssignment.notes}
                  onChangeText={(text) =>
                    setNewAssignment({ ...newAssignment, notes: text })
                  }
                  multiline
                  numberOfLines={3}
                  textAlignVertical="top"
                />

                <View style={styles.modalButtons}>
                  <TouchableOpacity
                    style={styles.cancelButton}
                    onPress={() => {
                      setShowWarehouseModal(false);
                      setNewAssignment({ 
                        warehouseId: '', 
                        isPermanent: true, 
                        expiresAt: '', 
                        notes: '',
                        permissionType: 'READ', // ✅ Reset permission type
                      });
                    }}
                  >
                    <Text style={styles.cancelButtonText}>Close</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={styles.saveButton}
                    onPress={handleAssignWarehouse}
                  >
                    <Text style={styles.saveButtonText}>Assign</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}