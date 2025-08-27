import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  TextInput,
  StyleSheet,
  SafeAreaView,
  Modal,
  Dimensions,
  Alert,
  StatusBar,
  FlatList,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const { width, height } = Dimensions.get('window');

// Helper functions outside component to avoid scope issues
const getSeasonalMultiplier = (month) => {
  if (month >= 11 || month <= 1) return 1.2; // Winter - higher sales
  if (month >= 5 && month <= 7) return 1.1; // Summer - good sales
  if (month >= 2 && month <= 4) return 0.9; // Spring - moderate
  return 1.0; // Fall - baseline
};

const generateDailyActivities = (date, sales, orders) => {
  const activities = [];
  const dayOfWeek = date.getDay();
  
  // Morning activities
  activities.push({
    time: '08:00',
    type: 'opening',
    description: 'Store opened for business',
    icon: 'storefront-outline'
  });
  
  if (dayOfWeek >= 1 && dayOfWeek <= 5) { // Weekdays
    activities.push({
      time: '08:30',
      type: 'delivery',
      description: 'Fresh bakery items delivered',
      icon: 'car-outline'
    });
  }
  
  // Peak hours
  if (orders > 40) {
    activities.push({
      time: '12:15',
      type: 'peak',
      description: 'Lunch rush - high customer volume',
      icon: 'people-outline'
    });
  }
  
  // Inventory activities
  if (Math.random() > 0.7) {
    activities.push({
      time: '14:30',
      type: 'inventory',
      description: 'Inventory restocked',
      icon: 'cube-outline'
    });
  }
  
  // Special events
  if (dayOfWeek === 5 && Math.random() > 0.6) { // Friday specials
    activities.push({
      time: '16:00',
      type: 'promotion',
      description: 'Friday special promotion launched',
      icon: 'pricetag-outline'
    });
  }
  
  // Closing
  activities.push({
    time: '20:00',
    type: 'closing',
    description: 'Store closed',
    icon: 'lock-closed-outline'
  });
  
  return activities;
};

const generateTopItemsForDay = (sales) => {
  const baseItems = ['Coffee', 'Sandwich', 'Tea', 'Croissant', 'Muffin', 'Salad'];
  return baseItems.slice(0, 3).map((item, index) => ({
    name: item,
    sales: Math.floor(sales * (0.3 - index * 0.08)),
    quantity: Math.floor(sales * (0.05 - index * 0.01))
  }));
};

