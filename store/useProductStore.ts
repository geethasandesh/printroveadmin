import { IProduct, ICompleteProduct, IProductData } from "../types/product";
import { ProductVariant } from "../types/variant";
import apiClient from "@/apiClient";
import { create } from "zustand";

interface ProductStore {
  allProducts: IProduct[];
  isLoadingAll: boolean;
  fetchAllProducts: () => Promise<void>;
  isCreating: boolean;
  error: string | null;
  createProduct: (data: ICompleteProduct) => Promise<boolean>;
  variants: ProductVariant[];
  total: number;
  isLoading: boolean;
  fetchVariants: (
    page: number,
    limit: number,
    search?: string
  ) => Promise<void>;
  currentProduct: IProductData | null;
  isLoadingProduct: boolean;
  getProduct: (id: string) => Promise<void>;
  updateProduct: (id: string, data: ICompleteProduct) => Promise<boolean>;
  isDeleting: boolean;
  deleteProducts: (productIds: string[]) => Promise<boolean>;
  isSyncingToZoho: boolean;
  syncProductToZoho: (productId: string) => Promise<boolean>;
  createPurchaseOrder: (data: any) => Promise<boolean>; // Added createPurchaseOrder method
}

export const useProductStore = create<ProductStore>((set, get) => ({
  allProducts: [],
  isLoadingAll: false,
  fetchAllProducts: async () => {
    set({ isLoadingAll: true });
    try {
      const response = await apiClient.get<{
        success: boolean;
        data: IProduct[];
      }>("/inventory/items");
      set({
        allProducts: response.data.data,
        isLoadingAll: false,
      });
    } catch (error) {
      console.error("Failed to fetch all products:", error);
      set({ isLoadingAll: false });
    }
  },
  isCreating: false,
  error: null,
  createProduct: async (data: ICompleteProduct) => {
    set({ isCreating: true, error: null });
    try {
      const response = await apiClient.post<{ success: boolean }>(
        "/inventory/products",
        data
      );

      set({ isCreating: false });
      return response.data.success;
    } catch (error: any) {
      // Surface server-side validation details to the console and store
      const resp = error?.response;
      try {
        const parsedReq = (() => { try { return JSON.parse(resp?.config?.data || '{}'); } catch { return resp?.config?.data; } })();
        console.group("Create Product – HTTP Error");
        console.error("Status:", resp?.status);
        console.error("URL:", resp?.config?.url);
        console.error("Method:", resp?.config?.method);
        console.error("Request Payload:", typeof parsedReq === 'string' ? parsedReq : JSON.stringify(parsedReq, null, 2));
        console.error("Response Data:", typeof resp?.data === 'string' ? resp?.data : JSON.stringify(resp?.data, null, 2));
        console.groupEnd();
      } catch {}
      const serverData = resp?.data;
      set({
        isCreating: false,
        // Prefer backend message when available
        error: serverData?.message || (error instanceof Error ? error.message : "Failed to create product"),
      });
      return false;
    }
  },
  variants: [],
  total: 0,
  isLoading: false,
  fetchVariants: async (page: number, limit: number, search?: string) => {
    set({ isLoading: true });
    try {
      const response = await apiClient.get<{
        success: boolean;
        data: ProductVariant[];
        total: number;
      }>("/inventory/products/variants", {
        params: { page, limit, search },
      });

      set({
        variants: response.data.data,
        total: response.data.total,
        isLoading: false,
      });
    } catch (error) {
      console.error("Failed to fetch variants:", error);
      set({ isLoading: false });
    }
  },
  currentProduct: null,
  isLoadingProduct: false,

  getProduct: async (id: string) => {
    set({ isLoadingProduct: true });
    try {
      const response = await apiClient.get<{
        success: boolean;
        data: ICompleteProduct;
      }>(`/inventory/products/${id}`);

      set({
        currentProduct: response.data.data,
        isLoadingProduct: false,
      });
    } catch (error) {
      console.error("Failed to fetch product:", error);
      set({ isLoadingProduct: false });
    }
  },

  updateProduct: async (id: string, data: ICompleteProduct) => {
    set({ isCreating: true, error: null });
    try {
      const response = await apiClient.put<{ success: boolean }>(
        `/inventory/products/${id}`,
        data
      );

      set({ isCreating: false });
      return response.data.success;
    } catch (error) {
      console.error("Failed to update product:", error);
      set({
        isCreating: false,
        error:
          error instanceof Error ? error.message : "Failed to update product",
      });
      return false;
    }
  },
  isDeleting: false,
  deleteProducts: async (productIds: string[]) => {
    set({ isDeleting: true, error: null });
    try {
      const response = await apiClient.post<{ success: boolean }>(
        "/inventory/products/delete",
        { productIds }
      );

      if (response.data.success) {
        // Refresh the variants list after successful deletion
        await get().fetchVariants(1, 10);
      }

      set({ isDeleting: false });
      return response.data.success;
    } catch (error) {
      console.error("Failed to delete products:", error);
      set({
        isDeleting: false,
        error:
          error instanceof Error ? error.message : "Failed to delete products",
      });
      return false;
    }
  },
  isSyncingToZoho: false,
  syncProductToZoho: async (productId: string) => {
    set({ isSyncingToZoho: true });
    try {
      const response = await apiClient.post<{
        success: boolean;
        syncStatus: {
          fullySync: boolean;
          totalVariants: number;
          syncedVariants: number;
          unsyncedVariants: Array<{
            key: string;
            combination: string;
            sku: string;
          }>;
        };
      }>(`/inventory/products/${productId}/zoho/sync`);

      // Update the current product with the new sync status
      if (response.data.success && get().currentProduct) {
        const currentProduct = get().currentProduct;
        set({
          currentProduct: {
            ...currentProduct,
            zohoSyncStatus: response.data.syncStatus,
          },
        });
      }

      set({ isSyncingToZoho: false });
      return response.data.success;
    } catch (error) {
      console.error("Failed to sync product to Zoho:", error);
      set({ isSyncingToZoho: false });
      return false;
    }
  },
  createPurchaseOrder: async (data: any) => {
    set({ isCreating: true, error: null });
    try {
      // Add isOpen parameter to the API call
      const response = await apiClient.post<{ success: boolean }>(
        "/purchase/orders",
        data
      );

      set({ isCreating: false });
      return response.data.success;
    } catch (error) {
      console.error("Failed to create purchase order:", error);
      set({
        isCreating: false,
        error:
          error instanceof Error
            ? error.message
            : "Failed to create purchase order",
      });
      return false;
    }
  },
}));
