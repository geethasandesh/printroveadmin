import { create } from "zustand";
import toast from "react-hot-toast";
import apiClient from "@/apiClient";

// Manifest interfaces
interface Manifest {
  _id: string;
  manifestId: string;
  createdAt: string;
  pickupPersonName: string;
  pickupPersonNumber: string;
  courierPartner: string;
  orderIds: string[];
  status: "Pending" | "Picked Up" | "Delivered" | "Cancelled";
  totalOrders: number;
  pickedUpAt?: string;
  pickedUpBy?: string;
  trackingNumber?: string;
}

interface ReturnManifest {
  _id: string;
  returnId: string;
  trackingNumber: string;
  poDetails: {
    poDate: string;
    poNumber: string;
    referenceNumber: string;
  }[];
  status: "Pending" | "In Transit" | "Received" | "Processed";
  createdAt: string;
}

// Pagination interface
interface Pagination {
  totalCount: number;
  page: number;
  limit: number;
  totalPages: number;
}

interface ManifestFilters {
  page?: number;
  limit?: number;
  courierPartner?: string;
  status?: string;
  startDate?: string;
  endDate?: string;
  search?: string;
}

interface ReturnManifestFilters {
  page?: number;
  limit?: number;
  poNumber?: string;
  referenceNumber?: string;
  trackingNumber?: string;
  status?: string;
  startDate?: string;
  endDate?: string;
}

// Form data interfaces
interface CreateManifestForm {
  pickupPersonName: string;
  pickupPersonNumber: string;
  courierPartner: string;
  orderIds: string[];
}

interface CreateReturnForm {
  trackingNumber: string;
  poDetails: {
    poDate: string;
    poNumber: string;
    referenceNumber: string;
  }[];
}

interface DispatchStore {
  // Manifests state
  manifests: Manifest[];
  manifestFilters: ManifestFilters;
  manifestPagination: Pagination;
  isLoadingManifests: boolean;
  manifestError: string | null;

  // Return manifests state
  returnManifests: ReturnManifest[];
  returnFilters: ReturnManifestFilters;
  returnPagination: Pagination;
  isLoadingReturns: boolean;
  returnError: string | null;

  // Modal states
  isCreateManifestModalOpen: boolean;
  isCreateReturnModalOpen: boolean;

  // Form states
  createManifestForm: CreateManifestForm;
  createReturnForm: CreateReturnForm;

  // Action states
  isSubmittingAction: boolean;

  // Manifests actions
  fetchManifests: (filters?: Partial<ManifestFilters>) => Promise<void>;
  createManifest: () => Promise<void>;
  updateManifestStatus: (
    manifestId: string,
    status: string,
    trackingNumber?: string
  ) => Promise<void>;

  // Return manifests actions
  fetchReturnManifests: (
    filters?: Partial<ReturnManifestFilters>
  ) => Promise<void>;
  createReturnManifest: () => Promise<void>;
  updateReturnStatus: (returnId: string, status: string) => Promise<void>;
  deleteReturnManifest: (returnId: string) => Promise<void>;

  // Form actions
  setCreateManifestForm: (form: Partial<CreateManifestForm>) => void;
  setCreateReturnForm: (form: Partial<CreateReturnForm>) => void;
  addPoDetail: () => void;
  updatePoDetail: (index: number, field: string, value: string) => void;
  removePoDetail: (index: number) => void;

  // Modal actions
  openCreateManifestModal: () => void;
  closeCreateManifestModal: () => void;
  openCreateReturnModal: () => void;
  closeCreateReturnModal: () => void;

  // Filter actions
  setManifestFilters: (filters: Partial<ManifestFilters>) => void;
  setReturnFilters: (filters: Partial<ReturnManifestFilters>) => void;
  clearManifestFilters: () => void;
  clearReturnFilters: () => void;

  // Error actions
  clearErrors: () => void;
}

