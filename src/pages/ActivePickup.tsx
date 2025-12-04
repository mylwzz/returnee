import { useEffect, useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { StatusChip } from "@/components/StatusChip";
import { mockApi } from "@/lib/mockApi";
import { Pickup } from "@/types/pickup";
import { ArrowLeft, MapPin, Calendar, Package, MessageCircle, CheckCircle2, Clock, Truck } from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";

const timelineSteps = [
  { status: "scheduled", label: "Scheduled", icon: Clock },
  { status: "assigned", label: "Driver assigned", icon: Truck },
  { status: "pickedUp", label: "Picked up", icon: CheckCircle2 },
  { status: "dropped", label: "Dropped at carrier", icon: Package },
  { status: "completed", label: "Complete", icon: CheckCircle2 },
];

export default function ActivePickup() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [pickup, setPickup] = useState<Pickup | null>(null);

  useEffect(() => {
    if (id) {
      loadPickup(id);
    }
  }, [id]);

  const loadPickup = async (pickupId: string) => {
    try {
      const data = await mockApi.pickups.get(pickupId);
      if (!data || !["scheduled", "assigned", "pickedUp", "dropped"].includes(data.status)) {
        navigate("/dashboard");
        return;
      }
      setPickup(data);
    } catch (error) {
      console.error("Failed to load pickup:", error);
      navigate("/dashboard");
    }
  };

  if (!pickup) {
    return null;
  }

  const currentStepIndex = timelineSteps.findIndex((step) => step.status === pickup.status);

  return (
    <div className="min-h-screen">
      <header className="border-b border-border">
        <div className="container mx-auto px-4 py-4">
          <Button variant="ghost" onClick={() => navigate("/dashboard")}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Dashboard
          </Button>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 max-w-3xl">
        <div className="mb-6">
          <div className="flex items-start justify-between mb-2">
            <div>
              <h1 className="text-3xl font-bold">Pickup #{pickup.id}</h1>
              <p className="text-muted-foreground mt-1">
                Created {format(new Date(pickup.createdAt), "MMM d, yyyy 'at' h:mm a")}
              </p>
            </div>
            <StatusChip status={pickup.status} />
          </div>
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Tracking Timeline</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="relative">
                {timelineSteps.map((step, index) => {
                  const Icon = step.icon;
                  const isCompleted = index <= currentStepIndex;
                  const isCurrent = index === currentStepIndex;

                  return (
                    <div key={step.status} className="relative pb-8 last:pb-0">
                      {index < timelineSteps.length - 1 && (
                        <div
                          className={cn(
                            "absolute left-4 top-8 h-full w-0.5 -ml-px",
                            isCompleted ? "bg-primary" : "bg-border"
                          )}
                        />
                      )}
                      <div className="relative flex items-start gap-4">
                        <div
                          className={cn(
                            "h-8 w-8 rounded-full flex items-center justify-center border-2 transition-colors",
                            isCompleted
                              ? "bg-primary border-primary"
                              : "bg-background border-border"
                          )}
                        >
                          <Icon
                            className={cn(
                              "h-4 w-4",
                              isCompleted ? "text-primary-foreground" : "text-muted-foreground"
                            )}
                          />
                        </div>
                        <div className="flex-1 pt-0.5">
                          <p
                            className={cn(
                              "font-medium",
                              isCurrent && "text-primary",
                              !isCompleted && "text-muted-foreground"
                            )}
                          >
                            {step.label}
                          </p>
                          {isCompleted && pickup.custody.pickupTimestamp && index === 2 && (
                            <p className="text-sm text-muted-foreground mt-1">
                              {format(new Date(pickup.custody.pickupTimestamp), "MMM d 'at' h:mm a")}
                            </p>
                          )}
                          {isCompleted && pickup.custody.pickupPhotoUrl && index === 2 && (
                            <img
                              src={pickup.custody.pickupPhotoUrl}
                              alt="Pickup photo"
                              className="mt-2 rounded-lg w-32 h-32 object-cover border border-border"
                            />
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Pickup Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-start gap-3">
                <MapPin className="h-5 w-5 text-muted-foreground mt-0.5" />
                <div>
                  <p className="text-sm text-muted-foreground">Address</p>
                  <p className="font-medium">{pickup.pickupAddress}</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <Calendar className="h-5 w-5 text-muted-foreground mt-0.5" />
                <div>
                  <p className="text-sm text-muted-foreground">Window</p>
                  <p className="font-medium">
                    {format(new Date(pickup.windowStart), "EEEE, MMMM d")}
                    <br />
                    {format(new Date(pickup.windowStart), "h:mm a")} -{" "}
                    {format(new Date(pickup.windowEnd), "h:mm a")}
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <Package className="h-5 w-5 text-muted-foreground mt-0.5" />
                <div>
                  <p className="text-sm text-muted-foreground">Drop location</p>
                  <p className="font-medium">{pickup.dropOption}</p>
                </div>
              </div>

              {pickup.notes && (
                <div className="flex items-start gap-3">
                  <MessageCircle className="h-5 w-5 text-muted-foreground mt-0.5" />
                  <div>
                    <p className="text-sm text-muted-foreground">Notes</p>
                    <p className="font-medium">{pickup.notes}</p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          <div className="flex flex-col sm:flex-row gap-3">
            <Button variant="outline" className="flex-1" disabled>
              Reschedule
            </Button>
            <Button variant="outline" className="flex-1" disabled>
              Cancel pickup
            </Button>
          </div>

          <div className="text-center">
            <Link to="#" className="text-sm text-primary hover:underline">
              Need help? Contact support
            </Link>
          </div>
        </div>
      </main>
    </div>
  );
}
