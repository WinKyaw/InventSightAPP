# Testing Guide - GM+ Receipt View & Scroll Fix

## Manual Testing Checklist

### 🔧 Backend Testing

#### 1. Test GM+ Receipt Access
```bash
# GM+ user should see all store receipts
GET /api/receipts
Authorization: Bearer <gm-plus-token>

Expected: Returns all receipts for the active store
```

#### 2. Test Regular User Receipt Access
```bash
# Regular user should see only their own receipts
GET /api/receipts
Authorization: Bearer <regular-user-token>

Expected: Returns only receipts created by this user
```

#### 3. Test Cashier Filtering (GM+ Only)
```bash
# GM+ user filtering by cashier
GET /api/receipts?cashierId=<cashier-uuid>
Authorization: Bearer <gm-plus-token>

Expected: Returns receipts processed by specified cashier
```

#### 4. Test Recent Receipts
```bash
# Get 10 most recent receipts
GET /api/receipts/recent?limit=10
Authorization: Bearer <token>

Expected: Returns 10 most recent receipts (all or user's based on role)
```

#### 5. Test Cashier Statistics (GM+ Only)
```bash
# Get cashier stats
GET /api/receipts/cashiers
Authorization: Bearer <gm-plus-token>

Expected: Returns cashier statistics with counts and totals

# Regular user attempt
GET /api/receipts/cashiers
Authorization: Bearer <regular-user-token>

Expected: Returns 403 Forbidden
```

### 📱 Frontend Testing

#### 1. Test Scroll Functionality (Create Tab)

**Test Case 1: Scroll Buttons Appear**
1. Open Receipt screen
2. Navigate to Create tab
3. Add multiple items to create scrollable content
4. Scroll down > 100px
5. ✅ Verify: Scroll buttons appear in bottom-right corner

**Test Case 2: Scroll to Top**
1. Scroll to bottom of page
2. Tap "↑" button
3. ✅ Verify: Page smoothly scrolls to top

**Test Case 3: Scroll to Bottom**
1. Scroll to top of page
2. Tap "↓" button
3. ✅ Verify: Page smoothly scrolls to bottom

**Test Case 4: Buttons Hide When Near Top**
1. Scroll to top of page (< 100px from top)
2. ✅ Verify: Scroll buttons disappear

#### 2. Test GM+ Cashier Filter (Create Tab)

**Setup:** Login as GM+ user (GENERAL_MANAGER, CEO, FOUNDER, or ADMIN)

**Test Case 1: Filter Display**
1. Navigate to Receipt screen → Create tab
2. ✅ Verify: Cashier filter appears above "Recent Receipts"
3. ✅ Verify: Shows "All Cashiers" and individual cashiers with receipt counts

**Test Case 2: Filter by Cashier**
1. Tap on a specific cashier in the filter
2. ✅ Verify: Button becomes highlighted (orange border)
3. ✅ Verify: "Recent Receipts" title shows cashier name indicator
4. ✅ Verify: Receipts list updates to show only that cashier's receipts

**Test Case 3: Clear Filter**
1. Select a cashier filter
2. Tap "All Cashiers" button
3. ✅ Verify: Filter clears
4. ✅ Verify: All receipts are shown again

**Test Case 4: Filter Persistence**
1. Select a cashier filter
2. Switch to History tab
3. Switch back to Create tab
4. ✅ Verify: Filter is still active

#### 3. Test GM+ Cashier Filter (History Tab)

**Setup:** Login as GM+ user

**Test Case 1: Filter Display**
1. Navigate to Receipt screen → History tab
2. ✅ Verify: Cashier filter appears below date filters
3. ✅ Verify: Shows "All" and individual cashiers

**Test Case 2: Filter with Banner**
1. Select a specific cashier
2. ✅ Verify: Filter banner appears above receipts list
3. ✅ Verify: Banner shows "Showing receipts by: [Cashier Name]"
4. ✅ Verify: Banner has "Clear" button

