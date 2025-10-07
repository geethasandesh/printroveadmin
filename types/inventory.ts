export interface IInventoryLocation {
  name: string;
  unavailable: number;
  committed: number;
  available: number;
  onHand: number;
}

export interface IInventory {
  sku: string;
  zohoItemId: string;
  location: IInventoryLocation;
}

export interface IShipping {
  productWeight: string;
  shippingWeight: string;
}
