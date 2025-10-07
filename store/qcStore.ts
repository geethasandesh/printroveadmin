import { create } from "zustand";
import apiClient from "@/apiClient";
import { toast } from "react-hot-toast";

interface QCRecord {
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

interface QCDetails {
  productId: string;
  variantKey: string;
  zohoItemId: string;
  printConfigurations: any[];
  mockupImages: string[];
  thumbnails: any[];
  productName: string;
  planningStatus: string;
  orderId: string;
  uid: string;
  batchNumber: string;
  batchId: string;
}

interface QCStore {
  // List view state
  records: QCRecord[];
  pagination: PaginationInfo;
  isLoading: boolean;
  searchQuery: string;
  error: string | null;

  // Detail view state
  currentRecord: QCDetails | null;
  isDetailLoading: boolean;
  detailError: string | null;

  // Form state
  isSubmitting: boolean;

  // Actions
  fetchQCRecords: (
    page?: number,
    limit?: number,
    search?: string
  ) => Promise<void>;
  fetchQCDetails: (planId: string) => Promise<void>;
  updateQCStatus: (
    planId: string,
    status: "pass" | "fail",
    reason?: string
  ) => Promise<boolean>;
  setSearchQuery: (query: string) => void;
  clearCurrentRecord: () => void;

  // Helpers
  clearError: () => void;
  clearDetailError: () => void;
}

export const useQCStore = create<QCStore>((set, get) => ({
  // Initial list view state
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
  searchQuery: "",
  error: null,

  // Initial detail view state
  currentRecord: null,
  isDetailLoading: false,
  detailError: null,

  // Initial form state
  isSubmitting: false,

  // Set search query and fetch records
  setSearchQuery: (query: string) => {
    set({ searchQuery: query });
    // Fetch with new query
    get().fetchQCRecords(1, get().pagination.limit, query);
  },

  // Fetch all QC records with pagination and search
  fetchQCRecords: async (page = 1, limit = 10, search = get().searchQuery) => {
    try {
      set({ isLoading: true, error: null });

      const response = await apiClient.get("/qc", {
        params: {
          page,
          limit,
          search,
        },
      });

      const data = response.data as {
        success: boolean;
        data?: { records: QCRecord[]; pagination: PaginationInfo };
        error?: string;
      };

      if (data.success) {
        set({
          records: data.data?.records || [],
          pagination: data.data?.pagination || {
            total: 0,
            page: 1,
            limit: 10,
            pages: 0,
            hasNextPage: false,
            hasPrevPage: false,
          },
          isLoading: false,
        });
      } else {
        set({
          error: data.error || "Failed to fetch QC records",
          isLoading: false,
        });
        toast.error("Failed to fetch QC records");
      }
    } catch (error: any) {
      const errorMessage =
        error.response?.data?.error ||
        error.message ||
        "An error occurred while fetching QC records";

      set({ error: errorMessage, isLoading: false });
      toast.error(errorMessage);
    }
  },

  // Fetch QC details for a specific planning record
  fetchQCDetails: async (planId: string) => {
    try {
      set({ isDetailLoading: true, detailError: null });

      const response = await apiClient.get(`/qc/${planId}`);

      const data = response.data as {
        success: boolean;
        data?: any;
        error?: string;
      };

      if (data.success) {
        set({
          currentRecord: data.data,
          isDetailLoading: false,
        });
      } else {
        set({
          detailError: data.error || "Failed to fetch QC details",
          isDetailLoading: false,
        });
        toast.error("Failed to fetch QC details");
      }
    } catch (error: any) {
      const errorMessage =
        error.response?.data?.error ||
        error.message ||
        "An error occurred while fetching QC details";

      set({ detailError: errorMessage, isDetailLoading: false });
      toast.error(errorMessage);
    }
  },

  // Update QC status for a planning record
  updateQCStatus: async (
    planId: string,
    status: "pass" | "fail",
    reason?: string
  ) => {
    try {
      set({ isSubmitting: true });

      const payload: { status: string; reason?: string } = { status };

      if (status === "fail" && reason) {
        payload.reason = reason;
      }

      const response = await apiClient.put(`/qc/${planId}`, payload);

      const responseData = response.data as {
        success: boolean;
        error?: string;
      };
      if (responseData.success) {
        toast.success(
          `QC marked as ${status === "pass" ? "Passed" : "Failed"}`
        );
        set({ isSubmitting: false });
        return true;
      } else {
        const errorMsg =
          typeof response.data === "object" &&
          response.data !== null &&
          "error" in response.data
            ? (response.data as { error?: string }).error
            : undefined;
        toast.error(errorMsg || "Failed to update QC status");
        set({ isSubmitting: false });
        return false;
      }
    } catch (error: any) {
      const errorMessage =
        error.response?.data?.error ||
        error.message ||
        "An error occurred while updating QC status";

      toast.error(errorMessage);
      set({ isSubmitting: false });
      return false;
    }
  },

  // Clear current record
  clearCurrentRecord: () => set({ currentRecord: null }),

  // Clear errors
  clearError: () => set({ error: null }),
  clearDetailError: () => set({ detailError: null }),
}));