export const useDispatchStore = create<DispatchStore>((set, get) => ({
  // Manifests state
  manifests: [],
  manifestFilters: {
    page: 1,
    limit: 10,
  },
  manifestPagination: {
    totalCount: 0,
    page: 1,
    limit: 10,
    totalPages: 0,
  },
  isLoadingManifests: false,
  manifestError: null,

  // Return manifests state
  returnManifests: [],
  returnFilters: {
    page: 1,
    limit: 10,
  },
  returnPagination: {
    totalCount: 0,
    page: 1,
    limit: 10,
    totalPages: 0,
  },
  isLoadingReturns: false,
  returnError: null,

  // Modal states
  isCreateManifestModalOpen: false,
  isCreateReturnModalOpen: false,

  // Form states
  createManifestForm: {
    pickupPersonName: "",
    pickupPersonNumber: "",
    courierPartner: "",
    orderIds: [],
  },
  createReturnForm: {
    trackingNumber: "",
    poDetails: [
      {
        poDate: "",
        poNumber: "",
        referenceNumber: "",
      },
    ],
  },

  // Action states
  isSubmittingAction: false,

  // Manifests actions
  fetchManifests: async (filters: Partial<ManifestFilters> = {}) => {
    try {
      set({
        isLoadingManifests: true,
        manifestError: null,
      });

      const currentFilters = get().manifestFilters;
      const newFilters = { ...currentFilters, ...filters };
      set({ manifestFilters: newFilters });

      // Build query string
      const queryParams = new URLSearchParams();
      Object.entries(newFilters).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== "") {
          queryParams.append(key, value.toString());
        }
      });

      const response = await apiClient.get(
        `/dispatch/manifests?${queryParams.toString()}`
      );

      if (response.data.success) {
        set({
          manifests: response.data.data.manifests,
          manifestPagination: response.data.data.pagination,
          isLoadingManifests: false,
        });
      } else {
        throw new Error(response.data.message || "Failed to fetch manifests");
      }
    } catch (error: any) {
      const errorMsg =
        error.response?.data?.message ||
        error.message ||
        "Failed to fetch manifests";

      set({
        isLoadingManifests: false,
        manifestError: errorMsg,
      });

      toast.error(errorMsg);
    }
  },

  createManifest: async () => {
    try {
      set({ isSubmittingAction: true });

      const form = get().createManifestForm;

      // Validate form
      if (!form.pickupPersonName.trim()) {
        throw new Error("Pickup person name is required");
      }

      if (!form.pickupPersonNumber.trim()) {
        throw new Error("Pickup person phone number is required");
      }

      if (!form.courierPartner.trim()) {
        throw new Error("Courier partner is required");
      }

      if (form.orderIds.length === 0) {
        throw new Error("At least one order must be selected");
      }

      const response = await apiClient.post("/dispatch/manifests", form);

      if (response.data.success) {
        toast.success("Manifest created successfully");

        // Reset form and close modal
        set({
          createManifestForm: {
            pickupPersonName: "",
            pickupPersonNumber: "",
            courierPartner: "",
            orderIds: [],
          },
          isCreateManifestModalOpen: false,
        });

        // Refresh manifests list
        get().fetchManifests();
      } else {
        throw new Error(response.data.message || "Failed to create manifest");
      }
    } catch (error: any) {
      const errorMsg =
        error.response?.data?.message ||
        error.message ||
        "Failed to create manifest";

      toast.error(errorMsg);
    } finally {
      set({ isSubmittingAction: false });
    }
  },

  updateManifestStatus: async (
    manifestId: string,
    status: string,
    trackingNumber?: string
  ) => {
    try {
      set({ isSubmittingAction: true });

      // Validate tracking number for Picked Up status
      if (status === "Picked Up" && !trackingNumber) {
        throw new Error("Tracking number is required when status is Picked Up");
      }

      const response = await apiClient.put(
        `/dispatch/manifests/${manifestId}/status`,
        {
          status,
          trackingNumber,
        }
      );

      if (response.data.success) {
        toast.success(`Manifest status updated to ${status}`);

        // Update manifest in state
        set((state) => ({
          manifests: state.manifests.map((manifest) =>
            manifest.manifestId === manifestId
              ? { ...manifest, status, trackingNumber }
              : manifest
          ),
        }));
      } else {
        throw new Error(
          response.data.message || "Failed to update manifest status"
        );
      }
    } catch (error: any) {
      const errorMsg =
        error.response?.data?.message ||
        error.message ||
        "Failed to update manifest status";

      toast.error(errorMsg);
    } finally {
      set({ isSubmittingAction: false });
    }
  },

  // Return manifests actions
  fetchReturnManifests: async (
    filters: Partial<ReturnManifestFilters> = {}
  ) => {
    try {
      set({
        isLoadingReturns: true,
        returnError: null,
      });

      const currentFilters = get().returnFilters;
      const newFilters = { ...currentFilters, ...filters };
      set({ returnFilters: newFilters });

      // Build query string
      const queryParams = new URLSearchParams();
      Object.entries(newFilters).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== "") {
          queryParams.append(key, value.toString());
        }
      });

      const response = await apiClient.get(
        `/dispatch/returns?${queryParams.toString()}`
      );

      if (response.data.success) {
        set({
          returnManifests: response.data.data.returnManifests,
          returnPagination: response.data.data.pagination,
          isLoadingReturns: false,
        });
      } else {
        throw new Error(
          response.data.message || "Failed to fetch return manifests"
        );
      }
    } catch (error: any) {
      const errorMsg =
        error.response?.data?.message ||
        error.message ||
        "Failed to fetch return manifests";

      set({
        isLoadingReturns: false,
        returnError: errorMsg,
      });

      toast.error(errorMsg);
    }
  },

  createReturnManifest: async () => {
    try {
      set({ isSubmittingAction: true });

      const form = get().createReturnForm;

      // Validate form
      if (!form.trackingNumber.trim()) {
        throw new Error("Tracking number is required");
      }

      if (form.poDetails.length === 0) {
        throw new Error("At least one PO detail is required");
      }

      // Validate each PO detail
      for (const detail of form.poDetails) {
        if (!detail.poDate) {
          throw new Error("PO date is required for all entries");
        }

        if (!detail.poNumber.trim()) {
          throw new Error("PO number is required for all entries");
        }

        if (!detail.referenceNumber.trim()) {
          throw new Error("Reference number is required for all entries");
        }
      }

      const response = await apiClient.post("/dispatch/returns", form);

      if (response.data.success) {
        toast.success("Return manifest created successfully");

        // Reset form and close modal
        set({
          createReturnForm: {
            trackingNumber: "",
            poDetails: [
              {
                poDate: "",
                poNumber: "",
                referenceNumber: "",
              },
            ],
          },
          isCreateReturnModalOpen: false,
        });

        // Refresh return manifests list
        get().fetchReturnManifests();
      } else {
        throw new Error(
          response.data.message || "Failed to create return manifest"
        );
      }
    } catch (error: any) {
      const errorMsg =
        error.response?.data?.message ||
        error.message ||
        "Failed to create return manifest";

      toast.error(errorMsg);
    } finally {
      set({ isSubmittingAction: false });
    }
  },

  updateReturnStatus: async (returnId: string, status: string) => {
    try {
      set({ isSubmittingAction: true });

      const response = await apiClient.put(
        `/dispatch/returns/${returnId}/status`,
        {
          status,
        }
      );

      if (response.data.success) {
        toast.success(`Return manifest status updated to ${status}`);

        // Update return manifest in state
        set((state) => ({
          returnManifests: state.returnManifests.map((returnManifest) =>
            returnManifest.returnId === returnId
              ? { ...returnManifest, status }
              : returnManifest
          ),
        }));
      } else {
        throw new Error(
          response.data.message || "Failed to update return manifest status"
        );
      }
    } catch (error: any) {
      const errorMsg =
        error.response?.data?.message ||
        error.message ||
        "Failed to update return manifest status";

      toast.error(errorMsg);
    } finally {
      set({ isSubmittingAction: false });
    }
  },

  deleteReturnManifest: async (returnId: string) => {
    try {
      set({ isSubmittingAction: true });

      const response = await apiClient.delete(`/dispatch/returns/${returnId}`);

      if (response.data.success) {
        toast.success("Return manifest deleted successfully");

        // Remove deleted manifest from state
        set((state) => ({
          returnManifests: state.returnManifests.filter(
            (manifest) => manifest.returnId !== returnId
          ),
        }));
      } else {
        throw new Error(
          response.data.message || "Failed to delete return manifest"
        );
      }
    } catch (error: any) {
      const errorMsg =
        error.response?.data?.message ||
        error.message ||
        "Failed to delete return manifest";

      toast.error(errorMsg);
    } finally {
      set({ isSubmittingAction: false });
    }
  },

  // Form actions
  setCreateManifestForm: (form: Partial<CreateManifestForm>) => {
    set((state) => ({
      createManifestForm: {
        ...state.createManifestForm,
        ...form,
      },
    }));
  },

  setCreateReturnForm: (form: Partial<CreateReturnForm>) => {
    set((state) => ({
      createReturnForm: {
        ...state.createReturnForm,
        ...form,
      },
    }));
  },

  addPoDetail: () => {
    set((state) => ({
      createReturnForm: {
        ...state.createReturnForm,
        poDetails: [
          ...state.createReturnForm.poDetails,
          {
            poDate: "",
            poNumber: "",
            referenceNumber: "",
          },
        ],
      },
    }));
  },

  updatePoDetail: (index: number, field: string, value: string) => {
    set((state) => {
      const updatedPoDetails = [...state.createReturnForm.poDetails];
      updatedPoDetails[index] = {
        ...updatedPoDetails[index],
        [field]: value,
      };

      return {
        createReturnForm: {
          ...state.createReturnForm,
          poDetails: updatedPoDetails,
        },
      };
    });
  },

  removePoDetail: (index: number) => {
    set((state) => {
      const updatedPoDetails = [...state.createReturnForm.poDetails];
      updatedPoDetails.splice(index, 1);

      return {
        createReturnForm: {
          ...state.createReturnForm,
          poDetails:
            updatedPoDetails.length > 0
              ? updatedPoDetails
              : [
                  {
                    poDate: "",
                    poNumber: "",
                    referenceNumber: "",
                  },
                ],
        },
      };
    });
  },

  // Modal actions
  openCreateManifestModal: () => set({ isCreateManifestModalOpen: true }),
  closeCreateManifestModal: () => set({ isCreateManifestModalOpen: false }),
  openCreateReturnModal: () => set({ isCreateReturnModalOpen: true }),
  closeCreateReturnModal: () => set({ isCreateReturnModalOpen: false }),

  // Filter actions
  setManifestFilters: (filters: Partial<ManifestFilters>) => {
    set((state) => ({
      manifestFilters: {
        ...state.manifestFilters,
        ...filters,
        // Reset to page 1 when filters change
        page: filters.page || 1,
      },
    }));

    // Fetch with new filters
    get().fetchManifests();
  },

  setReturnFilters: (filters: Partial<ReturnManifestFilters>) => {
    set((state) => ({
      returnFilters: {
        ...state.returnFilters,
        ...filters,
        // Reset to page 1 when filters change
        page: filters.page || 1,
      },
    }));

    // Fetch with new filters
    get().fetchReturnManifests();
  },

  clearManifestFilters: () => {
    set({
      manifestFilters: {
        page: 1,
        limit: 10,
      },
    });

    get().fetchManifests();
  },

  clearReturnFilters: () => {
    set({
      returnFilters: {
        page: 1,
        limit: 10,
      },
    });

    get().fetchReturnManifests();
  },

  // Error actions
  clearErrors: () =>
    set({
      manifestError: null,
      returnError: null,
    }),
}));
