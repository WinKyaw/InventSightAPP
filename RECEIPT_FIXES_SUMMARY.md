# Receipt Page Fixes - Implementation Summary

## Overview
This implementation fixes two critical issues with the Receipt page:
1. **Store Selection & Sharing**: Receipt page now uses the same store selected on the Items page
2. **Payment Method Timing**: Payment method is now selected AFTER receipt creation, not during

## Changes Made

### 1. Store Context (New)
**File**: `context/StoreContext.tsx`

Created a new React context to share the current store selection across the Items and Receipt pages. This ensures both pages work with the same store without requiring manual coordination.

**Key Features**:
- Stores the currently selected store
- Provides `isStoreReady` flag to check if a store is selected
- Automatically updates when store changes

### 2. App Layout Update
**File**: `app/_layout.tsx`

Added `StoreProvider` wrapper around the app to make the store context available to all screens.

```tsx
<StoreProvider>
  <OfflineProvider>
    {/* ... rest of providers */}
  </OfflineProvider>
</StoreProvider>
```

### 3. Items Page Update
**File**: `app/(tabs)/items.tsx`

**Changes**:
- Replaced local `currentStore` state with shared `useStore()` hook
- Store selection now updates the shared context
- Other pages can now read the selected store

**Code Change**:
```tsx
// OLD: Local state
const [currentStore, setCurrentStore] = useState<Store | null>(null);

// NEW: Shared context
const { currentStore, setCurrentStore } = useStore();
```

### 4. Receipt Page Major Updates
**File**: `app/(tabs)/receipt.tsx`

**Changes**:
1. **Store Integration**:
   - Added `useStore()` hook to read current store
   - Display current store in receipt info card
   - Validate store is selected before creating receipt
   - Show warning if no store selected

2. **Removed Payment Method from Creation**:
   - Removed payment method selection UI from receipt creation step
   - Created new `handleCreatePendingReceipt` function
   - Receipts are now created with `status: 'PENDING'` and no `paymentMethod`
   - Button text changed from "Complete Transaction" to "Save as Pending Receipt"

3. **Payment Modal Integration**:
   - Added `PaymentModal` component
   - Added "Pay Now" handler for pending receipts
   - Payment modal opens when user clicks "Pay Now" on a pending receipt

### 5. Payment Modal (New)
**File**: `components/receipt/PaymentModal.tsx`

A new modal component for completing payment on pending receipts.

**Features**:
- Shows receipt number and total amount
- Allows selection of payment method (CASH, CARD, MOBILE, OTHER)
- Calls `/api/receipts/{id}/complete` endpoint with selected payment method
- Provides visual feedback during payment processing
- Refreshes pending receipts list after successful payment

### 6. Pending Receipt Card Update
**File**: `components/ui/PendingReceiptCard.tsx`

**Changes**:
- Added `onPayNow` callback prop
- Added "Pay Now" button that shows when `!receipt.paymentMethod`
- Button styled with orange theme to match payment focus

## User Flow Changes

### Before (Old Flow)
1. User goes to Receipt page
2. Sees "No store assigned" warning
3. Adds items to receipt
4. Selects payment method (CASH/CARD/etc.)
5. Clicks "Complete Transaction"
6. Receipt created but store may be wrong

### After (New Flow)
1. User goes to Items page and selects a store
2. Goes to Receipt page
3. Sees selected store displayed in receipt info
4. Adds items to receipt
5. Clicks "Save as Pending Receipt" (no payment method yet)
6. Receipt saved with PENDING status
7. Later, user clicks "Pay Now" on the pending receipt
8. Payment modal appears with payment method options
9. User selects payment method and completes payment

## API Changes

### Receipt Creation
**Endpoint**: `POST /api/receipts`

**New Payload**:
```json
{
  "storeId": "store-uuid-from-context",
  "customerName": "Customer Name or Walk-in Customer",
  "items": [
    { "productId": "123", "quantity": 2 }
  ],
  "status": "PENDING"
  // NO paymentMethod field
}
```

### Payment Completion
**Endpoint**: `PUT /api/receipts/{receiptId}/complete`

