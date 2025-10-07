import { create } from "zustand";
import apiClient from "@/apiClient";

interface OrderRef {
  id: string;
  name: string;
  _id: string;
}

interface Batch {
  _id: string;
  batchNumber: string;
  type: string;
  orderIds: OrderRef[];
  fromDate: string;
  toDate: string;
  batchStatus: string;
  dtgCount: number;
  dtfCount: number;
  merchants: any[];
  createdAt: string;
  updatedAt: string;
  isEligibleForPicking?: boolean;
  pickingEligibilityMarkedAt?: string;
  pickingEligibilityMarkedBy?: string;
}

interface BatchFormData {
  batchType: "RUSH" | "OUTSOURCED" | "IN-HOUSE NON TSHIRT";
  dtgCount: number;
  dtfCount: number;
  orderIds: Array<{ id: string; name: string }>;
  fromDate: string;
  toDate: string;
}

interface BatchResponse {
  success: boolean;
  message?: string;
  data?: {
    success: boolean;
    message?: string;
    suggestions?: Array<{
      id: string;
      name: string;
      products: Array<{
        id: string;
        printType: string;
        qty: number;
        sku: string;
      }>;
      totalQty: number;
    }>;
  };
}

interface Order {
  id: string;
  name: string;
}

interface DownloadResponse {
  success: boolean;
  message?: string;
}

interface BatchStore {
  batches: any[];
  orders: Order[];
  total: number;
  isLoading: boolean;
  isCreating: boolean;
  isDownloading: boolean;
  error: string | null;
  downloadError: string | null;
  fetchBatches: (page: number, limit: number, search?: string) => Promise<void>;
  fetchOrders: () => Promise<void>;
  createBatch: (batchData: BatchFormData) => Promise<BatchResponse>;
  markBatchEligibleForPicking: (batchId: string) => Promise<{
    success: boolean;
    message?: string;
    data?: any;
  }>;
  downloadBrandingImages: (batchId: string) => Promise<boolean>;
  downloadBarcodes: (batchId: string) => Promise<boolean>; // Add this line
}

