import { create } from "zustand";
import apiClient from "@/apiClient";

export interface OrderProduct {
  id: string;
  sku: string;
  variants: any[];
  qty: number;
  price: number;
  _id: string;
  brandingImageUrl?: string;
  auditEntries?: {
    uid: string;
    productId: string;
    productName: string;
    currentStatus: string;
    binNumber: string;
    timeline: Array<{
      timestamp: string;
      action: string;
      entityType: string;
      message: string;
      changedBy: string;
    }>;
  }[];
}

interface ShippingAddress {
  fullName: string;
  storeName: string;
  address1: string;
  address2: string;
  landmark: string;
  country: string;
  state: string;
  city: string;
  zip: string;
  phone?: string; // Optional field for customer phone
  email?: string; // Optional field for customer email
}

interface Merchant {
  id: string;
  name: string;
}

interface OrderDetails {
  _id: string;
  orderId: string;
  products: OrderProduct[];
  shippingAddress: ShippingAddress;
  merchant: Merchant;
  orderStatus: string;
  isDeleted: boolean;
  createdAt: string;
  updatedAt: string;
  estimatedDispatchDate?: string;
  trackingId?: string;
}

interface Order {
  _id: string;
  placedOn: string;
  type: string;
  orderId: string;
  reference: string;
  merchant: string;
  customerName: string;
  shippingMode: string;
  trackingId: string;
  status: string;
  estimatedDeliveryDate: string;
}

// Planning related interfaces
interface PlanningProduct {
  id: string;
  name: string;
}

interface PlanningDetail {
  _id: string;
  uid: string;
  product: PlanningProduct;
  planningStatus: string;
}

interface PackingStatusResponse {
  success: boolean;
  allProductsPacked: boolean;
  orderStatus: string;
  canMarkAsFulfilled: boolean;
  message: string;
}

interface FulfillOrderResponse {
  success: boolean;
  message: string;
  data: OrderDetails;
}

interface OrderStore {
  // Orders list state
  orders: Order[];
  total: number;
  isLoading: boolean;
  error: string | null;

  // Order details state
  currentOrderDetails: OrderDetails | null;
  isLoadingDetails: boolean;
  detailsError: string | null;

  // Planning details state
  planningDetails: PlanningDetail[];
  isLoadingPlanning: boolean;
  planningError: string | null;

  // Packing status state
  packingStatus: {
    allProductsPacked: boolean;
    canMarkAsFulfilled: boolean;
    loading: boolean;
  };
  isMarkingFulfilled: boolean;
  fulfillmentError: string | null;

  // New state properties for fetching all orders
  allOrders: OrderDetails[];
  isLoadingAllOrders: boolean;
  allOrdersError: string | null;

  // Actions
  fetchOrders: (page: number, limit: number, search?: string) => Promise<void>;
  fetchOrderDetails: (orderId: string) => Promise<void>;
  fetchPlanningDetails: (orderId: string) => Promise<void>;
  clearOrderDetails: () => void;
  clearPlanningDetails: () => void;
  clearErrors: () => void;
  checkOrderPackingStatus: (orderId: string) => Promise<void>;
  markOrderAsFulfilled: (orderId: string) => Promise<boolean>;
  clearFulfillmentError: () => void;

  // New action for fetching all orders
  fetchAllOrders: () => Promise<void>;
}