const App = () => {
  const [currentScreen, setCurrentScreen] = useState('login');
  const [user, setUser] = useState(null);
  const [items, setItems] = useState([
    { id: 1, name: 'Coffee', price: 4.50, quantity: 25, total: 112.50, expanded: false, category: 'Beverages', salesCount: 445 },
    { id: 2, name: 'Sandwich', price: 8.99, quantity: 15, total: 134.85, expanded: false, category: 'Food', salesCount: 298 },
    { id: 3, name: 'Croissant', price: 3.75, quantity: 20, total: 75.00, expanded: false, category: 'Bakery', salesCount: 245 },
    { id: 4, name: 'Tea', price: 3.25, quantity: 30, total: 97.50, expanded: false, category: 'Beverages', salesCount: 189 },
    { id: 5, name: 'Muffin', price: 2.99, quantity: 12, total: 35.88, expanded: false, category: 'Bakery', salesCount: 156 },
    { id: 6, name: 'Salad', price: 6.50, quantity: 8, total: 52.00, expanded: false, category: 'Food', salesCount: 134 }
  ]);
  
  // Daily Activity Data with proper function scope
  const [dailyActivities, setDailyActivities] = useState(() => {
    const activities = {};
    const startDate = new Date('2023-08-25');
    const endDate = new Date('2025-08-25');
    
    for (let date = new Date(startDate); date <= endDate; date.setDate(date.getDate() + 1)) {
      const dateKey = date.toISOString().split('T')[0];
      const dayOfWeek = date.getDay();
      
      // Generate realistic data based on day of week and seasonal patterns
      const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
      const baseMultiplier = isWeekend ? 1.3 : 1.0;
      const seasonalMultiplier = getSeasonalMultiplier(date.getMonth());
      
      const sales = Math.floor((800 + Math.random() * 1500) * baseMultiplier * seasonalMultiplier);
      const orders = Math.floor(sales / (15 + Math.random() * 20));
      const customers = Math.floor(orders * (0.8 + Math.random() * 0.4));
      
      activities[dateKey] = {
        date: dateKey,
        sales,
        orders,
        customers,
        activities: generateDailyActivities(date, sales, orders),
        topItems: generateTopItemsForDay(sales)
      };
    }
    return activities;
  });

  const [searchTerm, setSearchTerm] = useState('');
  const [showAddForm, setShowAddForm] = useState(false);
  const [reminders, setReminders] = useState([
    { id: 1, title: 'Coffee Bean Delivery', date: '2025-08-26', type: 'order', time: '10:00 AM', description: 'Premium coffee beans from supplier' },
    { id: 2, title: 'Staff Meeting', date: '2025-08-27', type: 'meeting', time: '2:00 PM', description: 'Monthly team meeting' },
    { id: 3, title: 'Equipment Maintenance', date: '2025-08-29', type: 'maintenance', time: '9:00 AM', description: 'Espresso machine service' },
    { id: 4, title: 'Inventory Restock', date: '2025-08-30', type: 'order', time: '11:00 AM', description: 'Pastries and bread delivery' }
  ]);
  const [showAddReminder, setShowAddReminder] = useState(false);
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [showHamburgerMenu, setShowHamburgerMenu] = useState(false);

  // Calendar States
  const [currentCalendarDate, setCurrentCalendarDate] = useState(new Date());
  const [showDayModal, setShowDayModal] = useState(false);
  const [selectedDayData, setSelectedDayData] = useState(null);

  // Receipt states
  const [receiptItems, setReceiptItems] = useState([]);
  const [customerName, setCustomerName] = useState('');
  const [showAddToReceipt, setShowAddToReceipt] = useState(false);
  const [receipts, setReceipts] = useState([]);
  const [showReceiptPreview, setShowReceiptPreview] = useState(false);
  const [currentReceipt, setCurrentReceipt] = useState(null);

  const [employees, setEmployees] = useState([
    { 
      id: 1, 
      firstName: 'John', 
      lastName: 'Doe', 
      checkInTime: '8:00 AM', 
      hourlyRate: 18.50, 
      phone: '(555) 123-4567',
      totalCompensation: 38480,
      startDate: '2023-03-15',
      status: 'Active',
      title: 'Barista',
      bonus: 1200,
      expanded: false
    },
    { 
      id: 2, 
      firstName: 'Sarah', 
      lastName: 'Johnson', 
      checkInTime: '9:30 AM', 
      hourlyRate: 22.00, 
      phone: '(555) 987-6543',
      totalCompensation: 45760,
      startDate: '2022-11-08',
      status: 'Active',
      title: 'Shift Manager',
      bonus: 2500,
      expanded: false
    },
    { 
      id: 3, 
      firstName: 'Mike', 
      lastName: 'Chen', 
      checkInTime: 'Not checked in', 
      hourlyRate: 16.75, 
      phone: '(555) 456-7890',
      totalCompensation: 34840,
      startDate: '2024-01-22',
      status: 'Active',
      title: 'Cashier',
      bonus: 500,
      expanded: false
    },
    { 
      id: 4, 
      firstName: 'Emma', 
      lastName: 'Williams', 
      checkInTime: '7:45 AM', 
      hourlyRate: 25.00, 
      phone: '(555) 321-0987',
      totalCompensation: 52000,
      startDate: '2021-08-30',
      status: 'Active',
      title: 'Assistant Manager',
      bonus: 3500,
      expanded: false
    }
  ]);
  const [showAddEmployee, setShowAddEmployee] = useState(false);

  // UPDATED: Current DateTime function
  const getCurrentDateTime = () => {
    return '2025-08-25 00:31:09';
  };

  // Calculate dynamic sales data from items
  const calculateDynamicSalesData = () => {
    const totalInventoryValue = items.reduce((sum, item) => sum + item.total, 0);
    const totalSalesCount = items.reduce((sum, item) => sum + item.salesCount, 0);
    const totalRevenue = items.reduce((sum, item) => sum + (item.price * item.salesCount), 0);
    
    // Generate last 7 days data
    const dailyData = [];
    for (let i = 6; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      const dateKey = date.toISOString().split('T')[0];
      const dayData = dailyActivities[dateKey] || { sales: 1500, orders: 45 };
      dailyData.push({
        date: dateKey,
        sales: dayData.sales,
        orders: dayData.orders
      });
    }

    // Sort items by sales count for top performers
    const sortedItems = [...items].sort((a, b) => b.salesCount - a.salesCount);
    const topItems = sortedItems.slice(0, 4).map(item => ({
      name: item.name,
      sales: Math.floor(item.price * item.salesCount),
      quantity: item.salesCount,
      trend: Math.random() * 20 - 5 // Random trend between -5 and +15
    }));

    return {
      daily: dailyData,
      monthly: {
        current: Math.floor(totalRevenue * 0.8),
        previous: Math.floor(totalRevenue * 0.7),
        target: Math.floor(totalRevenue)
      },
      topItems,
      seasonal: {
        spring: { item: 'Iced Coffee', sales: 12500 },
        summer: { item: 'Cold Brew', sales: 18900 },
        fall: { item: 'Pumpkin Latte', sales: 15600 },
        winter: { item: 'Hot Chocolate', sales: 11200 }
      },
      kpis: {
        totalRevenue: Math.floor(totalRevenue * 0.8),
        totalOrders: Math.floor(totalSalesCount * 0.3),
        avgOrderValue: totalRevenue > 0 ? (totalRevenue * 0.8) / (totalSalesCount * 0.3) : 0,
        customerSatisfaction: 94.2,
        profitMargin: 32.8
      }
    };
  };

  const calculateTotal = () => {
    return receiptItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  };

  const calculateTax = (subtotal) => {
    return subtotal * 0.08;
  };

  const generateReceiptNumber = () => {
    return `RCP-${Date.now()}`;
  };

  const handleAddItemToReceipt = (item, quantity = 1) => {
    if (item.quantity < quantity) {
      Alert.alert('Insufficient Stock', `Only ${item.quantity} units available for ${item.name}`);
      return;
    }

    const existingItem = receiptItems.find(ri => ri.id === item.id);
    if (existingItem) {
      const newQuantity = existingItem.quantity + quantity;
      if (newQuantity > item.quantity) {
        Alert.alert('Insufficient Stock', `Only ${item.quantity} units available for ${item.name}`);
        return;
      }
      setReceiptItems(receiptItems.map(ri => 
        ri.id === item.id 
          ? { ...ri, quantity: newQuantity }
          : ri
      ));
    } else {
      setReceiptItems([...receiptItems, { ...item, quantity }]);
    }
    setShowAddToReceipt(false);
    Alert.alert('Success', `${item.name} added to receipt!`);
  };

  const removeItemFromReceipt = (itemId) => {
    setReceiptItems(receiptItems.filter(item => item.id !== itemId));
  };

  const updateReceiptItemQuantity = (itemId, newQuantity) => {
    if (newQuantity <= 0) {
      removeItemFromReceipt(itemId);
      return;
    }

    const inventoryItem = items.find(item => item.id === itemId);
    if (inventoryItem && newQuantity > inventoryItem.quantity) {
      Alert.alert('Insufficient Stock', `Only ${inventoryItem.quantity} units available`);
      return;
    }

    setReceiptItems(receiptItems.map(item =>
      item.id === itemId ? { ...item, quantity: newQuantity } : item
    ));
  };

  const handleSubmitReceipt = () => {
    if (receiptItems.length === 0) {
      Alert.alert('Error', 'Please add items to the receipt');
      return;
    }

    for (const receiptItem of receiptItems) {
      const inventoryItem = items.find(item => item.id === receiptItem.id);
      if (!inventoryItem || inventoryItem.quantity < receiptItem.quantity) {
        Alert.alert('Insufficient Stock', `Not enough stock for ${receiptItem.name}`);
        return;
      }
    }

    const subtotal = calculateTotal();
    const tax = calculateTax(subtotal);
    const total = subtotal + tax;

    const receipt = {
      id: Date.now(),
      receiptNumber: generateReceiptNumber(),
      customerName: customerName || 'Walk-in Customer',
      items: [...receiptItems],
      subtotal,
      tax,
      total,
      dateTime: getCurrentDateTime(),
      status: 'completed'
    };

    // Update items inventory and sales count
    setItems(prevItems => 
      prevItems.map(item => {
        const soldItem = receiptItems.find(ri => ri.id === item.id);
        if (soldItem) {
          const newQuantity = item.quantity - soldItem.quantity;
          return {
            ...item,
            quantity: Math.max(0, newQuantity),
            total: item.price * Math.max(0, newQuantity),
            salesCount: item.salesCount + soldItem.quantity
          };
        }
        return item;
      })
    );

    setReceipts([receipt, ...receipts]);
    setCurrentReceipt(receipt);
    setShowReceiptPreview(true);
    setReceiptItems([]);
    setCustomerName('');

    Alert.alert('Success', 'Transaction completed successfully!');
  };

  // Filter items based on search
  const filteredItems = items.filter(item =>
    item.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Calendar helper functions
  const getDaysInMonth = (date) => {
    return new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
  };

  const getFirstDayOfMonth = (date) => {
    return new Date(date.getFullYear(), date.getMonth(), 1).getDay();
  };

  const formatDate = (year, month, day) => {
    return `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
  };

  const handleDayPress = (day) => {
    const dateKey = formatDate(currentCalendarDate.getFullYear(), currentCalendarDate.getMonth(), day);
    const dayData = dailyActivities[dateKey];
    
    if (dayData) {
      setSelectedDayData(dayData);
      setShowDayModal(true);
    }
  };

  const navigateCalendar = (direction) => {
    const newDate = new Date(currentCalendarDate);
    newDate.setMonth(newDate.getMonth() + direction);
    setCurrentCalendarDate(newDate);
  };

  // Keep all existing component definitions...
  const LoginScreen = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');

    const handleLogin = () => {
      if (email && password) {
        setUser({ email, name: 'WinKyaw' });
        setCurrentScreen('dashboard');
      } else {
        Alert.alert('Error', 'Please enter email and password');
      }
    };

    return (
      <SafeAreaView style={styles.container}>
        <StatusBar backgroundColor="#3B82F6" barStyle="light-content" />
        <View style={styles.loginContainer}>
          <View style={styles.loginCard}>
            <View style={styles.logoContainer}>
              <View style={styles.logo}>
                <Ionicons name="cube" size={32} color="white" />
              </View>
              <Text style={styles.title}>Point of Sale</Text>
              <Text style={styles.subtitle}>Welcome back! Please sign in.</Text>
            </View>
            
            <View style={styles.inputContainer}>
              <TextInput
                style={styles.input}
                placeholder="Email"
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
              />
              
              <TextInput
                style={styles.input}
                placeholder="Password"
                value={password}
                onChangeText={setPassword}
                secureTextEntry
              />
              
              <TouchableOpacity style={styles.primaryButton} onPress={handleLogin}>
                <Text style={styles.primaryButtonText}>Sign In</Text>
              </TouchableOpacity>
              
              <View style={styles.linkContainer}>
                <Text style={styles.linkText}>Don't have an account? </Text>
                <TouchableOpacity onPress={() => setCurrentScreen('signup')}>
                  <Text style={styles.link}>Sign Up</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </View>
      </SafeAreaView>
    );
  };

  const SignUpScreen = () => {
    const [formData, setFormData] = useState({
      name: '', email: '', password: '', confirmPassword: ''
    });

    const handleSignUp = () => {
      if (formData.email && formData.password && formData.password === formData.confirmPassword) {
        setUser({ email: formData.email, name: formData.name });
        setCurrentScreen('dashboard');
      } else {
        Alert.alert('Error', 'Please fill all fields and ensure passwords match');
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
              <TextInput
                style={styles.input}
                placeholder="Full Name"
                value={formData.name}
                onChangeText={(text) => setFormData({...formData, name: text})}
              />
              
              <TextInput
                style={styles.input}
                placeholder="Email"
                value={formData.email}
                onChangeText={(text) => setFormData({...formData, email: text})}
                keyboardType="email-address"
                autoCapitalize="none"
              />
              
              <TextInput
                style={styles.input}
                placeholder="Password"
                value={formData.password}
                onChangeText={(text) => setFormData({...formData, password: text})}
                secureTextEntry
              />
              
              <TextInput
                style={styles.input}
                placeholder="Confirm Password"
                value={formData.confirmPassword}
                onChangeText={(text) => setFormData({...formData, confirmPassword: text})}
                secureTextEntry
              />
              
              <TouchableOpacity style={[styles.primaryButton, { backgroundColor: '#10B981' }]} onPress={handleSignUp}>
                <Text style={styles.primaryButtonText}>Create Account</Text>
              </TouchableOpacity>
              
              <View style={styles.linkContainer}>
                <Text style={styles.linkText}>Already have an account? </Text>
                <TouchableOpacity onPress={() => setCurrentScreen('login')}>
                  <Text style={[styles.link, { color: '#10B981' }]}>Sign In</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </View>
      </SafeAreaView>
    );
  };

  // FIXED: Add Item Form with category support
  const AddItemForm = () => {
    const [newItem, setNewItem] = useState({
      name: '', price: '', quantity: '', category: 'Beverages', date: new Date().toISOString().split('T')[0]
    });
    const [showScanOption, setShowScanOption] = useState(false);

    const handleAddItem = () => {
      if (newItem.name && newItem.price && newItem.quantity) {
        const item = {
          id: Date.now(),
          name: newItem.name,
          price: parseFloat(newItem.price),
          quantity: parseInt(newItem.quantity),
          total: parseFloat(newItem.price) * parseInt(newItem.quantity),
          category: newItem.category,
          expanded: false,
          salesCount: 0
        };
        setItems([...items, item]);
        setShowAddForm(false);
        setNewItem({ name: '', price: '', quantity: '', category: 'Beverages', date: new Date().toISOString().split('T')[0] });
        Alert.alert('Success', `${item.name} has been added to inventory!`);
      } else {
        Alert.alert('Error', 'Please fill all required fields');
      }
    };

    const handleScanBarcode = () => {
      const mockBarcodeData = {
        name: 'Scanned Product',
        price: '12.99'
      };
      setNewItem({
        ...newItem,
        name: mockBarcodeData.name,
        price: mockBarcodeData.price
      });
      setShowScanOption(false);
    };

    return (
      <Modal visible={showAddForm} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <SafeAreaView style={styles.modalSafeArea}>
            <View style={styles.modalContainer}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Add New Item</Text>
                <TouchableOpacity onPress={() => setShowAddForm(false)}>
                  <Ionicons name="close" size={24} color="#666" />
                </TouchableOpacity>
              </View>
              
              <ScrollView style={styles.modalContent} showsVerticalScrollIndicator={false}>
                <TouchableOpacity 
                  style={styles.scanButton} 
                  onPress={() => setShowScanOption(!showScanOption)}
                >
                  <Ionicons name="camera" size={16} color="#3B82F6" />
                  <Text style={styles.scanButtonText}>Scan Barcode</Text>
                </TouchableOpacity>

                {showScanOption && (
                  <View style={styles.scanContainer}>
                    <View style={styles.scanContent}>
                      <Ionicons name="camera" size={48} color="#3B82F6" />
                      <Text style={styles.scanText}>Point camera at barcode to scan product</Text>
                      <TouchableOpacity style={styles.scanSimulateButton} onPress={handleScanBarcode}>
                        <Text style={styles.scanSimulateButtonText}>Simulate Scan</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                )}
                
                <TextInput
                  style={styles.input}
                  placeholder="Item Name"
                  value={newItem.name}
                  onChangeText={(text) => setNewItem({...newItem, name: text})}
                />
                
                <View style={styles.pickerContainer}>
                  <Text style={styles.pickerLabel}>Category:</Text>
                  <View style={styles.pickerRow}>
                    {['Beverages', 'Food', 'Bakery'].map((category) => (
                      <TouchableOpacity
                        key={category}
                        style={[styles.pickerOption, newItem.category === category && styles.pickerOptionSelected]}
                        onPress={() => setNewItem({...newItem, category})}
                      >
                        <Text style={[styles.pickerOptionText, newItem.category === category && styles.pickerOptionTextSelected]}>
                          {category}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>
                
                <TextInput
                  style={styles.input}
                  placeholder="Price"
                  value={newItem.price}
                  onChangeText={(text) => setNewItem({...newItem, price: text})}
                  keyboardType="numeric"
                />
                
                <TextInput
                  style={styles.input}
                  placeholder="Quantity"
                  value={newItem.quantity}
                  onChangeText={(text) => setNewItem({...newItem, quantity: text})}
                  keyboardType="numeric"
                />
                
                <View style={styles.modalButtons}>
                  <TouchableOpacity style={styles.cancelButton} onPress={() => setShowAddForm(false)}>
                    <Text style={styles.cancelButtonText}>Cancel</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.primaryButton} onPress={handleAddItem}>
                    <Text style={styles.primaryButtonText}>Add Item</Text>
                  </TouchableOpacity>
                </View>
              </ScrollView>
            </View>
          </SafeAreaView>
        </View>
      </Modal>
    );
  };

  // FIXED: Add Employee Form
  const AddEmployeeForm = () => {
    const [newEmployee, setNewEmployee] = useState({
      firstName: '', lastName: '', hourlyRate: '', phone: '', title: '', bonus: '', startDate: new Date().toISOString().split('T')[0]
    });

    const handleAddEmployee = () => {
      if (newEmployee.firstName && newEmployee.lastName && newEmployee.hourlyRate && newEmployee.phone) {
        const employee = {
          id: Date.now(),
          firstName: newEmployee.firstName,
          lastName: newEmployee.lastName,
          checkInTime: 'Not checked in',
          hourlyRate: parseFloat(newEmployee.hourlyRate),
          phone: newEmployee.phone,
          totalCompensation: parseFloat(newEmployee.hourlyRate) * 2080, // 40 hours * 52 weeks
          startDate: newEmployee.startDate,
          status: 'Active',
          title: newEmployee.title || 'Staff',
          bonus: parseFloat(newEmployee.bonus) || 0,
          expanded: false
        };
        setEmployees([...employees, employee]);
        setShowAddEmployee(false);
        setNewEmployee({ firstName: '', lastName: '', hourlyRate: '', phone: '', title: '', bonus: '', startDate: new Date().toISOString().split('T')[0] });
        Alert.alert('Success', `${employee.firstName} ${employee.lastName} has been added to the team!`);
      } else {
        Alert.alert('Error', 'Please fill all required fields (First Name, Last Name, Hourly Rate, Phone)');
      }
    };

    return (
      <Modal visible={showAddEmployee} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <SafeAreaView style={styles.modalSafeArea}>
            <View style={styles.modalContainer}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Add New Employee</Text>
                <TouchableOpacity onPress={() => setShowAddEmployee(false)}>
                  <Ionicons name="close" size={24} color="#666" />
                </TouchableOpacity>
              </View>
              
              <ScrollView style={styles.modalContent} showsVerticalScrollIndicator={false}>
                <View style={styles.modalRow}>
                  <TextInput
                    style={[styles.input, { flex: 1, marginRight: 8 }]}
                    placeholder="First Name *"
                    value={newEmployee.firstName}
                    onChangeText={(text) => setNewEmployee({...newEmployee, firstName: text})}
                  />
                  <TextInput
                    style={[styles.input, { flex: 1, marginLeft: 8 }]}
                    placeholder="Last Name *"
                    value={newEmployee.lastName}
                    onChangeText={(text) => setNewEmployee({...newEmployee, lastName: text})}
                  />
                </View>
                
                <TextInput
                  style={styles.input}
                  placeholder="Job Title (Optional)"
                  value={newEmployee.title}
                  onChangeText={(text) => setNewEmployee({...newEmployee, title: text})}
                />
                
                <TextInput
                  style={styles.input}
                  placeholder="Hourly Rate ($) *"
                  value={newEmployee.hourlyRate}
                  onChangeText={(text) => setNewEmployee({...newEmployee, hourlyRate: text})}
                  keyboardType="numeric"
                />
                
                <TextInput
                  style={styles.input}
                  placeholder="Annual Bonus ($) (Optional)"
                  value={newEmployee.bonus}
                  onChangeText={(text) => setNewEmployee({...newEmployee, bonus: text})}
                  keyboardType="numeric"
                />
                
                <TextInput
                  style={styles.input}
                  placeholder="Phone Number *"
                  value={newEmployee.phone}
                  onChangeText={(text) => setNewEmployee({...newEmployee, phone: text})}
                  keyboardType="phone-pad"
                />
                
                <View style={styles.modalButtons}>
                  <TouchableOpacity style={styles.cancelButton} onPress={() => setShowAddEmployee(false)}>
                    <Text style={styles.cancelButtonText}>Cancel</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={[styles.primaryButton, { backgroundColor: '#8B5CF6' }]} onPress={handleAddEmployee}>
                    <Text style={styles.primaryButtonText}>Add Employee</Text>
                  </TouchableOpacity>
                </View>
              </ScrollView>
            </View>
          </SafeAreaView>
        </View>
      </Modal>
    );
  };

  // FIXED: Add Reminder Form
  const AddReminderForm = () => {
    const [newReminder, setNewReminder] = useState({
      title: '', date: selectedDate, type: 'order', time: '', description: ''
    });

    const handleAddReminder = () => {
      if (newReminder.title && newReminder.date && newReminder.time) {
        const reminder = {
          id: Date.now(),
          ...newReminder
        };
        setReminders([...reminders, reminder]);
        setShowAddReminder(false);
        setNewReminder({ title: '', date: selectedDate, type: 'order', time: '', description: '' });
        Alert.alert('Success', `Reminder "${reminder.title}" has been created!`);
      } else {
        Alert.alert('Error', 'Please fill all required fields (Title, Date, Time)');
      }
    };

    return (
      <Modal visible={showAddReminder} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <SafeAreaView style={styles.modalSafeArea}>
            <View style={styles.modalContainer}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Add Reminder</Text>
                <TouchableOpacity onPress={() => setShowAddReminder(false)}>
                  <Ionicons name="close" size={24} color="#666" />
                </TouchableOpacity>
              </View>
              
              <ScrollView style={styles.modalContent} showsVerticalScrollIndicator={false}>
                <TextInput
                  style={styles.input}
                  placeholder="Reminder Title *"
                  value={newReminder.title}
                  onChangeText={(text) => setNewReminder({...newReminder, title: text})}
                />
                
                <View style={styles.pickerContainer}>
                  <Text style={styles.pickerLabel}>Type:</Text>
                  <View style={styles.pickerRow}>
                    {['order', 'meeting', 'maintenance'].map((type) => (
                      <TouchableOpacity
                        key={type}
                        style={[styles.pickerOption, newReminder.type === type && styles.pickerOptionSelected]}
                        onPress={() => setNewReminder({...newReminder, type})}
                      >
                        <Text style={[styles.pickerOptionText, newReminder.type === type && styles.pickerOptionTextSelected]}>
                          {type.charAt(0).toUpperCase() + type.slice(1)}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>
                
                <TextInput
                  style={styles.input}
                  placeholder="Date (YYYY-MM-DD) *"
                  value={newReminder.date}
                  onChangeText={(text) => setNewReminder({...newReminder, date: text})}
                />
                
                <TextInput
                  style={styles.input}
                  placeholder="Time (e.g., 2:00 PM) *"
                  value={newReminder.time}
                  onChangeText={(text) => setNewReminder({...newReminder, time: text})}
                />
                
                <TextInput
                  style={[styles.input, styles.textArea]}
                  placeholder="Description (optional)"
                  value={newReminder.description}
                  onChangeText={(text) => setNewReminder({...newReminder, description: text})}
                  multiline
                  numberOfLines={3}
                />
                
                <View style={styles.modalButtons}>
                  <TouchableOpacity style={styles.cancelButton} onPress={() => setShowAddReminder(false)}>
                    <Text style={styles.cancelButtonText}>Cancel</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={[styles.primaryButton, { backgroundColor: '#F59E0B' }]} onPress={handleAddReminder}>
                    <Text style={styles.primaryButtonText}>Add Reminder</Text>
                  </TouchableOpacity>
                </View>
              </ScrollView>
            </View>
          </SafeAreaView>
        </View>
      </Modal>
    );
  };

  // FIXED: Add Item to Receipt Modal
  const AddItemToReceiptModal = () => {
    return (
      <Modal visible={showAddToReceipt} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <SafeAreaView style={styles.modalSafeArea}>
            <View style={styles.addItemModalContainer}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Add Items to Receipt</Text>
                <TouchableOpacity onPress={() => setShowAddToReceipt(false)}>
                  <Ionicons name="close" size={24} color="#666" />
                </TouchableOpacity>
              </View>
              
              <ScrollView style={styles.modalContent} showsVerticalScrollIndicator={false}>
                <Text style={styles.modalSubtitle}>Available Items</Text>
                {items.filter(item => item.quantity > 0).length === 0 ? (
                  <View style={styles.noItemsContainer}>
                    <Ionicons name="cube-outline" size={48} color="#D1D5DB" />
                    <Text style={styles.noItemsText}>No items available in inventory</Text>
                    <Text style={styles.noItemsSubtext}>Add some items to your inventory first</Text>
                  </View>
                ) : (
                  items.filter(item => item.quantity > 0).map((item) => {
                    const inReceiptQuantity = receiptItems.find(ri => ri.id === item.id)?.quantity || 0;
                    const availableQuantity = item.quantity - inReceiptQuantity;
                    
                    return (
                      <View key={item.id} style={styles.addItemRow}>
                        <View style={styles.addItemInfo}>
                          <Text style={styles.addItemName}>{item.name}</Text>
                          <Text style={styles.addItemDetails}>
                            ${item.price.toFixed(2)} • {availableQuantity} available
                            {inReceiptQuantity > 0 && (
                              <Text style={styles.inReceiptText}> • {inReceiptQuantity} in receipt</Text>
                            )}
                          </Text>
                        </View>
                        
                        {availableQuantity > 0 ? (
                          <TouchableOpacity 
                            style={styles.addItemButton}
                            onPress={() => handleAddItemToReceipt(item, 1)}
                          >
                            <Ionicons name="add" size={20} color="white" />
                          </TouchableOpacity>
                        ) : (
                          <View style={styles.outOfStockButton}>
                            <Text style={styles.outOfStockText}>Out of Stock</Text>
                          </View>
                        )}
                      </View>
                    );
                  })
                )}
              </ScrollView>
            </View>
          </SafeAreaView>
        </View>
      </Modal>
    );
  };

  // Calendar Component
  const CalendarView = () => {
    const year = currentCalendarDate.getFullYear();
    const month = currentCalendarDate.getMonth();
    const daysInMonth = getDaysInMonth(currentCalendarDate);
    const firstDayOfMonth = getFirstDayOfMonth(currentCalendarDate);
    
    const monthNames = [
      'January', 'February', 'March', 'April', 'May', 'June',
      'July', 'August', 'September', 'October', 'November', 'December'
    ];
    
    const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    
    const days = [];
    
    // Add empty cells for days before the first day of the month
    for (let i = 0; i < firstDayOfMonth; i++) {
      days.push(null);
    }
    
    // Add all days of the month
    for (let day = 1; day <= daysInMonth; day++) {
      days.push(day);
    }
    
    const today = new Date();
    const isCurrentMonth = today.getFullYear() === year && today.getMonth() === month;
    const todayDate = today.getDate();

    return (
      <View style={styles.calendarView}>
        {/* Calendar Header */}
        <View style={styles.calendarHeader}>
          <TouchableOpacity onPress={() => navigateCalendar(-1)}>
            <Ionicons name="chevron-back" size={24} color="#F59E0B" />
          </TouchableOpacity>
          
          <Text style={styles.calendarMonthYear}>
            {monthNames[month]} {year}
          </Text>
          
          <TouchableOpacity onPress={() => navigateCalendar(1)}>
            <Ionicons name="chevron-forward" size={24} color="#F59E0B" />
          </TouchableOpacity>
        </View>

        {/* Day Names */}
        <View style={styles.calendarDayNames}>
          {dayNames.map(day => (
            <Text key={day} style={styles.calendarDayName}>{day}</Text>
          ))}
        </View>

        {/* Calendar Grid */}
        <View style={styles.calendarGrid}>
          {days.map((day, index) => {
            if (day === null) {
              return <View key={`empty-${index}`} style={styles.calendarEmptyDay} />;
            }

            const dateKey = formatDate(year, month, day);
            const hasData = dailyActivities[dateKey] !== undefined;
            const isToday = isCurrentMonth && day === todayDate;
            const isPastDate = new Date(dateKey) < today;

            return (
              <TouchableOpacity
                key={day}
                style={[
                  styles.calendarDay,
                  hasData && styles.calendarDayWithData,
                  isToday && styles.calendarToday
                ]}
                onPress={() => handleDayPress(day)}
                disabled={!hasData}
              >
                <Text style={[
                  styles.calendarDayText,
                  hasData && styles.calendarDayTextWithData,
                  isToday && styles.calendarTodayText,
                  !isPastDate && !isToday && styles.calendarFutureText
                ]}>
                  {day}
                </Text>
                {hasData && <View style={styles.calendarDayIndicator} />}
              </TouchableOpacity>
            );
          })}
        </View>
      </View>
    );
  };

  // Day Details Modal
  const DayDetailsModal = () => {
    if (!selectedDayData) return null;

    const date = new Date(selectedDayData.date);
    const formattedDate = date.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });

    return (
      <Modal visible={showDayModal} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <SafeAreaView style={styles.modalSafeArea}>
            <View style={styles.dayModalContainer}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>{formattedDate}</Text>
                <TouchableOpacity onPress={() => setShowDayModal(false)}>
                  <Ionicons name="close" size={24} color="#666" />
                </TouchableOpacity>
              </View>
              
              <ScrollView style={styles.modalContent} showsVerticalScrollIndicator={false}>
                {/* Sales Summary */}
                <View style={styles.daySummaryCard}>
                  <Text style={styles.daySummaryTitle}>📊 Daily Summary</Text>
                  <View style={styles.daySummaryGrid}>
                    <View style={styles.daySummaryItem}>
                      <Text style={styles.daySummaryLabel}>Sales</Text>
                      <Text style={styles.daySummaryValue}>${selectedDayData.sales}</Text>
                    </View>
                    <View style={styles.daySummaryItem}>
                      <Text style={styles.daySummaryLabel}>Orders</Text>
                      <Text style={styles.daySummaryValue}>{selectedDayData.orders}</Text>
                    </View>
                    <View style={styles.daySummaryItem}>
                      <Text style={styles.daySummaryLabel}>Customers</Text>
                      <Text style={styles.daySummaryValue}>{selectedDayData.customers}</Text>
                    </View>
                    <View style={styles.daySummaryItem}>
                      <Text style={styles.daySummaryLabel}>Avg Order</Text>
                      <Text style={styles.daySummaryValue}>
                        ${(selectedDayData.sales / selectedDayData.orders).toFixed(0)}
                      </Text>
                    </View>
                  </View>
                </View>

                {/* Top Items */}
                <View style={styles.dayTopItemsCard}>
                  <Text style={styles.dayTopItemsTitle}>🏆 Top Items</Text>
                  {selectedDayData.topItems.map((item, index) => (
                    <View key={index} style={styles.dayTopItem}>
                      <View style={styles.dayTopItemLeft}>
                        <Text style={styles.dayTopItemRank}>#{index + 1}</Text>
                        <Text style={styles.dayTopItemName}>{item.name}</Text>
                      </View>
                      <View style={styles.dayTopItemRight}>
                        <Text style={styles.dayTopItemSales}>${item.sales}</Text>
                        <Text style={styles.dayTopItemQuantity}>{item.quantity} sold</Text>
                      </View>
                    </View>
                  ))}
                </View>

                {/* Activities */}
                <View style={styles.dayActivitiesCard}>
                  <Text style={styles.dayActivitiesTitle}>📝 Daily Activities</Text>
                  {selectedDayData.activities.map((activity, index) => (
                    <View key={index} style={styles.dayActivity}>
                      <View style={styles.dayActivityLeft}>
                        <Ionicons name={activity.icon} size={20} color="#F59E0B" />
                        <View style={styles.dayActivityInfo}>
                          <Text style={styles.dayActivityTime}>{activity.time}</Text>
                          <Text style={styles.dayActivityDescription}>{activity.description}</Text>
                        </View>
                      </View>
                    </View>
                  ))}
                </View>
              </ScrollView>
            </View>
          </SafeAreaView>
        </View>
      </Modal>
    );
  };

  // Filter Modal
  const FilterModal = ({ visible, onClose, selectedCategory, onSelectCategory }) => {
    const [customCategory, setCustomCategory] = useState('');
    const categories = ['All', ...new Set(items.map(item => item.category))];
    
    const handleCustomCategoryAdd = () => {
      if (customCategory.trim()) {
        onSelectCategory(customCategory.trim());
        setCustomCategory('');
        onClose();
      }
    };

    return (
      <Modal visible={visible} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <SafeAreaView style={styles.modalSafeArea}>
            <View style={styles.filterModalContainer}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Filter by Category</Text>
                <TouchableOpacity onPress={onClose}>
                  <Ionicons name="close" size={24} color="#666" />
                </TouchableOpacity>
              </View>
              
              <ScrollView style={styles.modalContent} showsVerticalScrollIndicator={false}>
                <Text style={styles.modalSubtitle}>Select Category</Text>
                
                <View style={styles.categoryList}>
                  {categories.map((category) => (
                    <TouchableOpacity
                      key={category}
                      style={[
                        styles.categoryOption,
                        selectedCategory === category && styles.categoryOptionSelected
                      ]}
                      onPress={() => {
                        onSelectCategory(category);
                        onClose();
                      }}
                    >
                      <Text style={[
                        styles.categoryOptionText,
                        selectedCategory === category && styles.categoryOptionTextSelected
                      ]}>
                        {category}
                      </Text>
                      {selectedCategory === category && (
                        <Ionicons name="checkmark" size={20} color="#10B981" />
                      )}
                    </TouchableOpacity>
                  ))}
                </View>

                <View style={styles.customCategorySection}>
                  <Text style={styles.customCategoryLabel}>Or create new category:</Text>
                  <View style={styles.customCategoryInput}>
                    <TextInput
                      style={styles.customCategoryTextInput}
                      placeholder="Enter new category name"
                      value={customCategory}
                      onChangeText={setCustomCategory}
                    />
                    <TouchableOpacity 
                      style={[
                        styles.customCategoryButton,
                        !customCategory.trim() && styles.customCategoryButtonDisabled
                      ]}
                      onPress={handleCustomCategoryAdd}
                      disabled={!customCategory.trim()}
                    >
                      <Text style={[
                        styles.customCategoryButtonText,
                        !customCategory.trim() && styles.customCategoryButtonTextDisabled
                      ]}>
                        Add
                      </Text>
                    </TouchableOpacity>
                  </View>
                </View>
              </ScrollView>
            </View>
          </SafeAreaView>
        </View>
      </Modal>
    );
  };

  // Sort Modal
  const SortModal = ({ visible, onClose, sortBy, sortOrder, onSelectSort }) => {
    const sortOptions = [
      { key: 'name', label: 'Name', icon: 'text-outline' },
      { key: 'price', label: 'Price', icon: 'pricetag-outline' },
      { key: 'quantity', label: 'Stock', icon: 'cube-outline' },
      { key: 'total', label: 'Value', icon: 'cash-outline' }
    ];

    const handleSortSelect = (key) => {
      onSelectSort(key);
      onClose();
    };

    return (
      <Modal visible={visible} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <SafeAreaView style={styles.modalSafeArea}>
            <View style={styles.filterModalContainer}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Sort Items</Text>
                <TouchableOpacity onPress={onClose}>
                  <Ionicons name="close" size={24} color="#666" />
                </TouchableOpacity>
              </View>
              
              <ScrollView style={styles.modalContent} showsVerticalScrollIndicator={false}>
                <Text style={styles.modalSubtitle}>Sort by</Text>
                
                <View style={styles.categoryList}>
                  {sortOptions.map((option) => (
                    <TouchableOpacity
                      key={option.key}
                      style={[
                        styles.categoryOption,
                        sortBy === option.key && styles.categoryOptionSelected
                      ]}
                      onPress={() => handleSortSelect(option.key)}
                    >
                      <View style={styles.sortOptionLeft}>
                        <Ionicons 
                          name={option.icon} 
                          size={20} 
                          color={sortBy === option.key ? '#10B981' : '#6B7280'} 
                        />
                        <Text style={[
                          styles.categoryOptionText,
                          { marginLeft: 12 },
                          sortBy === option.key && styles.categoryOptionTextSelected
                        ]}>
                          {option.label}
                        </Text>
                      </View>
                      <View style={styles.sortOptionRight}>
                        {sortBy === option.key && (
                          <View style={styles.sortOrderIndicator}>
                            <Ionicons 
                              name={sortOrder === 'asc' ? 'chevron-up' : 'chevron-down'} 
                              size={16} 
                              color="#10B981" 
                            />
                            <Text style={styles.sortOrderText}>
                              {sortOrder === 'asc' ? 'A-Z' : 'Z-A'}
                            </Text>
                          </View>
                        )}
                        {sortBy === option.key && (
                          <Ionicons name="checkmark" size={20} color="#10B981" />
                        )}
                      </View>
                    </TouchableOpacity>
                  ))}
                </View>
              </ScrollView>
            </View>
          </SafeAreaView>
        </View>
      </Modal>
    );
  };

  // Dashboard Screen with dynamic data
  const DashboardScreen = () => {
    const salesData = calculateDynamicSalesData();

    const getCurrentSeason = () => {
      const month = new Date().getMonth();
      if (month >= 2 && month <= 4) return 'spring';
      if (month >= 5 && month <= 7) return 'summer';
      if (month >= 8 && month <= 10) return 'fall';
      return 'winter';
    };

    const getRevenueGrowth = () => {
      const growth = ((salesData.monthly.current - salesData.monthly.previous) / salesData.monthly.previous) * 100;
      return growth.toFixed(1);
    };

    const getTargetProgress = () => {
      return ((salesData.monthly.current / salesData.monthly.target) * 100).toFixed(1);
    };

    const bestItem = salesData.topItems[0];
    const worstItem = salesData.topItems[salesData.topItems.length - 1];
    const currentSeason = getCurrentSeason();
    const seasonalBestSeller = salesData.seasonal[currentSeason];

    return (
      <SafeAreaView style={styles.container}>
        <StatusBar backgroundColor="#3B82F6" barStyle="light-content" />
        <ScrollView style={styles.dashboardContainer} showsVerticalScrollIndicator={false}>
          <View style={styles.dashboardHeader}>
            <Text style={styles.dashboardTitle}>Sales Dashboard</Text>
            <Text style={styles.dashboardSubtitle}>Live Data from Inventory</Text>
          </View>

          <View style={styles.kpiContainer}>
            <View style={styles.kpiRow}>
              <View style={styles.kpiCard}>
                <Text style={styles.kpiLabel}>Monthly Revenue</Text>
                <Text style={styles.kpiValue}>${salesData.kpis.totalRevenue.toLocaleString()}</Text>
                <Text style={[styles.kpiTrend, { color: getRevenueGrowth() >= 0 ? '#10B981' : '#EF4444' }]}>
                  {getRevenueGrowth() >= 0 ? '↗' : '↘'} {Math.abs(getRevenueGrowth())}%
                </Text>
              </View>
              
              <View style={styles.kpiCard}>
                <Text style={styles.kpiLabel}>Total Orders</Text>
                <Text style={[styles.kpiValue, { color: '#3B82F6' }]}>{salesData.kpis.totalOrders}</Text>
                <View style={styles.progressBar}>
                  <View style={[styles.progressFill, { width: `${Math.min(getTargetProgress(), 100)}%` }]} />
                </View>
              </View>
            </View>

            <View style={styles.kpiRowSmall}>
              <View style={styles.kpiCardSmall}>
                <Text style={styles.kpiLabelSmall}>Avg Order</Text>
                <Text style={[styles.kpiValueSmall, { color: '#8B5CF6' }]}>
                  ${salesData.kpis.avgOrderValue.toFixed(0)}
                </Text>
              </View>
              
              <View style={styles.kpiCardSmall}>
                <Text style={styles.kpiLabelSmall}>Active Items</Text>
                <Text style={[styles.kpiValueSmall, { color: '#10B981' }]}>
                  {items.filter(item => item.quantity > 0).length}
                </Text>
              </View>
              
              <View style={styles.kpiCardSmall}>
                <Text style={styles.kpiLabelSmall}>Low Stock</Text>
                <Text style={[styles.kpiValueSmall, { color: '#F59E0B' }]}>
                  {items.filter(item => item.quantity <= 10 && item.quantity > 0).length}
                </Text>
              </View>
            </View>

            <View style={styles.chartCard}>
              <Text style={styles.chartTitle}>7-Day Sales Performance</Text>
              {salesData.daily.map((day, index) => {
                const maxSales = Math.max(...salesData.daily.map(d => d.sales));
                const percentage = (day.sales / maxSales) * 100;
                return (
                  <View key={day.date} style={styles.chartRow}>
                    <Text style={styles.chartLabel}>
                      {new Date(day.date).toLocaleDateString('en-US', { weekday: 'short' })}
                    </Text>
                    <View style={styles.chartBarContainer}>
                      <View style={[styles.chartBar, { width: `${percentage}%` }]} />
                    </View>
                    <Text style={styles.chartValue}>${day.sales}</Text>
                  </View>
                );
              })}
            </View>

            <View style={styles.performanceCard}>
              <Text style={styles.performanceTitle}>📈 Best Performer This Month</Text>
              <View style={styles.performanceRow}>
                <View>
                  <Text style={[styles.performanceName, { color: '#10B981' }]}>{bestItem.name}</Text>
                  <Text style={styles.performanceUnits}>{bestItem.quantity} units sold</Text>
                </View>
                <View style={styles.performanceRight}>
                  <Text style={styles.performanceValue}>${bestItem.sales.toLocaleString()}</Text>
                  <Text style={styles.performanceTrend}>
                    {bestItem.trend >= 0 ? '↗' : '↘'} {Math.abs(bestItem.trend.toFixed(1))}%
                  </Text>
                </View>
              </View>
              <View style={styles.performanceProgress}>
                <View style={styles.performanceProgressLabel}>
                  <Text style={styles.performanceProgressText}>Performance</Text>
                  <Text style={styles.performanceProgressText}>Excellent</Text>
                </View>
                <View style={styles.performanceProgressBar}>
                  <View style={[styles.performanceProgressFill, { width: '92%', backgroundColor: '#10B981' }]} />
                </View>
              </View>
            </View>

            <View style={styles.performanceCard}>
              <Text style={styles.performanceTitle}>📉 Needs Attention</Text>
              <View style={styles.performanceRow}>
                <View>
                  <Text style={[styles.performanceName, { color: '#F59E0B' }]}>{worstItem.name}</Text>
                  <Text style={styles.performanceUnits}>{worstItem.quantity} units sold</Text>
                </View>
                <View style={styles.performanceRight}>
                  <Text style={styles.performanceValue}>${worstItem.sales.toLocaleString()}</Text>
                  <Text style={[styles.performanceTrend, { color: '#EF4444' }]}>
                    ↘ {Math.abs(worstItem.trend.toFixed(1))}%
                  </Text>
                </View>
              </View>
              <View style={styles.performanceProgress}>
                <View style={styles.performanceProgressLabel}>
                  <Text style={styles.performanceProgressText}>Performance</Text>
                  <Text style={styles.performanceProgressText}>Below Average</Text>
                </View>
                                <View style={styles.performanceProgressBar}>
                  <View style={[styles.performanceProgressFill, { width: '33%', backgroundColor: '#F59E0B' }]} />
                </View>
              </View>
            </View>

            <View style={styles.topItemsCard}>
              <Text style={styles.topItemsTitle}>🏆 Live Inventory Performance</Text>
              {salesData.topItems.map((item, index) => (
                <View key={item.name} style={styles.topItemRow}>
                  <View style={styles.topItemLeft}>
                    <Text style={styles.topItemRank}>#{index + 1}</Text>
                    <View>
                      <Text style={styles.topItemName}>{item.name}</Text>
                      <Text style={styles.topItemUnits}>{item.quantity} units sold</Text>
                    </View>
                  </View>
                  <View style={styles.topItemRight}>
                    <Text style={styles.topItemValue}>${item.sales.toLocaleString()}</Text>
                    <Text style={[styles.topItemTrend, { color: item.trend >= 0 ? '#10B981' : '#EF4444' }]}>
                      {item.trend >= 0 ? '↗' : '↘'} {Math.abs(item.trend.toFixed(1))}%
                    </Text>
                  </View>
                </View>
              ))}
              <View style={styles.liveDataIndicator}>
                <Ionicons name="sync" size={12} color="#10B981" />
                <Text style={styles.liveDataText}>Data synced with inventory</Text>
              </View>
            </View>
          </View>
        </ScrollView>
        
        <BottomNavigation currentScreen={currentScreen} onScreenChange={setCurrentScreen} />
      </SafeAreaView>
    );
  };

  // Items Screen with sales count display
  const ItemsScreen = () => {
    const [searchItems, setSearchItems] = useState('');
    const [selectedCategory, setSelectedCategory] = useState('All');
    const [sortBy, setSortBy] = useState('name');
    const [sortOrder, setSortOrder] = useState('asc');
    const [showFilterModal, setShowFilterModal] = useState(false);
    const [showSortModal, setShowSortModal] = useState(false);

    const toggleItemExpansion = (id) => {
      setItems(items.map(item => 
        item.id === id ? { ...item, expanded: !item.expanded } : item
      ));
    };

    const categories = ['All', ...new Set(items.map(item => item.category))];

    const getFilteredAndSortedItems = () => {
      let filtered = items.filter(item =>
        item.name.toLowerCase().includes(searchItems.toLowerCase())
      );

      if (selectedCategory !== 'All') {
        filtered = filtered.filter(item => item.category === selectedCategory);
      }

      filtered.sort((a, b) => {
        let aValue, bValue;
        
        switch (sortBy) {
          case 'name':
            aValue = a.name.toLowerCase();
            bValue = b.name.toLowerCase();
            break;
          case 'price':
            aValue = a.price;
            bValue = b.price;
            break;
          case 'quantity':
            aValue = a.quantity;
            bValue = b.quantity;
            break;
          case 'total':
            aValue = a.total;
            bValue = b.total;
            break;
          case 'salesCount':
            aValue = a.salesCount || 0;
            bValue = b.salesCount || 0;
            break;
          default:
            aValue = a.name.toLowerCase();
            bValue = b.name.toLowerCase();
        }

        if (aValue < bValue) return sortOrder === 'asc' ? -1 : 1;
        if (aValue > bValue) return sortOrder === 'asc' ? 1 : -1;
        return 0;
      });

      return filtered;
    };

    const filteredItems = getFilteredAndSortedItems();

    const handleSortPress = (newSortBy) => {
      if (sortBy === newSortBy) {
        setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
      } else {
        setSortBy(newSortBy);
        setSortOrder('asc');
      }
    };

    const getSortLabel = () => {
      const labels = { name: 'Name', price: 'Price', quantity: 'Stock', total: 'Value', salesCount: 'Sales' };
      return labels[sortBy] || 'Name';
    };

    return (
      <SafeAreaView style={styles.container}>
        <StatusBar backgroundColor="#10B981" barStyle="light-content" />
        <View style={styles.itemsHeader}>
          <View style={styles.itemsHeaderTop}>
            <Text style={styles.itemsTitle}>Inventory Management</Text>
            <TouchableOpacity style={styles.addItemButton} onPress={() => setShowAddForm(true)}>
              <Text style={styles.addItemButtonText}>Add Item</Text>
            </TouchableOpacity>
          </View>
          
          <View style={styles.searchContainer}>
            <Ionicons name="search" size={20} color="#666" style={styles.searchIcon} />
            <TextInput
              style={styles.searchInput}
              placeholder="Search inventory..."
              value={searchItems}
              onChangeText={setSearchItems}
              returnKeyType="search"
              blurOnSubmit={false}
              autoCorrect={false}
              autoCapitalize="none"
            />
          </View>
        </View>

        <View style={styles.filterSortContainer}>
          <View style={styles.filterSortRow}>
            <TouchableOpacity
              style={[
                styles.dynamicFilterButton,
                selectedCategory !== 'All' && styles.dynamicFilterButtonActive
              ]}
              onPress={() => setShowFilterModal(true)}
            >
              <Ionicons 
                name="funnel-outline" 
                size={16} 
                color={selectedCategory !== 'All' ? '#10B981' : '#6B7280'} 
              />
              <Text style={[
                styles.dynamicFilterButtonText,
                selectedCategory !== 'All' && styles.dynamicFilterButtonTextActive
              ]}>
                {selectedCategory === 'All' ? 'Filter' : selectedCategory}
              </Text>
              {selectedCategory !== 'All' && (
                <TouchableOpacity
                  style={styles.clearFilterButton}
                  onPress={() => setSelectedCategory('All')}
                >
                  <Ionicons name="close-circle" size={16} color="#10B981" />
                </TouchableOpacity>
              )}
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.dynamicSortButton}
              onPress={() => setShowSortModal(true)}
            >
              <Ionicons name="swap-vertical-outline" size={16} color="#6B7280" />
              <Text style={styles.dynamicSortButtonText}>
                {getSortLabel()}
              </Text>
              <Ionicons 
                name={sortOrder === 'asc' ? 'chevron-up' : 'chevron-down'} 
                size={14} 
                color="#6B7280" 
              />
            </TouchableOpacity>
          </View>
        </View>

        <ScrollView style={styles.itemsList} showsVerticalScrollIndicator={false}>
          <View style={styles.itemsCard}>
            {filteredItems.length === 0 ? (
              <View style={styles.noItemsContainer}>
                <Ionicons name="cube-outline" size={48} color="#D1D5DB" />
                <Text style={styles.noItemsText}>No items found</Text>
                <Text style={styles.noItemsSubtext}>
                  {searchItems || selectedCategory !== 'All' ? 'Try adjusting your search or filters' : 'Add some items to get started'}
                </Text>
              </View>
            ) : (
              filteredItems.map((item, index) => (
                <View key={item.id}>
                  {index > 0 && <View style={styles.itemSeparator} />}
                  <TouchableOpacity
                    style={styles.itemRow}
                    onPress={() => toggleItemExpansion(item.id)}
                  >
                    <View style={styles.itemInfo}>
                      <View style={styles.itemNameRow}>
                        <Text style={styles.itemName}>{item.name}</Text>
                        <View style={styles.categoryBadge}>
                          <Text style={styles.categoryBadgeText}>{item.category}</Text>
                        </View>
                      </View>
                    </View>
                    <View style={styles.itemStats}>
                      <Text style={styles.itemStat}>${item.price.toFixed(2)}</Text>
                      <Text style={styles.itemStat}>Qty: {item.quantity}</Text>
                      <Text style={[styles.itemStat, { color: '#3B82F6', fontWeight: '600' }]}>
                        Sold: {item.salesCount || 0}
                      </Text>
                      <Text style={[styles.itemStat, { color: '#10B981', fontWeight: '600' }]}>
                        ${item.total.toFixed(2)}
                      </Text>
                    </View>
                  </TouchableOpacity>
                  
                  {item.expanded && (
                    <View style={styles.itemExpanded}>
                      <View style={styles.itemExpandedGrid}>
                        <View style={styles.itemExpandedItem}>
                          <Text style={styles.itemExpandedLabel}>Category:</Text>
                          <Text style={styles.itemExpandedValue}>{item.category}</Text>
                        </View>
                        <View style={styles.itemExpandedItem}>
                          <Text style={styles.itemExpandedLabel}>Unit Price:</Text>
                          <Text style={styles.itemExpandedValue}>${item.price.toFixed(2)}</Text>
                        </View>
                        <View style={styles.itemExpandedItem}>
                          <Text style={styles.itemExpandedLabel}>Stock:</Text>
                          <Text style={styles.itemExpandedValue}>{item.quantity} units</Text>
                        </View>
                        <View style={styles.itemExpandedItem}>
                          <Text style={styles.itemExpandedLabel}>Total Value:</Text>
                          <Text style={[styles.itemExpandedValue, { color: '#10B981' }]}>${item.total.toFixed(2)}</Text>
                        </View>
                        <View style={styles.itemExpandedItem}>
                          <Text style={styles.itemExpandedLabel}>Total Sales:</Text>
                          <Text style={[styles.itemExpandedValue, { color: '#3B82F6' }]}>
                            {item.salesCount || 0} units sold
                          </Text>
                        </View>
                        <View style={styles.itemExpandedItem}>
                          <Text style={styles.itemExpandedLabel}>Status:</Text>
                          <Text style={[styles.itemExpandedValue, { color: item.quantity > 10 ? '#10B981' : '#F59E0B' }]}>
                            {item.quantity > 10 ? 'In Stock' : 'Low Stock'}
                          </Text>
                        </View>
                      </View>
                    </View>
                  )}
                </View>
              ))
            )}
          </View>
        </ScrollView>

        <FilterModal
          visible={showFilterModal}
          onClose={() => setShowFilterModal(false)}
          selectedCategory={selectedCategory}
          onSelectCategory={setSelectedCategory}
        />

        <SortModal
          visible={showSortModal}
          onClose={() => setShowSortModal(false)}
          sortBy={sortBy}
          sortOrder={sortOrder}
          onSelectSort={handleSortPress}
        />

        <BottomNavigation currentScreen={currentScreen} onScreenChange={setCurrentScreen} />
      </SafeAreaView>
    );
  };

  // Keep all other screens unchanged...
  const EmployeesScreen = () => {
    const [searchEmployees, setSearchEmployees] = useState('');

    const toggleEmployeeExpansion = (id) => {
      setEmployees(employees.map(employee => 
        employee.id === id ? { ...employee, expanded: !employee.expanded } : employee
      ));
    };

    const filteredEmployees = employees.filter(employee =>
      employee.firstName.toLowerCase().includes(searchEmployees.toLowerCase()) ||
      employee.lastName.toLowerCase().includes(searchEmployees.toLowerCase()) ||
      employee.title.toLowerCase().includes(searchEmployees.toLowerCase())
    );

    return (
      <SafeAreaView style={styles.container}>
        <StatusBar backgroundColor="#8B5CF6" barStyle="light-content" />
        <View style={styles.employeesHeader}>
          <View style={styles.employeesHeaderTop}>
            <Text style={styles.employeesTitle}>Team Management</Text>
            <TouchableOpacity style={styles.addEmployeeButton} onPress={() => setShowAddEmployee(true)}>
              <Text style={styles.addEmployeeButtonText}>Add Employee</Text>
            </TouchableOpacity>
          </View>
          
          <View style={styles.searchContainer}>
            <Ionicons name="search" size={20} color="#666" style={styles.searchIcon} />
            <TextInput
              style={styles.searchInput}
              placeholder="Search employees..."
              value={searchEmployees}
              onChangeText={setSearchEmployees}
              returnKeyType="search"
              blurOnSubmit={false}
              autoCorrect={false}
              autoCapitalize="none"
            />
          </View>
        </View>

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
          <View style={styles.employeesCard}>
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
                      <Text style={[styles.employeeStatSmallValue, { color: '#3B82F6' }]}>${employee.hourlyRate}/hr</Text>
                    </View>
                  </View>
                </TouchableOpacity>
                
                {employee.expanded && (
                  <View style={styles.employeeExpanded}>
                    <View style={styles.employeeExpandedItem}>
                      <Text style={styles.employeeExpandedLabel}>Full Name:</Text>
                      <Text style={styles.employeeExpandedValue}>{employee.firstName} {employee.lastName}</Text>
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

        <BottomNavigation currentScreen={currentScreen} onScreenChange={setCurrentScreen} />
      </SafeAreaView>
    );
  };

  // Calendar Screen with interactive calendar
  const CalendarScreen = () => {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar backgroundColor="#F59E0B" barStyle="light-content" />
        <View style={styles.calendarHeader}>
          <View style={styles.calendarHeaderTop}>
            <Text style={styles.calendarTitle}>Calendar & Activity</Text>
            <TouchableOpacity style={styles.addReminderButton} onPress={() => setShowAddReminder(true)}>
              <Text style={styles.addReminderButtonText}>Add Reminder</Text>
            </TouchableOpacity>
          </View>
          <Text style={styles.calendarSubtitle}>Track daily activities and performance</Text>
        </View>

        <ScrollView style={styles.calendarContainer} showsVerticalScrollIndicator={false}>
          <CalendarView />

          <View style={styles.calendarCard}>
            <Text style={styles.upcomingTitle}>Upcoming Reminders</Text>
            {reminders
              .filter(reminder => reminder.date >= new Date().toISOString().split('T')[0])
              .sort((a, b) => new Date(a.date) - new Date(b.date))
              .slice(0, 10)
              .map(reminder => (
                <View key={reminder.id} style={styles.reminderCard}>
                  <View style={styles.reminderHeader}>
                    <Text style={styles.reminderTitle}>{reminder.title}</Text>
                    <View style={[styles.reminderType, { 
                      backgroundColor: reminder.type === 'order' ? '#DCFCE7' : 
                                      reminder.type === 'meeting' ? '#DBEAFE' : '#FEF3C7',
                      borderColor: reminder.type === 'order' ? '#BBF7D0' : 
                                   reminder.type === 'meeting' ? '#BFDBFE' : '#FDE68A'
                    }]}>
                      <Text style={[styles.reminderTypeText, {
                        color: reminder.type === 'order' ? '#166534' : 
                               reminder.type === 'meeting' ? '#1E40AF' : '#92400E'
                      }]}>{reminder.type}</Text>
                    </View>
                  </View>
                  <Text style={styles.reminderDate}>
                    📅 {new Date(reminder.date).toLocaleDateString()} at {reminder.time}
                  </Text>
                  {reminder.description && (
                    <Text style={styles.reminderDescription}>{reminder.description}</Text>
                  )}
                </View>
              ))}
          </View>
        </ScrollView>

        <DayDetailsModal />

        <BottomNavigation currentScreen={currentScreen} onScreenChange={setCurrentScreen} />
      </SafeAreaView>
    );
  };

  const HamburgerMenu = () => {
    if (!showHamburgerMenu) return null;

    return (
      <Modal 
        visible={showHamburgerMenu} 
        animationType="slide" 
        transparent={true}
        onRequestClose={() => setShowHamburgerMenu(false)}
      >
        <View style={styles.hamburgerOverlay}>
          <TouchableOpacity 
            style={styles.hamburgerBackdrop} 
            onPress={() => setShowHamburgerMenu(false)}
            activeOpacity={1}
          />
          <View style={styles.hamburgerMenuContainer}>
            <View style={styles.hamburgerHeader}>
              <Text style={styles.hamburgerTitle}>Menu</Text>
              <TouchableOpacity 
                onPress={() => setShowHamburgerMenu(false)}
                style={styles.hamburgerCloseButton}
              >
                <Ionicons name="close" size={24} color="#666" />
              </TouchableOpacity>
            </View>

            <View style={styles.hamburgerContent}>
              <View style={styles.profileSection}>
                <View style={styles.profileAvatar}>
                  <Ionicons name="person" size={32} color="white" />
                </View>
                <View style={styles.profileInfo}>
                  <Text style={styles.profileName}>WinKyaw</Text>
                  <Text style={styles.profileEmail}>winkyaw@example.com</Text>
                  <Text style={styles.profileStatus}>Active User</Text>
                </View>
              </View>

              <View style={styles.menuDivider} />

              <View style={styles.infoSection}>
                <Text style={styles.sectionTitle}>SYSTEM INFORMATION</Text>
                
                <View style={styles.infoRow}>
                  <Ionicons name="time-outline" size={18} color="#3B82F6" />
                  <View style={styles.infoText}>
                    <Text style={styles.infoLabel}>Current DateTime (UTC)</Text>
                    <Text style={styles.infoValue}>2025-08-25 00:34:35</Text>
                  </View>
                </View>

                <View style={styles.infoRow}>
                  <Ionicons name="person-circle-outline" size={18} color="#10B981" />
                  <View style={styles.infoText}>
                    <Text style={styles.infoLabel}>Current User</Text>
                    <Text style={styles.infoValue}>WinKyaw</Text>
                  </View>
                </View>

                <View style={styles.infoRow}>
                  <Ionicons name="checkmark-circle-outline" size={18} color="#F59E0B" />
                  <View style={styles.infoText}>
                    <Text style={styles.infoLabel}>Login Status</Text>
                    <Text style={styles.infoValue}>Active Session</Text>
                  </View>
                </View>
              </View>

              <View style={styles.menuDivider} />

              <View style={styles.navigationSection}>
                <Text style={styles.sectionTitle}>NAVIGATION</Text>
                
                <TouchableOpacity 
                  style={styles.menuItem}
                  onPress={() => {
                    setShowHamburgerMenu(false);
                    setCurrentScreen('dashboard');
                  }}
                >
                  <Ionicons name="analytics-outline" size={20} color="#3B82F6" />
                  <Text style={styles.menuItemText}>Sales Dashboard</Text>
                  <Ionicons name="chevron-forward" size={16} color="#9CA3AF" />
                </TouchableOpacity>

                <TouchableOpacity 
                  style={styles.menuItem}
                  onPress={() => {
                    setShowHamburgerMenu(false);
                    setCurrentScreen('items');
                  }}
                >
                  <Ionicons name="cube-outline" size={20} color="#10B981" />
                  <Text style={styles.menuItemText}>Inventory Items</Text>
                  <Ionicons name="chevron-forward" size={16} color="#9CA3AF" />
                </TouchableOpacity>

                <TouchableOpacity 
                  style={styles.menuItem}
                  onPress={() => {
                    setShowHamburgerMenu(false);
                    setCurrentScreen('receipt');
                  }}
                >
                  <Ionicons name="receipt-outline" size={20} color="#F59E0B" />
                  <Text style={styles.menuItemText}>Create Receipt</Text>
                  <Ionicons name="chevron-forward" size={16} color="#9CA3AF" />
                </TouchableOpacity>

                <TouchableOpacity 
                  style={styles.menuItem}
                  onPress={() => {
                    setShowHamburgerMenu(false);
                    setCurrentScreen('employees');
                  }}
                >
                  <Ionicons name="people-outline" size={20} color="#8B5CF6" />
                  <Text style={styles.menuItemText}>Team Management</Text>
                  <Ionicons name="chevron-forward" size={16} color="#9CA3AF" />
                </TouchableOpacity>

                <TouchableOpacity 
                  style={styles.menuItem}
                  onPress={() => {
                    setShowHamburgerMenu(false);
                    setCurrentScreen('calendar');
                  }}
                >
                  <Ionicons name="calendar-outline" size={20} color="#F59E0B" />
                  <Text style={styles.menuItemText}>Calendar & Activities</Text>
                  <Ionicons name="chevron-forward" size={16} color="#9CA3AF" />
                </TouchableOpacity>
              </View>

              <View style={styles.menuDivider} />

              <View style={styles.optionsSection}>
                <Text style={styles.sectionTitle}>APPLICATION</Text>
                
                <TouchableOpacity style={styles.menuItem}>
                  <Ionicons name="settings-outline" size={20} color="#6B7280" />
                  <Text style={styles.menuItemText}>Settings</Text>
                  <Ionicons name="chevron-forward" size={16} color="#9CA3AF" />
                </TouchableOpacity>

                <TouchableOpacity style={styles.menuItem}>
                  <Ionicons name="help-circle-outline" size={20} color="#6B7280" />
                  <Text style={styles.menuItemText}>Help & Support</Text>
                  <Ionicons name="chevron-forward" size={16} color="#9CA3AF" />
                </TouchableOpacity>

                <TouchableOpacity style={styles.menuItem}>
                  <Ionicons name="information-circle-outline" size={20} color="#6B7280" />
                  <Text style={styles.menuItemText}>About POS App</Text>
                  <Ionicons name="chevron-forward" size={16} color="#9CA3AF" />
                </TouchableOpacity>
              </View>

              <TouchableOpacity
                style={styles.signOutButton}
                onPress={() => {
                  setShowHamburgerMenu(false);
                  setTimeout(() => {
                    setUser(null);
                    setCurrentScreen('login');
                  }, 300);
                }}
              >
                <Ionicons name="log-out-outline" size={20} color="white" />
                <Text style={styles.signOutText}>Sign Out</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    );
  };

  // Receipt screen
  const ReceiptScreen = () => {
    const subtotal = calculateTotal();
    const tax = calculateTax(subtotal);
    const total = subtotal + tax;

    return (
      <SafeAreaView style={styles.container}>
        <StatusBar backgroundColor="#F59E0B" barStyle="light-content" />
        <View style={styles.receiptHeader}>
          <Text style={styles.receiptTitle}>Create Receipt</Text>
          <Text style={styles.receiptSubtitle}>Point of Sale Transaction</Text>
        </View>

        <ScrollView style={styles.receiptContainer} showsVerticalScrollIndicator={false}>
          <View style={styles.receiptInfoCard}>
            <View style={styles.receiptInfoRow}>
              <View style={styles.receiptInfoItem}>
                <Ionicons name="calendar-outline" size={16} color="#F59E0B" />
                <Text style={styles.receiptInfoLabel}>Date & Time (UTC)</Text>
              </View>
              <Text style={styles.receiptInfoValue}>2025-08-25 00:34:35</Text>
            </View>

            <View style={styles.receiptInfoRow}>
              <View style={styles.receiptInfoItem}>
                <Ionicons name="person-outline" size={16} color="#F59E0B" />
                <Text style={styles.receiptInfoLabel}>Cashier</Text>
              </View>
              <Text style={styles.receiptInfoValue}>WinKyaw</Text>
            </View>

            <View style={styles.customerInputSection}>
              <Text style={styles.customerInputLabel}>Customer Name (Optional)</Text>
              <TextInput
                style={styles.customerInput}
                placeholder="Enter customer name or leave blank for walk-in"
                value={customerName}
                onChangeText={setCustomerName}
              />
            </View>
          </View>

          <TouchableOpacity 
            style={styles.addItemToReceiptButton}
            onPress={() => setShowAddToReceipt(true)}
          >
            <Ionicons name="add-circle-outline" size={24} color="white" />
            <Text style={styles.addItemToReceiptText}>Add Items to Receipt</Text>
          </TouchableOpacity>

          {receiptItems.length > 0 && (
            <View style={styles.receiptItemsCard}>
              <Text style={styles.receiptItemsTitle}>Items in Receipt</Text>
              
              {receiptItems.map((item, index) => (
                <View key={`${item.id}-${index}`} style={styles.receiptItem}>
                  <View style={styles.receiptItemInfo}>
                    <Text style={styles.receiptItemName}>{item.name}</Text>
                    <Text style={styles.receiptItemPrice}>${item.price.toFixed(2)} each</Text>
                  </View>
                  
                  <View style={styles.receiptItemControls}>
                    <View style={styles.quantityControls}>
                      <TouchableOpacity 
                        style={styles.quantityButton}
                        onPress={() => updateReceiptItemQuantity(item.id, item.quantity - 1)}
                      >
                        <Ionicons name="remove" size={16} color="#F59E0B" />
                      </TouchableOpacity>
                      <Text style={styles.quantityText}>{item.quantity}</Text>
                      <TouchableOpacity 
                        style={styles.quantityButton}
                        onPress={() => updateReceiptItemQuantity(item.id, item.quantity + 1)}
                      >
                        <Ionicons name="add" size={16} color="#F59E0B" />
                      </TouchableOpacity>
                    </View>
                    
                    <Text style={styles.receiptItemTotal}>
                      ${(item.price * item.quantity).toFixed(2)}
                    </Text>
                    
                    <TouchableOpacity 
                      style={styles.removeItemButton}
                      onPress={() => removeItemFromReceipt(item.id)}
                    >
                      <Ionicons name="trash-outline" size={16} color="#EF4444" />
                    </TouchableOpacity>
                  </View>
                </View>
              ))}

              <View style={styles.receiptTotals}>
                <View style={styles.totalRow}>
                  <Text style={styles.totalLabel}>Subtotal:</Text>
                  <Text style={styles.totalValue}>${subtotal.toFixed(2)}</Text>
                </View>
                <View style={styles.totalRow}>
                  <Text style={styles.totalLabel}>Tax (8%):</Text>
                  <Text style={styles.totalValue}>${tax.toFixed(2)}</Text>
                </View>
                <View style={[styles.totalRow, styles.grandTotalRow]}>
                  <Text style={styles.grandTotalLabel}>Total:</Text>
                  <Text style={styles.grandTotalValue}>${total.toFixed(2)}</Text>
                </View>
              </View>

              <TouchableOpacity 
                style={styles.submitReceiptButton}
                onPress={handleSubmitReceipt}
              >
                <Ionicons name="checkmark-circle-outline" size={24} color="white" />
                <Text style={styles.submitReceiptText}>Complete Transaction</Text>
              </TouchableOpacity>
            </View>
          )}

          {receiptItems.length === 0 && (
            <View style={styles.emptyReceiptCard}>
              <Ionicons name="receipt-outline" size={64} color="#D1D5DB" />
              <Text style={styles.emptyReceiptTitle}>No Items Added</Text>
              <Text style={styles.emptyReceiptText}>
                Tap "Add Items to Receipt" to start creating a transaction
              </Text>
            </View>
          )}
        </ScrollView>

        <BottomNavigation currentScreen={currentScreen} onScreenChange={setCurrentScreen} />
      </SafeAreaView>
    );
  };

  const BottomNavigation = ({ currentScreen, onScreenChange }) => (
    <View style={styles.bottomNavWithReceipt}>
      <TouchableOpacity
        style={styles.navItemReceipt}
        onPress={() => onScreenChange('dashboard')}
      >
        <Ionicons 
          name="analytics" 
          size={20} 
          color={currentScreen === 'dashboard' ? '#3B82F6' : '#666'} 
        />
        <Text style={[styles.navTextSmall, { color: currentScreen === 'dashboard' ? '#3B82F6' : '#666' }]}>
          Dashboard
        </Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.navItemReceipt}
        onPress={() => onScreenChange('items')}
      >
        <Ionicons 
          name="cube" 
          size={20} 
          color={currentScreen === 'items' ? '#3B82F6' : '#666'} 
        />
        <Text style={[styles.navTextSmall, { color: currentScreen === 'items' ? '#3B82F6' : '#666' }]}>
          Items
        </Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.navItemReceipt}
        onPress={() => onScreenChange('receipt')}
      >
        <Ionicons 
          name="receipt" 
          size={20} 
          color={currentScreen === 'receipt' ? '#3B82F6' : '#666'} 
        />
        <Text style={[styles.navTextSmall, { color: currentScreen === 'receipt' ? '#3B82F6' : '#666' }]}>
          Receipt
        </Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.navItemReceipt}
        onPress={() => onScreenChange('employees')}
      >
        <Ionicons 
          name="people" 
          size={20} 
          color={currentScreen === 'employees' ? '#3B82F6' : '#666'} 
        />
        <Text style={[styles.navTextSmall, { color: currentScreen === 'employees' ? '#3B82F6' : '#666' }]}>
          Team
        </Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.navItemReceipt}
        onPress={() => onScreenChange('calendar')}
      >
        <Ionicons 
          name="calendar" 
          size={20} 
          color={currentScreen === 'calendar' ? '#3B82F6' : '#666'} 
        />
        <Text style={[styles.navTextSmall, { color: currentScreen === 'calendar' ? '#3B82F6' : '#666' }]}>
          Calendar
        </Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.navItemReceipt}
        onPress={() => setShowHamburgerMenu(true)}
      >
        <Ionicons 
          name="menu" 
          size={20} 
          color="#666"
        />
        <Text style={[styles.navTextSmall, { color: '#666' }]}>
          Menu
        </Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <>
      {currentScreen === 'login' && <LoginScreen />}
      {currentScreen === 'signup' && <SignUpScreen />}
      {currentScreen === 'dashboard' && <DashboardScreen />}
      {currentScreen === 'items' && <ItemsScreen />}
      {currentScreen === 'receipt' && <ReceiptScreen />}
      {currentScreen === 'employees' && <EmployeesScreen />}
      {currentScreen === 'calendar' && <CalendarScreen />}
      
      <AddItemForm />
      <AddEmployeeForm />
      <AddReminderForm />
      <AddItemToReceiptModal />
      <HamburgerMenu />
    </>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  
  // Login Screen Styles
  loginContainer: {
    flex: 1,
    justifyContent: 'center',
    padding: 16,
    backgroundColor: '#3B82F6',
  },
  loginCard: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 32,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 8,
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: 32,
  },
  logo: {
    width: 64,
    height: 64,
    backgroundColor: '#3B82F6',
    borderRadius: 32,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1F2937',
  },
  subtitle: {
    fontSize: 16,
    color: '#6B7280',
    marginTop: 8,
    textAlign: 'center',
  },
  inputContainer: {
    gap: 24,
  },
  input: {
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    backgroundColor: '#FFFFFF',
    marginBottom: 16,
  },
  primaryButton: {
    backgroundColor: '#3B82F6',
    borderRadius: 8,
    paddingVertical: 12,
    alignItems: 'center',
  },
  primaryButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  linkContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  linkText: {
    color: '#6B7280',
  },
  link: {
    color: '#3B82F6',
    fontWeight: '600',
  },

  // Dashboard Header Styles
  dashboardContainer: {
    flex: 1,
  },
  dashboardHeader: {
    backgroundColor: '#3B82F6',
    padding: 16,
    paddingTop: 8,
    paddingBottom: 16,
  },
  dashboardTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: 'white',
  },
  dashboardSubtitle: {
    fontSize: 16,
    color: 'white',
    opacity: 0.9,
  },

  // Search container styles
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: '#1F2937',
    padding: 0,
    margin: 0,
  },

  // Live Data Indicator
  liveDataIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
    gap: 4,
  },
  liveDataText: {
    fontSize: 12,
    color: '#10B981',
    fontWeight: '500',
  },

  // Dynamic Filter and Sort Bar Styles
  filterSortContainer: {
    backgroundColor: 'white',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  filterSortRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  dynamicFilterButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    gap: 6,
    minWidth: 80,
  },
  dynamicFilterButtonActive: {
    backgroundColor: '#DCFCE7',
    borderColor: '#10B981',
  },
  dynamicFilterButtonText: {
    fontSize: 14,
    color: '#6B7280',
    fontWeight: '500',
  },
  dynamicFilterButtonTextActive: {
    color: '#10B981',
    fontWeight: '600',
  },
  clearFilterButton: {
    marginLeft: 4,
  },
  dynamicSortButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    gap: 6,
  },
  dynamicSortButtonText: {
    fontSize: 14,
    color: '#6B7280',
    fontWeight: '500',
  },

  // Filter/Sort Modal Styles
  filterModalContainer: {
    backgroundColor: 'white',
    borderRadius: 16,
    width: '100%',
    maxWidth: 400,
    maxHeight: '80%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 8,
  },
  categoryList: {
    gap: 12,
  },
  categoryOption: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  categoryOptionSelected: {
    backgroundColor: '#DCFCE7',
    borderColor: '#10B981',
  },
  categoryOptionText: {
    fontSize: 16,
    color: '#374151',
    fontWeight: '500',
  },
  categoryOptionTextSelected: {
    color: '#10B981',
    fontWeight: '600',
  },
  customCategorySection: {
    marginTop: 24,
    paddingTop: 24,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
  customCategoryLabel: {
    fontSize: 14,
    color: '#374151',
    fontWeight: '600',
    marginBottom: 12,
  },
  customCategoryInput: {
    flexDirection: 'row',
    gap: 12,
  },
  customCategoryTextInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 16,
    backgroundColor: '#FFFFFF',
  },
  customCategoryButton: {
    backgroundColor: '#10B981',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
    justifyContent: 'center',
  },
  customCategoryButtonDisabled: {
    backgroundColor: '#D1D5DB',
  },
  customCategoryButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
  },
  customCategoryButtonTextDisabled: {
    color: '#9CA3AF',
  },
  sortOptionLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  sortOptionRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  sortOrderIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  sortOrderText: {
    fontSize: 12,
    color: '#10B981',
    fontWeight: '600',
  },

  // Calendar Styles
  calendarView: {
    backgroundColor: 'white',
    borderRadius: 12,
    margin: 16,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  calendarHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
    paddingHorizontal: 8,
  },
  calendarMonthYear: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1F2937',
  },
  calendarDayNames: {
    flexDirection: 'row',
    marginBottom: 12,
  },
  calendarDayName: {
    flex: 1,
    textAlign: 'center',
    fontSize: 12,
    fontWeight: '600',
    color: '#6B7280',
    paddingVertical: 8,
  },
  calendarGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  calendarEmptyDay: {
    width: `${100/7}%`,
    height: 40,
  },
  calendarDay: {
    width: `${100/7}%`,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  calendarDayWithData: {
    backgroundColor: '#F0F9FF',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#BFDBFE',
  },
  calendarToday: {
    backgroundColor: '#F59E0B',
    borderRadius: 8,
  },
  calendarDayText: {
    fontSize: 14,
    color: '#9CA3AF',
  },
  calendarDayTextWithData: {
    color: '#1E40AF',
    fontWeight: '600',
  },
  calendarTodayText: {
    color: 'white',
    fontWeight: 'bold',
  },
  calendarFutureText: {
    color: '#D1D5DB',
  },
  calendarDayIndicator: {
    position: 'absolute',
    bottom: 2,
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#3B82F6',
  },

  // Day Modal Styles
  dayModalContainer: {
    backgroundColor: 'white',
    borderRadius: 16,
    width: '100%',
    maxWidth: 450,
    maxHeight: '90%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 8,
  },
  daySummaryCard: {
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  daySummaryTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 12,
  },
  daySummaryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 16,
  },
  daySummaryItem: {
    width: '45%',
    alignItems: 'center',
  },
  daySummaryLabel: {
    fontSize: 12,
    color: '#6B7280',
    marginBottom: 4,
  },
  daySummaryValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1F2937',
  },
  dayTopItemsCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  dayTopItemsTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 12,
  },
  dayTopItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  dayTopItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  dayTopItemRank: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6B7280',
    marginRight: 12,
    width: 24,
  },
  dayTopItemName: {
    fontSize: 16,
    fontWeight: '500',
    color: '#1F2937',
  },
  dayTopItemRight: {
    alignItems: 'flex-end',
  },
  dayTopItemSales: {
    fontSize: 16,
    fontWeight: '600',
    color: '#10B981',
  },
  dayTopItemQuantity: {
    fontSize: 12,
    color: '#6B7280',
  },
  dayActivitiesCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  dayActivitiesTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 12,
  },
  dayActivity: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  dayActivityLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  dayActivityInfo: {
    marginLeft: 12,
    flex: 1,
  },
  dayActivityTime: {
    fontSize: 14,
    fontWeight: '600',
    color: '#F59E0B',
    marginBottom: 2,
  },
  dayActivityDescription: {
    fontSize: 14,
    color: '#6B7280',
  },

  // Continue with all other existing styles...
  kpiContainer: {
    padding: 16,
    gap: 16,
  },
  kpiRow: {
    flexDirection: 'row',
    gap: 12,
  },
  kpiCard: {
    flex: 1,
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  kpiLabel: {
    fontSize: 12,
    color: '#6B7280',
    marginBottom: 4,
  },
  kpiValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#10B981',
  },
  kpiTrend: {
    fontSize: 12,
    fontWeight: '500',
    marginTop: 4,
  },
  progressBar: {
    height: 8,
    backgroundColor: '#E5E7EB',
    borderRadius: 4,
    marginTop: 8,
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#3B82F6',
    borderRadius: 4,
  },
  kpiRowSmall: {
    flexDirection: 'row',
    gap: 8,
  },
  kpiCardSmall: {
    flex: 1,
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  kpiLabelSmall: {
    fontSize: 10,
    color: '#6B7280',
    marginBottom: 4,
  },
  kpiValueSmall: {
    fontSize: 18,
    fontWeight: 'bold',
  },

  // Chart Styles
  chartCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  chartTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 12,
  },
  chartRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  chartLabel: {
    fontSize: 12,
    color: '#6B7280',
    width: 48,
  },
  chartBarContainer: {
    flex: 1,
    height: 12,
    backgroundColor: '#E5E7EB',
    borderRadius: 6,
    marginHorizontal: 12,
  },
  chartBar: {
    height: '100%',
    backgroundColor: '#3B82F6',
    borderRadius: 6,
  },
  chartValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1F2937',
    width: 60,
    textAlign: 'right',
  },

  // Performance Card Styles
  performanceCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  performanceTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 12,
  },
  performanceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  performanceName: {
    fontSize: 16,
    fontWeight: '600',
  },
  performanceUnits: {
    fontSize: 14,
    color: '#6B7280',
  },
  performanceRight: {
    alignItems: 'flex-end',
  },
  performanceValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1F2937',
  },
  performanceTrend: {
    fontSize: 12,
    fontWeight: '500',
    color: '#10B981',
  },
  performanceProgress: {
    backgroundColor: '#F3F4F6',
    borderRadius: 8,
    padding: 8,
  },
  performanceProgressLabel: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  performanceProgressText: {
    fontSize: 12,
    color: '#374151',
  },
  performanceProgressBar: {
    height: 8,
    backgroundColor: '#E5E7EB',
    borderRadius: 4,
    marginTop: 4,
  },
  performanceProgressFill: {
    height: '100%',
    borderRadius: 4,
  },

  // Top Items Styles
  topItemsCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  topItemsTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 12,
  },
  topItemRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  topItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  topItemRank: {
    fontSize: 14,
    fontWeight: '500',
    color: '#6B7280',
    marginRight: 12,
  },
  topItemName: {
    fontSize: 16,
    fontWeight: '500',
    color: '#1F2937',
  },
  topItemUnits: {
    fontSize: 12,
    color: '#6B7280',
  },
  topItemRight: {
    alignItems: 'flex-end',
  },
  topItemValue: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
  },
  topItemTrend: {
    fontSize: 12,
    fontWeight: '500',
  },

  // Items Screen Styles
  itemsHeader: {
    backgroundColor: '#10B981',
    padding: 16,
    paddingTop: 8,
  },
  itemsHeaderTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  addItemButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  addItemButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '500',
  },
  itemsTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: 'white',
  },
  itemsList: {
    flex: 1,
    padding: 16,
  },
    itemsCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  itemRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
  },
  itemInfo: {
    flex: 1,
  },
  itemNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  itemName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    flex: 1,
  },
  categoryBadge: {
    backgroundColor: '#EFF6FF',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#BFDBFE',
  },
  categoryBadgeText: {
    fontSize: 10,
    color: '#1E40AF',
    fontWeight: '600',
  },
  itemStats: {
    flexDirection: 'row',
    gap: 12,
  },
  itemStat: {
    fontSize: 12,
    color: '#6B7280',
  },
  itemSeparator: {
    height: 1,
    backgroundColor: '#F3F4F6',
    marginHorizontal: 16,
  },
  itemExpanded: {
    backgroundColor: '#F9FAFB',
    padding: 16,
  },
  itemExpandedGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 16,
  },
  itemExpandedItem: {
    width: '45%',
  },
  itemExpandedLabel: {
    fontSize: 12,
    color: '#6B7280',
  },
  itemExpandedValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1F2937',
  },

  // No items state
  noItemsContainer: {
    padding: 40,
    alignItems: 'center',
  },
  noItemsText: {
    fontSize: 16,
    color: '#9CA3AF',
    fontWeight: '600',
    marginTop: 12,
    marginBottom: 4,
  },
  noItemsSubtext: {
    fontSize: 14,
    color: '#9CA3AF',
    textAlign: 'center',
  },

  // Employees Screen Styles
  employeesHeader: {
    backgroundColor: '#8B5CF6',
    padding: 16,
    paddingTop: 8,
  },
  employeesHeaderTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  employeesTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: 'white',
  },
  addEmployeeButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  addEmployeeButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '500',
  },
  employeeStats: {
    flexDirection: 'row',
    padding: 16,
    gap: 16,
  },
  employeeStatCard: {
    flex: 1,
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  employeeStatLabel: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 4,
  },
  employeeStatValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1F2937',
  },
  employeesList: {
    flex: 1,
    paddingHorizontal: 16,
  },
  employeesCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  employeeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
  },
  employeeInfo: {
    flex: 1,
  },
  employeeName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
  },
  employeeTitle: {
    fontSize: 14,
    color: '#6B7280',
  },
  employeeStats: {
    flexDirection: 'row',
    gap: 12,
  },
  employeeStat: {
    alignItems: 'center',
  },
  employeeStatSmallLabel: {
    fontSize: 10,
    color: '#6B7280',
  },
  employeeStatSmallValue: {
    fontSize: 14,
    fontWeight: '500',
  },
  employeeExpanded: {
    backgroundColor: '#F9FAFB',
    padding: 16,
    gap: 12,
  },
  employeeExpandedItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  employeeExpandedLabel: {
    fontSize: 14,
    color: '#6B7280',
  },
  employeeExpandedValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1F2937',
  },

  // Calendar Screen Styles
  calendarHeader: {
    backgroundColor: '#F59E0B',
    padding: 16,
    paddingTop: 8,
  },
  calendarHeaderTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  calendarTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: 'white',
  },
  addReminderButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  addReminderButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '500',
  },
  calendarSubtitle: {
    fontSize: 16,
    color: 'white',
    opacity: 0.9,
  },
  calendarContainer: {
    flex: 1,
  },
  calendarCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    margin: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  upcomingTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 16,
  },
  reminderCard: {
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 8,
    padding: 16,
    marginBottom: 12,
  },
  reminderHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  reminderTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    flex: 1,
  },
  reminderType: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 12,
    borderWidth: 1,
  },
  reminderTypeText: {
    fontSize: 12,
    fontWeight: '500',
    textTransform: 'capitalize',
  },
  reminderDate: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 4,
  },
  reminderDescription: {
    fontSize: 14,
    color: '#6B7280',
  },

  // Hamburger menu styles
  hamburgerOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  hamburgerBackdrop: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  hamburgerMenuContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'white',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '80%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 10,
  },
  hamburgerHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
    backgroundColor: '#F9FAFB',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
  },
  hamburgerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1F2937',
  },
  hamburgerCloseButton: {
    padding: 4,
    borderRadius: 20,
    backgroundColor: 'rgba(0,0,0,0.05)',
  },
  hamburgerContent: {
    paddingBottom: 20,
    maxHeight: '85%',
  },
  
  // Profile Section
  profileSection: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#F8FAFC',
  },
  profileAvatar: {
    width: 60,
    height: 60,
    backgroundColor: '#3B82F6',
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
    shadowColor: '#3B82F6',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 4,
  },
  profileInfo: {
    flex: 1,
  },
  profileName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 2,
  },
  profileEmail: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 2,
  },
  profileStatus: {
    fontSize: 12,
    color: '#10B981',
    fontWeight: '600',
  },
  
  // Divider
  menuDivider: {
    height: 1,
    backgroundColor: '#E5E7EB',
    marginHorizontal: 0,
  },
  
  // Info Section
  infoSection: {
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: '#374151',
    marginBottom: 12,
    letterSpacing: 0.5,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    paddingVertical: 2,
  },
  infoText: {
    marginLeft: 12,
    flex: 1,
  },
  infoLabel: {
    fontSize: 12,
    color: '#6B7280',
    marginBottom: 2,
  },
  infoValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1F2937',
  },
  
  // Navigation Section
  navigationSection: {
    paddingHorizontal: 20,
    paddingVertical: 12,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 4,
    borderRadius: 8,
    marginBottom: 2,
  },
  menuItemText: {
    fontSize: 16,
    color: '#1F2937',
    marginLeft: 12,
    flex: 1,
    fontWeight: '500',
  },
  
  // Options Section
  optionsSection: {
    paddingHorizontal: 20,
    paddingVertical: 12,
  },
  
  // Sign Out Button
  signOutButton: {
    backgroundColor: '#EF4444',
    marginHorizontal: 20,
    marginTop: 16,
    paddingVertical: 14,
    borderRadius: 8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    shadowColor: '#EF4444',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 4,
  },
  signOutText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },

  // MODAL STYLES
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalSafeArea: {
    flex: 1,
    width: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContainer: {
    backgroundColor: 'white',
    borderRadius: 16,
    width: '100%',
    maxWidth: 400,
    maxHeight: '90%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 8,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1F2937',
  },
  modalContent: {
    padding: 20,
    maxHeight: height * 0.7,
  },
  modalSubtitle: {
    fontSize: 16,
    color: '#374151',
    marginBottom: 16,
    fontWeight: '600',
  },
  modalRow: {
    flexDirection: 'row',
    marginBottom: 16,
  },
  scanButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#EFF6FF',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    marginBottom: 16,
    gap: 8,
  },
  scanButtonText: {
    color: '#3B82F6',
    fontSize: 14,
    fontWeight: '500',
  },
  scanContainer: {
    backgroundColor: '#EFF6FF',
    borderRadius: 8,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#BFDBFE',
  },
  scanContent: {
    alignItems: 'center',
  },
  scanText: {
    fontSize: 14,
    color: '#1E40AF',
    textAlign: 'center',
    marginVertical: 12,
  },
  scanSimulateButton: {
    backgroundColor: '#3B82F6',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  scanSimulateButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '500',
  },
  pickerContainer: {
    marginBottom: 16,
  },
  pickerLabel: {
    fontSize: 14,
    color: '#374151',
    marginBottom: 8,
    fontWeight: '500',
  },
  pickerRow: {
    flexDirection: 'row',
    gap: 8,
  },
  pickerOption: {
    flex: 1,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 6,
    alignItems: 'center',
  },
  pickerOptionSelected: {
    backgroundColor: '#EFF6FF',
    borderColor: '#3B82F6',
  },
  pickerOptionText: {
    fontSize: 14,
    color: '#6B7280',
  },
  pickerOptionTextSelected: {
    color: '#3B82F6',
    fontWeight: '500',
  },
  textArea: {
    height: 80,
    textAlignVertical: 'top',
  },
  modalButtons: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 24,
  },
  cancelButton: {
    flex: 1,
    backgroundColor: '#F3F4F6',
    borderRadius: 8,
    paddingVertical: 12,
    alignItems: 'center',
  },
  cancelButtonText: {
    color: '#374151',
    fontSize: 16,
    fontWeight: '600',
  },

  // Receipt Screen Styles
  receiptHeader: {
    backgroundColor: '#F59E0B',
    padding: 16,
    paddingTop: 8,
  },
  receiptTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: 'white',
  },
  receiptSubtitle: {
    fontSize: 16,
    color: 'white',
    opacity: 0.9,
  },
  receiptContainer: {
    flex: 1,
    padding: 16,
  },
  receiptInfoCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  receiptInfoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  receiptInfoItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  receiptInfoLabel: {
    fontSize: 14,
    color: '#6B7280',
    marginLeft: 8,
  },
  receiptInfoValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1F2937',
  },
  customerInputSection: {
    marginTop: 8,
  },
  customerInputLabel: {
    fontSize: 14,
    color: '#374151',
    marginBottom: 8,
    fontWeight: '500',
  },
  customerInput: {
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 16,
    backgroundColor: '#FFFFFF',
  },
  addItemToReceiptButton: {
    backgroundColor: '#F59E0B',
    borderRadius: 12,
    paddingVertical: 16,
    paddingHorizontal: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
    shadowColor: '#F59E0B',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 4,
    gap: 8,
  },
  addItemToReceiptText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  receiptItemsCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  receiptItemsTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 16,
  },
  receiptItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  receiptItemInfo: {
    flex: 1,
  },
  receiptItemName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 2,
  },
  receiptItemPrice: {
    fontSize: 14,
    color: '#6B7280',
  },
  receiptItemControls: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  quantityControls: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F3F4F6',
    borderRadius: 20,
    paddingHorizontal: 4,
  },
  quantityButton: {
    padding: 8,
    borderRadius: 16,
  },
  quantityText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    paddingHorizontal: 12,
  },
  receiptItemTotal: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1F2937',
    minWidth: 60,
    textAlign: 'right',
  },
  removeItemButton: {
    padding: 8,
    borderRadius: 16,
    backgroundColor: '#FEF2F2',
  },
  receiptTotals: {
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 2,
    borderTopColor: '#E5E7EB',
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  totalLabel: {
    fontSize: 16,
    color: '#6B7280',
  },
  totalValue: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
  },
  grandTotalRow: {
    borderTopWidth: 1,
    borderTopColor: '#D1D5DB',
    paddingTop: 8,
    marginTop: 8,
  },
  grandTotalLabel: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1F2937',
  },
  grandTotalValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#F59E0B',
  },
  submitReceiptButton: {
    backgroundColor: '#10B981',
    borderRadius: 8,
    paddingVertical: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 20,
    gap: 8,
    shadowColor: '#10B981',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 4,
  },
  submitReceiptText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  emptyReceiptCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 40,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  emptyReceiptTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#9CA3AF',
    marginTop: 16,
    marginBottom: 8,
  },
  emptyReceiptText: {
    fontSize: 14,
    color: '#9CA3AF',
    textAlign: 'center',
    lineHeight: 20,
  },

  // Add Item Modal Styles
  addItemModalContainer: {
    backgroundColor: 'white',
    borderRadius: 16,
    width: '100%',
    maxWidth: 400,
    maxHeight: '90%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 8,
  },
  addItemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    paddingHorizontal: 4,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  addItemInfo: {
    flex: 1,
  },
  addItemName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 4,
  },
  addItemDetails: {
    fontSize: 14,
    color: '#6B7280',
  },
  inReceiptText: {
    color: '#F59E0B',
    fontWeight: '500',
  },
  addItemButton: {
    backgroundColor: '#F59E0B',
    borderRadius: 20,
    padding: 8,
    marginLeft: 12,
  },
  outOfStockButton: {
    backgroundColor: '#F3F4F6',
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginLeft: 12,
  },
  outOfStockText: {
    color: '#9CA3AF',
    fontSize: 12,
    fontWeight: '500',
  },

  // Bottom Navigation (6 tabs)
  bottomNavWithReceipt: {
    flexDirection: 'row',
    backgroundColor: 'white',
    paddingVertical: 8,
    paddingHorizontal: 8,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 8,
    alignItems: 'center',
    justifyContent: 'space-around',
  },
  navItemReceipt: {
    alignItems: 'center',
    flex: 1,
    paddingVertical: 4,
  },
  navTextSmall: {
    fontSize: 9,
    marginTop: 2,
  },
});

export default App;