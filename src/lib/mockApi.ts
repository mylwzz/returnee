import { User, Pickup, EstimateRequest, EstimateResponse } from "@/types/pickup";

// Mock user storage
let currentUser: User | null = null;

// Mock pickups database
const mockPickups: Pickup[] = [
  {
    id: "RR-NYC-001234",
    userId: "user-1",
    status: "pickedUp",
    createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
    pickupAddress: "123 Broadway, New York, NY 10012",
    dropCarrier: "ups",
    dropOption: "UPS Store",
    returnArtifact: {
      type: "file",
      urlOrText: "/mock/label.pdf",
      fileName: "amazon-return-label.pdf",
      fileSize: 428000,
    },
    services: { box: false, printLabel: false },
    returnDeadline: new Date(Date.now() + 25 * 24 * 60 * 60 * 1000).toISOString(),
    windowStart: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000 + 19 * 60 * 60 * 1000).toISOString(),
    windowEnd: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000 + 21 * 60 * 60 * 1000).toISOString(),
    estFee: 2.99,
    notes: "Leave with doorman",
    custody: {
      pickupPhotoUrl: "https://images.unsplash.com/photo-1566576721346-d4a3b4eaeb55?w=400",
      pickupScanCode: "PKG-ABC-123",
      pickupTimestamp: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000 + 19.5 * 60 * 60 * 1000).toISOString(),
    },
  },
  {
    id: "RR-NYC-001235",
    userId: "user-1",
    status: "completed",
    createdAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
    pickupAddress: "456 5th Ave, New York, NY 10018",
    dropCarrier: "fedex",
    dropOption: "FedEx",
    returnArtifact: {
      type: "qr",
      urlOrText: "QR-789456123",
    },
    services: { box: true, printLabel: true },
    returnDeadline: new Date(Date.now() + 20 * 24 * 60 * 60 * 1000).toISOString(),
    windowStart: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000 + 19 * 60 * 60 * 1000).toISOString(),
    windowEnd: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000 + 21 * 60 * 60 * 1000).toISOString(),
    estFee: 5.49,
    custody: {
      pickupPhotoUrl: "https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?w=400",
      pickupScanCode: "PKG-DEF-456",
      dropPhotoUrl: "https://images.unsplash.com/photo-1567521464027-f127ff144326?w=800",
      dropReceiptId: "FDX-789456",
      pickupTimestamp: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000 + 19.5 * 60 * 60 * 1000).toISOString(),
      dropTimestamp: new Date(Date.now() - 6 * 24 * 60 * 60 * 1000 + 10 * 60 * 60 * 1000).toISOString(),
    },
  },
];

export const mockApi = {
  auth: {
    signup: async (email: string, password: string, name: string): Promise<User> => {
      await new Promise((resolve) => setTimeout(resolve, 500));
      currentUser = {
        id: "user-1",
        email,
        name,
      };
      return currentUser;
    },
    login: async (email: string, password: string): Promise<{ user: User; token: string }> => {
      await new Promise((resolve) => setTimeout(resolve, 500));
      currentUser = {
        id: "user-1",
        email,
        name: "Demo User",
      };
      return { user: currentUser, token: "mock-token-123" };
    },
    logout: () => {
      currentUser = null;
    },
    getCurrentUser: (): User | null => currentUser,
  },

  pickups: {
    list: async (): Promise<Pickup[]> => {
      await new Promise((resolve) => setTimeout(resolve, 300));
      return mockPickups.filter((p) => p.userId === currentUser?.id);
    },
    
    get: async (id: string): Promise<Pickup | null> => {
      await new Promise((resolve) => setTimeout(resolve, 300));
      return mockPickups.find((p) => p.id === id && p.userId === currentUser?.id) || null;
    },

    estimate: async (request: EstimateRequest): Promise<EstimateResponse> => {
      await new Promise((resolve) => setTimeout(resolve, 400));
      
      const base = 2.99 + Math.random() * 1.0;
      const printLabel = request.services.printLabel ? 0.5 : 0;
      const box = request.services.box ? 1.5 : 0;
      
      return {
        estFee: Math.round((base + printLabel + box) * 100) / 100,
        breakdown: {
          base: Math.round(base * 100) / 100,
          printLabel,
          box,
        },
      };
    },

    create: async (pickupData: Partial<Pickup>): Promise<Pickup> => {
      await new Promise((resolve) => setTimeout(resolve, 500));
      
      const newPickup: Pickup = {
        id: `RR-NYC-${String(Math.floor(Math.random() * 999999)).padStart(6, "0")}`,
        userId: currentUser?.id || "user-1",
        status: "scheduled",
        createdAt: new Date().toISOString(),
        custody: {},
        ...pickupData,
      } as Pickup;
      
      mockPickups.push(newPickup);
      return newPickup;
    },
  },
};
