import { create } from "zustand";
import { toast } from "react-hot-toast";
import apiClient from "@/apiClient";

export interface Bin {
  id: string;
  name: string;
  category: string;
}

export interface StockItem {
  id: string;
  productId: string;
  productName: string;
  productSku: string;
  binNumber: string;
  binName: string;
  qty: number;
  qtyOnHand?: number;
  isModified?: boolean;
}

export interface InventoryAdjustment {
  id: string;
  productId: string;
  productName: string;
  productSku: string;
  binNumber: string;
  binName: string;
  oldQty: number;
  newQty: number;
  reason: string;
  type: "MANUAL" | "CYCLE_COUNT";
  adjustedBy: string;
  adjustedAt: string;
}

export interface UpdateAdjustmentRequestDto {
  newQty?: number;
  reason?: AdjustmentReason;
  adjustedBy: string;
}

export type AdjustmentReason =
  | "Damaged"
  | "Found"
  | "Lost"
  | "Initial Count"
  | "Returned"
  | "Cycle Count"
  | "Other";

export interface SimplifiedAdjustment {
  id: string;
  createdDate: string;
  stockAdjustment: string;
  createdBy: string;
  lastUpdated: string;
}

interface InventoryAdjustmentState {
  // State
  isLoading: boolean;
  bins: Bin[];
  selectedBins: string[];
  inventoryItems: StockItem[];
  cycleCountItems: StockItem[];
  reason: AdjustmentReason;
  currentPage: number;
  totalItems: number;
  itemsPerPage: number;
  adjustmentHistory: SimplifiedAdjustment[] | InventoryAdjustment[];
  selectedAdjustment: InventoryAdjustment | null;
  isLoadingDetails: boolean;
  error: string | null;

  // Actions
  setLoading: (loading: boolean) => void;
  fetchBins: () => Promise<void>;
  setSelectedBins: (binIds: string[]) => void;
  fetchStockByBins: (page?: number) => Promise<void>;
  updateQtyOnHand: (itemId: string, value: number) => void;
  setReason: (reason: AdjustmentReason) => void;
  saveManualAdjustments: () => Promise<boolean>;
  fetchCycleCount: (count: number) => Promise<void>;
  saveCycleCount: () => Promise<boolean>;
  fetchAdjustmentHistory: (
    page?: number,
    type?: "MANUAL" | "CYCLE_COUNT"
  ) => Promise<void>;
  fetchAdjustmentById: (id: string) => Promise<void>;
  updateAdjustmentById: (
    id: string,
    updateData: UpdateAdjustmentRequestDto
  ) => Promise<boolean>;
  deleteAdjustmentById: (id: string, deletedBy: string) => Promise<boolean>;
  resetSelectedAdjustment: () => void;
  resetStore: () => void;
}

