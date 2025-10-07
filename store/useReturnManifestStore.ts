import apiClient from "@/apiClient";
import { create } from "zustand";

interface ReturnManifestItem {
  orderId: string;
  products: Array<{
    _id?: string;
    id?: string | null;
    productId?: string;
    sku: string;
    variants?: any[];
    qty: number;
    price?: number;
    inventoryType?: "Good_Inventory" | "Bad_Inventory";
  }>;
  addedAt: string;
  addedBy: string;
  isProcessed: boolean;
}

interface ReturnManifest {
  manifestId: string;
  pickupPerson: string;
  pickupPersonNumber: string;
  shippingCompany: string;
  createdTime: string;
  completedTime?: string;
  status: "OPEN" | "COMPLETED";
  receivedBy?: string;
  orders: ReturnManifestItem[];
  orderCount: number;
  orderIds: string[];
}

interface ReturnManifestSummary {
  manifestId: string;
  date: string;
  returnCount: number;
  receivedBy: string;
  courierCompany: string;
  deliveryPerson: string;
  status: string;
  qty: number;
  completedTime?: string;
}

interface ReturnManifestStoreState {
  returnManifests: ReturnManifestSummary[];
  currentManifest: ReturnManifest | null;
  scannedOrder: any | null;
  total: number;
  isLoading: boolean;
  isLoadingDetails: boolean;
  error: string | null;
  fetchReturnManifests: (
    page: number,
    limit: number,
    search?: string,
    sort?: string
  ) => Promise<void>;
  fetchManifestDetails: (manifestId: string) => Promise<void>;
  createReturnManifest: (data: {
    pickupPerson: string;
    pickupPersonNumber: string;
    shippingCompany: string;
  }) => Promise<boolean>;
  scanOrderForManifest: (
    manifestId: string,
    orderId: string
  ) => Promise<boolean>;
  updateOrderProducts: (
    manifestId: string,
    orderId: string,
    products: Array<{
      productId: string;
      quantity: number;
      inventoryType: "Good_Inventory" | "Bad_Inventory";
    }>
  ) => Promise<boolean>;
  completeReturnManifest: (manifestId: string) => Promise<boolean>;
  setCurrentManifest: (manifest: ReturnManifest | null) => void;
}

export const useReturnManifestStore = create<ReturnManifestStoreState>(
  (set, get) => ({
    returnManifests: [],
    currentManifest: null,
    scannedOrder: null,
    total: 0,
    isLoading: false,
    isLoadingDetails: false,
    error: null,

    fetchReturnManifests: async (
      page = 1,
      limit = 10,
      search = "",
      sort = "newest"
    ) => {
      set({ isLoading: true, error: null });

      try {
        const sortParam = sort === "oldest" ? "asc" : "desc";
        const response = await apiClient.get("/return-manifest/paginated", {
          params: {
            page,
            limit,
            search,
            sort: sortParam,
          },
        });

        // Add the missing data handling code
        const responseData = response.data;

        set({
          returnManifests: responseData.data || [],
          total: responseData.total || 0,
          isLoading: false,
        });
      } catch (error: any) {
        console.error("Error fetching return manifests:", error);
        set({
          isLoading: false,
          error:
            error.response?.data?.message || "Failed to fetch return manifests",
        });
      }
    },

    fetchManifestDetails: async (manifestId: string) => {
      set({ isLoadingDetails: true, error: null, currentManifest: null });

      try {
        const response = await apiClient.get(`/return-manifest/${manifestId}`);

        const data = response.data as { data: ReturnManifest };
        set({
          currentManifest: data.data,
          isLoadingDetails: false,
        });
      } catch (error: any) {
        console.error("Error fetching return manifest details:", error);
        set({
          isLoadingDetails: false,
          error:
            error.response?.data?.message ||
            "Failed to fetch return manifest details",
        });
      }
    },

    createReturnManifest: async (manifestData: {
      pickupPerson: string;
      pickupPersonNumber: string;
      shippingCompany: string;
    }) => {
      try {
        const response = await apiClient.post("/return-manifest", manifestData);

        const responseData = response.data as { success: boolean };
        if (responseData.success) {
          return true;
        }

        return false;
      } catch (error: any) {
        console.error("Error creating return manifest:", error);
        set({
          error:
            error.response?.data?.message || "Failed to create return manifest",
        });
        throw error;
      }
    },

    scanOrderForManifest: async (manifestId: string, orderId: string) => {
      try {
        const response = await apiClient.put(
          `/return-manifest/${manifestId}/scan-order`,
          {
            orderId,
          }
        );

        const data = response.data as {
          success: boolean;
          data: { manifest: ReturnManifest; order: any };
        };
        if (data.success) {
          // Update current manifest with new order
          set({
            currentManifest: data.data.manifest,
            scannedOrder: data.data.order,
          });
          return true;
        }

        return false;
      } catch (error: any) {
        console.error("Error scanning order for manifest:", error);
        set({
          error: error.response?.data?.message || "Failed to scan order",
        });
        throw error;
      }
    },

    updateOrderProducts: async (
      manifestId: string,
      orderId: string,
      products: Array<{
        productId: string;
        quantity: number;
        inventoryType: "Good_Inventory" | "Bad_Inventory";
      }>
    ) => {
      try {
        const response = await apiClient.put(
          `/return-manifest/${manifestId}/order/${orderId}/products`,
          products
        );

        const data = response.data as {
          success: boolean;
          data: ReturnManifest;
        };
        if (data.success) {
          // Update the manifest with processed order
          set({
            currentManifest: data.data,
          });
          return true;
        }

        return false;
      } catch (error: any) {
        console.error("Error updating order products:", error);
        set({
          error:
            error.response?.data?.message || "Failed to update order products",
        });
        throw error;
      }
    },

    completeReturnManifest: async (manifestId: string) => {
      try {
        const response = await apiClient.put(
          `/return-manifest/${manifestId}/complete`
        );

        const data = response.data as {
          success: boolean;
          data: ReturnManifest;
        };
        if (data.success) {
          // Update manifest with completed status
          set({
            currentManifest: data.data,
          });
          return true;
        }

        return false;
      } catch (error: any) {
        console.error("Error completing return manifest:", error);
        set({
          error:
            error.response?.data?.message ||
            "Failed to complete return manifest",
        });
        throw error;
      }
    },

    setCurrentManifest: (manifest: ReturnManifest | null) => {
      set({ currentManifest: manifest });
    },
  })
);
