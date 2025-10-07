import { create } from "zustand";
import apiClient from "@/apiClient";

interface PutAwayLineItem {
  productId: string;
  qty: number;
  binNumber: string;
}

export interface PutAwayRecord {
  _id: string;
  putAwayId: string;
  referenceNumber: string;
  putawayType: "INCOMING" | "PRODUCTION";
  totalQty: number;
  lineItems: PutAwayLineItem[];
  createdBy: string;
  createdAt: string;
}

interface Bin {
  _id: string;
  name: string;
  category: string;
}

interface PutAwayForm {
  referenceNumber: string;
  putawayType: "INCOMING" | "PRODUCTION";
  totalQty: number;
  lineItems: PutAwayLineItem[];
}

interface PutAwayState {
  // Records management
  putAways: PutAwayRecord[];
  total: number;
  isLoading: boolean;
  isCreating: boolean;
  isSaving: boolean;
  currentPage: number;
  limit: number;

  // Form data
  formData: PutAwayForm;
  bins: Bin[];

  // Actions
  fetchPutAways: (
    page?: number,
    limit?: number,
    search?: string
  ) => Promise<void>;
  fetchBins: () => Promise<void>;
  resetFormData: () => void;
  setFormField: (field: string, value: any) => void;
  addLineItem: () => void;
  updateLineItem: (index: number, field: string, value: any) => void;
  removeLineItem: (index: number) => void;
  createPutAway: () => Promise<string | null>;
  savePutAwayWithLineItems: () => Promise<void>;
}

const initialFormData: PutAwayForm = {
  referenceNumber: "",
  putawayType: "INCOMING",
  totalQty: 0,
  lineItems: [],
};

const usePutAwayStore = create<PutAwayState>((set, get) => ({
  // State
  putAways: [],
  total: 0,
  isLoading: false,
  isCreating: false,
  isSaving: false,
  currentPage: 1,
  limit: 10,
  formData: { ...initialFormData },
  bins: [],

  // Actions
  fetchPutAways: async (page = 1, limit = 10, search = "") => {
    set({ isLoading: true, currentPage: page, limit });

    try {
      const response = await apiClient.get("/putaway", {
        params: { page, limit, search },
      });

      const data = response.data as {
        success: boolean;
        data: PutAwayRecord[];
        total: number;
      };

      if (data.success) {
        set({
          putAways: data.data,
          total: data.total,
        });
      }
    } catch (error) {
      console.error("Error fetching put away records:", error);
    } finally {
      set({ isLoading: false });
    }
  },

  fetchBins: async () => {
    try {
      const response = await apiClient.get("/bins");

      const data = response.data as { success: boolean; data: Bin[] };
      if (data.success) {
        set({ bins: data.data });
      }
    } catch (error) {
      console.error("Error fetching bins:", error);
    }
  },

  resetFormData: () => {
    set({ formData: { ...initialFormData } });
  },

  setFormField: (field, value) => {
    set((state) => ({
      formData: {
        ...state.formData,
        [field]: value,
      },
    }));
  },

  addLineItem: () => {
    set((state) => ({
      formData: {
        ...state.formData,
        lineItems: [
          ...state.formData.lineItems,
          { productId: "", qty: 1, binNumber: "" },
        ],
      },
    }));
  },

  updateLineItem: (index, field, value) => {
    set((state) => {
      const updatedLineItems = [...state.formData.lineItems];
      updatedLineItems[index] = {
        ...updatedLineItems[index],
        [field]: value,
      };

      // Recalculate total quantity when individual quantities change
      let totalQty = 0;
      if (field === "qty") {
        totalQty = updatedLineItems.reduce(
          (sum, item) => sum + (Number(item.qty) || 0),
          0
        );
      } else {
        totalQty = state.formData.totalQty;
      }

      return {
        formData: {
          ...state.formData,
          lineItems: updatedLineItems,
          totalQty: field === "qty" ? totalQty : state.formData.totalQty,
        },
      };
    });
  },

  removeLineItem: (index) => {
    set((state) => {
      const updatedLineItems = [...state.formData.lineItems];
      updatedLineItems.splice(index, 1);

      // Recalculate total quantity
      const totalQty = updatedLineItems.reduce(
        (sum, item) => sum + (Number(item.qty) || 0),
        0
      );

      return {
        formData: {
          ...state.formData,
          lineItems: updatedLineItems,
          totalQty,
        },
      };
    });
  },

  createPutAway: async () => {
    set({ isCreating: true });

    try {
      // We're just creating the header info here
      // This is a placeholder since we'll handle the actual creation with line items later
      // Return a fake ID for now to simulate redirection
      set({ isCreating: false });
      return "temp-" + Date.now();
    } catch (error) {
      console.error("Error creating put away record:", error);
      set({ isCreating: false });
      return null;
    }
  },

  savePutAwayWithLineItems: async () => {
    const { formData } = get();
    set({ isSaving: true });

    try {
      // Calculate total from line items to ensure accuracy
      const totalQty = formData.lineItems.reduce(
        (sum, item) => sum + Number(item.qty),
        0
      );

      const payload = {
        ...formData,
        totalQty,
        createdBy: "currentUser", // This would typically come from auth context or user state
      };

      const response = await apiClient.post("/putaway", payload);

      // Assert the type of response.data
      const data = response.data as {
        success: boolean;
        message?: string;
        data?: any;
      };

      if (!data.success) {
        throw new Error(data.message || "Failed to save put away record");
      }

      // Reset form after successful save
      set({ isSaving: false });
      get().resetFormData();
      return data.data;
    } catch (error) {
      console.error("Error saving put away with line items:", error);
      set({ isSaving: false });
      throw error;
    }
  },
}));

export default usePutAwayStore;