**Payload**:
```json
{
  "paymentMethod": "CASH" // or CARD, MOBILE, OTHER
}
```

## Testing Guide

### Test 1: Store Selection Sharing
1. Open the app and navigate to Items page
2. Select a store from the store selector
3. Navigate to Receipt page
4. **Expected**: Receipt info card shows the same store you selected
5. Go back to Items, select a different store
6. Return to Receipt page
7. **Expected**: Receipt info card updates to show the new store

### Test 2: No Store Warning
1. Clear app state or use a new installation
2. Navigate directly to Receipt page (without selecting store)
3. **Expected**: Warning message appears: "No store selected. Please go to Items page and select a store before creating receipts."
4. Try to add items and create receipt
5. **Expected**: Alert appears prompting to go to Items page to select a store

### Test 3: Pending Receipt Creation
1. Select a store on Items page
2. Go to Receipt page
3. Add items to the receipt
4. **Expected**: No payment method selection visible
5. Click "Save as Pending Receipt"
6. **Expected**: Success alert appears
7. **Expected**: Receipt appears in Pending Receipts section
8. **Expected**: Receipt form is cleared (no items)

### Test 4: Payment Completion
1. Create a pending receipt (following Test 3)
2. Scroll to Pending Receipts section
3. Find the pending receipt you created
4. **Expected**: "Pay Now" button is visible
5. Click "Pay Now"
6. **Expected**: Payment modal appears showing receipt number and total
7. Select a payment method (e.g., CASH)
8. Click "Complete Payment"
9. **Expected**: Success message appears
10. **Expected**: Receipt disappears from Pending Receipts (or moves to completed)

### Test 5: Multiple Stores
1. If you have multiple stores, select Store A on Items page
2. Create a pending receipt
3. Go back to Items page and select Store B
4. Create another pending receipt
5. **Expected**: Each receipt is associated with the correct store
6. Verify receipts in backend/database have correct storeId

## Potential Issues & Solutions

### Issue: Store not persisting between app restarts
**Solution**: The StoreContext currently doesn't persist to AsyncStorage. If persistence is needed, add:
```tsx
// In StoreContext.tsx
useEffect(() => {
  AsyncStorage.setItem('selectedStore', JSON.stringify(currentStore));
}, [currentStore]);

// On mount
useEffect(() => {
  const loadStore = async () => {
    const stored = await AsyncStorage.getItem('selectedStore');
    if (stored) setCurrentStore(JSON.parse(stored));
  };
  loadStore();
}, []);
```

### Issue: Backend doesn't support PENDING status
**Solution**: The backend may need to be updated to:
1. Accept receipts without `paymentMethod`
2. Support `status: 'PENDING'`
3. Implement `PUT /api/receipts/{id}/complete` endpoint

### Issue: Old receipts created with payment method
**Solution**: The `PendingReceiptCard` checks `!receipt.paymentMethod` before showing "Pay Now" button. Old receipts will not show the button, which is correct behavior.

## Files Changed

### New Files (2)
1. `context/StoreContext.tsx` - Store sharing context
2. `components/receipt/PaymentModal.tsx` - Payment completion modal

### Modified Files (5)
1. `app/_layout.tsx` - Added StoreProvider
2. `app/(tabs)/items.tsx` - Uses shared store context
3. `app/(tabs)/receipt.tsx` - Major changes for store integration and pending receipts
4. `components/ui/PendingReceiptCard.tsx` - Added Pay Now button

## Benefits

1. **Better User Experience**: Store selection is shared, reducing confusion
2. **Clear Payment Flow**: Payment is a separate step after receipt creation
3. **Pending Receipts**: Receipts can be created and paid later
4. **Flexibility**: Cashiers can create multiple receipts before taking payments
5. **Accuracy**: Reduces errors from wrong store assignment

## Next Steps

1. Test thoroughly on development environment
2. Update backend if needed to support PENDING status and completion endpoint
3. Add store persistence if needed (AsyncStorage)
4. Consider adding receipt editing capabilities for pending receipts
5. Add ability to cancel/delete pending receipts
6. Add filtering/searching for pending receipts
