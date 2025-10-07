import { create } from "zustand";
import apiClient from "@/apiClient";

interface Product {
  id: string;
  name: string;
}

interface PlanningRecord {
  _id: string;
  planId: string;
  uid: string;
  batchId: string;
  orderId: string;
  product: Product;
  planningStatus: string;
  createdAt: string;
  updatedAt: string;
}

interface PlanningStore {
  planningRecords: PlanningRecord[];
  total: number;
  isLoading: boolean;
  error: string | null;
  fetchPlanningRecords: (
    page: number,
    limit: number,
    search?: string
  ) => Promise<void>;
}

export const usePlanningStore = create<PlanningStore>((set) => ({
  planningRecords: [],
  total: 0,
  isLoading: false,
  error: null,

  fetchPlanningRecords: async (
    page: number,
    limit: number,
    search?: string
  ) => {
    try {
      set({ isLoading: true });
      const response = await apiClient.get<{
        success: boolean;
        data: PlanningRecord[];
        total: number;
      }>("/planning", {
        params: { page, limit, search },
      });

      set({
        planningRecords: response.data.data,
        total: response.data.total,
        isLoading: false,
        error: null,
      });
    } catch (error) {
      set({
        isLoading: false,
        error: "Failed to fetch planning records",
      });
    }
  },
}));
