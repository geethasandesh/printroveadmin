import apiClient from "@/apiClient";
import { create } from "zustand";

interface ReverseManifestItem {
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

interface ReverseManifest {
  manifestId: string;
  pickupPerson: string;
  pickupPersonNumber: string;
  shippingCompany: string;
  createdTime: string;
  completedTime?: string;
  status: "OPEN" | "COMPLETED";
  receivedBy?: string;
  orders: ReverseManifestItem[];
  orderCount: number;
  orderIds: string[];
}

interface ReverseManifestSummary {
  manifestId: string;
  date: string;
  reverseCount: number;
  receivedBy: string;
  courierCompany: string;
  deliveryPerson: string;
  status: string;
  qty: number;
  completedTime?: string;
}

interface ReverseManifestStoreState {
  reverseManifests: ReverseManifestSummary[];
  currentManifest: ReverseManifest | null;
  scannedOrder: any | null;
  total: number;
  isLoading: boolean;
  isLoadingDetails: boolean;
  error: string | null;
  fetchReverseManifests: (
    page: number,
    limit: number,
    search?: string,
    sort?: string
  ) => Promise<void>;
  fetchManifestDetails: (manifestId: string) => Promise<void>;
  createReverseManifest: (data: {
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
  completeReverseManifest: (manifestId: string) => Promise<boolean>;
  setCurrentManifest: (manifest: ReverseManifest | null) => void;
}

export const useReverseManifestStore = create<ReverseManifestStoreState>(
  (set, get) => ({
    reverseManifests: [],
    currentManifest: null,
    scannedOrder: null,
    total: 0,
    isLoading: false,
    isLoadingDetails: false,
    error: null,

    fetchReverseManifests: async (
      page = 1,
      limit = 10,
      search = "",
      sort = "newest"
    ) => {
      set({ isLoading: true, error: null });

      try {
        const sortParam = sort === "oldest" ? "asc" : "desc";
        const response = await apiClient.get("/reverse-manifest/", {
          params: {
            page,
            limit,
            search,
            sort: sortParam,
          },
        });

        const responseData = response.data as {
          data: ReverseManifestSummary[];
          total: number;
        };

        set({
          reverseManifests: responseData.data || [],
          total: responseData.total || 0,
          isLoading: false,
        });
      } catch (error: any) {
        console.error("Error fetching reverse manifests:", error);
        set({
          isLoading: false,
          error:
            error.response?.data?.message ||
            "Failed to fetch reverse manifests",
        });
      }
    },

    fetchManifestDetails: async (manifestId: string) => {
      set({ isLoadingDetails: true, error: null, currentManifest: null });

      try {
        const response = await apiClient.get(`/reverse-manifest/${manifestId}`);

        const data = response.data as { data: ReverseManifest };
        set({
          currentManifest: data.data,
          isLoadingDetails: false,
        });
      } catch (error: any) {
        console.error("Error fetching reverse manifest details:", error);
        set({
          isLoadingDetails: false,
          error:
            error.response?.data?.message ||
            "Failed to fetch reverse manifest details",
        });
      }
    },

    createReverseManifest: async (manifestData: {
      pickupPerson: string;
      pickupPersonNumber: string;
      shippingCompany: string;
    }) => {
      try {
        const response = await apiClient.post(
          "/reverse-manifest",
          manifestData
        );

        const responseData = response.data as { success: boolean };
        if (responseData.success) {
          return true;
        }

        return false;
      } catch (error: any) {
        console.error("Error creating reverse manifest:", error);
        set({
          error:
            error.response?.data?.message ||
            "Failed to create reverse manifest",
        });
        throw error;
      }
    },

    scanOrderForManifest: async (manifestId: string, orderId: string) => {
      try {
        const response = await apiClient.put(
          `/reverse-manifest/${manifestId}/scan-order`,
          {
            orderId,
          }
        );

        const data = response.data as {
          success: boolean;
          data: { manifest: ReverseManifest; order: any };
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
        const response = await apiClient.post(
          `/reverse-manifest/${manifestId}/order/${orderId}/products`,
          products
        );

        const data = response.data as {
          success: boolean;
          data: ReverseManifest;
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

    completeReverseManifest: async (manifestId: string) => {
      try {
        const response = await apiClient.post(
          `/reverse-manifest/${manifestId}/complete`
        );

        const data = response.data as {
          success: boolean;
          data: ReverseManifest;
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
        console.error("Error completing reverse manifest:", error);
        set({
          error:
            error.response?.data?.message ||
            "Failed to complete reverse manifest",
        });
        throw error;
      }
    },

    setCurrentManifest: (manifest: ReverseManifest | null) => {
      set({ currentManifest: manifest });
    },
  })
);
