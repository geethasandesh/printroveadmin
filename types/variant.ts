import { IInventory, IShipping } from "./inventory";

export interface IBoundingBox {
  width: string;
  height: string;
  top: string;
  left: string;
  _id?: string;
}

export interface IPrintLocation {
  location?: string;
  basePrice: string;
  fontRate: string;
  boundingBox: IBoundingBox;
  gridlines: Array<{
    key: string;
    url: string;
    _id: string;
  }>;
  _id: string;
}

export interface IPrintConfiguration {
  name: string;
  locations: IPrintLocation[];
  _id: string;
}

export interface IVariantConfiguration {
  variantNumber: string;
  combination: string;
  values: Array<{
    name: string;
    value: string;
    _id: string;
  }>;
  printConfigurations: IPrintConfiguration[];
  inventory: IInventory & {
    _id: string;
    zohoItemId: string;
    location: {
      _id: string;
    };
  };
  shipping: IShipping & {
    _id: string;
  };
  thumbnails: Array<{
    key: string;
    url: string;
    _id: string;
  }>;
  _id: string;
  pricing: {
    price: string;
    compareAtPrice: string;
    costPerItem: string;
  };
  isZohoSynced: boolean;
}

export interface ProductVariant {
  productId: string;
  title: string;
  description: string;
  variantCombo: string;
  sku: string;
  onHand: number;
  committed: number;
  available: number;
  productNumber: string;
  variantNumber: string;
  thumbnailUrl?: string;
}
