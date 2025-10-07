import { create } from "zustand";
import apiClient from "@/apiClient";

interface ROPData {
  _id: string;
  productId: string;
  variantKey: string;
  sku: string;
  productName: string;
  variantCombination: string;
  currentStock: number;
  pendingQuantity: number;
  yetToBeReceived: number;
  averageDailyUsage: number;
  maximumDailyUsage: number;
  leadTimeDemand: number;
  safetyStock: number;
  rop: number;
  estimatedQuantity: number;
  suggestedQuantity: number;
  adjustedQuantity?: number;
  toOrderQuantity: number;
  primaryVendor?: {
    vendorId: string;
    vendorName: string;
    rate: number;
  };
  vendorSplits: Array<{
    vendorId: string;
    vendorName: string;
    quantity: number;
    rate: number;
    amount: number;
  }>;
  status: string;
}

interface ROPStore {
  ropItems: ROPData[];
  total: number;
  isLoading: boolean;
  isCalculating: boolean;
  selectedItems: string[];
  
  calculateROP: () => Promise<void>;
  fetchProductsToOrder: () => Promise<void>;
  fetchPendingROPOrders: (page?: number, limit?: number) => Promise<void>;
  updateQuantity: (id: string, quantity: number) => Promise<void>;
  updateVendorSplit: (id: string, vendorSplits: any[]) => Promise<void>;
  createPOsFromSelected: () => Promise<void>;
  toggleSelectItem: (id: string) => void;
  selectAll: () => void;
  clearSelection: () => void;
}

export const useROPStore = create<ROPStore>((set, get) => ({
  ropItems: [],
  total: 0,
  isLoading: false,
  isCalculating: false,
  selectedItems: [],

  calculateROP: async () => {
    set({ isCalculating: true });
    try {
      await apiClient.post("/rop/calculate");
      
      // After calculation, fetch the products to order
      await get().fetchProductsToOrder();
      
      set({ isCalculating: false });
    } catch (error) {
      console.error("Failed to calculate ROP:", error);
      set({ isCalculating: false });
      throw error;
    }
  },

  fetchProductsToOrder: async () => {
    set({ isLoading: true });
    try {
      const response = await apiClient.get<{
        success: boolean;
        count: number;
        data: ROPData[];
      }>("/rop/to-order");

      set({
        ropItems: response.data.data,
        total: response.data.count,
        isLoading: false,
      });
    } catch (error) {
      console.error("Failed to fetch products to order:", error);
      set({ isLoading: false });
    }
  },

  fetchPendingROPOrders: async (page = 1, limit = 50) => {
    set({ isLoading: true });
    try {
      const response = await apiClient.get<{
        success: boolean;
        data: ROPData[];
        total: number;
      }>("/rop/pending", {
        params: { page, limit },
      });

      set({
        ropItems: response.data.data,
        total: response.data.total,
        isLoading: false,
      });
    } catch (error) {
      console.error("Failed to fetch pending ROP orders:", error);
      set({ isLoading: false });
    }
  },

  updateQuantity: async (id: string, adjustedQuantity: number) => {
    try {
      await apiClient.patch(`/rop/${id}/quantity`, { adjustedQuantity });

      // Update local state
      set((state) => ({
        ropItems: state.ropItems.map((item) =>
          item._id === id
            ? { ...item, adjustedQuantity, toOrderQuantity: adjustedQuantity, status: "adjusted" }
            : item
        ),
      }));
    } catch (error) {
      console.error("Failed to update quantity:", error);
      throw error;
    }
  },

  updateVendorSplit: async (id: string, vendorSplits: any[]) => {
    try {
      await apiClient.patch(`/rop/${id}/vendor-split`, { vendorSplits });

      // Update local state
      set((state) => ({
        ropItems: state.ropItems.map((item) =>
          item._id === id
            ? { ...item, vendorSplits, status: "adjusted" }
            : item
        ),
      }));
    } catch (error) {
      console.error("Failed to update vendor split:", error);
      throw error;
    }
  },

  createPOsFromSelected: async () => {
    const selectedIds = get().selectedItems;
    
    if (selectedIds.length === 0) {
      throw new Error("No items selected");
    }

    try {
      const response = await apiClient.post<{
        success: boolean;
        count: number;
        data: any[];
      }>("/rop/create-pos", {
        ropOrderIds: selectedIds,
      });

      // Clear selection and refresh list
      set({ selectedItems: [] });
      await get().fetchPendingROPOrders();

      return response.data;
    } catch (error) {
      console.error("Failed to create POs from ROP:", error);
      throw error;
    }
  },

  toggleSelectItem: (id: string) => {
    set((state) => ({
      selectedItems: state.selectedItems.includes(id)
        ? state.selectedItems.filter((itemId) => itemId !== id)
        : [...state.selectedItems, id],
    }));
  },

  selectAll: () => {
    set((state) => ({
      selectedItems: state.ropItems.map((item) => item._id),
    }));
  },

  clearSelection: () => {
    set({ selectedItems: [] });
  },
}));

