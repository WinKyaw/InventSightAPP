# Transfer Request System - Frontend Documentation

## Overview

The Transfer Request System provides a comprehensive UI for managing inventory transfers between locations (Stores and Warehouses). This system supports the complete transfer lifecycle from request creation to receipt confirmation with role-based permissions and real-time tracking.

## Features

### 🎯 Core Functionality
- **Universal Transfer Support**: Store↔Store, Warehouse↔Warehouse, Store↔Warehouse
- **Role-Based Access Control**: Different permissions for regular users and GM+ roles
- **Complete Tracking**: Visual timeline showing request, approval, shipment, and receipt
- **Smart Filtering**: Search by status, location, date range, and item name
- **Analytics Dashboard**: Summary statistics and reports

### 👥 User Roles & Permissions

#### All Users (Authenticated)
- Create transfer requests
- View their own requests
- View transfers involving their assigned locations
- Cancel pending requests they created

#### GM+ Roles (FOUNDER, CEO, GENERAL_MANAGER, STORE_MANAGER, ADMIN)
- All user permissions
- Approve/reject pending transfer requests
- Add carrier information when approving
- View all transfer requests across all locations

#### Destination Location Users
- Confirm receipt of delivered transfers
- Record actual received quantities
- Report damages or partial deliveries

## Architecture

### File Structure

```
├── types/
│   └── transfer.ts                          # TypeScript interfaces
├── services/api/
│   ├── config.ts                            # API endpoints (updated)
│   └── transferRequestService.ts            # API service layer
├── hooks/
│   ├── useTransferRequests.ts               # Data fetching hook
│   └── useTransferPermissions.ts            # Permission checking hook
├── components/transfer/
│   ├── TransferStatusBadge.tsx              # Status indicator
│   ├── TransferTimeline.tsx                 # Progress timeline
│   ├── TransferRequestCard.tsx              # List item card
│   ├── TransferFilters.tsx                  # Filter component
│   ├── LocationSelector.tsx                 # Location dropdown
│   ├── ApproveTransferModal.tsx             # GM+ approval modal
│   ├── ReceiveTransferModal.tsx             # Receipt confirmation modal
│   └── index.ts                             # Barrel export
└── app/
    ├── transfer-requests.tsx                # Main list screen
    ├── transfer-request-create.tsx          # Create request screen
    ├── transfer-detail/[id].tsx             # Detail view screen
    └── transfer-history.tsx                 # Reports screen
```

### Data Flow

```
User Action → Screen → Hook → Service → API → Backend
                ↓
           Component ← State Update ← Response
```

## API Integration

### Endpoints

All endpoints are configured in `services/api/config.ts`:

```typescript
TRANSFER_REQUESTS: {
  ALL: '/api/transfer-requests',
  BY_ID: (id) => `/api/transfer-requests/${id}`,
  CREATE: '/api/transfer-requests',
  SEND: (id) => `/api/transfer-requests/${id}/send`,
  REJECT: (id) => `/api/transfer-requests/${id}/reject`,
  CONFIRM_RECEIPT: (id) => `/api/transfer-requests/${id}/receive',
  CANCEL: (id) => `/api/transfer-requests/${id}/cancel`,
  HISTORY: '/api/transfer-requests/history',
  SUMMARY: '/api/transfer-requests/summary',
}
```

### Service Methods

See `services/api/transferRequestService.ts` for all available methods:
- `createTransferRequest(request)`
- `getTransferRequests(filters, page, size)`
- `getTransferRequestById(id)`
- `approveAndSendTransfer(id, sendData)`
- `rejectTransfer(id, reason)`
- `confirmReceipt(id, receiptData)`
- `cancelTransfer(id, reason)`
- `getTransferHistory(locationId, locationType)`
- `getTransferSummary(filters)`

## User Flows

### 1. Creating a Transfer Request

```
User → /transfer-request-create
  ↓
Select From Location (Store/Warehouse)
  ↓
Select To Location (different from above)
  ↓
Search & Select Product
  ↓
Enter Quantity (validated against available stock)
  ↓
Select Priority (High/Medium/Low)
  ↓
Enter Reason (required) & Notes (optional)
  ↓
Submit → Success → Navigate to /transfer-requests
```

**Key Validations:**
- From ≠ To location
- Quantity > 0 and ≤ available stock
- Reason is required
- All required fields filled

### 2. Approving a Transfer (GM+ Only)

```
GM+ User → /transfer-detail/[id]
  ↓
View Pending Request
  ↓
Click "Approve & Send"
  ↓
Modal Opens: ApproveTransferModal
  ↓
Enter/Modify Approved Quantity
  ↓
Enter Carrier Info (name, phone, vehicle)
  ↓
Set Estimated Delivery Date
  ↓
Add Approval Notes (optional)
  ↓
Submit → Transfer status = IN_TRANSIT
```

**Key Actions:**
- Can modify approved quantity (up to requested or available)
- Required: Carrier name
- Optional: Phone, vehicle, estimated delivery, notes
- Alternative: "Reject" button to reject the request

### 3. Receiving a Transfer

```
Destination User → /transfer-detail/[id]
  ↓
