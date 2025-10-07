import { create } from "zustand";
import apiClient from "@/apiClient";

interface LineItem {
  line_item_id: string;
  item_id: string;
  name: string;
  quantity: number;
  rate: number;
  item_total: number;
  sku: string;
}

interface Merchants {
  profile: any;
  bill_id: string;
  date: string;
  bill_number: string;
  reference_number: string;
  vendor_id: string;
  vendor_name: string;
  status: string;
  total: number;
  currency_code: string;
  currency_symbol: string;
  sub_total: number;
  tax_total: number;
  line_items: LineItem[];
  created_time: string;
  last_modified_time: string;
}

interface CreateBillResponse {
  success: boolean;
  data: {
    bill_id: string;
    bill_number: string;
    vendor_name: string;
    status: string;
    total: number;
  };
}

interface MerchantsStore {
  merchantDetails: MerchantsDetails | null;
  merchants: Merchants[];
  total: number;
  isLoading: boolean;
  error: string | null;
  isCreating: boolean;
  fetchMerchants: (
    page: number,
    limit: number,
    search?: string
  ) => Promise<void>;
  fetchMerchantsById: (id: string) => Promise<void>;
}

interface MerchantsDetails {
  success: true;
  data: {
    profile: {
      full_name: string;
      last_name: string;
      phone_number: string;
      email: string;
      store_name: string;
    };
    business_and_banking_info: {
      company_name: string;
      store_name: string;
      country: string;
      state: string;
      city: string;
      pincode: string;
      address_line1: string;
      address_line2: string;
      gstin: string;
      bank_holder_name: string;
      account_number: string;
      ifsc_code: string;
    };
    courier: {
      courier_priority: string;
      shipping_methods: Array<{
        method_name: string;
        product: string;
        _id: string;
      }>;
    };
    notification: {
      order_created_email: boolean;
      credit_transactions_email: boolean;
      order_returned_email: boolean;
      credits_below_threshold: number;
      order_tracking: string;
    };
    _id: string;
    user_list: Array<{
      name: string;
      email_id: string;
      phone_number: number;
      created_date: string;
      _id: string;
    }>;
    createdAt: string;
    updatedAt: string;
    __v: number;
  };
}

export const useMerchantsStore = create<MerchantsStore>((set) => ({
  merchantDetails: null,
  merchants: [],
  total: 0,
  isLoading: false,
  error: null,
  isCreating: false,

  fetchMerchants: async (page: number, limit: number, search?: string) => {
    try {
      set({ isLoading: true });
      const response = await apiClient.get<{
        success: boolean;
        data: Merchants[];
        total: number;
      }>("/merchant", {
        params: { page, limit, search },
      });

      set({
        merchants: response.data.data,
        total: response.data.total,
        isLoading: false,
        error: null,
      });
    } catch (error) {
      set({
        isLoading: false,
        error: "Failed to fetch bills",
      });
    }
  },

  fetchMerchantsById: async (id: string) => {
    set({ isLoading: true });
    try {
      const response = await apiClient.get<MerchantsDetails>(`/merchant/${id}`);
      set({ merchantDetails: response.data, isLoading: false });
    } catch (error) {
      console.error("Failed to fetch vendor details:", error);
      set({ isLoading: false });
    }
  },
}));
