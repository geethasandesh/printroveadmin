import apiClient from "@/apiClient";
import { create } from "zustand";

interface VendorCredit {
  vendor_credit_id?: string;
  _id?: string;
  date: string;
  creditNumber?: string;
  vendor_credit_number?: string;
  purchaseBill?: string;
  purchase_bill?: string;
  vendorName?: string;
  vendor_name?: string;
  status: string;
  amount?: {
    value: number;
    formatted: string;
  };
  total_formatted?: string;
}

interface VendorCreditDetails extends VendorCredit {
  id: string;
  vendorId: string;
  reference: string;
  notes: string;
  items: Array<{
    id: string;
    productName: string;
    quantity: number;
    rate: number;
    amount: number;
  }>;
}

interface VendorCreditStore {
  vendorCredits: VendorCredit[];
  total: number;
  isLoading: boolean;
  currentCredit: VendorCreditDetails | null;
  isLoadingDetails: boolean;
  isCreating: boolean;
  error: string | null;
  fetchVendorCredits: (
    page: number,
    limit: number,
    search?: string,
    days?: string
  ) => Promise<void>;
  fetchVendorCreditById: (id: string) => Promise<void>;
  createVendorCredit: (data: {
    vendor_id: string;
    date: string;
    reference_number: string;
    purchase_bill_reference?: string;
    line_items: Array<{
      item_id: string;
      quantity: number;
      rate: number;
    }>;
  }) => Promise<boolean>;
  createDraft: (data: {
    vendor_id: string;
    date?: string;
    reference_number?: string;
    purchase_bill_reference?: string;
    line_items?: Array<{
      item_id: string;
      quantity?: number;
      rate?: number;
    }>;
  }) => Promise<{ success: boolean; data?: string; error?: string }>;
  completeDraft: (id: string, data: {
    reference_number?: string;
    date?: string;
    purchase_bill_reference?: string;
    line_items?: Array<{
      item_id: string;
      quantity: number;
      rate: number;
    }>;
  }) => Promise<boolean>;
  updateStatus: (id: string, status: 'draft' | 'active') => Promise<boolean>;
  deleteVendorCredit: (id: string) => Promise<boolean>;
  updateVendorCredit: (
    id: string,
    data: {
      reference_number?: string;
      purchase_bill_reference?: string;
      date?: string;
      notes?: string;
      line_items?: Array<{ item_id: string; quantity: number; rate: number }>;
    }
  ) => Promise<{ success: boolean; data?: VendorCreditDetails; message?: string }>;
}

export const useVendorCreditStore = create<VendorCreditStore>((set) => ({
  vendorCredits: [],
  total: 0,
  isLoading: false,
  currentCredit: null,
  isLoadingDetails: false,
  isCreating: false,
  error: null,
  fetchVendorCredits: async (page: number, limit: number, search?: string, days?: string) => {
    try {
      set({ isLoading: true });
      
      let endpoint = "/purchase/vendorcredit";
      let params: any = { page, limit };
      
      // Add search parameter if provided
      if (search) {
        params.search = search;
      }
      
      // Add days parameter if provided
      if (days && days !== "all") {
        params.days = days;
      }
      
      const response = await apiClient.get<{
        data: VendorCredit[];
        total: number;
      }>(endpoint, { params });
      
      set({
        vendorCredits: response.data.data,
        total: response.data.total,
        isLoading: false,
      });
    } catch (error) {
      console.error("Error fetching vendor credits:", error);
      set({ isLoading: false });
    }
  },
  fetchVendorCreditById: async (id: string) => {
    try {
      set({ isLoadingDetails: true });
      const response = await apiClient.get<{
        success: boolean;
        data: VendorCreditDetails;
      }>(`/purchase/vendorcredit/${id}`);

      if (response.data.success) {
        set({
          currentCredit: response.data.data,
          isLoadingDetails: false,
        });
      } else {
        console.error("Failed to fetch vendor credit details");
        set({ isLoadingDetails: false });
      }
    } catch (error) {
      console.error("Error fetching vendor credit details:", error);
      set({ isLoadingDetails: false });
    }
  },
  createVendorCredit: async (data) => {
    try {
      set({ isCreating: true, error: null });
      const response = await apiClient.post<{
        success: boolean;
        data: string;
      }>("/vendor-credits", data);

      set({ isCreating: false });
      return response.data.success;
    } catch (error) {
      console.error("Error creating vendor credit:", error);
      set({
        isCreating: false,
        error: error instanceof Error ? error.message : "Failed to create vendor credit",
      });
      return false;
    }
  },
  createDraft: async (data) => {
    try {
      set({ isCreating: true, error: null });
      const response = await apiClient.post<{
        success: boolean;
        data: {
          vendor_credit_id: string;
          vendor_id: string;
          _id: string;
          vendor_credit_number: string;
          vendor_name: string;
          reference_number: string;
          date: string;
          status: string;
          total: number;
          total_formatted: string;
          currency_code: string;
          currency_symbol: string;
          line_items: any[];
          created_time: string;
          last_modified_time: string;
          createdAt: string;
          updatedAt: string;
          __v: number;
        };
      }>("/vendor-credits/draft", data);

      set({ isCreating: false });
      return { 
        success: response.data.success, 
        data: response.data.data.vendor_credit_id || response.data.data._id // Extract the ID from the response object
      };
    } catch (error) {
      console.error("Error creating draft vendor credit:", error);
      const errorMessage = error instanceof Error ? error.message : "Failed to create draft vendor credit";
      set({
        isCreating: false,
        error: errorMessage,
      });
      return { success: false, error: errorMessage };
    }
  },

  completeDraft: async (id, data) => {
    try {
      set({ isCreating: true, error: null });
      const response = await apiClient.put<{
        success: boolean;
        data: any;
      }>(`/vendor-credits/${id}/complete`, data);

      set({ isCreating: false });
      return response.data.success;
    } catch (error) {
      console.error("Error completing draft vendor credit:", error);
      set({
        isCreating: false,
        error: error instanceof Error ? error.message : "Failed to complete draft vendor credit",
      });
      return false;
    }
  },

  updateStatus: async (id, status) => {
    try {
      set({ isCreating: true, error: null });
      const response = await apiClient.put<{
        success: boolean;
        data: any;
      }>(`/vendor-credits/${id}/status`, { status });

      set({ isCreating: false });
      return response.data.success;
    } catch (error) {
      console.error("Error updating vendor credit status:", error);
      set({
        isCreating: false,
        error: error instanceof Error ? error.message : "Failed to update vendor credit status",
      });
      return false;
    }
  },
  deleteVendorCredit: async (id: string) => {
    try {
      const response = await apiClient.delete<{ success: boolean }>(`/vendor-credits/${id}`);
      return response.data.success ?? true;
    } catch (error) {
      console.error("Error deleting vendor credit:", error);
      return false;
    }
  },
  updateVendorCredit: async (id, data) => {
    try {
      const response = await apiClient.put<{
        success: boolean;
        data: any;
        message?: string;
      }>(`/vendor-credits/${id}`, data);

      if (response.data.success) {
        set({ currentCredit: response.data.data });
      }

      return {
        success: response.data.success,
        data: response.data.data as any,
        message: response.data.message,
      };
    } catch (error) {
      console.error("Error updating vendor credit:", error);
      return { success: false, message: "Failed to update vendor credit" };
    }
  },
}));
