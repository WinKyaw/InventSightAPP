import React, { useEffect, useState, useCallback } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  FlatList,
  ActivityIndicator,
  Alert,
  StatusBar,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Ionicons from "@expo/vector-icons/Ionicons";

import Header from "../../components/ui/Header";
import SearchBar from "../../components/ui/SearchBar";
import DatePicker from "../../components/ui/DatePicker";
import Input from "../../components/ui/Input";
import Button from "../../components/ui/Button";
import AddItemToReceiptModal from "../../components/modals/AddItemToReceiptModal";
import SmartScanner from "../../components/ui/SmartScanner";

import { useReceipt } from "../../context/ReceiptContext";
import { useItems } from "../../context/ItemsContext";
import { Receipt, Item } from "../../constants/types";
import ReceiptService from "../../services/ReceiptService";

// You can move these styles to a separate file if preferred
const styles = {
  container: { flex: 1, backgroundColor: "#fff" },
  receiptContainer: { flex: 1, padding: 16 },
  employeeStats: { flexDirection: "row", marginBottom: 12 },
  employeeStatCard: {
    flex: 1,
    backgroundColor: "#fff7e6",
    padding: 12,
    borderRadius: 12,
    marginHorizontal: 4,
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "center",
  },
  employeeStatValue: { fontSize: 16, fontWeight: "bold", marginRight: 6 },
  employeeStatLabel: { fontSize: 13, color: "#6B7280" },
  addItemToReceiptButton: {
    flexDirection: "row",
    backgroundColor: "#F59E0B",
    padding: 14,
    borderRadius: 12,
    marginVertical: 16,
    alignItems: "center",
    justifyContent: "center",
  },
  addItemToReceiptText: {
    color: "#fff",
    fontWeight: "600",
    marginLeft: 8,
    fontSize: 16,
  },
  scannerOptionsContainer: {
    flexDirection: "row",
    justifyContent: "space-around",
    marginVertical: 10,
  },
  scannerOptionButton: {
    flexDirection: "row",
    backgroundColor: "#e0e7ff",
    padding: 10,
    borderRadius: 8,
    alignItems: "center",
    marginHorizontal: 8,
  },
  scannerOptionText: {
    marginLeft: 8,
    color: "#3B82F6",
    fontWeight: "500",
  },
  receiptInfoCard: {
    backgroundColor: "#fffbe9",
    borderRadius: 12,
    padding: 16,
    marginBottom: 14,
  },
  receiptInfoRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 8,
  },
  receiptInfoItem: { flexDirection: "row", alignItems: "center" },
  receiptInfoLabel: { fontWeight: "bold", color: "#F59E0B", marginLeft: 6 },
  receiptInfoValue: { fontWeight: "500", color: "#6B7280" },
  customerInputSection: { marginTop: 8 },
  customerInputLabel: { fontWeight: "600", fontSize: 14, marginBottom: 2 },
  customerInput: { borderColor: "#ddd", borderWidth: 1, borderRadius: 8, padding: 8 },
  fieldErrorContainer: { flexDirection: "row", alignItems: "center", marginTop: 4 },
  fieldErrorText: { color: "#EF4444", marginLeft: 4, fontSize: 12 },
  receiptItemsCard: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 14,
    marginVertical: 16,
    elevation: 2,
  },
  receiptItemsTitle: { fontWeight: "bold", fontSize: 16, marginBottom: 10 },
  receiptItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 6,
    borderBottomWidth: 1,
    borderBottomColor: "#f3f4f6",
  },
  receiptItemInfo: {},
  receiptItemName: { fontWeight: "600", fontSize: 15 },
  receiptItemPrice: { color: "#6B7280", marginTop: 2, fontSize: 13 },
  receiptItemControls: { flexDirection: "row", alignItems: "center" },
  quantityControls: { flexDirection: "row", alignItems: "center", marginRight: 12 },
  quantityButton: {
    backgroundColor: "#FEF3C7",
    borderRadius: 6,
    padding: 2,
    marginHorizontal: 2,
  },
  quantityText: { fontWeight: "bold", fontSize: 15, marginHorizontal: 6 },
  receiptItemTotal: { fontWeight: "bold", marginRight: 10, fontSize: 15 },
  removeItemButton: { marginLeft: 3, padding: 2 },
  receiptTotals: { marginTop: 16 },
  totalRow: { flexDirection: "row", justifyContent: "space-between", marginVertical: 2 },
  totalLabel: { fontWeight: "600", fontSize: 14 },
  totalValue: { fontWeight: "bold", fontSize: 14 },
  grandTotalRow: { marginTop: 6 },
  grandTotalLabel: { fontWeight: "bold", fontSize: 16 },
  grandTotalValue: { fontWeight: "bold", fontSize: 16, color: "#10B981" },
  submitReceiptButton: { marginTop: 16 },
  apiToggleButton: {
    marginTop: 12,
    alignSelf: "center",
    backgroundColor: "#e0e7ff",
    borderRadius: 8,
    padding: 6,
    paddingHorizontal: 12,
  },
  apiToggleText: { color: "#3B82F6", fontWeight: "600" },
  errorContainer: { flexDirection: "row", alignItems: "center", marginTop: 8 },
  errorText: { color: "#EF4444", marginLeft: 6, fontSize: 13 },
  recentReceiptsSection: { marginTop: 16 },
  recentReceiptsTitle: { fontSize: 15, fontWeight: "bold", marginBottom: 6 },
  emptyRecentReceipts: { alignItems: "center", padding: 14 },
  emptyRecentReceiptsText: { color: "#aaa", fontSize: 13 },
  recentReceiptsList: { marginTop: 6 },
  recentReceiptItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 8,
    backgroundColor: "#fffbe9",
    borderRadius: 8,
    padding: 8,
  },
  recentReceiptInfo: {},
  recentReceiptNumber: { fontWeight: "bold" },
  recentReceiptCustomer: { color: "#555" },
  recentReceiptDetails: { alignItems: "flex-end" },
  recentReceiptTotal: { fontWeight: "bold", color: "#10B981" },
  recentReceiptDate: { color: "#555", fontSize: 12 },
  viewAllReceiptsButton: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 6,
    alignSelf: "flex-end",
  },
  viewAllReceiptsText: { color: "#F59E0B", fontWeight: "bold", marginRight: 4 },
  emptyReceiptCard: {
    alignItems: "center",
    marginVertical: 32,
    padding: 18,
    backgroundColor: "#F3F4F6",
    borderRadius: 12,
  },
  emptyReceiptTitle: { fontWeight: "bold", fontSize: 17, marginTop: 18 },
  emptyReceiptText: { color: "#6B7280", marginTop: 4, fontSize: 13 },
  dateFilterContainer: { marginVertical: 10 },
  dateFilterRow: { flexDirection: "row", marginBottom: 4 },
  dateFilterField: { flex: 1, marginHorizontal: 4 },
  clearDateFiltersButton: {
    alignSelf: "flex-end",
    margin: 6,
    paddingHorizontal: 12,
    paddingVertical: 5,
    backgroundColor: "#f3f4f6",
    borderRadius: 8,
  },
  clearDateFiltersText: { color: "#F59E0B", fontWeight: "bold" },
  employeesList: {},
  loadingContainer: { alignItems: "center", marginTop: 16 },
  loadingText: { color: "#F59E0B", marginTop: 8 },
  errorHeader: { flexDirection: "row", alignItems: "center", marginBottom: 4 },
};

