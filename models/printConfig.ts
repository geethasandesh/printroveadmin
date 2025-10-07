export interface PrintConfig {
  _id: string;
  name: string;
  // options are plain string values now
  options: string[];
  associatedProductIds: string[];
  // optional enhanced field returned by GET /print-configs/:id
  associatedProducts?: {
    id: string;
    title: string;
    image: string;
    status: string;
  }[];
  createdAt: string;
  updatedAt: string;
  status: "active" | "inactive";
}

export interface PrintConfigResponse {
  data: PrintConfig[];
  total: number;
}