View Delivered/In-Transit Transfer
  ↓
Click "Confirm Receipt"
  ↓
Modal Opens: ReceiveTransferModal
  ↓
Enter Received Quantity
  ↓
Select Condition (Good/Damaged/Partial)
  ↓
Add Receipt Notes
  ↓
Submit → Transfer status = RECEIVED/COMPLETED
```

**Condition Options:**
- **Good**: All items received in perfect condition
- **Damaged**: Some items damaged (shows damage notes field)
- **Partial**: Missing items (shows missing items field)

### 4. Viewing Transfer History

```
User → /transfer-history
  ↓
View Summary Statistics
  - Total transfers
  - Pending/Completed/In-Transit counts
  - Average delivery time
  - Top requested items
  - Most active routes
  ↓
Apply Filters (date range, status, location)
  ↓
View Transfer List
  ↓
Export (CSV/PDF) - placeholder for future
```

## Status Workflow

```
PENDING → (GM+ Approves) → IN_TRANSIT → (Delivered) → RECEIVED → COMPLETED
   ↓                           ↑
   └──(GM+ Rejects)→ REJECTED  └──(User Cancels)→ CANCELLED
```

**Status Descriptions:**
- **PENDING**: Awaiting GM+ approval
- **APPROVED**: Approved but not yet shipped (transitional)
- **IN_TRANSIT**: Shipped with carrier info
- **DELIVERED**: Arrived at destination
- **RECEIVED**: Confirmed received by destination user
- **PARTIALLY_RECEIVED**: Some items received/damaged
- **COMPLETED**: Fully completed and inventory updated
- **REJECTED**: Rejected by GM+
- **CANCELLED**: Cancelled by requester

## Component Usage

### TransferStatusBadge

```tsx
import { TransferStatusBadge } from '@/components/transfer';

<TransferStatusBadge 
  status={TransferStatus.IN_TRANSIT} 
  size="medium" // small | medium | large
/>
```

### TransferTimeline

```tsx
import { TransferTimeline } from '@/components/transfer';

<TransferTimeline timeline={transfer.timeline} />
```

### TransferRequestCard

```tsx
import { TransferRequestCard } from '@/components/transfer';

<TransferRequestCard
  transfer={transfer}
  onPress={(t) => router.push(`/transfer-detail/${t.id}`)}
  showActions
  onActionPress={(t, action) => handleAction(t, action)}
/>
```

### TransferFilters

```tsx
import { TransferFilters } from '@/components/transfer';

<TransferFilters
  filters={filters}
  onApply={handleApplyFilters}
  onClear={handleClearFilters}
/>
```

### LocationSelector

```tsx
import { LocationSelector } from '@/components/transfer';

<LocationSelector
  locationType={LocationType.STORE}
  selectedId={selectedStoreId}
  onSelect={setSelectedStoreId}
  excludeId={fromLocationId} // Prevent same location
/>
```

### ApproveTransferModal

```tsx
import { ApproveTransferModal } from '@/components/transfer';

<ApproveTransferModal
  visible={showModal}
  transfer={transfer}
  onClose={() => setShowModal(false)}
  onApprove={handleApprove}
  onReject={handleReject}
/>
```

### ReceiveTransferModal

```tsx
import { ReceiveTransferModal } from '@/components/transfer';

<ReceiveTransferModal
  visible={showModal}
  transfer={transfer}
  onClose={() => setShowModal(false)}
  onConfirm={handleConfirmReceipt}
/>
```

## Custom Hooks

### useTransferRequests

Manages fetching, filtering, and pagination of transfer requests.

```tsx
import { useTransferRequests } from '@/hooks/useTransferRequests';

const {
  transfers,           // Array of transfer requests
  loading,            // Loading state
  error,              // Error message if any
  refreshing,         // Pull-to-refresh state
  currentPage,        // Current page number
  totalPages,         // Total pages available
  totalItems,         // Total items count
  hasMore,            // Whether more items exist
  filters,            // Current filters
  refresh,            // Function to refresh
  loadMore,           // Function to load next page
  applyFilters,       // Function to apply new filters
  clearFilters,       // Function to clear filters
  goToPage,           // Function to go to specific page
} = useTransferRequests(initialFilters, page, pageSize);
```

### useTransferRequest

Manages fetching and updating a single transfer request.

```tsx
import { useTransferRequest } from '@/hooks/useTransferRequests';

const {
  transfer,    // Transfer request object
  loading,     // Loading state
  error,       // Error message if any
  refresh,     // Function to refresh
  setTransfer, // Function to manually update
} = useTransferRequest(transferId);
```

### useTransferPermissions

Checks user permissions for various transfer operations.

```tsx
import { useTransferPermissions } from '@/hooks/useTransferPermissions';

