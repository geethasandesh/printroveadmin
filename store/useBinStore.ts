import { create } from "zustand";
import apiClient from "@/apiClient";

interface Bin {
  _id: string;
  name: string;
  category: string;
  createdAt: string;
  updatedAt: string;
}

interface BinWithStock extends Bin {
  stockQty: number;
}

interface BinPayload {
  name: string;
  category: string;
}

interface BinStore {
  bins: Bin[];
  allBins: Bin[]; // All bins without pagination
  productBins: BinWithStock[]; // Bins containing specific product with stock info
  total: number;
  isLoading: boolean;
  isLoadingAll: boolean;
  isLoadingProductBins: boolean; // New loading state for product bins
  error: string | null;

  createBin: (payload: BinPayload) => Promise<void>;
  fetchBins: (page: number, limit: number) => Promise<void>;
  fetchAllBins: () => Promise<void>;
  fetchBinsByProductId: (productId: string) => Promise<void>; // New method for product-specific bins
  updateBin: (id: string, payload: BinPayload) => Promise<void>;
  deleteBin: (id: string) => Promise<void>;
}

export const useBinStore = create<BinStore>((set) => ({
  bins: [],
  allBins: [],
  productBins: [], // Initialize the product bins array
  total: 0,
  isLoading: false,
  isLoadingAll: false,
  isLoadingProductBins: false, // Initialize the new loading state
  error: null,

  createBin: async (payload: BinPayload) => {
    try {
      set({ isLoading: true, error: null });

      await apiClient.post("/inventory/bins", payload);

      // Refresh the bins list after creation (assuming first page)
      const response = await apiClient.get<{ data: Bin[]; total: number }>(
        "/inventory/bins?page=1&limit=10"
      );

      set({
        bins: response.data.data,
        total: response.data.total,
        isLoading: false,
      });

      // Also refresh the all bins list
      const allBinsResponse = await apiClient.get<{ data: Bin[] }>(
        "/inventory/bins/all"
      );

      set({
        allBins: allBinsResponse.data.data,
      });
    } catch (error) {
      set({
        isLoading: false,
        error: error instanceof Error ? error.message : "Failed to create bin",
      });
      throw error; // Re-throw to handle in the UI
    }
  },

  fetchBins: async (page: number, limit: number) => {
    try {
      set({ isLoading: true, error: null });

      const response = await apiClient.get<{ data: Bin[]; total: number }>(
        `/inventory/bins?page=${page}&limit=${limit}`
      );

      set({
        bins: response.data.data,
        total: response.data.total,
        isLoading: false,
      });
    } catch (error) {
      set({
        isLoading: false,
        error: error instanceof Error ? error.message : "Failed to fetch bins",
      });
    }
  },

  fetchAllBins: async () => {
    try {
      set({ isLoadingAll: true, error: null });

      const response = await apiClient.get<{ data: Bin[] }>(
        "/inventory/bins/all"
      );

      set({
        allBins: response.data.data,
        isLoadingAll: false,
      });
    } catch (error) {
      set({
        isLoadingAll: false,
        error:
          error instanceof Error ? error.message : "Failed to fetch all bins",
      });
    }
  },

  // New function to fetch bins containing a specific product
  fetchBinsByProductId: async (productId: string) => {
    try {
      set({ isLoadingProductBins: true, error: null });

      const response = await apiClient.get<{
        success: boolean;
        data: BinWithStock[];
        total: number;
      }>(`/inventory/bins/product/${productId}`);

      if (response.data.success) {
        set({
          productBins: response.data.data,
          isLoadingProductBins: false,
        });
      } else {
        throw new Error("Failed to fetch bins for product");
      }
    } catch (error) {
      set({
        isLoadingProductBins: false,
        error:
          error instanceof Error
            ? error.message
            : "Failed to fetch bins for product",
        productBins: [], // Reset on error
      });
    }
  },

  updateBin: async (id: string, payload: BinPayload) => {
    try {
      set({ isLoading: true, error: null });

      await apiClient.put(`/inventory/bins/${id}`, payload);

      // Refresh the bins list after update (assuming first page)
      const response = await apiClient.get<{ data: Bin[]; total: number }>(
        "/inventory/bins?page=1&limit=10"
      );

      set({
        bins: response.data.data,
        total: response.data.total,
        isLoading: false,
      });

      // Also refresh the all bins list
      const allBinsResponse = await apiClient.get<{ data: Bin[] }>(
        "/inventory/bins/all"
      );

      set({
        allBins: allBinsResponse.data.data,
      });
    } catch (error) {
      set({
        isLoading: false,
        error: error instanceof Error ? error.message : "Failed to update bin",
      });
      throw error; // Re-throw to handle in the UI
    }
  },

  deleteBin: async (id: string) => {
    try {
      set({ isLoading: true, error: null });

      await apiClient.delete(`/inventory/bins/${id}`);

      // Refresh the bins list after deletion (assuming first page)
      const response = await apiClient.get<{ data: Bin[]; total: number }>(
        "/inventory/bins?page=1&limit=10"
      );

      set({
        bins: response.data.data,
        total: response.data.total,
        isLoading: false,
      });

      // Also refresh the all bins list
      const allBinsResponse = await apiClient.get<{ data: Bin[] }>(
        "/inventory/bins/all"
      );

      set({
        allBins: allBinsResponse.data.data,
      });
    } catch (error) {
      set({
        isLoading: false,
        error: error instanceof Error ? error.message : "Failed to delete bin",
      });
      throw error; // Re-throw to handle in the UI
    }
  },
}));
