import { create } from "zustand";
import apiClient from "@/apiClient";

interface PrintingRecord {
  createdAt: string;
  batchId: string;
  uid: string;
  orderId: string;
  productName: string;
  batchNumber: string;
}

interface PreviewStore {
  printingRecords: PrintingRecord[];
  total: number;
  isLoading: boolean;
  error: string | null;
  fetchPrintingRecords: (
    page: number,
    limit: number,
    search?: string
  ) => Promise<void>;
  clearError: () => void;
  getPrintingRecordByUID: (uid: string) => Promise<PrintingRecord | null>;
}

export const usePreviewStore = create<PreviewStore>((set) => ({
  printingRecords: [],
  total: 0,
  isLoading: false,
  error: null,

  fetchPrintingRecords: async (
    page: number,
    limit: number,
    search?: string
  ) => {
    try {
      set({ isLoading: true, error: null });

      // Build query parameters
      const params = new URLSearchParams();
      params.append("page", page.toString());
      params.append("limit", limit.toString());
      if (search) {
        params.append("search", search);
      }

      const response = await apiClient.get(`/preview/?${params.toString()}`);

      const data = response.data as {
        success: boolean;
        data: { records: PrintingRecord[]; count: number };
        message?: string;
      };

      if (data.success) {
        set({
          printingRecords: data.data.records,
          total: data.data.count,
          error: null,
        });
      } else {
        set({
          error: data.message || "Failed to fetch printing records",
        });
      }
    } catch (error: any) {
      set({
        error:
          error.response?.data?.message ||
          error.message ||
          "Error fetching printing records",
      });
    } finally {
      set({ isLoading: false });
    }
  },

  clearError: () => set({ error: null }),

  getPrintingRecordByUID: async (uid: string) => {
    try {
      set({ isLoading: true, error: null });
      const response = await fetch(
        `/api/printing/record-by-uid?uid=${encodeURIComponent(uid)}`
      );

      if (!response.ok) {
        const errorData = await response.json();
        set({
          error: errorData.message || "Failed to fetch record",
          isLoading: false,
        });
        return null;
      }

      const data = await response.json();
      return data;
    } catch (error: any) {
      set({
        error: error.message || "An error occurred while fetching the record",
        isLoading: false,
      });
      return null;
    } finally {
      set({ isLoading: false });
    }
  },
}));
