# Changelog

All notable changes to InventSight Mobile App will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.2.0] - 2026-02-08

### 🎉 Major Features

#### Complete Transfer Request UI
- ✅ **Transfer Workflow Screens** - Full transfer management interface
  - Transfer list with status filtering (All, Pending, In Transit, Completed)
  - Transfer detail screen with timeline visualization
  - Create transfer request form (select warehouse, store, product, quantity)
  - Approve/reject transfer with carrier details
  - Mark as ready for pickup
  - Start delivery with QR code
  - Mark as delivered with proof of delivery
  - Receive transfer with quantity confirmation and damage tracking
  - Digital signature support
  - Photo upload for proof of delivery

#### Warehouse Management UI
- ✅ **Warehouse Screens** - Complete warehouse inventory interface
  - Warehouse selection and switching
  - Warehouse inventory tab (product list with quantities)
  - Warehouse restocks tab (addition history)
  - Warehouse sales tab (withdrawal history)
  - Add inventory modal
  - Withdraw inventory modal
  - Search and filter functionality
  - Pull-to-refresh support
  - Infinite scroll pagination

#### Store Inventory UI Enhancements
- ✅ **Store Inventory Updates** - Real-time inventory tracking
  - Product quantity updates on transfer receipt
  - Restock history tab showing transfer-in records
  - Transfer reference numbers in restock logs
  - Automatic refresh after transfers

### 🐛 Bug Fixes

#### Transfer Receipt
- **Fixed: Transfer receipt API calls**
  - Proper payload formatting for receive endpoint
  - Idempotency key support
  - Error handling and user feedback
  - Success confirmation and navigation

#### Warehouse Features
- **Fixed: Warehouse sales tab showing data**
  - Proper API integration for withdrawals
  - Transaction type icons (🚚 TRANSFER_OUT, 🚛 ISSUE, etc.)
  - Date formatting and display
  - Empty state handling

#### Data Synchronization
- **Fixed: Cache invalidation on transfers**
  - Clear warehouse cache after transfers
  - Refresh store inventory on receipt
  - Proper state management
  - Optimistic UI updates

### 🎯 Enhancements

#### User Experience
- **Transfer Timeline** - Visual step-by-step progress
- **Status Icons** - Clear status indicators throughout
- **Error Messages** - User-friendly error handling
- **Loading States** - Better feedback during operations
- **Confirmation Dialogs** - Prevent accidental actions
- **Search and Filter** - Easy navigation through transfers

#### Performance
- **Pagination** - Load large datasets efficiently
- **Caching** - 1-minute cache for warehouse data
- **Lazy Loading** - Load data as needed
- **Pull-to-Refresh** - Manual refresh when needed

### 📱 UI Components

#### New Screens
- Transfer List Screen
- Transfer Detail Screen
- Create Transfer Screen
- Receive Transfer Modal
- Warehouse Detail Screen (with tabs)

#### New Components
- TransferCard component
- TransferTimeline component
- TransferStatusBadge component
- WarehouseInventoryList component
- SignaturePad component (for receipts)
- PhotoUpload component (for proof of delivery)

### 📊 Current Features (v0.2.0)

#### ✅ Fully Working Features

**Transfer Management:**
- Create transfer requests
- View transfer list with filtering
- Transfer detail with full information
- Approve/reject transfers with notes
- Assign carrier information
- Mark as ready, in transit, delivered
- Receive transfers with damage tracking
- Transfer timeline visualization
- Status tracking (PENDING → COMPLETED)

**Warehouse Management:**
- View warehouse list
- Switch between warehouses
- View warehouse inventory with pagination
- View warehouse restocks (additions history)
- View warehouse sales (withdrawals history)
- Add inventory to warehouse
- Withdraw inventory from warehouse
- Search warehouse inventory
- Pull-to-refresh all tabs

**Store Inventory:**
- View store products
- Product quantity display
- Restock history tab
- Transfer-in records
- Low stock indicators
- Search and filter products

**User Interface:**
- Bottom tab navigation
- Pull-to-refresh on all lists
- Infinite scroll pagination
- Loading states
- Empty states
- Error handling
- Success feedback

#### 🚧 Partial/In Progress Features

**Transfers:**
- QR code scanning (UI ready, needs camera integration)
- Barcode scanning for products (not implemented)
- Photo editing for proof of delivery (basic upload only)
- Offline mode (not implemented)

**Warehouse:**
- Warehouse settings (not implemented)
- Warehouse reports (not implemented)
- Export data (not implemented)

**Notifications:**
- Push notifications for transfer updates (not implemented)
- In-app notifications (not implemented)

#### ❌ Known Limitations

**Transfer Workflow:**
- Cannot cancel transfers after IN_TRANSIT
- Cannot edit transfer after approval
- No partial receipt UI (must receive full quantity)
- No transfer history filtering by date range

**Warehouse:**
- No batch/lot selection UI
- No warehouse capacity visualization
- No warehouse layout/map view
- No inventory value calculations

**Offline:**
- No offline support (requires internet connection)
- No data sync when back online
- No cached operation queue

**Camera:**
- QR code scanning not implemented
- Barcode scanning not implemented
- Photo capture basic (no editing)

### 🔧 Technical Improvements

**API Integration:**
- Unified API client with error handling
- Idempotency key support
- Request/response interceptors
- Token refresh handling
- Better error messages

**State Management:**
- Proper React hooks usage
- Efficient cache management
- Optimistic UI updates
- Loading state handling

**Performance:**
- Pagination for large lists
- Image lazy loading
- Debounced search
- Memoized calculations

**Code Quality:**
- TypeScript type definitions
- Consistent component structure
- Reusable components
- Clean code practices

### 📝 Migration Notes

**For Users Upgrading from v0.1.0:**
1. Update the app from store/TestFlight
2. Pull to refresh all data
3. Existing data will sync automatically
4. No action required

**For Developers:**
1. Pull latest code: `git pull origin main`
2. Install dependencies: `npm install` or `yarn install`
3. Clear cache: `npx expo start -c`
4. Rebuild: `eas build` (if using EAS)

### 🎯 What's Next (v0.3.0 Roadmap)

**Planned Features:**
- [ ] QR code and barcode scanning
- [ ] Push notifications for transfers
- [ ] Offline mode with sync
- [ ] Transfer cancellation UI
- [ ] Partial receipt UI
- [ ] Advanced filtering and search
- [ ] Export reports (PDF, Excel)
- [ ] Dark mode support
- [ ] Multi-language support

**Improvements:**
- [ ] Camera integration for scanning
- [ ] Photo editing for proof of delivery
- [ ] Better transfer timeline visualization
- [ ] Analytics dashboard
- [ ] Performance optimizations
- [ ] Accessibility improvements

### 🙏 Contributors

- Leon Win (WinKyaw) - Frontend development
- GitHub Copilot - Code assistance

---

## [0.1.0] - 2026-01-11

### Initial Release
- Basic store management UI
- Product listing
- User authentication
- Company and store selection
- Initial warehouse screens

---

For more details, see the [Release Notes](RELEASE_NOTES.md).