type TabType = "create" | "list";

export default function ReceiptScreen() {
  const {
    receiptItems,
    customerName,
    loading,
    error,
    submitting,
    setCustomerName,
    updateReceiptItemQuantity,
    removeItemFromReceipt,
    calculateTotal,
    calculateTax,
    handleSubmitReceipt,
    useApiIntegration,
    setUseApiIntegration,
  } = useReceipt();

  const [activeTab, setActiveTab] = useState<TabType>("create");
  const [showAddToReceipt, setShowAddToReceipt] = useState(false);
  const [customerNameError, setCustomerNameError] = useState("");

  // Receipt listing state
  const [receipts, setReceipts] = useState<Receipt[]>([]);
  const [loadingReceipts, setLoadingReceipts] = useState(false);
  const [receiptsError, setReceiptsError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [sortBy, setSortBy] = useState<"date" | "total" | "customer">("date");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");
  const [refreshing, setRefreshing] = useState(false);

  // Date filtering state
  const [startDate, setStartDate] = useState<Date | null>(null);
  const [endDate, setEndDate] = useState<Date | null>(null);

  // SmartScanner state
  const [showSmartScanner, setShowSmartScanner] = useState(false);

  // Items context for adding scanned items
  const { items, addItem } = useItems();

  useEffect(() => {
    if (activeTab === "list") {
      loadReceipts();
    }
  }, [activeTab]);

  useEffect(() => {
    loadReceipts();
  }, []);

  const loadReceipts = async (showRefreshing = false) => {
    try {
      if (showRefreshing) setRefreshing(true);
      else setLoadingReceipts(true);
      setReceiptsError(null);
      const response = await ReceiptService.getAllReceipts();
      setReceipts(response.receipts || []);
    } catch (error: any) {
      setReceiptsError(error.message || "Failed to load receipts");
    } finally {
      setLoadingReceipts(false);
      setRefreshing(false);
    }
  };

  const handleRefreshReceipts = () => {
    loadReceipts(true);
  };

  // Filter and sort receipts
  const getFilteredAndSortedReceipts = () => {
    let filtered = receipts;
    filtered = getFilteredReceiptsByDate(filtered);
    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase().trim();
      filtered = filtered.filter(
        (receipt) =>
          receipt.customerName?.toLowerCase().includes(term) ||
          receipt.receiptNumber?.toString().includes(term)
      );
    }
    filtered = filtered.sort((a, b) => {
      let valA: any = a[sortBy];
      let valB: any = b[sortBy];
      if (sortBy === "date") {
        valA = new Date(a.dateTime || 0).getTime();
        valB = new Date(b.dateTime || 0).getTime();
      }
      if (valA < valB) return sortOrder === "asc" ? -1 : 1;
      if (valA > valB) return sortOrder === "asc" ? 1 : -1;
      return 0;
    });
    return filtered;
  };

  const getFilteredReceiptsByDate = (receiptsList: Receipt[]) => {
    if (!startDate && !endDate) return receiptsList;
    return receiptsList.filter((receipt) => {
      if (!receipt.dateTime) return true;
      const receiptDate = new Date(receipt.dateTime);
      const start = startDate
        ? new Date(startDate.getFullYear(), startDate.getMonth(), startDate.getDate())
        : null;
      const end = endDate
        ? new Date(endDate.getFullYear(), endDate.getMonth(), endDate.getDate(), 23, 59, 59)
        : null;
      if (start && receiptDate < start) return false;
      if (end && receiptDate > end) return false;
      return true;
    });
  };

  const toggleSortOrder = () => {
    setSortOrder((prev) => (prev === "asc" ? "desc" : "asc"));
  };

  const getCurrentDateTime = () => {
    const now = new Date();
    return now.toLocaleString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const renderReceiptItem = ({ item }: { item: Receipt }) => (
    <View style={styles.receiptItem}>
      <View style={styles.receiptItemInfo}>
        <Text style={styles.receiptItemName}>#{item.receiptNumber}</Text>
        <Text style={styles.receiptItemPrice}>{item.customerName || "Walk-in Customer"}</Text>
        <Text style={styles.receiptItemPrice}>
          {item.items?.length || 0} items • Tax: ${item.tax?.toFixed(2) || "0.00"}
        </Text>
      </View>
      <View style={styles.receiptItemControls}>
        <Text style={styles.receiptItemTotal}>${item.total.toFixed(2)}</Text>
        <Text style={styles.receiptItemName}>{formatDate(item.dateTime)}</Text>
      </View>
    </View>
  );

  const formatDate = (date: string | number | Date) => {
    if (!date) return "";
    return new Date(date).toLocaleString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const renderReceiptListTab = () => (
    <View style={styles.receiptContainer}>
      <SearchBar
        placeholder="Search receipts..."
        value={searchTerm}
        onChangeText={setSearchTerm}
      />

      <View style={styles.dateFilterContainer}>
        <View style={styles.dateFilterRow}>
          <View style={styles.dateFilterField}>
            <DatePicker
              label="Start Date"
              value={startDate}
              onChange={setStartDate}
              placeholder="Any date"
            />
          </View>
          <View style={styles.dateFilterField}>
            <DatePicker
              label="End Date"
              value={endDate}
              onChange={setEndDate}
              placeholder="Any date"
              minimumDate={startDate || undefined}
            />
          </View>
        </View>
        {(startDate || endDate) && (
          <TouchableOpacity
            style={styles.clearDateFiltersButton}
            onPress={() => {
              setStartDate(null);
              setEndDate(null);
            }}
          >
            <Text style={styles.clearDateFiltersText}>Clear Filters</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Sort/Stats Header */}
      <View style={styles.employeeStats}>
        <TouchableOpacity style={styles.employeeStatCard} onPress={() => setSortBy("date")}>
          <Text style={styles.employeeStatValue}>Date</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.employeeStatCard} onPress={() => setSortBy("total")}>
          <Text style={styles.employeeStatValue}>Total</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.employeeStatCard} onPress={() => setSortBy("customer")}>
          <Text style={styles.employeeStatValue}>Customer</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.employeeStatCard} onPress={toggleSortOrder}>
          <Ionicons
            name={sortOrder === "asc" ? "arrow-up" : "arrow-down"}
            size={16}
            color="#6B7280"
          />
        </TouchableOpacity>
      </View>

      {loadingReceipts && !refreshing && (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#F59E0B" />
          <Text style={styles.loadingText}>Loading receipts...</Text>
        </View>
      )}

      {receiptsError && (
        <View style={styles.errorContainer}>
          <View style={styles.errorHeader}>
            <Ionicons name="alert-circle" size={16} color="#EF4444" />
            <Text style={styles.errorText}>{receiptsError}</Text>
          </View>
          <TouchableOpacity style={styles.retryButton} onPress={() => loadReceipts()}>
            <Text style={styles.retryButtonText}>Retry</Text>
          </TouchableOpacity>
        </View>
      )}

      {!loadingReceipts && !receiptsError && (
        <FlatList
          data={getFilteredAndSortedReceipts()}
          renderItem={renderReceiptItem}
          keyExtractor={(item) => item.id?.toString() || item.receiptNumber || Math.random().toString()}
          refreshing={refreshing}
          onRefresh={handleRefreshReceipts}
          ListEmptyComponent={() => (
            <View style={styles.emptyReceiptCard}>
              <Ionicons name="receipt-outline" size={48} color="#D1D5DB" />
              <Text style={styles.emptyReceiptTitle}>No Receipts Found</Text>
              <Text style={styles.emptyReceiptText}>
                {searchTerm.trim()
                  ? "No receipts match your search criteria"
                  : "No receipts have been created yet"}
              </Text>
            </View>
          )}
          style={styles.employeesList}
        />
      )}

      {receipts.length > 0 && (
        <View style={styles.employeeStats}>
          <View style={styles.employeeStatCard}>
            <Text style={styles.employeeStatValue}>{receipts.length}</Text>
            <Text style={styles.employeeStatLabel}>Total Receipts</Text>
          </View>
          <View style={styles.employeeStatCard}>
            <Text style={styles.employeeStatValue}>
              ${receipts.reduce((sum, receipt) => sum + receipt.total, 0).toLocaleString()}
            </Text>
            <Text style={styles.employeeStatLabel}>Total Revenue</Text>
          </View>
        </View>
      )}
    </View>
  );

  // SmartScanner handlers
  const handleSmartBarcodeDetected = (barcode: string) => {
    const item = items.find((item) => item.barcode === barcode);
    if (item) {
      addItem({
        ...item,
        quantity: 1,
        total: item.price * 1,
      });
    } else {
      Alert.alert("Not Found", `No item found for barcode: ${barcode}`);
    }
  };

  const handleSmartOcrDetected = (ocrText: string) => {
    const lines = ocrText.split("\n");
    let found = false;
    lines.forEach((line) => {
      items.forEach((item) => {
        if (line.toLowerCase().includes(item.name.toLowerCase())) {
          found = true;
          addItem({
            ...item,
            quantity: 1,
            total: item.price * 1,
          });
        }
      });
    });
    if (!found) {
      Alert.alert("No items recognized", "No known items found in OCR result.");
    }
  };

  const subtotal = calculateTotal();
  const tax = calculateTax();
  const total = subtotal + tax;

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar backgroundColor="#F59E0B" barStyle="light-content" />
      <Header
        title={activeTab === "create" ? "Create Receipt" : "Receipt History"}
        subtitle={
          activeTab === "create"
            ? "Point of Sale Transaction"
            : "View and search receipts"
        }
        backgroundColor="#F59E0B"
      />

      {/* Tab Navigation */}
      <View style={styles.employeeStats}>
        <TouchableOpacity
          style={[
            styles.employeeStatCard,
            activeTab === "create" && { backgroundColor: "#FEF3C7" },
          ]}
          onPress={() => setActiveTab("create")}
        >
          <Ionicons
            name="add-circle-outline"
            size={20}
            color={activeTab === "create" ? "#F59E0B" : "#6B7280"}
          />
          <Text
            style={[
              styles.employeeStatLabel,
              activeTab === "create" && { color: "#F59E0B" },
            ]}
          >
            Create
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[
            styles.employeeStatCard,
            activeTab === "list" && { backgroundColor: "#FEF3C7" },
          ]}
          onPress={() => setActiveTab("list")}
        >
          <Ionicons
            name="list-outline"
            size={20}
            color={activeTab === "list" ? "#F59E0B" : "#6B7280"}
          />
          <Text
            style={[
              styles.employeeStatLabel,
              activeTab === "list" && { color: "#F59E0B" },
            ]}
          >
            History
          </Text>
        </TouchableOpacity>
      </View>

      {/* Tab Content */}
      {activeTab === "create" ? (
        <ScrollView style={styles.receiptContainer} showsVerticalScrollIndicator={false}>
          <View style={styles.receiptInfoCard}>
            <View style={styles.receiptInfoRow}>
              <View style={styles.receiptInfoItem}>
                <Ionicons name="calendar-outline" size={16} color="#F59E0B" />
                <Text style={styles.receiptInfoLabel}>Date & Time (UTC)</Text>
              </View>
              <Text style={styles.receiptInfoValue}>{getCurrentDateTime()}</Text>
            </View>
            <View style={styles.receiptInfoRow}>
              <View style={styles.receiptInfoItem}>
                <Ionicons name="person-outline" size={16} color="#F59E0B" />
                <Text style={styles.receiptInfoLabel}>Cashier</Text>
              </View>
              <Text style={styles.receiptInfoValue}>WinKyaw</Text>
            </View>
            <View style={styles.customerInputSection}>
              <Text style={styles.customerInputLabel}>
                Customer Name (Optional)
              </Text>
              <Input
                placeholder="Enter customer name or leave blank for walk-in"
                value={customerName}
                onChangeText={setCustomerName}
                style={styles.customerInput}
                maxLength={50}
              />
              {customerNameError ? (
                <View style={styles.fieldErrorContainer}>
                  <Ionicons name="alert-circle" size={16} color="#EF4444" />
                  <Text style={styles.fieldErrorText}>{customerNameError}</Text>
                </View>
              ) : null}
            </View>
          </View>

          <TouchableOpacity
            style={styles.addItemToReceiptButton}
            onPress={() => setShowAddToReceipt(true)}
          >
            <Ionicons name="add-circle-outline" size={24} color="white" />
            <Text style={styles.addItemToReceiptText}>Add Items to Receipt</Text>
          </TouchableOpacity>

          <View style={styles.scannerOptionsContainer}>
            <TouchableOpacity
              style={styles.scannerOptionButton}
              onPress={() => setShowSmartScanner(true)}
            >
              <Ionicons name="scan" size={20} color="#3B82F6" />
              <Text style={styles.scannerOptionText}>Smart Scan</Text>
            </TouchableOpacity>
          </View>

          {receiptItems.length > 0 && (
            <View style={styles.receiptItemsCard}>
              <Text style={styles.receiptItemsTitle}>Items in Receipt</Text>
              {receiptItems.map((item, index) => (
                <View key={`${item.id}-${index}`} style={styles.receiptItem}>
                  <View style={styles.receiptItemInfo}>
                    <Text style={styles.receiptItemName}>{item.name}</Text>
                    <Text style={styles.receiptItemPrice}>
                      ${item.price.toFixed(2)} each
                    </Text>
                  </View>
                  <View style={styles.receiptItemControls}>
                    <View style={styles.quantityControls}>
                      <TouchableOpacity
                        style={styles.quantityButton}
                        onPress={() =>
                          updateReceiptItemQuantity(item.id, item.quantity - 1)
                        }
                      >
                        <Ionicons name="remove" size={16} color="#F59E0B" />
                      </TouchableOpacity>
                      <Text style={styles.quantityText}>{item.quantity}</Text>
                      <TouchableOpacity
                        style={styles.quantityButton}
                        onPress={() =>
                          updateReceiptItemQuantity(item.id, item.quantity + 1)
                        }
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
              <Button
                title={submitting ? "Processing..." : "Complete Transaction"}
                onPress={handleSubmitReceipt}
                disabled={submitting || receiptItems.length === 0}
                color="#10B981"
                style={styles.submitReceiptButton}
              />
              {__DEV__ && (
                <TouchableOpacity
                  style={styles.apiToggleButton}
                  onPress={() => setUseApiIntegration(!useApiIntegration)}
                >
                  <Text style={styles.apiToggleText}>
                    API Integration: {useApiIntegration ? "ON" : "OFF"}
                  </Text>
                </TouchableOpacity>
              )}
              {error && (
                <View style={styles.errorContainer}>
                  <Ionicons name="alert-circle" size={16} color="#EF4444" />
                  <Text style={styles.errorText}>{error}</Text>
                </View>
              )}
            </View>
          )}

          <View style={styles.recentReceiptsSection}>
            <Text style={styles.recentReceiptsTitle}>Recent Receipts</Text>
            {receipts.length === 0 ? (
              <View style={styles.emptyRecentReceipts}>
                <Text style={styles.emptyRecentReceiptsText}>
                  No recent receipts
                </Text>
              </View>
            ) : (
              <View style={styles.recentReceiptsList}>
                {receipts.slice(0, 3).map((receipt, index) => (
                  <View key={receipt.id || index} style={styles.recentReceiptItem}>
                    <View style={styles.recentReceiptInfo}>
                      <Text style={styles.recentReceiptNumber}>
                        #{receipt.receiptNumber}
                      </Text>
                      <Text style={styles.recentReceiptCustomer}>
                        {receipt.customerName || "Walk-in Customer"}
                      </Text>
                    </View>
                    <View style={styles.recentReceiptDetails}>
                      <Text style={styles.recentReceiptTotal}>
                        ${receipt.total.toFixed(2)}
                      </Text>
                      <Text style={styles.recentReceiptDate}>
                        {receipt.dateTime
                          ? new Date(receipt.dateTime).toLocaleDateString()
                          : "Today"}
                      </Text>
                    </View>
                  </View>
                ))}
                <TouchableOpacity
                  style={styles.viewAllReceiptsButton}
                  onPress={() => setActiveTab("list")}
                >
                  <Text style={styles.viewAllReceiptsText}>View All Receipts</Text>
                  <Ionicons name="arrow-forward" size={16} color="#F59E0B" />
                </TouchableOpacity>
              </View>
            )}
          </View>

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
      ) : (
        renderReceiptListTab()
      )}

      <AddItemToReceiptModal
        visible={showAddToReceipt}
        onClose={() => setShowAddToReceipt(false)}
      />

      <SmartScanner
        visible={showSmartScanner}
        onClose={() => setShowSmartScanner(false)}
        onBarcodeDetected={handleSmartBarcodeDetected}
        onOcrDetected={handleSmartOcrDetected}
        ocrApiUrl="http://<YOUR_BACKEND_URL>:<PORT>/api/ocr/myanmar"
      />
    </SafeAreaView>
  );
}