export const useOrderStore = create<OrderStore>((set, get) => ({
  // Orders list initial state
  orders: [],
  total: 0,
  isLoading: false,
  error: null,

  // Order details initial state
  currentOrderDetails: null,
  isLoadingDetails: false,
  detailsError: null,

  // Planning details initial state
  planningDetails: [],
  isLoadingPlanning: false,
  planningError: null,

  // Packing status initial state
  packingStatus: {
    allProductsPacked: false,
    canMarkAsFulfilled: false,
    loading: false,
  },
  isMarkingFulfilled: false,
  fulfillmentError: null,

  // New state properties for fetching all orders
  allOrders: [],
  isLoadingAllOrders: false,
  allOrdersError: null,

  // Fetch orders list
  fetchOrders: async (page: number, limit: number, search?: string) => {
    try {
      set({ isLoading: true, error: null });
      const response = await apiClient.get<{
        success: boolean;
        data: Order[];
        total: number;
      }>("/orders", {
        params: { page, limit, search },
      });

      set({
        orders: response.data.data,
        total: response.data.total,
        isLoading: false,
      });
    } catch (error) {
      set({
        isLoading: false,
        error:
          error instanceof Error ? error.message : "Failed to fetch orders",
      });
    }
  },

  // Fetch single order details
  fetchOrderDetails: async (orderId: string) => {
    try {
      set({ isLoadingDetails: true, detailsError: null });

      const response = await apiClient.get(
        `/order/${orderId}?includeAudit=true`
      );

      const data = response.data as { success: boolean; data: OrderDetails };

      if (data.success) {
        set({
          currentOrderDetails: data.data,
          isLoadingDetails: false,
        });

        // Automatically fetch planning details when order details are successfully loaded
        get().fetchPlanningDetails(data.data.orderId);
      } else {
        set({
          detailsError: "Failed to fetch order details",
          isLoadingDetails: false,
        });
      }
    } catch (error: any) {
      set({
        detailsError:
          error.message || "An error occurred while fetching order details",
        isLoadingDetails: false,
      });
    }
  },

  // Fetch planning details for an order
  fetchPlanningDetails: async (orderId: string) => {
    try {
      set({ isLoadingPlanning: true, planningError: null });

      const response = await apiClient.get(`/planning/order/${orderId}`);
      const data = response.data as {
        success: boolean;
        data: PlanningDetail[];
      };

      if (data.success) {
        set({
          planningDetails: data.data,
          isLoadingPlanning: false,
        });
      } else {
        set({
          planningError: "Failed to fetch planning details",
          isLoadingPlanning: false,
        });
      }
    } catch (error: any) {
      set({
        planningError:
          error.message || "An error occurred while fetching planning details",
        isLoadingPlanning: false,
      });
      console.error("Error fetching planning details:", error);
    }
  },

  // Check if all products in an order are packed and ready for fulfillment
  checkOrderPackingStatus: async (orderId: string) => {
    try {
      set((state) => ({
        packingStatus: {
          ...state.packingStatus,
          loading: true,
        },
      }));

      const response = await apiClient.get<PackingStatusResponse>(
        `/order/${orderId}/packing-status`
      );

      if (response.data.success) {
        set({
          packingStatus: {
            allProductsPacked: response.data.allProductsPacked,
            canMarkAsFulfilled: response.data.canMarkAsFulfilled,
            loading: false,
          },
          fulfillmentError: null,
        });
      } else {
        set((state) => ({
          packingStatus: {
            ...state.packingStatus,
            loading: false,
          },
          fulfillmentError:
            response.data.message || "Failed to check packing status",
        }));
      }
    } catch (error: any) {
      console.error("Error checking order packing status:", error);
      set((state) => ({
        packingStatus: {
          ...state.packingStatus,
          loading: false,
        },
        fulfillmentError:
          error.message || "An error occurred while checking packing status",
      }));
    }
  },

  // Mark an order as fulfilled
  markOrderAsFulfilled: async (orderId: string) => {
    try {
      set({ isMarkingFulfilled: true, fulfillmentError: null });

      const response = await apiClient.post<FulfillOrderResponse>(
        `/order/${orderId}/fulfill`
      );

      if (response.data.success) {
        // Update the order details with the new fulfilled status
        set((state) => ({
          currentOrderDetails: response.data.data,
          packingStatus: {
            ...state.packingStatus,
            canMarkAsFulfilled: false,
          },
          isMarkingFulfilled: false,
        }));

        // Refresh planning details to reflect the fulfilled status
        get().fetchPlanningDetails(orderId);
        return true;
      } else {
        set({
          isMarkingFulfilled: false,
          fulfillmentError:
            response.data.message || "Failed to mark order as fulfilled",
        });
        return false;
      }
    } catch (error: any) {
      console.error("Error marking order as fulfilled:", error);
      set({
        isMarkingFulfilled: false,
        fulfillmentError:
          error.message || "An error occurred while marking order as fulfilled",
      });
      return false;
    }
  },

  // Fetch all orders
  fetchAllOrders: async () => {
    try {
      set({ isLoadingAllOrders: true, allOrdersError: null });

      const response = await apiClient.get<{
        success: boolean;
        data: OrderDetails[];
      }>("/order/all");

      if (response.data.success) {
        set({
          allOrders: response.data.data,
          isLoadingAllOrders: false,
        });
      } else {
        set({
          isLoadingAllOrders: false,
          allOrdersError: "Failed to fetch all orders",
        });
      }
    } catch (error: any) {
      console.error("Error fetching all orders:", error);
      set({
        isLoadingAllOrders: false,
        allOrdersError:
          error.message || "An error occurred while fetching all orders",
      });
    }
  },

  // Clear current order details (useful when navigating away)
  clearOrderDetails: () => set({ currentOrderDetails: null }),

  // Clear planning details
  clearPlanningDetails: () => set({ planningDetails: [] }),

  // Clear all errors
  clearErrors: () =>
    set({ error: null, detailsError: null, planningError: null }),

  // Clear fulfillment error
  clearFulfillmentError: () => set({ fulfillmentError: null }),
}));
