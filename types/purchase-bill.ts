// Models for API responses
export interface Bill {
  bill_id: string;
  date: string;
  bill_number: string;
  reference_number: string;
  vendor_id: string;
  vendor_name: string;
  status: "open" | "paid" | "partially_paid" | "overdue" | "void";
  total: number;
  currency_code: string;
  currency_symbol: string;
  sub_total: number;
  tax_total: number;
  line_items: LineItem[];
  created_time: string;
  last_modified_time: string;
  notes?: string;
  terms?: string;
  billing_address?: any;
  due_date?: string;
  purchase_orders?: string[];
}

export interface LineItem {
  line_item_id: string;
  item_id: string;
  name: string;
  quantity: number;
  rate: number;
  item_total: number;
  sku: string;
}

// Model for API requests - partial updates
export interface UpdateBillPayload {
  vendorId?: string;
  reference?: string;
  billNumber?: string;
  billDate?: string;
  dueDate?: string;
  status?: "open" | "paid" | "partially_paid" | "overdue" | "void";
  notes?: string;
  terms?: string;
  items?: Array<{
    id?: string; // For existing items
    productId: string;
    quantity: string;
    rate: string;
    amount: string;
    name?: string; // For display
    sku?: string; // For display
  }>;
  purchaseOrders?: string[];
}

// Form data model (for UI use)
export interface BillFormData {
  vendorId: string;
  reference: string;
  billNumber: string;
  billDate: string;
  dueDate: string;
  status: "open" | "paid" | "partially_paid" | "overdue" | "void";
  notes: string;
  terms: string;
  items: Array<{
    id: string; // Local ID for rendering
    productId: string;
    quantity: string;
    rate: string;
    amount: string;
    name?: string;
    sku?: string;
  }>;
  purchaseOrders: string[];
}
