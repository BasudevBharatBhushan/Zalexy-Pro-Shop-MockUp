# StrikePOS: User Workflow Encyclopedia

This document serves as the definitive manual for StrikePOS operations, covering role-based actions, detailed transaction scenarios, and back-office management.

---

## 👥 1. Role-Based Responsibility
StrikePOS uses a tiered permission structure to ensure financial security.

### **The Cashier Workflow**
*   **Shift Start**: Count drawer, enter opening total.
*   **Sales**: Process orders, apply standard discounts, collect tips.
*   **Inventory**: View stock levels and logs.
*   **Shift End**: Perform final count and submit for closing.

### **The Manager Workflow (PIN Required)**
*   **Variance Approval**: A manager must enter their PIN to authorize a register closing if the cash is short/over.
*   **Sensitive Adjustments**: High-value inventory overrides or voiding completed transactions.
*   **Audit**: Reviewing the analytical preview panel to verify shift totals vs. actual deposits.

---

## 🧾 2. Advanced Transaction Workflows

### **Scenario A: The Walk-in (Standard Sale)**
1.  Add items to cart.
2.  Assign a customer (optional but recommended for receipts).
3.  Click **Charge** -> Process full payment.
4.  **Tip Prompt**: Present the screen to the customer for tip selection.
5.  Order is automatically marked **Closed**.

### **Scenario B: The Open Tab (Pay Later)**
1.  Select **Tab Type: Open Tab** in the cart.
2.  Add initial items (e.g., Shoe Rental).
3.  The order stays in **Open** status.
4.  Staff can add items (e.g., Drinks/Food) throughout the customer's visit.
5.  **Closing the Tab**: Click the order in the list, process the final total + tip in one go.

### **Scenario C: Reserved Orders (Deposits)**
1.  Orders with a "Paid" amount > $0 but < Total are marked **Open**.
2.  The "Analytical Preview" tracks these as **Outstanding Balance**.
3.  Upon customer arrival/departure, staff collects the remaining balance to move the order to **Closed**.

---

## 👕 3. Pro-Shop Apparel & Variant Management
Managing items like T-shirts or Shoes that come in multiple sizes.

1.  **Creation**: Create a "Parent" product (e.g., "StrikePOS Polo").
2.  **Variant Entry**:
    *   Add **Size** (S, M, L, XL) and **Color** (Black, Blue).
    *   System generates unique SKUs for each (e.g., `POLO-BLK-M`).
3.  **Inventory Tracking**:
    *   Staff can see the "Total Stock" for the Polo, or click into the **Detail View** to see exactly how many Mediums vs. Larges are left.
    *   Adjustments are made at the specific SKU level to ensure logs are accurate.

---

## 📉 4. Troubleshooting & Cash Reconciliation

### **Handling an Opening Variance**
*   **The Issue**: Drawer count is $198.50, but the system expected $200.00.
*   **Workflow**:
    1.  Re-count to confirm.
    2.  Enter $198.50.
    3.  The system logs a **-$1.50 Opening Variance**.
    4.  Note the discrepancy in the "Notes" field (e.g., "Missing small change from previous night").
    5.  Proceed to open; the manager will review the flag in the audit logs later.

### **Voiding an Order**
*   **The Issue**: Items were added in error or customer cancelled after "Holding."
*   **Workflow**:
    1.  Select the order from the **Orders Screen**.
    2.  Click the **Status** badge and select **Void**.
    3.  *Logic*: The system voids the transaction, removes it from "Sales Totals," and returns any allocated stock to the inventory automatically.

---

## 📈 5. Understanding the Reports Screen
The Reports screen is divided into two logical sections for auditing.

1.  **Analytical Preview (The "What happened")**:
    *   Shows a birds-eye view of the store's health.
    *   Check the **Total Sales** vs. **Total Collected (including tips)**.
    *   Use the **Status Filter** to see how much revenue is tied up in "Open" orders vs. "Closed."
2.  **Order Detail List (The "When it happened")**:
    *   Drill down into individual order numbers.
    *   Verify which staff member handled specific high-value transactions.
    *   Use the **Custom Date Picker** to run audits on previous weeks or months.
