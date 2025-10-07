import { IVariantConfiguration } from "./variant";

export interface IProduct {
  _id: string;
  item_id: string;
  name: string;
  rate: number;
  sku: string;
  status: string;
}

export interface IProductData {
  title: string;
  description: string;
  status: string;
  productId: string;
  collections: string[];
  printTypes: Array<{
    _id: string;
    name: string;
    options: Array<{
      name: string;
      values: string[];
      order: number;
    }>;
    associatedProductIds: string[];
    status: string;
    createdAt: string;
    updatedAt: string;
  }>;
  variants: Array<{
    name: string;
    values: string[];
    _id: string;
  }>;
  avgLeadTime: string;
  avgDailyUsage: string;
  additionalInfo: string;
  thumbnails: Array<{
    key: string;
    url: string;
    _id: string;
  }>;
  mockImages: Array<{
    key: string;
    url: string;
    _id: string;
  }>;
  productNumber: string;
  createdAt?: string;
  updatedAt?: string;
  productionType: "In-house-non-tshirt" | "outsourced"; // Add the productionType field
  variantConfigurations: {
    [key: string]: IVariantConfiguration;
  };
  zohoSyncStatus?: {
    fullySync: boolean;
    totalVariants: number;
    syncedVariants: number;
    unsyncedVariants: Array<{
      key: string;
      combination: string;
      sku: string;
    }>;
  };
}

export interface ICompleteProduct {
  product: IProductData;
  variantConfigurations: {
    [key: string]: IVariantConfiguration;
  };
}