const {
  isGMPlus,               // Is user GM+ role?
  canApproveTransfer,     // Can approve this transfer?
  canRejectTransfer,      // Can reject this transfer?
  canCancelTransfer,      // Can cancel this transfer?
  canReceiveTransfer,     // Can receive this transfer?
  canCreateTransfer,      // Can create transfers?
  canViewTransfer,        // Can view this transfer?
  hasLocationAccess,      // Has access to location?
  getAccessibleLocations, // Get user's location IDs
} = useTransferPermissions();
```

## Styling & Design

### Color Scheme

Status colors are defined in `TransferStatusBadge`:
- 🔵 **Pending**: Blue (#3B82F6)
- 🟢 **Approved**: Green (#10B981)
- 🟡 **In Transit**: Yellow (#F59E0B)
- 🟠 **Delivered**: Orange (#F97316)
- ✅ **Received/Completed**: Success Green (#059669)
- ⚡ **Partial**: Purple (#8B5CF6)
- ❌ **Rejected/Cancelled**: Red (#EF4444)

### Responsive Design

All components use React Native's `StyleSheet` and are optimized for:
- Mobile phones (primary)
- Tablets
- Responsive layouts with `flex` and `flexDirection`

## Navigation

Using Expo Router file-based routing:

```
/transfer-requests           → Main list screen
/transfer-request-create     → Create new request
/transfer-detail/[id]        → View/edit specific transfer
/transfer-history            → History and reports
```

**Access via Hamburger Menu:**
Menu → Transfer Requests (accessible to all authenticated users)

## Testing Guidelines

### Manual Testing Checklist

#### Create Request Flow
- [ ] Can select Store as From location
- [ ] Can select Warehouse as From location  
- [ ] Cannot select same location for To
- [ ] Product search works and shows results
- [ ] Quantity validation prevents invalid inputs
- [ ] Cannot request more than available stock
- [ ] Priority selector works (High/Medium/Low)
- [ ] Reason field validation (required)
- [ ] Success message appears after creation
- [ ] Redirects to list after success

#### Approval Flow (GM+ only)
- [ ] "Approve & Send" button visible for pending transfers
- [ ] Modal opens with pre-filled data
- [ ] Can modify approved quantity
- [ ] Carrier info validation works
- [ ] Date picker works for estimated delivery
- [ ] Approve action updates status to IN_TRANSIT
- [ ] Reject action updates status to REJECTED
- [ ] Non-GM+ users don't see approve buttons

#### Receipt Flow
- [ ] "Confirm Receipt" button visible for delivered transfers
- [ ] Modal pre-fills receiver name from current user
- [ ] Can enter received quantity
- [ ] Condition checkboxes work correctly
- [ ] Damage notes appear when "Damaged" selected
- [ ] Missing items notes appear when "Partial" selected
- [ ] Confirm action updates status to RECEIVED

#### List & Filters
- [ ] Transfer list loads and displays correctly
- [ ] Filters can be applied and cleared
- [ ] Search works for item names and transfer IDs
- [ ] Pull-to-refresh works
- [ ] Pagination/load more works
- [ ] Empty state shows when no results
- [ ] Card tap navigates to detail screen

#### History & Reports
- [ ] Summary statistics display correctly
- [ ] Filters work on history view
- [ ] Export buttons show "coming soon" alerts

### API Integration Testing

Requires backend to be running with transfer request endpoints implemented.

**Test with sample data:**
1. Create requests with various priorities
2. Approve some, reject others (as GM+)
3. Confirm receipts with different conditions
4. Verify status transitions
5. Check filtering and search
6. Validate summary statistics

## Known Limitations

1. **Location Assignment**: Currently simplified - full implementation requires backend API for user location assignments
2. **Export Functionality**: CSV/PDF export shows placeholder alerts - implementation pending
3. **Real-time Updates**: No WebSocket/SSE for live status updates - uses pull-to-refresh
4. **Offline Support**: Not implemented - requires network connection
5. **Image Upload**: Product images not supported in current version

## Future Enhancements

### Planned Features
- [ ] Barcode scanning for product selection
- [ ] Real-time notifications for status changes
- [ ] Batch transfer requests
- [ ] Transfer templates for recurring requests
- [ ] Photo attachments for damages/issues
- [ ] Route optimization suggestions
- [ ] QR code generation for tracking
- [ ] Offline mode with sync
- [ ] Advanced analytics with charts
- [ ] Email/SMS notifications
- [ ] Multi-item transfers in single request
- [ ] Transfer approval workflow (multi-level)

## Troubleshooting

### Common Issues

**Issue: "Cannot connect to API"**
- Ensure backend is running
- Check API_BASE_URL in services/api/config.ts
- Verify network connectivity

**Issue: "Permission denied"**
- Check user role in AuthContext
- Verify token is valid and not expired
- Ensure user has necessary role (GM+ for approvals)

**Issue: "Location not found"**
- Verify stores/warehouses exist in backend
- Check LocationSelector API calls
- Ensure user has location assignments

**Issue: "Product search returns no results"**
- Verify products exist in backend
- Check product API endpoints
- Ensure store/warehouse has products

## Support & Contribution

For issues, questions, or contributions:
1. Check existing documentation
2. Review code comments in components
3. Consult backend API documentation
4. Create GitHub issue with reproduction steps

## License

Part of the InventSightAPP - POS & Inventory Management System
