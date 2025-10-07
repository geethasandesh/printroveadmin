import { create } from "zustand";
import apiClient from "@/apiClient";

interface DispatchManifest {
  id: string;
  manifestId: string;
  createdTime: string;
  pickupPerson: string;
  pickupPersonNumber: string;
  shippingCompany: string;
  orderIds: string[];
  status: string;
}

interface DispatchStoreState {
  dispatchManifests: DispatchManifest[];
  total: number;
  isLoading: boolean;
  error: string | null;
  currentManifest: DispatchManifest | null;
  isLoadingDetails: boolean;
  detailsError: string | null;

  // Actions
  fetchDispatchManifests: (
    page: number,
    limit: number,
    search?: string
  ) => Promise<void>;
  fetchManifestDetails: (manifestId: string) => Promise<void>;
  createDispatchManifest: (data: any) => Promise<boolean>;
  updateManifestOrders: (
    manifestId: string,
    orderIds: string[]
  ) => Promise<boolean>;
  clearErrors: () => void;
  updateManifestStatus: (
    manifestId: string,
    status: string
  ) => Promise<boolean>;
}

export const useDispatchStore = create<DispatchStoreState>((set, get) => ({
  dispatchManifests: [],
  total: 0,
  isLoading: false,
  error: null,
  currentManifest: null,
  isLoadingDetails: false,
  detailsError: null,

  fetchDispatchManifests: async (page = 1, limit = 10, search = "") => {
    try {
      set({ isLoading: true, error: null });

      const response = await apiClient.get("/dispatch/manifests", {
        params: { page, limit, search },
      });

      const data = response.data as {
        success: boolean;
        data: DispatchManifest[];
        totalItems: number;
        message?: string;
      };

      if (data.success) {
        set({
          dispatchManifests: data.data,
          total: data.totalItems,
          isLoading: false,
        });
      } else {
        set({
          error: data.message || "Failed to fetch dispatch manifests",
          isLoading: false,
        });
      }
    } catch (error: any) {
      set({
        error: error.message || "An error occurred while fetching manifests",
        isLoading: false,
      });
    }
  },

  fetchManifestDetails: async (manifestId: string) => {
    try {
      set({ isLoadingDetails: true, detailsError: null });

      const response = await apiClient.get(`/dispatch/manifest/${manifestId}`);

      const data = response.data as {
        success: boolean;
        data: DispatchManifest;
        message?: string;
      };

      if (data.success) {
        set({
          currentManifest: data.data,
          isLoadingDetails: false,
        });
      } else {
        set({
          detailsError: data.message || "Failed to fetch manifest details",
          isLoadingDetails: false,
        });
      }
    } catch (error: any) {
      set({
        detailsError:
          error.message || "An error occurred while fetching manifest details",
        isLoadingDetails: false,
      });
    }
  },

  createDispatchManifest: async (data: any) => {
    try {
      const response = await apiClient.post("/dispatch/manifest", data);

      const responseData = response.data as {
        success: boolean;
        message?: string;
      };
      if (responseData.success) {
        // Refresh the manifests list
        const { fetchDispatchManifests } = get();
        await fetchDispatchManifests(1, 10);
        return true;
      } else {
        set({ error: responseData.message || "Failed to create manifest" });
        return false;
      }
    } catch (error: any) {
      set({
        error: error.message || "An error occurred while creating manifest",
      });
      return false;
    }
  },

  updateManifestOrders: async (manifestId: string, orderIds: string[]) => {
    try {
      const response = await apiClient.put("/dispatch/orders", {
        manifestId,
        orderIds,
      });

      const responseData = response.data as {
        success: boolean;
        message?: string;
      };

      if (responseData.success) {
        // Refresh the manifest details
        const { fetchManifestDetails } = get();
        await fetchManifestDetails(manifestId);
        return true;
      } else {
        set({
          detailsError:
            responseData.message || "Failed to update manifest orders",
        });
        return false;
      }
    } catch (error: any) {
      set({
        detailsError:
          error.message || "An error occurred while updating manifest orders",
      });
      return false;
    }
  },

  updateManifestStatus: async (manifestId: string, status: string) => {
    try {
      const response = await apiClient.put(`/dispatch/manifest/status`, {
        manifestId,
        status,
      });

      const responseData = response.data as {
        success: boolean;
        message?: string;
      };
      if (responseData.success) {
        // Update the manifest in the store
        set((state) => {
          // Update in the list
          const updatedManifests = state.dispatchManifests.map((m) =>
            m.manifestId === manifestId ? { ...m, status } : m
          );

          // Update current manifest if it's the one being viewed
          const updatedCurrentManifest =
            state.currentManifest?.manifestId === manifestId
              ? { ...state.currentManifest, status }
              : state.currentManifest;

          return {
            dispatchManifests: updatedManifests,
            currentManifest: updatedCurrentManifest,
          };
        });
        return true;
      } else {
        const responseData = response.data as {
          success: boolean;
          message?: string;
        };
        set({
          detailsError:
            responseData.message || "Failed to update manifest status",
        });
        return false;
      }
    } catch (error: any) {
      set({
        detailsError:
          error.message || "An error occurred while updating manifest status",
      });
      return false;
    }
  },

  clearErrors: () => set({ error: null, detailsError: null }),
}));
