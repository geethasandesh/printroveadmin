import { create } from "zustand";
import apiClient from "@/apiClient";

interface ProductToPick {
  productId: string;
  productName: string;
  variant: string;
  qty: number;
}

export interface Picking {
  _id: string;
  batchId: string;
  batchName: string;
  date: string;
  toPick: number;
  productsToPick: ProductToPick[];
  status: "PENDING" | "COMPLETED"; // Add status field
  isDeleted: boolean;
  createdAt: string;
  updatedAt: string;
  createdBy: string;
  updatedBy: string;
}

interface PickingAction {
  _id: string;
  pickingId: string;
  productId: string;
  productName: string;
  variant: string;
  requiredQty: number;
  pickedQty: number;
  surplusQty: number;
  binPickedFrom: string;
  pickedBy: string;
  pickedAt: string;
}

interface ProductPickStatus {
  productId: string;
  variant: string;
  required: number;
  picked: number;
  isFullyPicked: boolean;
}

interface PickingStore {
  // State
  pickings: Picking[];
  currentPicking: Picking | null;
  total: number;
  isLoading: boolean;
  isUpdating: boolean;
  error: null | string;
  pickedQuantities: Record<string, number>; // key is productId-variant, value is picked quantity
  pickingStatus: ProductPickStatus[];

  // Actions for listing & CRUD
  fetchPickings: (
    page: number,
    limit: number,
    search?: string
  ) => Promise<void>;
  getPickingById: (id: string) => Promise<void>;
  updatePicking: (
    id: string,
    pickingData: Partial<Picking>
  ) => Promise<{
    success: boolean;
    message?: string;
    data?: any;
  }>;
  deletePicking: (id: string) => Promise<{
    success: boolean;
    message?: string;
  }>;

  // Picking station actions
  setPickedQuantity: (key: string, quantity: number) => void;
  getPickingStatus: (pickingId: string) => Promise<void>;
  markProductAsPicked: (
    pickingId: string,
    productId: string,
    variant: string,
    pickedQty: number,
    binNumber: string
  ) => Promise<{
    success: boolean;
    message?: string;
    data?: {
      pickingAction: PickingAction;
      productStatus: {
        required: number;
        picked: number;
        isFullyPicked: boolean;
      };
    };
  }>;
  markMultipleProductsAsPicked: (
    pickingId: string,
    items: Array<{
      productId: string;
      variant: string;
      pickedQty: number;
      binNumber: string;
    }>
  ) => Promise<{
    success: boolean;
    message?: string;
    data?: PickingAction[];
  }>;
  completePicking: (pickingId: string) => Promise<{
    success: boolean;
    message: string;
    picking?: Picking;
    removedOrders?: string[];
  }>;
}

