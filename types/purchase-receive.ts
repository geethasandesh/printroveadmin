// Models for API responses
export interface PurchaseReceive {
  id: string;
  purchase_receive_id: string;
  vendor_id: string;
  vendor_name: string;
  date: string;
  bill_number: string;
  packages_count: number;
  shipping_company: string;
  tracking_number: string;
  status: "pending" | "completed";
  po_id?: string | { _id: string; purchaseorder_number?: string };
  po_mapping_status?: "mapped" | "no_po_available";
  vendor_credit_flag?: boolean;
  vendor_credit_status?: "pending" | "created" | "failed";
  line_items: Array<LineItem>;
  created_at: string;
  updated_at: string;
  total_items: number;
  accepted_items: number;
  rejected_items: number;
}

export interface LineItem {
  product_id: string;
  product_name: string;
  received_qty: number;
  rejected_qty: number;
  surplus_qty?: number;
  deficit_qty?: number;
  status?: "perfect" | "surplus" | "deficit";
}

// Model for API requests
export interface PurchaseReceivePayload {
  vendor_id: string;
  date: string;
  bill_number: string;
  packages_count: number;
  shipping_company: string;
  tracking_number: string;
  status: "pending" | "completed";
  line_items: Array<{
    product_id: string;
    received_qty: number;
    rejected_qty: number;
  }>;
}

// Form data model (for UI use)
export interface PurchaseReceiveFormData {
  vendor_id: string;
  date: Date;
  bill_number: string;
  packages_count: number;
  shipping_company: string;
  tracking_number: string;
  status: "pending" | "completed";
  line_items: Array<{
    id: string; // Local ID for rendering
    product_id: string;
    received_qty: number;
    rejected_qty: number;
  }>;
}

// Partial update payload model (for PUT /purchase/receive/:id)
export interface UpdatePurchaseReceivePayload {
  vendor_id?: string;
  date?: string; // ISO date string
  bill_number?: string;
  packages_count?: number;
  shipping_company?: string;
  tracking_number?: string;
  status?: "pending" | "completed";
  line_items?: Array<{
    product_id: string;
    received_qty: number;
    rejected_qty: number;
  }>;
}
