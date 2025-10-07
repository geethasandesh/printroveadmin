export interface LineItem {
  line_item_id: string;
  item_id: string;
  name: string;
  description?: string;
  rate: number;
  quantity: number;
  item_total: number;
  sku: string;
  unit: string;
  bcy_rate?: number;
  tax_name?: string;
  tax_percentage?: number;
}

export interface Address {
  zip: string;
  country: string;
  address: string;
  city: string;
  phone: string;
  attention?: string;
  street2?: string;
  state: string;
  fax?: string;
}

export interface PurchaseOrder {
  id: string;
  date: string;
  purchaseorder_number: string;
  reference_number: string;
  vendor_name: string;
  status: string;
  total: number;
  line_items: LineItem[];
  currency_code: string;
  currency_symbol: string;
  sub_total: number;
  tax_total: number;
  billing_address: Address;
  delivery_address: Address;
  notes?: string;
  terms?: string;
  created_time: string;
  last_modified_time: string;
  purchase_receives?: Array<{
    pr_id: string;
    date: string;
    status: "pending" | "completed";
    bill_number: string;
    receive_items: Array<{
      item_id: string;
      quantity: string;
      deficit_qty: string;
      description?: string;
    }>;
  }>;
}

export interface PurchaseOrderDetail extends PurchaseOrder {
  purchase_receives?: Array<{
    pr_id: string;
    date: string;
    status: "pending" | "completed";
    bill_number: string;
    receive_items: Array<{
      item_id: string;
      quantity: string;
      deficit_qty: string;
      description?: string;
    }>;
  }>;
}
