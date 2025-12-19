# GM+ Features Debug & Testing Guide

## Overview

This document provides debug information and testing instructions for GM+ features:
1. **Employee Receipt History Button** - View receipts processed by specific employees
2. **Cashier Filter** - Filter receipts by cashier on the Receipt screen

---

## What Changed

### 1. Fixed Role Check Bug in `employees.tsx`
**Problem:** Code was checking for 'OWNER' role which doesn't exist in backend  
**Solution:** Changed to check for 'FOUNDER' role to match backend

**Before:**
```typescript
user?.role === 'GENERAL_MANAGER' || user?.role === 'CEO' || user?.role === 'OWNER'
```

**After:**
```typescript
user?.role === 'GENERAL_MANAGER' || user?.role === 'CEO' || user?.role === 'FOUNDER' || user?.role === 'ADMIN'
```

### 2. Added Debug Logging

Added comprehensive console logging to help diagnose issues:

#### ReceiptContext.tsx
- Logs when cashier stats are being loaded
- Shows GM+ user detection
- Displays number of cashiers found

#### receipt.tsx  
- Logs user role and GM+ status
- Shows cashier stats data
- Indicates when filter is rendered/hidden

#### employees.tsx
- Logs employee receipts button visibility
- Shows user role check results
- Tracks navigation to employee receipts screen

---

## Backend Roles (Actual)

From `backend/src/main/java/com/pos/inventsight/enums/UserRole.java`:

```java
public enum UserRole {
    CASHIER,
    MANAGER,
    GENERAL_MANAGER,
    CEO,
    FOUNDER,
    ADMIN
}
```

**GM+ Roles** = GENERAL_MANAGER, CEO, FOUNDER, ADMIN

---

## Testing Instructions

### Test 1: Employee Receipt History Button

**Setup:**
1. Login as GM+ user (GENERAL_MANAGER, CEO, FOUNDER, or ADMIN)
2. Navigate to Team Management screen (Employees tab)

**Expected Behavior:**
- Each employee card should show a "📊 Receipts" button (orange background)
- The button should be visible alongside Edit and Delete buttons
- Clicking the button should navigate to employee-receipts screen

**Debug Console Output:**
```
🔍 Employee Receipts Button Check: {
  employeeId: 1,
  employeeName: "John Doe",
  userRole: "GENERAL_MANAGER",
  isGMPlus: true
}
✅ SHOWING receipts button for GM+ user
```

**If Button NOT Showing:**
Check console for:
```
⏭️ NOT showing receipts button - user is not GM+
```
This means user role is not GM+.

---

### Test 2: Cashier Filter on Receipt Screen

**Setup:**
1. Login as GM+ user (GENERAL_MANAGER, CEO, FOUNDER, or ADMIN)
2. Navigate to Receipt screen
3. Check both "Create" and "History" tabs

**Expected Behavior (Create Tab):**
- Should see "View receipts by cashier:" filter below receipt form
- Shows buttons: "All Cashiers" + individual cashier buttons with receipt counts
- Example: "John Smith (15)" means John processed 15 receipts

**Expected Behavior (History Tab):**
- Should see "Filter by cashier:" filter above receipts list
- Shows buttons: "All" + individual cashier buttons
- Clicking a cashier filters the list to show only their receipts

**Debug Console Output:**
```
🔍 Receipt Screen - User Debug:
  - User role: GENERAL_MANAGER
  - Is GM+: true
  - Cashier stats count: 3
  - Cashier stats data: [...]
  - Selected cashier: null

🔍 ReceiptContext: GM+ check: {
  isGMPlus: true,
  userRole: "GENERAL_MANAGER",
  canMakeApiCalls: true
}
✅ ReceiptContext: Loading cashier stats for GM+ user
📊 ReceiptContext: Loading cashier stats...
✅ ReceiptContext: Cashier stats loaded: [...]
📊 Number of cashiers: 3

🔍 Cashier Filter (Create Tab) Render Check: {
  isGMPlus: true,
  cashierStatsLength: 3,
  shouldShowFilter: true
}
✅ SHOWING cashier filter on Create tab
```

**If Filter NOT Showing:**

Check console for these scenarios:

**Scenario 1: Not GM+**
```
⏭️ ReceiptContext: Not GM+, skipping cashier stats
⏭️ NOT showing cashier filter on Create tab
```
**Solution:** Ensure user has GM+ role

**Scenario 2: No Cashiers Found**
```
✅ ReceiptContext: Cashier stats loaded: []
📊 Number of cashiers: 0
⏭️ NOT showing cashier filter on Create tab
```
**Solution:** Create some receipts first so cashier stats exist

