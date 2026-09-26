export type UserRole = "Inventory Manager" | "Warehouse Staff";

export interface User {
  fullName: string;
  email: string;
  role: UserRole;
}

export type OperationType = "Receipt" | "Delivery" | "Internal" | "Adjustment";

export type OperationStatus =
  | "Draft"
  | "Waiting"
  | "Ready"
  | "Done"
  | "Canceled";

export interface Operation {
  reference: string;
  type: OperationType;
  product: string;
  sku: string;
  quantity: string;
  location: string;
  status: OperationStatus;
  category: string;
  counterparty: string;
  time: string;
  statusLabel?: string;
  icon?: "receipt" | "delivery" | "transfer" | "adjustment";
}

export interface DashboardStats {
  totalStockUnits: number;
  lowStockItems: number;
  pendingReceipts: number;
  pendingDeliveries: number;
  scheduledTransfers: number;
}

export interface StockAlert {
  product: string;
  sku: string;
  location: string;
  onHand: number;
  status: "Low" | "Out of stock";
  category: string;
}

export interface LedgerEntry {
  description: string;
  detail: string;
  quantity: number;
  time: string;
  kind: "receipt" | "delivery" | "adjustment" | "transfer";
}

export type Warehouse =
  | "Main Warehouse"
  | "Production Floor"
  | "Rack A"
  | "Rack B"
  | "North Hub"
  | "South Annex"
  | "East Cross-dock";

export type ProductCategory = "Metal" | "Furniture" | "Electronics" | "Stationery";
