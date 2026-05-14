# StrikePOS: Unified Functional Workflow Guide

This guide details the complete operational lifecycle of the StrikePOS system, integrating feature specifications directly into the functional workflows.

---

## 🟢 Stage 1: System Boot & Device Identity
**Goal:** Establish a secure, registered hardware environment for transactions.

1.  **Auto-Registration**: Upon launch, the system checks for a unique `deviceKey` in local storage.
    *   *Feature Detail*: If new, the system silently creates a `Device` record in the database, assigning it a location and name automatically.
2.  **Environment Preparation**: The system loads the global store settings (e.g., tip percentages, store branding).
3.  **Session Restoration**: The system automatically queries the API for any "Open" sessions belonging to this device to prevent redundant login steps.

---

## 🟢 Stage 2: Register Management (Cash Control)
**Goal:** Ensure physical cash accountability and prevent unauthorized transactions.

1.  **Opening the Register**:
    *   **Logic**: Pulls the **Carry-Forward** amount from the last closed session.
    *   **Action**: Staff enters the physical cash count.
    *   **Validation**: System calculates **Opening Variance**. If a difference exists, a flag is raised for manager review, but the session is allowed to open.
2.  **Operational Guard**: Until the register is "Open," the POS checkout button is disabled and replaced by an amber warning banner.
3.  **Mid-Shift Movements**:
    *   **Deposits**: Record safe-drops or cash additions.
    *   **Payouts**: Record vendor payments or tip-payouts.
    *   *Feature Detail*: Every movement requires a reason code and staff attribution.
4.  **Closing the Register**:
    *   **Expected Total**: `Opening Cash + Cash Sales - Deposits + Adjustments`.
    *   **Manager PIN Override**: If the closing variance exceeds $0.01, the system locks the "Close" action until a Manager PIN is entered to acknowledge the discrepancy.

---

## 🟢 Stage 3: The Sales & Checkout Journey
**Goal:** Facilitate fast, accurate transactions with flexible pricing.

1.  **Product Selection**:
    *   **Variants**: Staff selects a product (e.g., Logo Tee). If variants exist, a picker allows selection of **Size/Color combinations** (each tracked as a unique SKU).
2.  **Cart Configuration**:
    *   **Discounts**: Staff can apply a **Fixed Amount ($)** or **Percentage (%)** discount to the entire subtotal.
    *   **Customer Assignment**: Search and link the order to an existing customer via Name or Phone.
3.  **Payment & Tipping**:
    *   **Checkout**: Process the final total.
    *   **Post-Payment Tip**: A dedicated screen appears with configurable preset percentages (e.g., 15%, 20%, 25%) and a "Custom Amount" option.
4.  **Finalization**:
    *   **Inventory Update**: Stock levels for the specific SKU/Variant decrement immediately.
    *   **Receipts**: If a customer email is present, a digital receipt is dispatched automatically.

---

## 🟢 Stage 4: Inventory & SKU Management
**Goal:** Maintain accurate stock levels and financial records.

1.  **Product Record Maintenance**:
    *   **Financials**: Every item tracks both **Retail Price** and **Cost Price** for margin transparency.
    *   **Variants**: Single product entries can house multiple SKUs to prevent catalog clutter.
2.  **Manual Adjustments**:
    *   **Action**: Staff can manually override stock levels for damages, returns, or new shipments.
    *   **Context**: Adjustments support **PO Numbers** and detailed notes.
3.  **Recent Activity Logs**:
    *   **Audit Trail**: Every change (Sale, Adjustment, Return) is logged with a timestamp, staff name, and reason, visible directly on the product's detail screen.

---

## 🟢 Stage 5: Intelligence, Audit & Reporting
**Goal:** Provide operational oversight and historical data access.

1.  **Order Management**:
    *   **Search**: Search history by Customer, Phone, Order #, or specific Amount.
    *   **Date Filtering**: Toggle views between **Today**, **All History**, or a **Custom Date Picker**.
2.  **Real-Time Analytics**:
    *   **Preview Panel**: Side-by-side summary showing Total Sales, Tips Collected, and Discounts Applied for the selected timeframe.
    *   **Status Tracking**: Quickly identify Open, Voided, or Cancelled orders to manage store flow.
3.  **Data Persistence**:
    *   **SQLite Storage**: All data is stored locally in a relational format for high performance and offline reliability.