**Scenario 3: API Call Failed**
```
❌ ReceiptContext: Error loading cashier stats: [error details]
```
**Solution:** Check backend is running and endpoint is accessible

---

## API Endpoints Used

### Get Cashier Stats
- **Endpoint:** `GET /api/receipts/cashiers`
- **Access:** GM+ only
- **Returns:**
```json
{
  "userId1": {
    "cashierId": "userId1",
    "cashierName": "John Smith",
    "receiptCount": 15,
    "totalSales": 1250.50
  },
  "userId2": { ... }
}
```

### Get Employee Receipts
- **Endpoint:** `GET /api/receipts/employee/{employeeId}?date=YYYY-MM-DD`
- **Access:** GM+ only
- **Returns:** Array of Receipt objects

---

## Console Log Reference

### ReceiptContext Logs

| Log | Meaning |
|-----|---------|
| `⏭️ ReceiptContext: Not GM+, skipping cashier stats` | User is not GM+, won't load stats |
| `✅ ReceiptContext: Loading cashier stats for GM+ user` | Starting to load cashier stats |
| `📊 ReceiptContext: Loading cashier stats...` | API call initiated |
| `✅ ReceiptContext: Cashier stats loaded: [...]` | Successfully loaded stats |
| `❌ ReceiptContext: Error loading cashier stats` | Failed to load stats |

### Receipt Screen Logs

| Log | Meaning |
|-----|---------|
| `🔍 Receipt Screen - User Debug:` | User info and GM+ check |
| `✅ SHOWING cashier filter on Create tab` | Filter is rendering |
| `⏭️ NOT showing cashier filter on Create tab` | Filter hidden (not GM+ or no data) |

### Employees Screen Logs

| Log | Meaning |
|-----|---------|
| `🔍 Employee Receipts Button Check:` | Checking if button should show |
| `✅ SHOWING receipts button for GM+ user` | Button is rendering |
| `⏭️ NOT showing receipts button - user is not GM+` | Button hidden (not GM+) |
| `📊 Navigating to employee receipts:` | User clicked button, navigating |

---

## Troubleshooting

### Issue: "Receipts" button not showing on Employee card

**Check:**
1. User role in console log
2. Is role one of: GENERAL_MANAGER, CEO, FOUNDER, ADMIN?
3. If not, user needs to be promoted to GM+ role

**Console Command:**
```javascript
// In browser/app console
console.log('Current user role:', user?.role);
```

### Issue: Cashier filter not showing on Receipt screen

**Check:**
1. User is GM+ (see console log for `isGMPlus`)
2. Cashier stats loaded successfully (see `cashierStatsLength` in logs)
3. At least one receipt exists in the system

**Manual Test:**
```javascript
// In browser/app console
console.log('Is GM+:', isGMPlus);
console.log('Cashier stats:', cashierStats);
console.log('Cashier count:', cashierStats?.length);
```

### Issue: Employee receipts screen shows "No receipts found"

**Check:**
1. Employee has processed receipts on the selected date
2. Backend endpoint is accessible
3. Console shows any API errors

---

## Feature Availability Matrix

| Role | View Employee Receipts | See Cashier Filter |
|------|----------------------|-------------------|
| CASHIER | ❌ No | ❌ No |
| MANAGER | ❌ No | ❌ No |
| GENERAL_MANAGER | ✅ Yes | ✅ Yes |
| CEO | ✅ Yes | ✅ Yes |
| FOUNDER | ✅ Yes | ✅ Yes |
| ADMIN | ✅ Yes | ✅ Yes |

---

## Next Steps

If issues persist after checking logs:

1. **Verify backend is running**
   ```bash
   curl http://localhost:8080/api/receipts/cashiers
   ```

2. **Check authentication token**
   - Ensure JWT token is valid
   - Token should contain correct user role

3. **Test with different user roles**
   - Create test users with different roles
   - Verify feature visibility matches table above

4. **Review backend logs**
   - Check for authorization errors
   - Verify endpoints are accessible

---

## Files Modified

1. `context/ReceiptContext.tsx` - Added debug logging
2. `app/(tabs)/receipt.tsx` - Added debug logging
3. `app/(tabs)/employees.tsx` - Fixed role check, added debug logging

---

## Success Criteria

✅ Employee "Receipts" button visible for GM+ users  
✅ Clicking button navigates to employee-receipts screen  
✅ Cashier filter visible on Receipt screen (Create tab) for GM+ users  
✅ Cashier filter visible on Receipt screen (History tab) for GM+ users  
✅ Clicking cashier button filters receipts correctly  
✅ Console logs help identify issues  
✅ Features hidden for non-GM+ users  
