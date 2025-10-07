import { create } from "zustand";
import toast from "react-hot-toast";
import apiClient from "@/apiClient";

interface PlanningRecord {
  _id: string;
  uid: string;
  product: {
    name: string;
  };
  planningStatus: string;
  binNumber?: string;
}

// Define KittingBatch interface based on usage and BatchDetails structure
interface KittingBatch {
  _id: string;
  batchId: string;
  batchStatus: string;
  // Add other fields as needed
}

interface BatchDetails {
  _id: string;
  batchId: string;
  batchStatus: string;
  planningRecords: PlanningRecord[];
  // Add other batch fields as needed
}

interface KittingStore {
  // Batches listing state
  batches: KittingBatch[];
  isLoadingBatches: boolean;
  batchesError: string | null;

  // Batch details state
  currentBatch: BatchDetails | null;
  isLoadingBatchDetails: boolean;
  batchDetailsError: string | null;

  // Action state
  isSubmittingAction: boolean;

  // Actions
  fetchKittingBatches: () => Promise<void>;
  fetchBatchDetails: (batchId: string) => Promise<void>;
  markAsKitted: (planId: string) => Promise<boolean>;
  completeKittingBatch: (batchId: string) => Promise<void>;

  // Helpers
  clearBatchesError: () => void;
  clearBatchDetailsError: () => void;
  clearCurrentBatch: () => void;
}

export const useKittingStore = create<KittingStore>((set, get) => ({
  // Initial batches state
  batches: [],
  isLoadingBatches: false,
  batchesError: null,

  // Initial batch details state
  currentBatch: null,
  isLoadingBatchDetails: false,
  batchDetailsError: null,

  // Action state
  isSubmittingAction: false,

  // Fetch all kitting batches
  fetchKittingBatches: async () => {
    try {
      set({ isLoadingBatches: true, batchesError: null });

      const response = await apiClient.get("/kitting/batches");

      const data = response.data as {
        success: boolean;
        data: KittingBatch[];
        error?: string;
      };

      if (data.success) {
        set({
          batches: data.data,
          isLoadingBatches: false,
        });
      } else {
        set({
          batchesError: data.error || "Failed to fetch kitting batches",
          isLoadingBatches: false,
        });
        toast.error("Failed to fetch kitting batches");
      }
    } catch (error: any) {
      const errorMessage =
        error.response?.data?.error ||
        error.message ||
        "An error occurred while fetching kitting batches";

      set({ batchesError: errorMessage, isLoadingBatches: false });
      toast.error(errorMessage);
    }
  },

  // Fetch details for a specific batch
  fetchBatchDetails: async (batchId: string) => {
    try {
      set({ isLoadingBatchDetails: true, batchDetailsError: null });

      const response = await apiClient.get(
        `/kitting/batch/${batchId}/planning-records`
      );

      const data = response.data as {
        success: boolean;
        data: { planningRecords: PlanningRecord[] };
        error?: string;
      };

      if (data.success) {
        set({
          currentBatch: {
            _id: batchId,
            batchId,
            batchStatus: "", // Set this to the correct status if available in the API response
            planningRecords: data.data.planningRecords,
          },
          isLoadingBatchDetails: false,
        });
      } else {
        set({
          batchDetailsError: data.error || "Failed to fetch batch details",
          isLoadingBatchDetails: false,
        });
        toast.error("Failed to fetch batch details");
      }
    } catch (error: any) {
      const errorMessage =
        error.response?.data?.error ||
        error.message ||
        "An error occurred while fetching batch details";

      set({ batchDetailsError: errorMessage, isLoadingBatchDetails: false });
      toast.error(errorMessage);
    }
  },

  // Mark a planning record as kitted
  markAsKitted: async (planId: string) => {
    try {
      set({ isSubmittingAction: true });

      const response = await apiClient.put(`/kitting/${planId}/mark`);
      const data = response.data as {
        success: boolean;
        message?: string;
        error?: string;
        data?: { batchCompleted?: boolean };
      };

      if (data.success) {
        // If the item was successfully kitted
        toast.success(data.message || "Item marked as kitted");

        // If the entire batch is now complete
        if (data.data?.batchCompleted) {
          toast.success("Batch kitting completed! Moved to Packing.");
        }

        // Refresh batch details if we're viewing a batch
        const currentBatch = get().currentBatch;
        if (currentBatch) {
          await get().fetchBatchDetails(currentBatch.batchId);
        }

        // Also refresh the batches list
        await get().fetchKittingBatches();

        set({ isSubmittingAction: false });
        return true;
      } else {
        toast.error(data.error || "Failed to mark item as kitted");
        set({ isSubmittingAction: false });
        return false;
      }
    } catch (error: any) {
      const errorMessage =
        error.response?.data?.error ||
        error.message ||
        "An error occurred while marking item as kitted";

      toast.error(errorMessage);
      set({ isSubmittingAction: false });
      return false;
    }
  },

  // Complete kitting batch
  completeKittingBatch: async (batchId: string) => {
    try {
      set({ isSubmittingAction: true });

      // Call the API endpoint we created
      const response = await apiClient.post(
        `/kitting/batch/${batchId}/complete`
      );
      const data = response.data as { success: boolean; message?: string };

      if (data.success) {
        toast.success("Batch kitting completed successfully");

        // Update the local state if needed
        set((state) => {
          if (state.currentBatch && state.currentBatch._id === batchId) {
            return {
              ...state,
              currentBatch: {
                ...state.currentBatch,
                batchStatus: "Kitting Completed",
              },
            };
          }
          return state;
        });
      } else {
        toast.error(
          (typeof response.data === "object" &&
          response.data &&
          "message" in response.data
            ? (response.data as { message?: string }).message
            : undefined) || "Failed to complete batch kitting"
        );
      }
    } catch (error: any) {
      const errorMsg =
        error.response?.data?.message ||
        error.message ||
        "Failed to complete batch kitting";

      toast.error(errorMsg);
      set({
        batchDetailsError: errorMsg,
      });
    } finally {
      set({ isSubmittingAction: false });
    }
  },

  // Helper methods
  clearBatchesError: () => set({ batchesError: null }),
  clearBatchDetailsError: () => set({ batchDetailsError: null }),
  clearCurrentBatch: () => set({ currentBatch: null }),
}));
