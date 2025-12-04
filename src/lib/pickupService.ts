import { supabase } from "@/integrations/supabase/client";
import { z } from "zod";
import type { Database } from "@/integrations/supabase/types";

type PickupStatus = Database["public"]["Enums"]["pickup_status"];
type DropCarrier = Database["public"]["Enums"]["drop_carrier"];
type CustodyEventType = Database["public"]["Enums"]["custody_event_type"];
type ProfileSummary = Pick<Database["public"]["Tables"]["profiles"]["Row"], "name" | "email">;

export type PickupWithRelations = Database["public"]["Tables"]["pickups"]["Row"] & {
  profiles?: ProfileSummary | null;
  driver?: ProfileSummary | null;
  custody_events?: Database["public"]["Tables"]["custody_events"]["Row"][] | null;
};

// Validation schemas
export const pickupCreateSchema = z.object({
  pickupAddress: z.string().trim().min(1, "Address is required").max(255, "Address too long"),
  dropCarrier: z.enum(["ups", "fedex", "usps", "best_option"]),
  returnArtifactType: z.enum(["file", "qr_code"]),
  returnArtifactUrl: z.string().optional(),
  returnArtifactText: z.string().max(500, "Code too long").optional(),
  needsBox: z.boolean(),
  needsLabelPrint: z.boolean(),
  returnDeadline: z.string(),
  windowStart: z.string(),
  windowEnd: z.string(),
  notesForDriver: z.string().max(500, "Notes too long").optional(),
  estimatedFeeCents: z.number().int().positive(),
});

export type PickupCreateInput = z.infer<typeof pickupCreateSchema>;

// Sanitize text by stripping HTML tags
function sanitizeText(text: string | undefined): string | undefined {
  if (!text) return undefined;
  return text.replace(/<[^>]*>/g, "").trim();
}

// Calculate estimate
export function calculateEstimate(needsBox: boolean, needsLabelPrint: boolean): {
  total: number;
  breakdown: { base: number; box: number; printLabel: number };
} {
  const base = 299; // cents
  const box = needsBox ? 150 : 0;
  const printLabel = needsLabelPrint ? 50 : 0;
  
  return {
    total: base + box + printLabel,
    breakdown: { base, box, printLabel },
  };
}

// Create pickup
export async function createPickup(input: PickupCreateInput, userId: string) {
  // Validate input
  const validated = pickupCreateSchema.parse(input);
  
  // Sanitize text fields
  const sanitizedNotes = sanitizeText(validated.notesForDriver);
  
  const { data, error } = await supabase
    .from("pickups")
    .insert({
      customer_id: userId,
      pickup_address: validated.pickupAddress.trim(),
      drop_carrier: validated.dropCarrier as DropCarrier,
      return_artifact_type: validated.returnArtifactType as Database["public"]["Enums"]["return_artifact_type"],
      return_artifact_url: validated.returnArtifactUrl,
      return_artifact_text: sanitizeText(validated.returnArtifactText),
      needs_box: validated.needsBox,
      needs_label_print: validated.needsLabelPrint,
      return_deadline: validated.returnDeadline,
      window_start: validated.windowStart,
      window_end: validated.windowEnd,
      notes_for_driver: sanitizedNotes,
      estimated_fee_cents: validated.estimatedFeeCents,
      status: "scheduled" as PickupStatus,
    })
    .select()
    .single();

  if (error) throw error;
  return data;
}

// Get customer pickups
export async function getCustomerPickups(userId: string): Promise<PickupWithRelations[]> {
  const { data, error } = await supabase
    .from("pickups")
    .select(`
      *,
      custody_events (*)
    `)
    .eq("customer_id", userId)
    .order("created_at", { ascending: false });

  if (error) throw error;
  return (data ?? []) as PickupWithRelations[];
}