export const usePickingStore = create<PickingStore>((set, get) => ({
  pickings: [],
  currentPicking: null,
  total: 0,
  isLoading: false,
  isUpdating: false,
  error: null,
  pickedQuantities: {},
  pickingStatus: [],

  fetchPickings: async (page: number, limit: number, search?: string) => {
    try {
      set({ isLoading: true });
      const response = await apiClient.get<{
        success: boolean;
        data: Picking[];
        total: number;
        page: number;
        limit: number;
      }>("/picking", {
        params: { page, limit, search },
      });

      if (response.data) {
        set({
          pickings: response.data.data,
          total: response.data.total,
          error: null,
        });
      }
    } catch (error: any) {
      set({ error: error.message || "Failed to fetch pickings" });
    } finally {
      set({ isLoading: false });
    }
  },

  getPickingById: async (id: string) => {
    try {
      set({ isLoading: true });
      const response = await apiClient.get<{
        success: boolean;
        data: Picking;
      }>(`/picking/${id}`);

      if (response.data) {
        set({
          currentPicking: response.data.data,
          error: null,
        });
      }
    } catch (error: any) {
      set({
        error: error.message || "Failed to fetch picking details",
        currentPicking: null,
      });
    } finally {
      set({ isLoading: false });
    }
  },

  updatePicking: async (id: string, pickingData: Partial<Picking>) => {
    try {
      set({ isUpdating: true });
      const response = await apiClient.put(`/picking/${id}`, pickingData);
      const data = response.data as {
        success: boolean;
        message?: string;
        data?: any;
      };

      if (data.success) {
        // Refresh the current picking if it's the one being updated
        const currentPicking = get().currentPicking;
        if (currentPicking && currentPicking._id === id) {
          await get().getPickingById(id);
        }

        // Refresh the pickings list
        const page = 1; // You might want to keep track of current page
        const limit = 10;
        await get().fetchPickings(page, limit);
      }

      return {
        success: data.success,
        message: data.message,
        data: data.data,
      };
    } catch (error: any) {
      console.error("Failed to update picking:", error);
      return {
        success: false,
        message:
          error.response?.data?.message ||
          error.message ||
          "Failed to update picking",
      };
    } finally {
      set({ isUpdating: false });
    }
  },

  deletePicking: async (id: string) => {
    try {
      set({ isUpdating: true });
      const response = await apiClient.delete(`/picking/${id}`);
      const data = response.data as {
        success: boolean;
        message?: string;
      };

      if (data.success) {
        // Refresh pickings list after deletion
        const page = 1; // You might want to keep track of current page
        const limit = 10;
        await get().fetchPickings(page, limit);
      }

      return {
        success: data.success,
        message: data.message,
      };
    } catch (error: any) {
      console.error("Failed to delete picking:", error);
      return {
        success: false,
        message:
          error.response?.data?.message ||
          error.message ||
          "Failed to delete picking",
      };
    } finally {
      set({ isUpdating: false });
    }
  },

  // New methods for the picking station
  setPickedQuantity: (key: string, quantity: number) => {
    set((state) => ({
      pickedQuantities: {
        ...state.pickedQuantities,
        [key]: quantity,
      },
    }));
  },

  getPickingStatus: async (pickingId: string) => {
    try {
      set({ isLoading: true, error: null });

      const response = await apiClient.get<{
        success: boolean;
        data: {
          picking: Picking;
          pickedProducts: ProductPickStatus[];
          isCompleted: boolean;
        };
      }>(`/picking/${pickingId}/status`);

      if (response.data.success) {
        set({
          currentPicking: response.data.data.picking,
          pickingStatus: response.data.data.pickedProducts,
          error: null,
        });
      } else {
        throw new Error("Failed to fetch picking status");
      }
    } catch (error) {
      set({
        error:
          error instanceof Error
            ? error.message
            : "Failed to fetch picking status",
      });
    } finally {
      set({ isLoading: false });
    }
  },

  markProductAsPicked: async (
    pickingId: string,
    productId: string,
    variant: string,
    pickedQty: number,
    binNumber: string
  ) => {
    try {
      set({ isUpdating: true });

      const response = await apiClient.post<{
        success: boolean;
        message?: string;
        data?: {
          pickingAction: PickingAction;
          productStatus: {
            required: number;
            picked: number;
            isFullyPicked: boolean;
          };
        };
      }>(`/picking/${pickingId}/pick?pickingId=${pickingId}`, {
        productId,
        variant,
        pickedQty,
        binNumber,
      });

      // After successful API call, clear the picked quantity for this product
      if (response.data.success) {
        const key = `${productId}-${variant}`;
        set((state) => ({
          pickedQuantities: {
            ...state.pickedQuantities,
            [key]: 0,
          },
        }));

        // Refresh the current picking to reflect changes
        await get().getPickingById(pickingId);
        // Update the picking status in our store
        await get().getPickingStatus(pickingId);
      }

      return {
        success: response.data.success,
        message: response.data.message,
        data: response.data.data,
      };
    } catch (error: any) {
      console.error("Failed to mark product as picked:", error);
      return {
        success: false,
        message:
          error.response?.data?.message ||
          error.message ||
          "Failed to mark product as picked",
      };
    } finally {
      set({ isUpdating: false });
    }
  },

  markMultipleProductsAsPicked: async (
    pickingId: string,
    items: Array<{
      productId: string;
      variant: string;
      pickedQty: number;
      binNumber: string;
    }>
  ) => {
    try {
      set({ isUpdating: true });

      const response = await apiClient.post<{
        success: boolean;
        message?: string;
        data?: PickingAction[];
      }>(`/picking/${pickingId}/pick-multiple`, {
        items,
      });

      // After successful API call, clear the picked quantities for these products
      if (response.data.success) {
        const resetQuantities = { ...get().pickedQuantities };

        items.forEach((item) => {
          const key = `${item.productId}-${item.variant}`;
          resetQuantities[key] = 0;
        });

        set({ pickedQuantities: resetQuantities });

        // Refresh the current picking to reflect changes
        await get().getPickingById(pickingId);
        // Update the picking status in our store
        await get().getPickingStatus(pickingId);
      }

      return {
        success: response.data.success,
        message: response.data.message,
        data: response.data.data,
      };
    } catch (error: any) {
      console.error("Failed to mark multiple products as picked:", error);
      return {
        success: false,
        message:
          error.response?.data?.message ||
          error.message ||
          "Failed to mark multiple products as picked",
      };
    } finally {
      set({ isUpdating: false });
    }
  },

  completePicking: async (pickingId: string) => {
    try {
      set({ isUpdating: true });

      const response = await apiClient.put<{
        success: boolean;
        message: string;
        data: Picking;
        removedOrders?: string[];
      }>(`/picking/${pickingId}/complete`);

      if (response.data.success) {
        // Update the current picking with the latest data
        if (response.data.data) {
          set({ currentPicking: response.data.data });

          // Also refresh the picking status
          await get().getPickingStatus(pickingId);
        }

        return {
          success: true,
          message: response.data.message || "Picking completed successfully",
          picking: response.data.data,
          removedOrders: response.data.removedOrders,
        };
      } else {
        set({ error: response.data.message || "Failed to complete picking" });

        return {
          success: false,
          message: response.data.message || "Failed to complete picking",
        };
      }
    } catch (error: any) {
      console.error("Error completing picking:", error);
      set({
        error:
          error.response?.data?.message ||
          error.message ||
          "An unexpected error occurred",
      });

      return {
        success: false,
        message:
          error.response?.data?.message ||
          error.message ||
          "An unexpected error occurred",
      };
    } finally {
      set({ isUpdating: false });
    }
  },
}));
