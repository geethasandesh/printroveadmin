import { create } from "zustand";
import apiClient from "@/apiClient";
import { PurchaseOrder } from "@/types/purchase-order";

interface PurchaseOrderStore {
  purchaseOrders: PurchaseOrder[];
  total: number;
  isLoading: boolean;
  error: string | null;
  selectedPO: PurchaseOrder | null;
  isLoadingDetails: boolean;
  fetchPurchaseOrders: (
    page: number,
    limit: number,
    search?: string
  ) => Promise<void>;
  createPurchaseOrder: (data: any) => Promise<void>;
  isCreating: boolean;
  allPurchaseOrders: PurchaseOrder[];
  isLoadingAll: boolean;
  fetchAllPurchaseOrders: () => Promise<void>;
  fetchPurchaseOrderById: (id: string) => Promise<void>;
  markPurchaseOrderAsOpen: (id: string) => Promise<boolean>; // Add this new method
  downloadPurchaseOrdersPDF: (poIds: string[]) => Promise<boolean>; // Add download method
}

export const usePurchaseOrderStore = create<PurchaseOrderStore>((set) => ({
  purchaseOrders: [],
  total: 0,
  isLoading: false,
  error: null,
  isCreating: false,
  allPurchaseOrders: [],
  isLoadingAll: false,
  selectedPO: null,
  isLoadingDetails: false,
  fetchPurchaseOrders: async (page: number, limit: number, search?: string) => {
    try {
      set({ isLoading: true });
      const response = await apiClient.get<{
        data: PurchaseOrder[];
        total: number;
      }>("/purchase/po/", {
        params: { page, limit, search },
      });
      set({
        purchaseOrders: response.data.data,
        total: response.data.total,
        isLoading: false,
        error: null,
      });
    } catch (error) {
      set({
        isLoading: false,
        error: "Failed to fetch purchase orders",
      });
    }
  },
  createPurchaseOrder: async (data) => {
    try {
      set({ isCreating: true });
      await apiClient.post("/purchase/po", data);
      set({ isCreating: false });
    } catch (error) {
      set({ isCreating: false });
      throw error;
    }
  },
  fetchAllPurchaseOrders: async () => {
    try {
      set({ isLoadingAll: true });
      const response = await apiClient.get<{
        success: boolean;
        data: PurchaseOrder[];
      }>("/purchase/po/all");
      set({
        allPurchaseOrders: response.data.data,
        isLoadingAll: false,
      });
    } catch (error) {
      console.error("Failed to fetch purchase orders:", error);
      set({ isLoadingAll: false });
    }
  },
  fetchPurchaseOrderById: async (id: string) => {
    try {
      set({ isLoadingDetails: true });
      const response = await apiClient.get<{
        success: boolean;
        data: PurchaseOrder;
      }>(`/purchase/po/${id}`);

      set({
        selectedPO: response.data.data,
        isLoadingDetails: false,
        error: null,
      });
    } catch (error) {
      console.error("Failed to fetch purchase order details:", error);
      set({
        isLoadingDetails: false,
        error: "Failed to fetch purchase order details",
        selectedPO: null,
      });
    }
  },
  markPurchaseOrderAsOpen: async (id: string) => {
    try {
      const response = await apiClient.post<{
        success: boolean;
        data: PurchaseOrder;
      }>(`/purchase/po/orders/${id}/open`);

      if (response.data.success) {
        // Update the selectedPO if it matches the ID
        set((state) => ({
          selectedPO:
            state.selectedPO?.purchaseorder_number === id
              ? { ...state.selectedPO, status: "open" }
              : state.selectedPO,
        }));

        // Also update in the lists if the PO exists there
        set((state) => ({
          purchaseOrders: state.purchaseOrders.map((po) =>
            po.purchaseorder_number === id ? { ...po, status: "open" } : po
          ),
          allPurchaseOrders: state.allPurchaseOrders.map((po) =>
            po.purchaseorder_number === id ? { ...po, status: "open" } : po
          ),
        }));
      }

      return response.data.success;
    } catch (error) {
      console.error("Failed to mark purchase order as open:", error);
      return false;
    }
  },
  downloadPurchaseOrdersPDF: async (poIds: string[]) => {
    try {
      // Use apiClient with responseType 'blob' to handle binary data
      const response = await apiClient.post(
        "/purchase/po/download",
        { poIds },
        {
          responseType: "blob", // Important for binary data
          headers: {
            Accept: "application/pdf, application/zip", // Accept both PDF and ZIP formats
            "Content-Type": "application/json",
          },
        }
      );

      // Get filename from content-disposition header if available
      const contentDisposition = response.headers["content-disposition"];
      const filename = contentDisposition
        ? contentDisposition.split("filename=")[1].replace(/"/g, "")
        : poIds.length === 1
        ? "purchase_order.pdf"
        : "purchase_orders.zip";

      // Create a blob URL from the response data
      const blob = new Blob([response.data], {
        type: poIds.length === 1 ? "application/pdf" : "application/zip",
      });
      const url = window.URL.createObjectURL(blob);

      // Create a download link and trigger download
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", filename);
      document.body.appendChild(link);
      link.click();

      // Clean up
      window.URL.revokeObjectURL(url);
      link.remove();

      return true;
    } catch (error) {
      console.error("Failed to download purchase order PDFs:", error);
      return false;
    }
  },
}));
