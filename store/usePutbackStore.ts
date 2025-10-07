import { create } from "zustand";
import apiClient from "@/apiClient";

export interface PutbackBatch {
  _id: string;
  pickingId: string;
  batchId: string;
  batchName: string;
  date: string;
  totalSurplusItems: number;
  itemsToPutback: number;
  alreadyPutback: number;
  createdAt: string;
  updatedAt: string;
}

export interface PutbackItem {
  _id: string;
  pickingId: string;
  productId: string;
  productName: string;
  sku: string;
  variantId: string;
  surplusQty: number;
  putbackQty: number;
  pendingQty: number;
  batchName: string;
  binId: string;
  binName: string;
}

interface PutbackStore {
  // State
  pendingPutbacks: PutbackBatch[];
  currentPutbackItems: PutbackItem[] | null;
  isLoading: boolean;
  isProcessing: boolean;
  error: string | null;
  total: number;

  // Actions
  fetchPendingPutbacks: (
    page: number,
    limit: number,
    search?: string
  ) => Promise<void>;
  getPutbackDetailsByPickingId: (pickingId: string) => Promise<void>;
  performPutback: (
    pickingId: string,
    items: Array<{
      productId: string;
      binId: string;
      quantity: number;
      surplusId?: string;
    }>
  ) => Promise<{ success: boolean; message?: string }>;
  clearError: () => void;
}

export const usePutbackStore = create<PutbackStore>((set) => ({
  pendingPutbacks: [],
  currentPutbackItems: null,
  isLoading: false,
  isProcessing: false,
  error: null,
  total: 0,

  fetchPendingPutbacks: async (
    page: number,
    limit: number,
    search?: string
  ) => {
    set({ isLoading: true, error: null });
    try {
      const response = await apiClient.get("/putback", {
        params: {
          page,
          limit,
          search: search || undefined,
        },
      });

      const data = response.data as {
        success: boolean;
        data?: { batches?: PutbackBatch[]; total?: number };
        message?: string;
      };

      if (data.success) {
        set({
          pendingPutbacks: data.data?.batches || [],
          total: data.data?.total || 0,
        });
      } else {
        set({
          error: data.message || "Failed to fetch pending putbacks",
        });
      }
    } catch (error: any) {
      set({
        error:
          error.response?.data?.message ||
          error.message ||
          "Failed to fetch pending putbacks",
      });
    } finally {
      set({ isLoading: false });
    }
  },

  getPutbackDetailsByPickingId: async (pickingId: string) => {
    set({ isLoading: true, error: null });
    try {
      const response = await apiClient.get(`/putback/${pickingId}`);

      const data = response.data as {
        success: boolean;
        data?: { items?: PutbackItem[] };
        message?: string;
      };

      if (data.success) {
        set({ currentPutbackItems: data.data?.items || [] });
      } else {
        set({
          error: data.message || "Failed to fetch putback details",
        });
      }
    } catch (error: any) {
      set({
        error:
          error.response?.data?.message ||
          error.message ||
          "Failed to fetch putback details",
      });
    } finally {
      set({ isLoading: false });
    }
  },

  performPutback: async (
    pickingId: string,
    items: Array<{
      productId: string;
      binId: string;
      quantity: number;
      surplusId?: string;
    }>
  ) => {
    set({ isProcessing: true, error: null });
    try {
      const response = await apiClient.post(`/putback/${pickingId}`, { items });
      const responseData = response.data as {
        success: boolean;
        message?: string;
        data?: any;
      };

      if (responseData.success) {
        // Refresh the current putback details
        const detailsResponse = await apiClient.get(`/putback/${pickingId}`);
        if ((detailsResponse.data as { success: boolean }).success) {
          set({
            currentPutbackItems: (detailsResponse.data as any).data.items || [],
          });
        }

        return { success: true };
      }

      set({ error: responseData.message || "Failed to perform putback" });
      return {
        success: false,
        message: responseData.message || "Failed to perform putback",
      };
    } catch (error: any) {
      const errorMessage =
        error.response?.data?.message ||
        error.message ||
        "Failed to perform putback";
      set({ error: errorMessage });
      return { success: false, message: errorMessage };
    } finally {
      set({ isProcessing: false });
    }
  },

  clearError: () => set({ error: null }),
}));
