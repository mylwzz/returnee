export type PickupStatus = "scheduled" | "assigned" | "pickedUp" | "dropped" | "completed" | "cancelled";

export type DropCarrier = "ups" | "fedex" | "usps" | "best";

export interface ReturnArtifact {
  type: "file" | "qr";
  urlOrText: string;
  fileName?: string;
  fileSize?: number;
}

export interface PickupServices {
  box: boolean;
  printLabel: boolean;
}

export interface Custody {
  pickupPhotoUrl?: string;
  pickupScanCode?: string;
  dropPhotoUrl?: string;
  dropReceiptId?: string;
  pickupTimestamp?: string;
  dropTimestamp?: string;
}

export interface Pickup {
  id: string;
  userId: string;
  status: PickupStatus;
  createdAt: string;
  pickupAddress: string;
  geocode?: { lat: number; lng: number };
  dropCarrier: DropCarrier;
  dropOption: string;
  returnArtifact: ReturnArtifact;
  services: PickupServices;
  returnDeadline: string;
  windowStart: string;
  windowEnd: string;
  estFee: number;
  notes?: string;
  custody: Custody;
}

export interface User {
  id: string;
  name: string;
  email: string;
}

export interface EstimateRequest {
  dropCarrier: DropCarrier;
  services: PickupServices;
  hasArtifact: boolean;
}

export interface EstimateResponse {
  estFee: number;
  breakdown: {
    base: number;
    printLabel: number;
    box: number;
  };
}
