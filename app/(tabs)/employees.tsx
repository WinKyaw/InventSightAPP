import React, { useState } from 'react';
import { View, Text, ScrollView, SafeAreaView, StatusBar, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useEmployees } from '../../context/EmployeesContext';
import { Header } from '../../components/shared/Header';
import { SearchBar } from '../../components/shared/SearchBar';
import { AddEmployeeModal } from '../../components/modals/AddEmployeeModal';
import { styles } from '../../constants/Styles';

export default function EmployeesScreen() {
  const { 
    employees, 
    loading, 
    error, 
    updateEmployee, 
    refreshEmployees,
    useApiIntegration,
    setUseApiIntegration
  } = useEmployees();
  const [searchTerm, setSearchTerm] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);

  const toggleEmployeeExpansion = (id: number) => {
    const employee = employees.find(emp => emp.id === id);
    if (employee) {
      updateEmployee(id, { expanded: !employee.expanded });
    }
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
          <TouchableOpacity 
            style={styles.headerButton} 
            onPress={() => setShowAddModal(true)}
          >
            <Text style={styles.headerButtonText}>Add Employee</Text>
          </TouchableOpacity>
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

      <ScrollView style={styles.employeesList} showsVerticalScrollIndicator={false}>
        {/* Loading State */}
        {loading && (
          <View style={styles.loadingContainer}>
            <Text style={styles.loadingText}>Loading employees...</Text>
          </View>
        )}

        {/* Error State */}
        {error && (
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

          {!loading && filteredEmployees.length === 0 && searchTerm.length === 0 && (
            <View style={styles.emptyStateContainer}>
              <Ionicons name="people-outline" size={64} color="#D1D5DB" />
              <Text style={styles.emptyStateTitle}>No Employees Yet</Text>
              <Text style={styles.emptyStateText}>
                Add your first employee to get started with team management
              </Text>
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
              
              {employee.expanded && (
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
    </SafeAreaView>
  );
}