export const useBatchStore = create<BatchStore>((set, get) => ({
  batches: [],
  orders: [],
  total: 0,
  isLoading: false,
  isCreating: false,
  isDownloading: false,
  error: null,
  downloadError: null,

  fetchBatches: async (page: number, limit: number, search?: string) => {
    try {
      set({ isLoading: true });
      const response = await apiClient.get<{
        success: boolean;
        data: Batch[];
        total: number;
      }>("/batch", {
        params: { page, limit, search },
      });

      if (response.data.success) {
        set({
          batches: response.data.data,
          total: response.data.total,
          error: null,
        });
      }
    } catch (error: any) {
      set({ error: error.message || "Failed to fetch batches" });
    } finally {
      set({ isLoading: false });
    }
  },

  fetchOrders: async () => {
    try {
      set({ isLoading: true });
      const response = await apiClient.get("/order/all");

      const data = response.data as { success: boolean; data: any[] };
      if (data.success) {
        set({
          orders: data.data.map((order: any) => ({
            id: order._id,
            name: order.orderId,
          })),
          error: null,
        });
      }
    } catch (error: any) {
      set({ error: error.message || "Failed to fetch orders" });
    } finally {
      set({ isLoading: false });
    }
  },

  createBatch: async (batchData: BatchFormData) => {
    try {
      set({ isCreating: true, error: null });
      const response = await apiClient.post("/batch", batchData);

      // Handle the nested success structure in the response
      const apiResponse = response.data as BatchResponse;

      // If the API response indicates success but the data contains success: false
      if (
        apiResponse.success &&
        apiResponse.data &&
        apiResponse.data.success === false
      ) {
        return {
          success: false,
          message: apiResponse.data.message || "Failed to create batch",
          data: apiResponse.data,
          suggestions: apiResponse.data.suggestions || [],
        };
      }

      // If the API response indicates success and data is also successful or undefined
      if (
        apiResponse.success &&
        (!apiResponse.data || apiResponse.data.success !== false)
      ) {
        await get().fetchBatches(1, 10);
        return {
          success: true,
          data: apiResponse.data,
        };
      }

      // If the API response indicates failure
      return {
        success: false,
        message: apiResponse.message || "Failed to create batch",
        suggestions: apiResponse.data?.suggestions || [],
      };
    } catch (error: any) {
      set({
        error:
          error.response?.data?.message ||
          error.message ||
          "Failed to create batch",
      });
      return {
        success: false,
        message:
          error.response?.data?.message ||
          error.message ||
          "Failed to create batch",
      };
    } finally {
      set({ isCreating: false });
    }
  },

  markBatchEligibleForPicking: async (batchId: string) => {
    try {
      set({ isLoading: true });
      const response = await apiClient.put(`/batch/${batchId}/mark-eligible`);
      const data = response.data as {
        success: boolean;
        message?: string;
        data?: any;
      };

      return {
        success: data.success,
        message: data.message,
        data: data.data,
      };
    } catch (error: any) {
      console.error("Failed to mark batch as eligible:", error);
      return {
        success: false,
        message:
          error.response?.data?.message ||
          error.message ||
          "Failed to mark batch as eligible for picking",
      };
    } finally {
      set({ isLoading: false });
    }
  },

  downloadBrandingImages: async (batchId: string) => {
    try {
      set({ isDownloading: true, downloadError: null });

      // Find the batch to get its order IDs
      const batch = get().batches.find((b) => b._id === batchId);

      if (!batch || !batch.orderIds || batch.orderIds.length === 0) {
        set({
          downloadError:
            "No orders found in this batch to download branding images",
          isDownloading: false,
        });
        return false;
      }

      // Extract order IDs from the batch
      const orderIds = batch.orderIds.map((order: OrderRef) => order.id);

      // Call the API to download branding images
      // We need to use fetch directly instead of apiClient to handle the blob response
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/downloads/branding-images`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            // Include auth headers if needed
            ...(apiClient.defaults.headers.common["Authorization"]
              ? {
                  Authorization: apiClient.defaults.headers.common[
                    "Authorization"
                  ] as string,
                }
              : {}),
          },
          body: JSON.stringify({ orderIds }),
        }
      );

      if (!response.ok) {
        // Try to parse error message if available
        let errorMessage = "Failed to download branding images";
        try {
          const errorData = await response.json();
          errorMessage = errorData.message || errorMessage;
        } catch (e) {
          // If parsing fails, use the default error message
        }

        set({ downloadError: errorMessage, isDownloading: false });
        return false;
      }

      // Get the filename from content disposition header or use a default
      const contentDisposition = response.headers.get("content-disposition");
      const filenameMatch =
        contentDisposition && contentDisposition.match(/filename="(.+?)"/);
      const filename = filenameMatch
        ? filenameMatch[1]
        : `branding-images-batch-${batch.batchNumber}.zip`;

      // Convert response to blob and trigger download
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = filename;
      document.body.appendChild(link);
      link.click();

      // Cleanup
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);

      set({ isDownloading: false });
      return true;
    } catch (error: any) {
      console.error("Error downloading branding images:", error);
      set({
        downloadError: error.message || "Failed to download branding images",
        isDownloading: false,
      });
      return false;
    }
  },

  downloadBarcodes: async (batchId: string) => {
    try {
      set({ isDownloading: true, downloadError: null });

      // We need to use fetch directly instead of apiClient to handle PDF response
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/batch/${batchId}/barcodes`,
        {
          method: "GET",
          headers: {
            Accept: "application/pdf",
            // Include auth headers if needed
            ...(apiClient.defaults.headers.common["Authorization"]
              ? {
                  Authorization: apiClient.defaults.headers.common[
                    "Authorization"
                  ] as string,
                }
              : {}),
          },
        }
      );

      if (!response.ok) {
        // Try to parse error message if available
        let errorMessage = "Failed to download barcodes";
        try {
          const errorData = await response.json();
          errorMessage = errorData.message || errorMessage;
        } catch (e) {
          // If parsing fails, use the default error message
        }

        set({ downloadError: errorMessage, isDownloading: false });
        return false;
      }

      // Get the batch number for the filename
      const batch = get().batches.find((b) => b._id === batchId);
      const batchNumber = batch ? batch.batchNumber : batchId;

      // Convert response to blob and trigger download
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `barcodes-batch-${batchNumber}.pdf`;
      document.body.appendChild(link);
      link.click();

      // Cleanup
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);

      set({ isDownloading: false });
      return true;
    } catch (error: any) {
      console.error("Error downloading barcodes:", error);
      set({
        downloadError: error.message || "Failed to download barcodes",
        isDownloading: false,
      });
      return false;
    }
  },
}));
