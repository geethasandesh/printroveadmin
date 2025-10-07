import { create } from "zustand";
import apiClient from "@/apiClient";
import { toast } from "react-hot-toast";

interface PrintingRecord {
  id: string;
  createdAt: string;
  uid: string;
  batchId: string;
  batchNumber: string;
  orderId: string;
  productName: string;
}

interface PaginationInfo {
  total: number;
  page: number;
  limit: number;
  pages: number;
  hasNextPage: boolean;
  hasPrevPage: boolean;
}

interface PrintingStore {
  // State
  records: PrintingRecord[];
  pagination: PaginationInfo;
  isLoading: boolean;
  isSubmitting: boolean;
  error: string | null;
  searchQuery: string;

  // Actions
  fetchPrintingRecords: (
    page?: number,
    limit?: number,
    search?: string
  ) => Promise<void>;
  completePrinting: (recordId: string) => Promise<boolean>;
  setSearchQuery: (query: string) => void;

  // Helpers
  clearError: () => void;
}

export const usePrintingStore = create<PrintingStore>((set, get) => ({
  // Initial state
  records: [],
  pagination: {
    total: 0,
    page: 1,
    limit: 10,
    pages: 0,
    hasNextPage: false,
    hasPrevPage: false,
  },
  isLoading: false,
  isSubmitting: false,
  error: null,
  searchQuery: "",

  // Set search query
  setSearchQuery: (query: string) => {
    set({ searchQuery: query });
    // Fetch with new query
    get().fetchPrintingRecords(1, get().pagination.limit, query);
  },

  // Fetch all printing records with pagination
  fetchPrintingRecords: async (
    page = 1,
    limit = 10,
    search = get().searchQuery
  ) => {
    try {
      set({ isLoading: true, error: null });

      const response = await apiClient.get("/printing", {
        params: {
          page,
          limit,
          search,
        },
      });

      const data = response.data as {
        success: boolean;
        data?: {
          records: PrintingRecord[];
          pagination: PaginationInfo;
        };
        error?: string;
      };

      if (data.success && data.data) {
        set({
          records: data.data.records || [],
          pagination: data.data.pagination,
          isLoading: false,
        });
      } else {
        set({
          error: data.error || "Failed to fetch printing records",
          isLoading: false,
        });
        toast.error("Failed to fetch printing records");
      }
    } catch (error: any) {
      const errorMessage =
        error.response?.data?.error ||
        error.message ||
        "An error occurred while fetching printing records";

      set({ error: errorMessage, isLoading: false });
      toast.error(errorMessage);
    }
  },

  // Mark a record as completed
  completePrinting: async (recordId: string) => {
    try {
      set({ isSubmitting: true, error: null });

      const response = await apiClient.put(`/printing/${recordId}/complete`);

      const data = response.data as { success: boolean; error?: string };
      if (data.success) {
        // Optimistically remove the record from the state
        const updatedRecords = get().records.filter(
          (record) => record.id !== recordId
        );
        set({ records: updatedRecords, isSubmitting: false });
        toast.success("Record marked as completed");
        return true;
      } else {
        set({
          error: data.error || "Failed to complete printing",
          isSubmitting: false,
        });
        toast.error("Failed to complete printing");
        return false;
      }
    } catch (error: any) {
      const errorMessage =
        error.response?.data?.error ||
        error.message ||
        "An error occurred while completing printing";

      set({ error: errorMessage, isSubmitting: false });
      toast.error(errorMessage);
      return false;
    }
  },

  // Clear error state
  clearError: () => set({ error: null }),
}));
