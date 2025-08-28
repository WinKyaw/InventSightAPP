import { StyleSheet, Dimensions } from 'react-native';
import { Colors } from './Colors';

const { width, height } = Dimensions.get('window');

export const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  
  // Header styles
  headerButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  headerButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '500',
  },

  // Login styles
  loginContainer: {
    flex: 1,
    justifyContent: 'center',
    padding: 16,
    backgroundColor: Colors.primary,
  },
  loginCard: {
    backgroundColor: Colors.white,
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
    backgroundColor: Colors.primary,
    borderRadius: 32,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: Colors.text,
  },
  subtitle: {
    fontSize: 16,
    color: Colors.textSecondary,
    marginTop: 8,
    textAlign: 'center',
  },
  inputContainer: {
    gap: 24,
  },
  linkContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  linkText: {
    color: Colors.textSecondary,
  },
  link: {
    color: Colors.primary,
    fontWeight: '600',
  },

  // Dashboard styles
  dashboardContainer: {
    flex: 1,
  },
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
    backgroundColor: Colors.white,
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
    color: Colors.textSecondary,
    marginBottom: 4,
  },
  kpiValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: Colors.success,
  },
  kpiTrend: {
    fontSize: 12,
    fontWeight: '500',
    marginTop: 4,
  },
  progressBar: {
    height: 8,
    backgroundColor: Colors.border,
    borderRadius: 4,
    marginTop: 8,
  },
  progressFill: {
    height: '100%',
    backgroundColor: Colors.primary,
    borderRadius: 4,
  },
  kpiRowSmall: {
    flexDirection: 'row',
    gap: 8,
  },
  kpiCardSmall: {
    flex: 1,
    backgroundColor: Colors.white,
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
    color: Colors.textSecondary,
    marginBottom: 4,
  },
  kpiValueSmall: {
    fontSize: 18,
    fontWeight: 'bold',
  },

  // Performance Card Styles
  performanceCard: {
    backgroundColor: Colors.white,
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
    color: Colors.text,
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
    color: Colors.textSecondary,
  },
  performanceRight: {
    alignItems: 'flex-end',
  },
  performanceValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: Colors.text,
  },

  // Top Items Styles
  topItemsCard: {
    backgroundColor: Colors.white,
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
    color: Colors.text,
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
    color: Colors.textSecondary,
    marginRight: 12,
  },
  topItemName: {
    fontSize: 16,
    fontWeight: '500',
    color: Colors.text,
  },
  topItemUnits: {
    fontSize: 12,
    color: Colors.textSecondary,
  },
  topItemRight: {
    alignItems: 'flex-end',
  },
  topItemValue: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.text,
  },

  // Items Screen Styles
  itemsList: {
    flex: 1,
    padding: 16,
  },
  itemsCard: {
    backgroundColor: Colors.white,
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
    color: Colors.text,
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
    color: Colors.textSecondary,
  },
  itemActions: {
    flexDirection: 'row',
    gap: 8,
    marginLeft: 8,
  },
  editButton: {
    padding: 8,
    borderRadius: 6,
    backgroundColor: '#EFF6FF',
    borderWidth: 1,
    borderColor: '#BFDBFE',
  },
  deleteButton: {
    padding: 8,
    borderRadius: 6,
    backgroundColor: '#FEF2F2',
    borderWidth: 1,
    borderColor: '#FECACA',
  },

  // Stock Management Styles
  stockInfoCard: {
    backgroundColor: '#F9FAFB',
    padding: 16,
    borderRadius: 8,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  stockInfoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  stockInfoItem: {
    flex: 1,
  },
  stockInfoLabel: {
    fontSize: 12,
    color: Colors.textSecondary,
    marginBottom: 4,
  },
  stockInfoValue: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.text,
  },
  stockPreview: {
    alignItems: 'center',
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
  stockPreviewLabel: {
    fontSize: 14,
    color: Colors.textSecondary,
    marginBottom: 4,
  },
  stockPreviewValue: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  lowStockWarning: {
    fontSize: 12,
    color: '#EF4444',
    marginTop: 4,
  },
  operationSelector: {
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.text,
    marginBottom: 12,
  },
  operationOptions: {
    flexDirection: 'row',
    gap: 8,
  },
  operationOption: {
    flex: 1,
    alignItems: 'center',
    padding: 12,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: '#E5E7EB',
    backgroundColor: Colors.white,
  },
  operationOptionSelected: {
    backgroundColor: '#F9FAFB',
  },
  operationOptionText: {
    fontSize: 12,
    fontWeight: '500',
    marginTop: 4,
    textAlign: 'center',
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
    color: Colors.textSecondary,
  },
  itemExpandedValue: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.text,
  },
  expandedActions: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 12,
    backgroundColor: Colors.white,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  actionButtonText: {
    fontSize: 14,
    fontWeight: '500',
    marginLeft: 8,
    color: Colors.text,
  },

  // No items state
  noItemsContainer: {
    padding: 40,
    alignItems: 'center',
  },
  noItemsText: {
    fontSize: 16,
    color: Colors.lightGray,
    fontWeight: '600',
    marginTop: 12,
    marginBottom: 4,
  },
  noItemsSubtext: {
    fontSize: 14,
    color: Colors.lightGray,
    textAlign: 'center',
  },

  // Employees Screen Styles
  employeeStats: {
    flexDirection: 'row',
    padding: 16,
    gap: 16,
  },
  employeeStatCard: {
    flex: 1,
    backgroundColor: Colors.white,
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
    color: Colors.textSecondary,
    marginBottom: 4,
  },
  employeeStatValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: Colors.text,
  },
  employeesList: {
    flex: 1,
    paddingHorizontal: 16,
  },
  employeesCard: {
    backgroundColor: Colors.white,
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
    color: Colors.text,
  },
  employeeTitle: {
    fontSize: 14,
    color: Colors.textSecondary,
  },
  employeeStat: {
    alignItems: 'center',
  },
  employeeStatSmallLabel: {
    fontSize: 10,
    color: Colors.textSecondary,
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
    color: Colors.textSecondary,
  },
  employeeExpandedValue: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.text,
  },

  // Calendar Screen Styles
  calendarContainer: {
    flex: 1,
  },
  calendarCard: {
    backgroundColor: Colors.white,
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
    color: Colors.text,
    marginBottom: 16,
  },
  reminderCard: {
    borderWidth: 1,
    borderColor: Colors.border,
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
    color: Colors.text,
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
    color: Colors.textSecondary,
    marginBottom: 4,
  },
  reminderDescription: {
    fontSize: 14,
    color: Colors.textSecondary,
  },

  // Receipt Screen Styles
  receiptContainer: {
    flex: 1,
    padding: 16,
  },
  receiptInfoCard: {
    backgroundColor: Colors.white,
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
    color: Colors.textSecondary,
    marginLeft: 8,
  },
  receiptInfoValue: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.text,
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
    borderColor: Colors.border,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 16,
    backgroundColor: Colors.white,
    marginBottom: 0,
  },
  addItemToReceiptButton: {
    backgroundColor: Colors.accent,
    borderRadius: 12,
    paddingVertical: 16,
    paddingHorizontal: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
    shadowColor: Colors.accent,
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
    backgroundColor: Colors.white,
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
    color: Colors.text,
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
    color: Colors.text,
    marginBottom: 2,
  },
  receiptItemPrice: {
    fontSize: 14,
    color: Colors.textSecondary,
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
    color: Colors.text,
    paddingHorizontal: 12,
  },
  receiptItemTotal: {
    fontSize: 16,
    fontWeight: 'bold',
    color: Colors.text,
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
    borderTopColor: Colors.border,
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  totalLabel: {
    fontSize: 16,
    color: Colors.textSecondary,
  },
  totalValue: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.text,
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
    color: Colors.text,
  },
  grandTotalValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: Colors.accent,
  },
  submitReceiptButton: {
    marginTop: 20,
  },
  emptyReceiptCard: {
    backgroundColor: Colors.white,
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
    color: Colors.lightGray,
    marginTop: 16,
    marginBottom: 8,
  },
  emptyReceiptText: {
    fontSize: 14,
    color: Colors.lightGray,
    textAlign: 'center',
    lineHeight: 20,
  },

  // Modal styles
  modalRow: {
    flexDirection: 'row',
    marginBottom: 16,
  },
  modalSubtitle: {
    fontSize: 16,
    color: '#374151',
    marginBottom: 16,
    fontWeight: '600',
  },
  modalButtons: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 24,
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
    color: Colors.primary,
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
    backgroundColor: Colors.primary,
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
    borderColor: Colors.border,
    borderRadius: 6,
    alignItems: 'center',
  },
  pickerOptionSelected: {
    backgroundColor: '#EFF6FF',
    borderColor: Colors.primary,
  },
  pickerOptionText: {
    fontSize: 14,
    color: Colors.textSecondary,
  },
  pickerOptionTextSelected: {
    color: Colors.primary,
    fontWeight: '500',
  },
  textArea: {
    height: 80,
    textAlignVertical: 'top',
  },

  // Filter/Sort Modal Styles
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
    borderColor: Colors.border,
  },
  categoryOptionSelected: {
    backgroundColor: '#DCFCE7',
    borderColor: Colors.success,
  },
  categoryOptionText: {
    fontSize: 16,
    color: '#374151',
    fontWeight: '500',
  },
  categoryOptionTextSelected: {
    color: Colors.success,
    fontWeight: '600',
  },
  customCategorySection: {
    marginTop: 24,
    paddingTop: 24,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
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
    marginBottom: 0,
  },
  customCategoryButton: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    minWidth: 60,
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
    color: Colors.success,
    fontWeight: '600',
  },

  // Add Item Modal Styles
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
    color: Colors.text,
    marginBottom: 4,
  },
  addItemDetails: {
    fontSize: 14,
    color: Colors.textSecondary,
  },
  inReceiptText: {
    color: Colors.accent,
    fontWeight: '500',
  },
  addItemButton: {
    backgroundColor: Colors.accent,
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
    color: Colors.lightGray,
    fontSize: 12,
    fontWeight: '500',
  },

  // Day Details Modal Styles
  daySummaryCard: {
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  daySummaryTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: Colors.text,
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
    color: Colors.textSecondary,
    marginBottom: 4,
  },
  daySummaryValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: Colors.text,
  },
  dayTopItemsCard: {
    backgroundColor: Colors.white,
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  dayTopItemsTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: Colors.text,
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
    color: Colors.textSecondary,
    marginRight: 12,
    width: 24,
  },
  dayTopItemName: {
    fontSize: 16,
    fontWeight: '500',
    color: Colors.text,
  },
  dayTopItemRight: {
    alignItems: 'flex-end',
  },
  dayTopItemSales: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.success,
  },
  dayTopItemQuantity: {
    fontSize: 12,
    color: Colors.textSecondary,
  },
  dayActivitiesCard: {
    backgroundColor: Colors.white,
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  dayActivitiesTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: Colors.text,
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
    color: Colors.accent,
    marginBottom: 2,
  },
  dayActivityDescription: {
    fontSize: 14,
    color: Colors.textSecondary,
  },
  demoInfo: {
    backgroundColor: '#E3F2FD',
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#BBDEFB',
  },
  demoText: {
    fontSize: 12,
    color: '#1565C0',
    textAlign: 'center',
    fontFamily: 'monospace',
  },
  statusInfo: {
    backgroundColor: '#E8F5E8',
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#C8E6C9',
  },
  statusText: {
    fontSize: 11,
    color: '#2E7D32',
    textAlign: 'center',
    fontFamily: 'monospace',
    lineHeight: 16,
  },
  emergencyButton: {
    backgroundColor: '#FF9800',
    padding: 12,
    borderRadius: 8,
    marginTop: 10,
    marginBottom: 10,
  },
  emergencyButtonText: {
    color: 'white',
    textAlign: 'center',
    fontSize: 14,
    fontWeight: '600',
  },
});