const useInventoryAdjustmentStore = create<InventoryAdjustmentState>(
  (set, get) => ({
    // Initial state
    isLoading: false,
    bins: [],
    selectedBins: [],
    inventoryItems: [],
    cycleCountItems: [],
    reason: "Initial Count",
    currentPage: 1,
    totalItems: 0,
    itemsPerPage: 20,
    adjustmentHistory: [],
    selectedAdjustment: null,
    isLoadingDetails: false,
    error: null,

    // Actions
    setLoading: (loading) => set({ isLoading: loading }),

    fetchBins: async () => {
      try {
        set({ isLoading: true });
        const response = await apiClient.get("/inventory/adjustments/bins");
        const data = response.data as { data: Bin[] };
        set({ bins: data.data, isLoading: false });
      } catch (error) {
        console.error("Error fetching bins:", error);
        toast.error("Failed to fetch bins");
        set({ isLoading: false });
      }
    },

    setSelectedBins: (binIds) => {
      set({ selectedBins: binIds });
    },

    fetchStockByBins: async (page = 1) => {
      const { selectedBins, itemsPerPage } = get();

      if (selectedBins.length === 0) {
        set({ inventoryItems: [], totalItems: 0 });
        return;
      }

      try {
        set({ isLoading: true });
        const response = await apiClient.get("/inventory/adjustments/stock", {
          params: {
            binIds: JSON.stringify(selectedBins),
            page,
            limit: itemsPerPage,
          },
        });

        const data = response.data as { data: StockItem[]; total: number };
        const items = data.data.map((item: StockItem) => ({
          ...item,
          qtyOnHand: item.qty,
          isModified: false,
        }));

        set({
          inventoryItems: items,
          totalItems: data.total,
          currentPage: page,
          isLoading: false,
        });
      } catch (error) {
        console.error("Error fetching stock:", error);
        toast.error("Failed to fetch inventory items");
        set({ isLoading: false });
      }
    },

    updateQtyOnHand: (itemId, value) => {
      const { inventoryItems, cycleCountItems } = get();

      // Update in inventory items if present
      const updatedInventoryItems = inventoryItems.map((item) =>
        item.id === itemId
          ? { ...item, qtyOnHand: value, isModified: item.qty !== value }
          : item
      );

      // Update in cycle count items if present
      const updatedCycleCountItems = cycleCountItems.map((item) =>
        item.id === itemId
          ? { ...item, qtyOnHand: value, isModified: item.qty !== value }
          : item
      );

      set({
        inventoryItems: updatedInventoryItems,
        cycleCountItems: updatedCycleCountItems,
      });
    },

    setReason: (reason) => {
      set({ reason });
    },

    saveManualAdjustments: async () => {
      const { inventoryItems, reason } = get();
      const modifiedItems = inventoryItems.filter((item) => item.isModified);

      if (modifiedItems.length === 0) {
        toast.error("No changes to save");
        return false;
      }

      try {
        set({ isLoading: true });

        const payload = {
          items: modifiedItems.map((item) => ({
            productId: item.productId,
            binNumber: item.binNumber,
            newQty: item.qtyOnHand,
            reason,
          })),
        };

        await apiClient.post("/inventory/adjustments/adjust", payload);

        toast.success("Inventory adjustments saved successfully");
        set({ isLoading: false });
        return true;
      } catch (error) {
        console.error("Error saving adjustments:", error);
        toast.error("Failed to save inventory adjustments");
        set({ isLoading: false });
        return false;
      }
    },

    fetchCycleCount: async (count) => {
      try {
        set({ isLoading: true });

        const response = await apiClient.get(
          "/inventory/adjustments/cycle-count",
          {
            params: { count },
          }
        );

        const data = response.data as { data: StockItem[] };
        const items = data.data.map((item: StockItem) => ({
          ...item,
          qtyOnHand: item.qty,
          isModified: false,
        }));

        set({ cycleCountItems: items, isLoading: false });
      } catch (error) {
        console.error("Error fetching cycle count items:", error);
        toast.error("Failed to fetch cycle count items");
        set({ isLoading: false });
      }
    },

    saveCycleCount: async () => {
      const { cycleCountItems } = get();
      const modifiedItems = cycleCountItems.filter((item) => item.isModified);

      if (modifiedItems.length === 0) {
        toast.error("No changes to save");
        return false;
      }

      try {
        set({ isLoading: true });

        const payload = {
          items: modifiedItems.map((item) => ({
            stockId: item.id,
            productId: item.productId,
            binNumber: item.binNumber,
            currentQty: item.qty,
            newQty: item.qtyOnHand,
            reason: "Cycle Count",
          })),
        };

        await apiClient.post(
          "/inventory/adjustments/cycle-count/confirm",
          payload
        );

        toast.success("Cycle count confirmed successfully");
        set({ isLoading: false });
        return true;
      } catch (error) {
        console.error("Error confirming cycle count:", error);
        toast.error("Failed to confirm cycle count");
        set({ isLoading: false });
        return false;
      }
    },

    fetchAdjustmentHistory: async (page = 1, type) => {
      try {
        set({ isLoading: true });

        const { itemsPerPage } = get();
        const params: any = { page, limit: itemsPerPage };

        if (type) {
          params.type = type;
        }

        const response = await apiClient.get("/inventory/adjustments", {
          params,
        });

        const data = response.data as {
          data: SimplifiedAdjustment[] | InventoryAdjustment[];
          total: number;
        };

        set({
          adjustmentHistory: data.data,
          totalItems: data.total,
          currentPage: page,
          isLoading: false,
        });
      } catch (error) {
        console.error("Error fetching adjustment history:", error);
        toast.error("Failed to fetch adjustment history");
        set({ isLoading: false });
      }
    },

    fetchAdjustmentById: async (id) => {
      try {
        console.log("Store: Fetching adjustment by ID:", id);
        set({ isLoadingDetails: true, error: null });

        const response = await apiClient.get(`/inventory/adjustments/${id}`);
        console.log("Store: API response received:", response.data);

        const apiResponse = response.data as { success: boolean; data: InventoryAdjustment };
        console.log("Store: Parsed response:", apiResponse);

        if (apiResponse.success && apiResponse.data) {
          const adjustment = apiResponse.data;
          console.log("Store: Setting adjustment:", adjustment);

          set({
            selectedAdjustment: adjustment,
            isLoadingDetails: false,
          });
        } else {
          throw new Error("API returned unsuccessful response");
        }
      } catch (error) {
        console.error("Store: Error fetching adjustment details:", error);
        const errorMessage = "Failed to fetch adjustment details";
        toast.error(errorMessage);
        set({
          error: errorMessage,
          isLoadingDetails: false,
          selectedAdjustment: null,
        });
      }
    },

    updateAdjustmentById: async (id, updateData) => {
      try {
        set({ isLoadingDetails: true, error: null });

        const response = await apiClient.put(
          `/inventory/adjustments/${id}`,
          updateData
        );

        const apiResponse = response.data as { success: boolean; data: InventoryAdjustment; message?: string };
        const updatedAdjustment = apiResponse.data;

        set({
          selectedAdjustment: updatedAdjustment,
          isLoadingDetails: false,
        });

        toast.success(apiResponse.message || "Inventory adjustment updated successfully");
        return true;
      } catch (error) {
        console.error("Error updating adjustment:", error);
        const errorMessage = "Failed to update inventory adjustment";
        toast.error(errorMessage);
        set({
          error: errorMessage,
          isLoadingDetails: false,
        });
        return false;
      }
    },

    deleteAdjustmentById: async (id, deletedBy) => {
      try {
        set({ isLoadingDetails: true, error: null });

        const response = await apiClient.delete(`/inventory/adjustments/${id}`, {
          data: { deletedBy }
        } as any);

        const apiResponse = response.data as { success: boolean; message?: string };
        const success = apiResponse.success;

        if (success) {
          set({
            selectedAdjustment: null,
            isLoadingDetails: false,
          });
          toast.success(apiResponse.message || "Inventory adjustment deleted successfully");
          return true;
        } else {
          throw new Error("Delete operation failed");
        }
      } catch (error) {
        console.error("Error deleting adjustment:", error);
        const errorMessage = "Failed to delete inventory adjustment";
        toast.error(errorMessage);
        set({
          error: errorMessage,
          isLoadingDetails: false,
        });
        return false;
      }
    },

    resetSelectedAdjustment: () => {
      set({
        selectedAdjustment: null,
        error: null,
        isLoadingDetails: false,
      });
    },

    resetStore: () => {
      set({
        selectedBins: [],
        inventoryItems: [],
        cycleCountItems: [],
        reason: "Initial Count",
        currentPage: 1,
        selectedAdjustment: null,
        error: null,
        isLoadingDetails: false,
      });
    },
  })
);

export default useInventoryAdjustmentStore;
