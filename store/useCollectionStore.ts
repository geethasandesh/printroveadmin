import { create } from "zustand";
import apiClient from "@/apiClient";

export interface AssociatedProduct {
  _id: string;
  title: string;
  status: string;
  thumbnailImage?: string;
}

export interface Collection {
  _id: string;
  name: string;
  type: "LISTED" | "UNLISTED";
  description?: string; // Changed to optional
  productIds: string[];
  createdAt: string;
  updatedAt: string;
  associatedProducts?: AssociatedProduct[];
}

interface CollectionResponse {
  data: Collection[];
  total: number;
}

interface CollectionPayload {
  name: string;
  type: "LISTED" | "UNLISTED";
  description?: string; // Changed to optional
}

interface AssociateProductsPayload {
  productIds: string[];
}

interface CollectionStore {
  collections: Collection[];
  total: number;
  isLoading: boolean;
  error: string | null;
  currentCollection: Collection | null;
  fetchCollections: (page: number, limit: number) => Promise<void>;
  createCollection: (payload: CollectionPayload) => Promise<void>;
  fetchCollectionById: (id: string) => Promise<void>;
  updateCollection: (id: string, payload: CollectionPayload) => Promise<void>;
  deleteCollection: (id: string) => Promise<void>;
  associateProducts: (
    id: string,
    payload: AssociateProductsPayload
  ) => Promise<void>;
}

export const useCollectionStore = create<CollectionStore>((set) => ({
  collections: [],
  total: 0,
  isLoading: false,
  error: null,
  currentCollection: null,

  fetchCollections: async (page: number, limit: number) => {
    try {
      set({ isLoading: true, error: null });

      const response = await apiClient.get<CollectionResponse>(
        `/inventory/collections?page=${page}&limit=${limit}`
      );

      set({
        collections: response.data.data,
        total: response.data.total,
        isLoading: false,
      });
    } catch (error) {
      set({
        isLoading: false,
        error:
          error instanceof Error
            ? error.message
            : "Failed to fetch collections",
      });
    }
  },

  createCollection: async (payload: CollectionPayload) => {
    try {
      set({ isLoading: true, error: null });

      await apiClient.post("/inventory/collections", payload);

      // Refresh the collections list after creation (assuming first page)
      const response = await apiClient.get<CollectionResponse>(
        "/inventory/collections?page=1&limit=10"
      );

      set({
        collections: response.data.data,
        total: response.data.total,
        isLoading: false,
      });
    } catch (error) {
      set({
        isLoading: false,
        error:
          error instanceof Error
            ? error.message
            : "Failed to create collection",
      });
      throw error; // Re-throw to handle in the UI
    }
  },

  fetchCollectionById: async (id: string) => {
    try {
      set({ isLoading: true, error: null });

      const response = await apiClient.get<Collection>(
        `/inventory/collections/${id}`
      );

      set({
        currentCollection: response.data,
        isLoading: false,
      });
    } catch (error) {
      set({
        isLoading: false,
        error:
          error instanceof Error ? error.message : "Failed to fetch collection",
        currentCollection: null,
      });
    }
  },

  updateCollection: async (id: string, payload: CollectionPayload) => {
    try {
      set({ isLoading: true, error: null });

      await apiClient.put(`/inventory/collections/${id}`, payload);

      // Refresh the collections list after update (assuming first page)
      const response = await apiClient.get<CollectionResponse>(
        "/inventory/collections?page=1&limit=10"
      );

      set({
        collections: response.data.data,
        total: response.data.total,
        isLoading: false,
      });
    } catch (error) {
      set({
        isLoading: false,
        error:
          error instanceof Error
            ? error.message
            : "Failed to update collection",
      });
      throw error; // Re-throw to handle in the UI
    }
  },

  deleteCollection: async (id: string) => {
    try {
      set({ isLoading: true, error: null });

      await apiClient.delete(`/inventory/collections/${id}`);

      // Refresh the collections list after deletion (assuming first page)
      const response = await apiClient.get<CollectionResponse>(
        "/inventory/collections?page=1&limit=10"
      );

      set({
        collections: response.data.data,
        total: response.data.total,
        isLoading: false,
      });
    } catch (error) {
      set({
        isLoading: false,
        error:
          error instanceof Error
            ? error.message
            : "Failed to delete collection",
      });
      throw error; // Re-throw to handle in the UI
    }
  },

  associateProducts: async (id: string, payload: AssociateProductsPayload) => {
    try {
      set({ isLoading: true, error: null });

      await apiClient.post(`/inventory/collections/${id}/products`, payload);

      // Refresh the current collection
      const response = await apiClient.get<Collection>(
        `/inventory/collections/${id}`
      );

      set({
        currentCollection: response.data,
        isLoading: false,
      });
    } catch (error) {
      set({
        isLoading: false,
        error:
          error instanceof Error
            ? error.message
            : "Failed to associate products",
      });
      throw error;
    }
  },
}));
