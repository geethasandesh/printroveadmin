import { create } from "zustand";
import apiClient from "@/apiClient";

interface ShippingAddress {
  fullName: string;
  storeName: string;
  address1: string;
  address2?: string;
  landmark?: string;
  country: string;
  state: string;
  city: string;
  zip: string;
}

interface Product {
  id: string;
  variants: string[];
  qty: number;
  price: number;
  _id: string;
}

interface Order {
  _id: string;
  orderId: string;
  products: Product[];
  shippingAddress: ShippingAddress;
  merchant: {
    id: string;
    name: string;
  };
  orderStatus: string;
  createdAt: string;
  updatedAt: string;
}

interface OrderStore {
  orders: Order[];
  total: number;
  isLoading: boolean;
  error: string | null;
  fetchOrders: (page: number, limit: number, search?: string) => Promise<void>;
}

export const useOrderStore = create<OrderStore>((set) => ({
  orders: [],
  total: 0,
  isLoading: false,
  error: null,

  fetchOrders: async (page: number, limit: number, search?: string) => {
    try {
      set({ isLoading: true });
      const response = await apiClient.get("/order", {
        params: { page, limit, search },
      });

      const data = response.data as {
        success: boolean;
        data: Order[];
        total: number;
      };

      if (data.success) {
        set({
          orders: data.data,
          total: data.total,
          error: null,
        });
      }
    } catch (error: any) {
      set({ error: error.message || "Failed to fetch orders" });
    } finally {
      set({ isLoading: false });
    }
  },
}));
