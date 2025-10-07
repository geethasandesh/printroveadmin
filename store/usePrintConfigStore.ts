import apiClient from "@/apiClient";
import { PrintConfig, PrintConfigResponse } from "@/models/printConfig";
import { create } from "zustand";

// First, add the interface for the update payload
// New payload: options is an array of string values
interface UpdatePrintConfigPayload {
  options: string[];
}

interface PrintConfigStore {
  configs: PrintConfig[];
  total: number;
  isLoading: boolean;
  error: string | null;
  currentConfig: PrintConfig | null;
  fetchConfigs: (page: number, limit: number) => Promise<void>;
  createConfig: (name: string) => Promise<PrintConfig>;
  fetchConfigById: (id: string) => Promise<void>;
  updateConfig: (
    id: string,
    payload: UpdatePrintConfigPayload
  ) => Promise<void>;
}

export const usePrintConfig = create<PrintConfigStore>((set) => ({
  configs: [],
  total: 0,
  isLoading: false,
  error: null,
  currentConfig: null,

  fetchConfigs: async (page: number, limit: number) => {
    try {
      set({ isLoading: true, error: null });

      const response = await apiClient.get<PrintConfigResponse>(
        `/inventory/print-configs?page=${page}&limit=${limit}`
      );

      set({
        configs: response.data.data,
        total: response.data.total,
        isLoading: false,
      });
    } catch (error) {
      set({
        isLoading: false,
        error: error instanceof Error ? error.message : "An error occurred",
      });
    }
  },

  createConfig: async (name: string): Promise<PrintConfig> => {
    set({ isLoading: true });
    try {
      const response = await apiClient.post<PrintConfig>(
        "/inventory/print-configs",
        {
          name,
        }
      );
      set({ isLoading: false });
      return response.data; // Make sure this returns the created config with _id
    } catch (error) {
      set({ isLoading: false });
      throw error;
    }
  },

  fetchConfigById: async (id: string) => {
    try {
      set({ isLoading: true, error: null });

      const response = await apiClient.get<PrintConfig>(
        `/inventory/print-configs/${id}`
      );

      set({
        currentConfig: response.data,
        isLoading: false,
      });
    } catch (error) {
      set({
        isLoading: false,
        error:
          error instanceof Error
            ? error.message
            : "Failed to fetch print config",
        currentConfig: null,
      });
    }
  },

  updateConfig: async (id: string, payload: UpdatePrintConfigPayload) => {
    try {
      set({ isLoading: true, error: null });

      await apiClient.put<PrintConfig>(
        `/inventory/print-configs/${id}`,
        payload
      );

      // Fetch the updated config to refresh the state
      const response = await apiClient.get<PrintConfig>(
        `/inventory/print-configs/${id}`
      );

      set({
        currentConfig: response.data,
        isLoading: false,
      });
    } catch (error) {
      set({
        isLoading: false,
        error:
          error instanceof Error
            ? error.message
            : "Failed to update print config",
      });
    }
  },
}));
