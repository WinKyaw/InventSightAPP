# Transfer Request Components

This directory contains the React Native components for the Transfer Request feature.

## Components

### 1. TransferFilters.tsx
A comprehensive filter component for transfer requests with:
- **Status Filter**: Dropdown/chip selector for all transfer statuses (All, Pending, Approved, In Transit, Delivered, Received, Completed, Rejected, Cancelled)
- **Search Input**: Search by item name or transfer ID
- **Date Range**: From and To date pickers
- **Actions**: Apply and Clear buttons

**Usage:**
```tsx
import { TransferFilters } from './components/transfer';

<TransferFilters
  filters={filters}
  onApply={(newFilters) => setFilters(newFilters)}
  onClear={() => setFilters({ status: 'ALL' })}
/>
```

### 2. LocationSelector.tsx
A smart dropdown selector for choosing stores or warehouses:
- **Location Type**: Supports both STORE and WAREHOUSE
- **Auto-fetch**: Automatically loads locations based on type
- **Visual Indicators**: Shows store/warehouse badge icons
- **Exclusion**: Can exclude a location (e.g., to prevent same-location transfers)
- **Address Display**: Shows location address if available

**Usage:**
```tsx
import { LocationSelector } from './components/transfer';
import { LocationType } from './types/transfer';

<LocationSelector
  locationType={LocationType.STORE}
  selectedId={fromLocationId}
  onSelect={(id, name) => setFromLocation({ id, name })}
  excludeId={toLocationId}
  label="From Location"
  placeholder="Select source location"
/>
```

### 3. ApproveTransferModal.tsx
Modal for GM+ users to approve and send transfer requests:
- **Transfer Summary**: Displays key transfer information
- **Quantity Adjustment**: Edit approved quantity (max = requested)
- **Carrier Details**: Name, phone, vehicle/tracking number
- **Delivery Estimate**: Optional estimated delivery date picker
- **Approval Notes**: Optional notes field
- **Actions**: Approve & Send, or Reject buttons
- **Validation**: Client-side validation for required fields
- **API Integration**: Calls `approveAndSendTransfer` and `rejectTransfer` services

**Usage:**
```tsx
import { ApproveTransferModal } from './components/transfer';

<ApproveTransferModal
  visible={showModal}
  onClose={() => setShowModal(false)}
  transfer={selectedTransfer}
  onSuccess={() => {
    loadTransfers();
    setShowModal(false);
  }}
/>
```

### 4. ReceiveTransferModal.tsx
Modal for confirming receipt of transfers at destination:
- **Expected Quantity**: Displays the approved/sent quantity
- **Received Quantity**: Input for actual received amount
- **Receiver Info**: Auto-filled from current user context
- **Receipt Date**: Date/time picker (defaults to now)
- **Condition Selector**: Good, Damaged, or Partial with visual icons
- **Conditional Fields**: Shows damage/missing items notes based on condition
- **Receipt Notes**: Optional general notes
- **API Integration**: Calls `confirmReceipt` service

**Usage:**
```tsx
import { ReceiveTransferModal } from './components/transfer';

<ReceiveTransferModal
  visible={showModal}
  onClose={() => setShowModal(false)}
  transfer={selectedTransfer}
  onSuccess={() => {
    loadTransfers();
    setShowModal(false);
  }}
/>
```

## Design Patterns

All components follow the existing app patterns:

- **TypeScript**: Fully typed with proper interfaces
- **Styling**: StyleSheet API with Colors constants
- **Icons**: Ionicons from @expo/vector-icons
- **Validation**: Client-side validation with error messages
- **Loading States**: ActivityIndicator during API calls
- **Error Handling**: Alert dialogs for user feedback
- **Accessibility**: Proper labels and hints
- **Reusable UI**: Leverages existing Modal, Input, Button, DatePicker components

## Dependencies

- `services/api/transferRequestService.ts` - API service methods
- `services/api/storeService.ts` - Store fetching
- `services/api/warehouse.ts` - Warehouse fetching
- `types/transfer.ts` - Type definitions
- `constants/Colors.ts` - Color palette
- `context/AuthContext.tsx` - Current user context (ReceiveTransferModal)
- `components/ui/Modal.tsx` - Base modal component
- `components/ui/Input.tsx` - Input component
- `components/ui/Button.tsx` - Button component
- `components/ui/DatePicker.tsx` - Date picker component

## Integration Example

```tsx
import React, { useState, useEffect } from 'react';
import { View, FlatList } from 'react-native';
import {
  TransferFilters,
  ApproveTransferModal,
  ReceiveTransferModal,
} from './components/transfer';
import { getTransferRequests } from './services/api/transferRequestService';
import { TransferRequest, TransferFilters as IFilters } from './types/transfer';

export function TransferRequestsScreen() {
  const [transfers, setTransfers] = useState<TransferRequest[]>([]);
  const [filters, setFilters] = useState<IFilters>({ status: 'ALL' });
  const [selectedTransfer, setSelectedTransfer] = useState<TransferRequest | null>(null);
  const [showApproveModal, setShowApproveModal] = useState(false);
  const [showReceiveModal, setShowReceiveModal] = useState(false);

  const loadTransfers = async () => {
    const response = await getTransferRequests(filters);
    setTransfers(response.items);
  };

  useEffect(() => {
    loadTransfers();
  }, [filters]);

  return (
    <View>
      <TransferFilters
        filters={filters}
        onApply={setFilters}
        onClear={() => setFilters({ status: 'ALL' })}
      />

      <FlatList
        data={transfers}
        renderItem={({ item }) => (
          <TransferCard
            transfer={item}
            onApprove={() => {
              setSelectedTransfer(item);
              setShowApproveModal(true);
            }}
            onReceive={() => {
              setSelectedTransfer(item);
              setShowReceiveModal(true);
            }}
          />
        )}
      />

      <ApproveTransferModal
        visible={showApproveModal}
        onClose={() => setShowApproveModal(false)}
        transfer={selectedTransfer}
        onSuccess={loadTransfers}
      />

      <ReceiveTransferModal
        visible={showReceiveModal}
        onClose={() => setShowReceiveModal(false)}
        transfer={selectedTransfer}
        onSuccess={loadTransfers}
      />
    </View>
  );
}
```

## Notes

- All modals use `ScrollView` for content that may exceed screen height
- Form validation provides immediate feedback
- API errors are handled gracefully with user-friendly alerts
- Loading states prevent duplicate submissions
- DatePicker components use the existing custom DatePicker UI (not native)
- LocationSelector uses custom dropdown (not React Native Picker) for better cross-platform consistency
