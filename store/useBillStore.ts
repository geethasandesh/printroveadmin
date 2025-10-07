import { create } from "zustand";
import apiClient from "@/apiClient";
import { Bill, UpdateBillPayload } from "@/types/purchase-bill";

// Add interface for purchase receive response
interface PurchaseReceiveResponse {
  purchaseReceiveId: string;
  id: string;
  vendorBillNumber: string;
  poId: string | null;
  poNumber: string | null;
  receiveDate: string;
  status: string;
  itemCount: number;
  totalReceived: number;
  packages: number;
  shippingInfo: {
    company: string;
    trackingNumber: string;
  };
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

interface BillStore {
  bills: Bill[];
  currentBill: Bill | null;
  total: number;
  isLoading: boolean;
  error: string | null;
  isCreating: boolean;
  isUpdating: boolean;
  purchaseReceives: PurchaseReceiveResponse[];
  isLoadingPurchaseReceives: boolean;
  fetchAllBills: () => Promise<void>;
  fetchBills: (page: number, limit: number, search?: string) => Promise<void>;
  createBill: (data: any) => Promise<CreateBillResponse>;
  getBillById: (id: string) => Promise<void>;
  updateBillById: (id: string, data: UpdateBillPayload) => Promise<boolean>;
  fetchPurchaseReceivesByBillNumber: (
    billNumber: string,
    vendorId?: string
  ) => Promise<PurchaseReceiveResponse[]>;
}

export const useBillStore = create<BillStore>((set, get) => ({
  bills: [],
  currentBill: null,
  total: 0,
  isLoading: false,
  error: null,
  isCreating: false,
  isUpdating: false,
  purchaseReceives: [],
  isLoadingPurchaseReceives: false,

  fetchBills: async (page: number, limit: number, search?: string) => {
    try {
      set({ isLoading: true });
      const response = await apiClient.get<{
        success: boolean;
        data: Bill[];
        total: number;
      }>("/purchase/bills", {
        params: { page, limit, search },
      });

      set({
        bills: response.data.data,
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

  fetchAllBills: async () => {
    try {
      set({ isLoading: true });
      const response = await apiClient.get<{ success: boolean; data: Bill[] }>(
        "/purchase/bills/all"
      );
      set({ bills: response.data.data, isLoading: false });
    } catch (error) {
      set({
        isLoading: false,
        error: "Failed to fetch bills",
      });
    }
  },

  createBill: async (data) => {
    try {
      set({ isCreating: true, error: null });
      const response = await apiClient.post<CreateBillResponse>(
        "/purchase/bills",
        data
      );
      set({ isCreating: false });
      return response.data;
    } catch (error) {
      set({
        isCreating: false,
        error: error instanceof Error ? error.message : "Failed to create bill",
      });
      throw error;
    }
  },

  getBillById: async (id: string) => {
    try {
      set({ isLoading: true, error: null });
      const response = await apiClient.get<{ success: boolean; data: Bill }>(
        `/purchase/bills/${id}`
      );
      set({ currentBill: response.data.data, isLoading: false });
    } catch (error) {
      set({
        isLoading: false,
        error:
          error instanceof Error
            ? error.message
            : "Failed to fetch bill details",
      });
      throw error;
    }
  },

  updateBillById: async (id: string, data: UpdateBillPayload) => {
    try {
      set({ isUpdating: true, error: null });
      const response = await apiClient.put<{ success: boolean; data: Bill }>(
        `/purchase/bills/${id}`,
        data
      );
      set({ currentBill: response.data.data, isUpdating: false });
      return true;
    } catch (error) {
      console.error("Error updating bill:", error);
      set({
        isUpdating: false,
        error:
          error instanceof Error
            ? error.message
            : "Failed to update bill",
      });
      return false;
    }
  },

  fetchPurchaseReceivesByBillNumber: async (
    billNumber: string,
    vendorId?: string
  ): Promise<PurchaseReceiveResponse[]> => {
    if (!billNumber.trim()) {
      return [];
    }

    try {
      set({ isLoading: true }); // Use a generic loading state

      const url = `/purchase/bills/by-vendor-bill/${billNumber}${
        vendorId ? `?vendorId=${vendorId}` : ""
      }`;

      const response = await apiClient.get<{
        success: boolean;
        data: PurchaseReceiveResponse[];
      }>(url);

      set({ isLoading: false });

      return response.data.data;
    } catch (error) {
      set({ isLoading: false });
      console.error("Error fetching purchase receives:", error);
      return [];
    }
  },
}));
