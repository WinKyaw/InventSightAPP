# InventSight Mobile App - User Guide

Version 0.2.0

## Table of Contents

1. [Getting Started](#getting-started)
2. [Transfers](#transfers)
3. [Warehouse Management](#warehouse-management)
4. [Store Inventory](#store-inventory)
5. [Tips & Tricks](#tips--tricks)
6. [Troubleshooting](#troubleshooting)

## Getting Started

### First Launch

1. **Login**
   - Enter your username
   - Enter your password
   - Tap "Sign In"

2. **Select Company**
   - Choose your company from the list
   - This determines which data you see

3. **Navigate**
   - Use bottom tabs to switch between sections
   - Dashboard, Items, Warehouse, Transfers, Receipt, Team, Menu

## Transfers

### Creating a Transfer

1. Tap **Transfers** tab
2. Tap **+** (plus button)
3. Fill in the form:
   - **From Location**: Select warehouse
   - **To Location**: Select store
   - **Product**: Choose from warehouse inventory
   - **Quantity**: Enter amount to transfer
   - **Priority**: Normal, High, or Urgent
   - **Notes**: Add any special instructions
4. Tap **Create Transfer**

### Viewing Transfers

**Filter by Status:**
- Tap filter chips at top (All, Pending, In Transit, Completed)
- See transfers matching selected status

**Search:**
- Use search bar to find by product name, ID, or reference

**Transfer Card Shows:**
- Product name and SKU
- Quantity requested/approved
- Status with color indicator
- From/To locations
- Date created

### Transfer Detail

**Tap any transfer to see:**
- Complete information
- Visual timeline of status
- Carrier information (if assigned)
- Quantities (requested, approved, received)
- Damage reports
- All timestamps
- User who performed each action

**Available Actions (based on status):**
- **Pending**: Approve, Reject
- **Approved**: Mark Ready, Assign Carrier
- **Ready**: Start Delivery
- **In Transit**: Mark Delivered
- **Delivered**: Receive Transfer

### Approving a Transfer

**Required Role:** Warehouse Manager or GM+

1. Open transfer (status: PENDING)
2. Tap **Approve**
3. Enter approved quantity (can be different from requested)
4. Enter carrier details:
   - Carrier name
   - Phone number
   - Vehicle info
   - Estimated delivery date/time
5. Add notes (optional)
6. Tap **Confirm**

**Result:**
- Transfer status → IN_TRANSIT
- Warehouse inventory deducted
- Store notified

### Receiving a Transfer

**Required Role:** Store Manager or Staff

1. Open transfer (status: DELIVERED)
2. Tap **Receive Transfer**
3. Enter received quantity
4. Enter damaged quantity (if any)
5. Enter your name
6. Sign (tap signature area to draw)
7. Upload photo (optional)
8. Add receipt notes
9. Tap **Confirm Receipt**

**Result:**
- Transfer status → COMPLETED
- Store inventory increased
- Restock record created

### Transfer Statuses

- 🟡 **PENDING**: Waiting for approval
- 🟢 **APPROVED**: Approved, ready to ship
- 🔵 **READY**: Packed, ready for pickup
- 🟣 **IN_TRANSIT**: Out for delivery
- 🟠 **DELIVERED**: Delivered, awaiting receipt
- ✅ **COMPLETED**: Received and complete
- ❌ **REJECTED**: Rejected by approver
- ⚫ **CANCELLED**: Cancelled

## Warehouse Management

### Selecting a Warehouse

1. Tap **Warehouse** tab
2. Tap warehouse dropdown at top
3. Select warehouse from list
4. Data loads for selected warehouse

### Inventory Tab

**Shows:**
- All products in warehouse
- Available quantity
- Low stock warnings
- Product details (SKU, name, price)

**Actions:**
- **Search**: Use search bar to find products
- **Tap product**: View details
- **Pull down**: Refresh data

### Restocks Tab

**Shows history of:**
- Inventory additions
- Receipts from suppliers
- Transfer-in from other warehouses
- Manual adjustments

**Each entry shows:**
- Product name and SKU
- Quantity added
- Date and time
- Created by user
- Transaction type
- Notes

### Sales Tab

**Shows history of:**
- Inventory withdrawals
- Transfer-out to stores
- Issues and damages
- Other outbound transactions

**Each entry shows:**
- Product name and SKU
- Quantity withdrawn (negative)
- Date and time
- Created by user
- Transaction type with icon
  - 🚚 TRANSFER_OUT
  - 🚛 ISSUE
  - 💥 DAMAGE
  - 🚨 THEFT
  - ⏰ EXPIRED
- Notes

### Adding Inventory

**Required Role:** Warehouse Manager

1. Select warehouse
2. Tap **➕ Add Inventory** button
3. Select product from list
4. Enter quantity
5. Add notes (optional)
6. Tap **Submit**

**Result:**
- Warehouse inventory increased
- Restock record created

### Withdrawing Inventory

**Required Role:** Warehouse Manager

1. Select warehouse
2. Tap **➖ Withdraw** button
3. Select product from warehouse inventory
4. Enter quantity (max shown)
5. Add notes
6. Tap **Submit**

**Result:**
- Warehouse inventory decreased
- Withdrawal record created

## Store Inventory

### Inventory Tab

**Shows:**
- All products in your store
- Current quantities
- Low stock alerts
- Product details

**Actions:**
- Search products
- View product details
- Pull to refresh

### Restocks Tab

**Shows:**
- All inventory additions to store
- Manual restocks
- Transfer-in from warehouses
- Batch additions

**Each entry shows:**
- Product name
- Quantity added
- Date and time
- Created by
- Notes (shows transfer reference if from transfer)

## Tips & Tricks

### Efficiency Tips

1. **Pull to Refresh**: Swipe down on any list to get latest data
2. **Search**: Use search bars instead of scrolling
3. **Filters**: Use status filters on transfers for quick access
4. **Batch Operations**: Create multiple transfers at once if needed

### Best Practices

1. **Approve Quickly**: Don't leave transfers pending
2. **Verify Quantities**: Always check quantities match
3. **Document Damages**: Report damaged goods accurately
4. **Add Notes**: Include relevant details in notes fields
5. **Check Before Receipt**: Verify delivery before confirming

### Common Tasks

**Daily Store Manager Tasks:**
1. Check pending transfer approvals
2. Review in-transit deliveries
3. Receive delivered transfers
4. Check low stock items
5. Create new transfer requests

**Daily Warehouse Manager Tasks:**
1. Approve pending transfers
2. Mark items as ready
3. Track in-transit shipments
4. Add received inventory
5. Monitor warehouse levels

## Troubleshooting

### Transfer Issues

**"Failed to confirm receipt"**
- Check internet connection
- Verify all required fields filled
- Try again in a few seconds
- Contact support if persists

**"Cannot create transfer"**
- Verify product selection
- Check quantity is positive
- Ensure warehouse has stock
- Check you have permission

### Data Not Loading

1. **Pull to Refresh**: Swipe down
2. **Check Connection**: Verify internet
3. **Restart App**: Close and reopen
4. **Clear Cache**: Logout and login again
5. **Contact Support**: If issue persists

### Permission Issues

**"You don't have permission"**
- Contact your manager
- Verify your role assignment
- Check you're in correct company
- Contact admin for access

### App Performance

**App is slow:**
1. Close other apps
2. Restart device
3. Update to latest version
4. Clear app cache
5. Reinstall if needed

### Contact Support

**For Help:**
- Email: [Support Email]
- Phone: [Support Phone]
- In-app: Menu → Help & Support

**Include When Reporting Issues:**
- Your username
- Company name
- Screen where error occurred
- What you were trying to do
- Error message (screenshot helpful)
- Device and OS version

---

**Need more help?** Check [FAQ.md](FAQ.md) or contact support.
