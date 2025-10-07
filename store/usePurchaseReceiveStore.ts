import { create } from "zustand";
import apiClient from "@/apiClient";
import {
  PurchaseReceive,
  PurchaseReceivePayload,
  UpdatePurchaseReceivePayload,
} from "@/types/purchase-receive";

interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  pages: number;
}

interface SingleResponse<T> {
  success: boolean;
  data: T;
}

interface PurchaseReceiveStore {
  // State
  purchaseReceives: PurchaseReceive[];
  selectedReceive: PurchaseReceive | null;
  total: number;
  page: number;
  limit: number;
  pages: number;

  // Loading states
  isLoading: boolean;
  isCreating: boolean;
  isLoadingDetails: boolean;

  // Error state
  error: string | null;

  // Actions
  createPurchaseReceive: (data: PurchaseReceivePayload) => Promise<void>;
  fetchPurchaseReceives: (
    page: number,
    limit: number,
    search?: string
  ) => Promise<void>;
  fetchPurchaseReceiveById: (id: string) => Promise<void>;
  updatePurchaseReceiveById: (
    id: string,
    data: UpdatePurchaseReceivePayload
  ) => Promise<boolean>;
  resetSelectedReceive: () => void;
  resetError: () => void;
}

export const usePurchaseReceiveStore = create<PurchaseReceiveStore>((set) => ({
  // Initial state
  purchaseReceives: [],
  selectedReceive: null,
  total: 0,
  page: 1,
  limit: 10,
  pages: 0,

  // Loading states
  isLoading: false,
  isCreating: false,
  isLoadingDetails: false,

  // Error state
  error: null,

  // Actions
  createPurchaseReceive: async (data: PurchaseReceivePayload) => {
    try {
      set({ isCreating: true, error: null });
      await apiClient.post("/purchase/receive", data);
      set({ isCreating: false });
    } catch (error) {
      console.error("Error creating purchase receive:", error);
      set({
        isCreating: false,
        error:
          error instanceof Error
            ? error.message
            : "Failed to create purchase receive",
      });
      throw error;
    }
  },

  fetchPurchaseReceives: async (
    page: number,
    limit: number,
    search?: string
  ) => {
    try {
      set({ isLoading: true, error: null });
      const response = await apiClient.get<PaginatedResponse<PurchaseReceive>>(
        "/purchase/receive",
        {
          params: { page, limit, search },
        }
      );

      set({
        purchaseReceives: response.data.data,
        total: response.data.total,
        page: response.data.page,
        limit: response.data.limit,
        pages: response.data.pages,
        isLoading: false,
      });
    } catch (error) {
      console.error("Error fetching purchase receives:", error);
      set({
        isLoading: false,
        error: "Failed to fetch purchase receives",
      });
    }
  },

  fetchPurchaseReceiveById: async (id: string) => {
    try {
      set({ isLoadingDetails: true, error: null });
      const response = await apiClient.get<SingleResponse<PurchaseReceive>>(
        `/purchase/receive/${id}`
      );

      set({
        selectedReceive: response.data.data,
        isLoadingDetails: false,
      });
    } catch (error) {
      console.error("Error fetching purchase receive details:", error);
      set({
        isLoadingDetails: false,
        error: "Failed to fetch purchase receive details",
      });
    }
  },

  updatePurchaseReceiveById: async (
    id: string,
    data: UpdatePurchaseReceivePayload
  ) => {
    try {
      set({ error: null });
      const response = await apiClient.put<SingleResponse<PurchaseReceive>>(
        `/purchase/receive/${id}`,
        data
      );

      set({ selectedReceive: response.data.data });
      return true;
    } catch (error) {
      console.error("Error updating purchase receive:", error);
      set({
        error:
          error instanceof Error
            ? error.message
            : "Failed to update purchase receive",
      });
      return false;
    }
  },

  resetSelectedReceive: () => set({ selectedReceive: null }),

  resetError: () => set({ error: null }),
}));
