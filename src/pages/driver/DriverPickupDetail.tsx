import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/hooks/useAuth";
import { getPickup, updatePickupStatus, addCustodyEvent } from "@/lib/pickupService";
import { toast } from "sonner";
import { ArrowLeft, MapPin, Clock, Package, User, Camera, Check, Navigation } from "lucide-react";
import { format } from "date-fns";

type Pickup = Awaited<ReturnType<typeof getPickup>>;

export default function DriverPickupDetail() {
  const { id } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [pickup, setPickup] = useState<Pickup>(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [photoUrl, setPhotoUrl] = useState("");

  useEffect(() => {
    if (id) loadPickup();
  }, [id]);

  const loadPickup = async () => {
    try {
      const data = await getPickup(id!);
      setPickup(data);
    } catch (error) {
      console.error("Failed to load pickup:", error);
      toast.error("Failed to load pickup details");
    } finally {
      setLoading(false);
    }
  };

  const handleStatusUpdate = async (newStatus: "picked_up" | "dropped_at_carrier" | "completed", eventType?: "pickup_photo" | "drop_photo") => {
    if (!pickup) return;
    setUpdating(true);
    try {
      // Add custody event if photo provided
      if (eventType && photoUrl) {
        await addCustodyEvent(pickup.id, eventType, photoUrl);
      }
      
      await updatePickupStatus(pickup.id, newStatus);
      toast.success(`Status updated to ${newStatus.replace("_", " ")}`);
      loadPickup();
      setPhotoUrl("");
    } catch (error) {
      console.error("Failed to update status:", error);
      toast.error("Failed to update status");
    } finally {
      setUpdating(false);
    }
  };

  const getCarrierLabel = (carrier: string) => {
    switch (carrier) {
      case "ups": return "UPS Store";
      case "fedex": return "FedEx";
      case "usps": return "USPS";
      case "best_option": return "Best Option";
      default: return carrier;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "scheduled":
        return "bg-info/20 text-info";
      case "driver_assigned":
        return "bg-warning/20 text-warning";
      case "picked_up":
        return "bg-primary/20 text-primary";
      case "dropped_at_carrier":
        return "bg-success/20 text-success";
      case "completed":
        return "bg-success/20 text-success";
      default:
        return "bg-muted text-muted-foreground";
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-muted-foreground">Loading pickup details...</p>
      </div>
    );
  }

  if (!pickup) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-muted-foreground">Pickup not found</p>
      </div>
    );
  }

  const steps = [
    { status: "scheduled", label: "Scheduled" },
    { status: "driver_assigned", label: "On the way" },
    { status: "picked_up", label: "Picked up" },
    { status: "dropped_at_carrier", label: "Dropped at carrier" },
    { status: "completed", label: "Complete" },
  ];

  const currentStepIndex = steps.findIndex(s => s.status === pickup.status);

  return (
    <div className="min-h-screen">
      <header className="border-b border-border">
        <div className="container mx-auto px-4 py-4">
          <Button variant="ghost" onClick={() => navigate("/driver")}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Dashboard
          </Button>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 max-w-3xl">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold">Pickup Details</h1>
          <Badge className={getStatusColor(pickup.status)}>
            {pickup.status.replace(/_/g, " ")}
          </Badge>
        </div>

        {/* Progress Steps */}
        <Card className="mb-6">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              {steps.map((step, index) => (
                <div key={step.status} className="flex flex-col items-center flex-1">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium
                    ${index <= currentStepIndex 
                      ? "bg-primary text-primary-foreground" 
                      : "bg-muted text-muted-foreground"}`}
                  >
                    {index < currentStepIndex ? <Check className="h-4 w-4" /> : index + 1}
                  </div>
                  <span className="text-xs mt-1 text-center">{step.label}</span>
                  {index < steps.length - 1 && (
                    <div className={`h-0.5 w-full mt-4 
                      ${index < currentStepIndex ? "bg-primary" : "bg-muted"}`} 
                    />
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Customer & Address Info */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5 text-primary" />
              Customer Info
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <p className="text-sm text-muted-foreground">Name</p>
              <p className="font-medium">{pickup.profiles?.name || "Customer"}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Pickup Address</p>
              <p className="font-medium">{pickup.pickup_address}</p>
            </div>
            <Button variant="outline" className="w-full" asChild>
              <a 
                href={`https://maps.google.com/?q=${encodeURIComponent(pickup.pickup_address)}`}
                target="_blank"
                rel="noopener noreferrer"
              >
                <Navigation className="mr-2 h-4 w-4" />
                Open in Maps
              </a>
            </Button>
          </CardContent>
        </Card>

        {/* Pickup Details */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Package className="h-5 w-5 text-primary" />
              Pickup Info
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-muted-foreground">Drop Carrier</p>
                <p className="font-medium">{getCarrierLabel(pickup.drop_carrier)}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Pickup Window</p>
                <p className="font-medium">
                  {format(new Date(pickup.window_start), "MMM d, h:mm a")}
                </p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Needs Box</p>
                <p className="font-medium">{pickup.needs_box ? "Yes" : "No"}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Needs Label Print</p>
                <p className="font-medium">{pickup.needs_label_print ? "Yes" : "No"}</p>
              </div>
            </div>
            {pickup.notes_for_driver && (
              <div>
                <p className="text-sm text-muted-foreground">Notes from Customer</p>
                <p className="font-medium p-3 bg-muted rounded-lg">{pickup.notes_for_driver}</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Actions based on status */}
        <Card>
          <CardHeader>
            <CardTitle>Actions</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {pickup.status === "driver_assigned" && (
              <>
                <div className="space-y-2">
                  <Label>Upload Pickup Photo (optional)</Label>
                  <Input
                    placeholder="Enter photo URL"
                    value={photoUrl}
                    onChange={(e) => setPhotoUrl(e.target.value)}
                  />
                  <p className="text-xs text-muted-foreground">
                    Take a photo of the package at pickup
                  </p>
                </div>
                <Button 
                  className="w-full" 
                  onClick={() => handleStatusUpdate("picked_up", "pickup_photo")}
                  disabled={updating}
                >
                  <Camera className="mr-2 h-4 w-4" />
                  {updating ? "Updating..." : "Mark as Picked Up"}
                </Button>
              </>
            )}

            {pickup.status === "picked_up" && (
              <>
                <div className="space-y-2">
                  <Label>Upload Drop Photo (optional)</Label>
                  <Input
                    placeholder="Enter photo URL"
                    value={photoUrl}
                    onChange={(e) => setPhotoUrl(e.target.value)}
                  />
                  <p className="text-xs text-muted-foreground">
                    Take a photo at the carrier drop-off location
                  </p>
                </div>
                <Button 
                  className="w-full" 
                  onClick={() => handleStatusUpdate("dropped_at_carrier", "drop_photo")}
                  disabled={updating}
                >
                  <Check className="mr-2 h-4 w-4" />
                  {updating ? "Updating..." : "Mark as Dropped at Carrier"}
                </Button>
              </>
            )}

            {pickup.status === "dropped_at_carrier" && (
              <Button 
                className="w-full" 
                onClick={() => handleStatusUpdate("completed")}
                disabled={updating}
              >
                <Check className="mr-2 h-4 w-4" />
                {updating ? "Updating..." : "Mark as Complete"}
              </Button>
            )}

            {pickup.status === "completed" && (
              <div className="text-center py-4">
                <Check className="h-12 w-12 text-success mx-auto mb-2" />
                <p className="font-medium text-success">Pickup Complete!</p>
              </div>
            )}

            {pickup.status === "scheduled" && (
              <p className="text-center text-muted-foreground py-4">
                This pickup hasn't been assigned yet
              </p>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
