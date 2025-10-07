import { create } from "zustand";
import toast from "react-hot-toast";
import apiClient from "@/apiClient";

interface PackingBatch {
  _id: string;
  batchNumber: string;
  type: string;
  totalOrders: number;
  totalItems: number;
  fromDate: string;
  toDate: string;
  createdAt: string;
  batchStatus: string;
}

interface OrderItem {
  _id: string;
  orderId: string;
  merchant: {
    id: string;
    name: string;
  };
  createdAt: string;
  totalItems: number;
  packingStatus: "Pending" | "Completed";
  shippingAddress: {
    fullName: string;
  };
}

interface PackingStore {
  // Batches listing
  batches: PackingBatch[];
  isLoadingBatches: boolean;
  batchesError: string | null;

  // Batch order details
  currentBatch: {
    batchDetails: PackingBatch | null;
    orders: OrderItem[];
  };
  isLoadingBatchOrders: boolean;
  batchOrdersError: string | null;

  // Action states
  isSubmittingAction: boolean;

  // Actions
  fetchPackingBatches: () => Promise<void>;
  fetchBatchOrders: (batchId: string) => Promise<void>;
  markOrderAsPacked: (orderId: string, batchId: string) => Promise<void>;
  clearErrors: () => void;
  clearCurrentBatch: () => void;
}

export const usePackingStore = create<PackingStore>((set, get) => ({
  // Batches listing state
  batches: [],
  isLoadingBatches: false,
  batchesError: null,

  // Batch order details state
  currentBatch: {
    batchDetails: null,
    orders: [],
  },
  isLoadingBatchOrders: false,
  batchOrdersError: null,

  // Action states
  isSubmittingAction: false,

  // Actions
  fetchPackingBatches: async () => {
    try {
      set({ isLoadingBatches: true, batchesError: null });

      const response = await apiClient.get("/packing/batches");
      const data = response.data as {
        success: boolean;
        data: PackingBatch[];
        message?: string;
      };

      if (data.success) {
        set({
          batches: data.data,
          isLoadingBatches: false,
        });
      } else {
        throw new Error(data.message || "Failed to fetch packing batches");
      }
    } catch (error: any) {
      const errorMsg =
        error.response?.data?.message ||
        error.message ||
        "Failed to fetch packing batches";

      set({
        isLoadingBatches: false,
        batchesError: errorMsg,
      });

      toast.error(errorMsg);
    }
  },

  fetchBatchOrders: async (batchId: string) => {
    try {
      set({ isLoadingBatchOrders: true, batchOrdersError: null });

      const response = await apiClient.get(`/packing/batch/${batchId}/orders`);
      const data = response.data as {
        success: boolean;
        data: {
          batchDetails: PackingBatch;
          orders: OrderItem[];
        };
        message?: string;
      };

      if (data.success) {
        set({
          currentBatch: {
            batchDetails: data.data.batchDetails,
            orders: data.data.orders,
          },
          isLoadingBatchOrders: false,
        });
      } else {
        throw new Error(data.message || "Failed to fetch batch orders");
      }
    } catch (error: any) {
      const errorMsg =
        error.response?.data?.message ||
        error.message ||
        "Failed to fetch batch orders";

      set({
        isLoadingBatchOrders: false,
        batchOrdersError: errorMsg,
      });

      toast.error(errorMsg);
    }
  },

  markOrderAsPacked: async (orderId: string, batchId: string) => {
    try {
      set({ isSubmittingAction: true });

      const response = await apiClient.post(
        `/packing/batch/${batchId}/order/${orderId}/pack`
      );

      const data = response.data as {
        success: boolean;
        message?: string;
        allPackingComplete?: boolean;
      };

      if (data.success) {
        toast.success(`Order ${orderId} marked as packed successfully`);

        // Update the order status in the current batch orders
        set((state) => ({
          currentBatch: {
            ...state.currentBatch,
            orders: state.currentBatch.orders.map((order) =>
              order.orderId === orderId
                ? { ...order, packingStatus: "Completed" }
                : order
            ),
          },
        }));

        // If all orders are now packed, refresh the batches list
        if (data.allPackingComplete) {
          toast.success("All orders in this batch have been packed");
          get().fetchPackingBatches();
        }
      } else {
        throw new Error(data.message || "Failed to mark order as packed");
      }
    } catch (error: any) {
      const errorMsg =
        error.response?.data?.message ||
        error.message ||
        "Failed to mark order as packed";

      toast.error(errorMsg);
    } finally {
      set({ isSubmittingAction: false });
    }
  },

  clearErrors: () =>
    set({
      batchesError: null,
      batchOrdersError: null,
    }),

  clearCurrentBatch: () =>
    set({
      currentBatch: {
        batchDetails: null,
        orders: [],
      },
    }),
}));
