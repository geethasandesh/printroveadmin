import { create } from "zustand";
// import axios from "axios";
import apiClient from "@/apiClient";

interface Vendor {
  id: string;
  vendorName: string;
  companyName: string;
  email: string;
  phone: string;
  payables: number;
  vendorId: string;
  syncStatus?: "success" | "pending" | "failed";
  lastSyncedAt?: string;
}

interface VendorDetails {
  personalInfo: {
    firstName: string;
    lastName: string;
    companyName: string;
    displayName: string;
    phone: string;
    email: string;
  };
  otherDetails: {
    msmeType: string;
    panNumber: string;
    website: string;
  };
  bankDetails: Array<{
    accountHolderName?: string;
    accountNumber?: string;
    bankName?: string;
    ifsc?: string;
  }>;
  transactions: {
    bills: Array<{
      date: string;
      billNumber: string;
      orderNumber: string;
      paymentStatus: string;
      amount: number;
      balanceDue: number;
    }>;
    purchaseOrders: Array<{
      date: string;
      poNumber: string;
      referenceNumber: string;
      status: string;
      amount: number;
    }>;
    vendorCredits: Array<{
      date: string;
      creditNumber: string;
      referenceNumber: string;
      status: string;
      amount: number;
    }>;
  };
}

interface SyncQueueItem {
  _id: string;
  entityType: string;
  entityId: string;
  status: string;
  retryCount: number;
  lastError?: string;
}

interface VendorStore {
  vendors: Vendor[];
  total: number;
  isLoading: boolean;
  vendorDetails: VendorDetails | null;
  isLoadingDetails: boolean;
  allVendors: Vendor[];
  isLoadingAll: boolean;
  isSyncing: boolean;
  syncMessage: string | null;
  failedSyncItems: SyncQueueItem[];
  fetchVendors: (page: number, limit: number, search?: string) => Promise<void>;
  fetchVendorDetails: (id: string) => Promise<void>;
  fetchAllVendors: () => Promise<void>;
  syncVendorsFromZoho: () => Promise<void>;
  fetchFailedSyncItems: () => Promise<void>;
  retrySyncItem: (id: string) => Promise<void>;
}

export const useVendorStore = create<VendorStore>((set, get) => ({
  vendors: [],
  total: 0,
  isLoading: false,
  vendorDetails: null,
  isLoadingDetails: false,
  allVendors: [],
  isLoadingAll: false,
  isSyncing: false,
  syncMessage: null,
  failedSyncItems: [],
  fetchVendors: async (page: number, limit: number, search?: string) => {
    set({ isLoading: true });
    try {
      const response = await apiClient.get<{
        data: Vendor[];
        total: number;
      }>("/purchase/vendor", {
        params: { page, limit, search },
      });
      set({
        vendors: response.data.data,
        total: response.data.total,
        isLoading: false,
      });
    } catch (error) {
      console.error("Failed to fetch vendors:", error);
      set({ isLoading: false });
    }
  },
  fetchVendorDetails: async (id: string) => {
    set({ isLoadingDetails: true });
    try {
      const response = await apiClient.get<VendorDetails>(
        `/purchase/vendor/${id}`
      );
      set({ vendorDetails: response.data, isLoadingDetails: false });
    } catch (error) {
      console.error("Failed to fetch vendor details:", error);
      set({ isLoadingDetails: false });
    }
  },
  fetchAllVendors: async () => {
    set({ isLoadingAll: true });
    try {
      const response = await apiClient.get<{
        success: boolean;
        data: Vendor[];
      }>("/purchase/vendor/all");
      set({
        allVendors: response.data.data,
        isLoadingAll: false,
      });
    } catch (error) {
      console.error("Failed to fetch all vendors:", error);
      set({ isLoadingAll: false });
    }
  },
  syncVendorsFromZoho: async () => {
    set({ isSyncing: true, syncMessage: null });
    try {
      const response = await apiClient.get<{
        success: boolean;
        message: string;
        count: number;
      }>("/purchase/vendor/sync");

      set({
        isSyncing: false,
        syncMessage:
          response.data.message ||
          `Successfully synced ${response.data.count} vendors`,
      });

      // Refresh the current vendor list after sync
      const currentPage = Math.ceil(get().vendors.length / 10) || 1;
      await get().fetchVendors(currentPage, 10);
    } catch (error: any) {
      console.error("Failed to sync vendors from Zoho:", error);
      
      // Extract error message from axios error response
      const errorMessage = error?.response?.data?.message 
        || error?.response?.data?.error
        || error?.message 
        || "Failed to sync vendors from Zoho";
      
      set({
        isSyncing: false,
        syncMessage: errorMessage,
      });
    }
  },

  fetchFailedSyncItems: async () => {
    try {
      const response = await apiClient.get<{
        success: boolean;
        items: SyncQueueItem[];
      }>("/sync-queue/failed");

      console.log("Fetched sync queue items:", response.data); // Debug log
      set({ failedSyncItems: response.data.items || [] });
    } catch (error) {
      console.error("Failed to fetch sync queue items:", error);
      set({ failedSyncItems: [] });
    }
  },

  retrySyncItem: async (id: string) => {
    try {
      await apiClient.post(`/sync-queue/retry/${id}`);
      
      // Refresh failed items
      await get().fetchFailedSyncItems();
      
      set({ syncMessage: "Retry initiated successfully" });
    } catch (error) {
      console.error("Failed to retry sync item:", error);
      set({ syncMessage: "Failed to retry sync" });
    }
  },
}));