// Get single pickup
export async function getPickup(pickupId: string): Promise<PickupWithRelations | null> {
  const { data, error } = await supabase
    .from("pickups")
    .select(`
      *,
      custody_events (*),
      profiles:customer_id (name, email)
    `)
    .eq("id", pickupId)
    .maybeSingle();

  if (error) throw error;
  return (data as PickupWithRelations | null) ?? null;
}

// Update pickup status
export async function updatePickupStatus(pickupId: string, status: PickupStatus, driverId?: string) {
  const updateData: { status: PickupStatus; driver_id?: string } = { status };
  if (driverId) {
    updateData.driver_id = driverId;
  }

  const { data, error } = await supabase
    .from("pickups")
    .update(updateData)
    .eq("id", pickupId)
    .select()
    .single();

  if (error) throw error;
  return data;
}

// Cancel pickup
export async function cancelPickup(pickupId: string, userId: string) {
  // First verify the pickup belongs to this user and is cancellable
  const { data: pickup, error: fetchError } = await supabase
    .from("pickups")
    .select("window_start, customer_id")
    .eq("id", pickupId)
    .single();

  if (fetchError) throw fetchError;
  if (pickup.customer_id !== userId) throw new Error("Unauthorized");

  // Check if we're within 2 hours of the window
  const windowStart = new Date(pickup.window_start);
  const now = new Date();
  const hoursUntilPickup = (windowStart.getTime() - now.getTime()) / (1000 * 60 * 60);
  
  if (hoursUntilPickup < 2) {
    throw new Error("Cannot cancel within 2 hours of pickup window");
  }

  return updatePickupStatus(pickupId, "canceled");
}

// Get driver assigned pickups
export async function getDriverPickups(driverId: string): Promise<PickupWithRelations[]> {
  const { data, error } = await supabase
    .from("pickups")
    .select(`
      *,
      profiles:customer_id (name, email)
    `)
    .eq("driver_id", driverId)
    .in("status", ["scheduled", "driver_assigned", "picked_up"])
    .order("window_start", { ascending: true });

  if (error) throw error;
  return (data ?? []) as PickupWithRelations[];
}

// Get available pickups for drivers
export async function getAvailablePickups(): Promise<PickupWithRelations[]> {
  const { data, error } = await supabase
    .from("pickups")
    .select(`
      *,
      profiles:customer_id (name, email)
    `)
    .is("driver_id", null)
    .eq("status", "scheduled")
    .order("window_start", { ascending: true });

  if (error) throw error;
  return (data ?? []) as PickupWithRelations[];
}

// Driver claims a pickup
export async function claimPickup(pickupId: string, driverId: string) {
  const { data, error } = await supabase
    .from("pickups")
    .update({ 
      driver_id: driverId,
      status: "driver_assigned" as PickupStatus
    })
    .eq("id", pickupId)
    .is("driver_id", null)
    .select()
    .single();

  if (error) throw error;
  return data;
}

// Add custody event
export async function addCustodyEvent(
  pickupId: string,
  eventType: CustodyEventType,
  imageUrl?: string,
  metadata?: Record<string, unknown>
) {
  const { data, error } = await supabase
    .from("custody_events")
    .insert([{
      pickup_id: pickupId,
      event_type: eventType,
      image_url: imageUrl || null,
      metadata: (metadata || {}) as Database["public"]["Tables"]["custody_events"]["Insert"]["metadata"],
    }])
    .select()
    .single();

  if (error) throw error;
  return data;
}

// Get all pickups (admin)
export async function getAllPickups(statusFilter?: string): Promise<PickupWithRelations[]> {
  let query = supabase
    .from("pickups")
    .select(`
      *,
      profiles:customer_id (name, email),
      driver:driver_id (name, email)
    `)
    .order("created_at", { ascending: false });

  if (statusFilter && statusFilter !== "all") {
    query = query.eq("status", statusFilter as PickupStatus);
  }

  const { data, error } = await query;
  if (error) throw error;
  return (data ?? []) as PickupWithRelations[];
}