**Test Case 3: Clear via Banner**
1. Select a cashier filter
2. Tap "Clear" button in banner
3. ✅ Verify: Filter clears
4. ✅ Verify: Banner disappears
5. ✅ Verify: All receipts shown

#### 4. Test Regular User Experience

**Setup:** Login as regular user (CASHIER or MANAGER)

**Test Case 1: No Cashier Filter**
1. Navigate to Receipt screen
2. Check both Create and History tabs
3. ✅ Verify: Cashier filter does NOT appear
4. ✅ Verify: Only user's own receipts are visible

**Test Case 2: Scroll Buttons Still Work**
1. Navigate to Create tab
2. Add items to create scrollable content
3. ✅ Verify: Scroll buttons appear and function correctly

#### 5. Test Cashier Stats Loading

**Setup:** Login as GM+ user

**Test Case 1: Stats Load on Mount**
1. Login as GM+ user
2. Navigate to Receipt screen
3. ✅ Verify: Cashier stats load automatically
4. ✅ Verify: Filter shows cashiers with correct counts

**Test Case 2: Stats Update After New Receipt**
1. Create a new receipt
2. Check cashier filter
3. ✅ Verify: Receipt count increases for current user

### 🐛 Edge Cases to Test

#### Edge Case 1: No Receipts
1. New store with no receipts
2. ✅ Verify: "No Receipts" message shown
3. ✅ Verify: Cashier filter hidden or shows empty

#### Edge Case 2: Single Cashier
1. Store with only one cashier
2. ✅ Verify: Filter shows "All" and single cashier
3. ✅ Verify: Selecting cashier shows same results as "All"

#### Edge Case 3: Network Error
1. Disconnect network
2. Try loading receipts
3. ✅ Verify: Error message shown
4. ✅ Verify: Retry button available

#### Edge Case 4: Long Cashier Names
1. Cashier with very long name
2. ✅ Verify: Name truncates or wraps properly
3. ✅ Verify: Filter button remains usable

### 📊 Performance Testing

#### Performance Test 1: Many Receipts
1. Load > 100 receipts
2. ✅ Verify: List scrolls smoothly
3. ✅ Verify: Scroll buttons respond quickly

#### Performance Test 2: Many Cashiers
1. Store with > 10 cashiers
2. ✅ Verify: Filter scrolls horizontally
3. ✅ Verify: All cashiers accessible

## Automated Testing Recommendations

### Backend Unit Tests
```java
@Test
void testGMPlusCanSeeAllReceipts() {
    // Setup GM+ user
    User gmUser = createGMUser();
    // Create receipts by different users
    // Verify GM+ user can see all
}

@Test
void testRegularUserSeesOwnReceiptsOnly() {
    // Setup regular user
    User regularUser = createRegularUser();
    // Create receipts by different users
    // Verify user sees only their own
}

@Test
void testCashierStatsAccessControl() {
    // Verify GM+ can access
    // Verify regular user gets 403
}
```

### Frontend Integration Tests
```typescript
describe('Cashier Filter', () => {
  it('shows filter for GM+ users', () => {
    // Login as GM+
    // Navigate to receipt screen
    // Assert filter is visible
  });

  it('hides filter for regular users', () => {
    // Login as regular user
    // Navigate to receipt screen
    // Assert filter is not visible
  });

  it('filters receipts when cashier selected', () => {
    // Login as GM+
    // Select a cashier
    // Assert receipts are filtered
  });
});

describe('Scroll Buttons', () => {
  it('shows buttons after scrolling', () => {
    // Scroll down > 100px
    // Assert buttons visible
  });

  it('scrolls to top on button press', () => {
    // Scroll to bottom
    // Press top button
    // Assert scrolled to top
  });
});
```

## Success Criteria

✅ All backend endpoints return correct data based on user role
✅ GM+ users can filter by cashier in both tabs
✅ Regular users see only their own receipts
✅ Scroll buttons appear and function correctly
✅ UI is responsive and smooth
✅ No console errors or warnings
✅ Access control properly enforced
