import { useEffect, useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { mockApi } from "@/lib/mockApi";
import { Pickup } from "@/types/pickup";
import { CheckCircle2, Calendar, MapPin, DollarSign, ExternalLink } from "lucide-react";
import { format } from "date-fns";

export default function PickupConfirmation() {
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
      setPickup(data);
    } catch (error) {
      console.error("Failed to load pickup:", error);
      navigate("/dashboard");
    }
  };

  if (!pickup) {
    return null;
  }

  const addToCalendar = () => {
    // Create ICS file content
    const start = format(new Date(pickup.windowStart), "yyyyMMdd'T'HHmmss");
    const end = format(new Date(pickup.windowEnd), "yyyyMMdd'T'HHmmss");
    
    const icsContent = `BEGIN:VCALENDAR
VERSION:2.0
BEGIN:VEVENT
SUMMARY:RETURNEE Pickup - ${pickup.id}
DESCRIPTION:Return pickup scheduled at ${pickup.pickupAddress}
LOCATION:${pickup.pickupAddress}
DTSTART:${start}
DTEND:${end}
END:VEVENT
END:VCALENDAR`;

    const blob = new Blob([icsContent], { type: "text/calendar" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `returnee-pickup-${pickup.id}.ics`;
    link.click();
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="w-full max-w-2xl space-y-6">
        <div className="text-center space-y-4">
          <div className="flex justify-center">
            <div className="h-20 w-20 rounded-full bg-success/10 flex items-center justify-center">
              <CheckCircle2 className="h-12 w-12 text-success" />
            </div>
          </div>
          <h1 className="text-4xl font-bold">Pickup Scheduled!</h1>
          <p className="text-xl text-muted-foreground">
            Your return pickup has been confirmed
          </p>
        </div>

        <Card>
          <CardContent className="pt-6 space-y-4">
            <div className="text-center pb-4 border-b border-border">
              <p className="text-sm text-muted-foreground">Pickup ID</p>
              <p className="text-2xl font-bold text-primary">{pickup.id}</p>
            </div>

            <div className="space-y-3">
              <div className="flex items-start gap-3">
                <MapPin className="h-5 w-5 text-muted-foreground mt-0.5" />
                <div>
                  <p className="text-sm text-muted-foreground">Pickup address</p>
                  <p className="font-medium">{pickup.pickupAddress}</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <Calendar className="h-5 w-5 text-muted-foreground mt-0.5" />
                <div>
                  <p className="text-sm text-muted-foreground">Pickup window</p>
                  <p className="font-medium">
                    {format(new Date(pickup.windowStart), "EEEE, MMMM d 'at' h:mm a")} -{" "}
                    {format(new Date(pickup.windowEnd), "h:mm a")}
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <DollarSign className="h-5 w-5 text-muted-foreground mt-0.5" />
                <div>
                  <p className="text-sm text-muted-foreground">Estimated total</p>
                  <p className="font-medium">${pickup.estFee.toFixed(2)}</p>
                </div>
              </div>
            </div>

            <div className="pt-4 border-t border-border">
              <p className="text-sm text-muted-foreground text-center">
                You'll receive a photo + QR scan receipt at handoff
              </p>
            </div>
          </CardContent>
        </Card>

        <div className="flex flex-col sm:flex-row gap-3">
          <Button variant="outline" className="flex-1" onClick={addToCalendar}>
            <Calendar className="mr-2 h-4 w-4" />
            Add to Calendar
          </Button>
          <Link to={`/pickup/${pickup.id}`} className="flex-1">
            <Button className="w-full">
              <ExternalLink className="mr-2 h-4 w-4" />
              View active pickup
            </Button>
          </Link>
        </div>

        <div className="text-center">
          <Link to="/dashboard">
            <Button variant="ghost">Return to Dashboard</Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
