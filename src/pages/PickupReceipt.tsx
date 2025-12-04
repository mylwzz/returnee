import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { mockApi } from "@/lib/mockApi";
import { Pickup } from "@/types/pickup";
import { ArrowLeft, Download, QrCode, MapPin, Calendar } from "lucide-react";
import { format } from "date-fns";

export default function PickupReceipt() {
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
      if (!data || data.status !== "completed") {
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

  const handleDownload = () => {
    // Mock PDF download
    alert("Receipt PDF would be downloaded here");
  };

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
          <h1 className="text-3xl font-bold mb-2">Pickup Receipt</h1>
          <p className="text-muted-foreground">Pickup #{pickup.id}</p>
        </div>

        <div className="space-y-6">
          <Card>
            <CardContent className="space-y-4 pt-6">
              {pickup.custody.dropPhotoUrl && (
                <div>
                  <p className="text-sm text-muted-foreground mb-2">Drop-off photo</p>
                  <img
                    src={pickup.custody.dropPhotoUrl}
                    alt="Drop-off"
                    className="rounded-lg w-full max-w-md border border-border"
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    Taken at {format(new Date(pickup.custody.dropTimestamp!), "MMM d, yyyy 'at' h:mm a")}
                  </p>
                </div>
              )}

              {pickup.custody.pickupScanCode && (
                <div className="flex items-center gap-2 p-3 bg-muted rounded-lg">
                  <QrCode className="h-5 w-5 text-muted-foreground" />
                  <div>
                    <p className="text-sm text-muted-foreground">Scan code</p>
                    <p className="font-mono font-medium">{pickup.custody.pickupScanCode}</p>
                  </div>
                </div>
              )}

              {pickup.custody.dropReceiptId && (
                <div className="flex items-center gap-2 p-3 bg-muted rounded-lg">
                  <QrCode className="h-5 w-5 text-muted-foreground" />
                  <div>
                    <p className="text-sm text-muted-foreground">Drop receipt ID</p>
                    <p className="font-mono font-medium">{pickup.custody.dropReceiptId}</p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Pickup Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
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
                  <p className="text-sm text-muted-foreground">Completed</p>
                  <p className="font-medium">
                    {format(new Date(pickup.custody.dropTimestamp!), "EEEE, MMMM d, yyyy 'at' h:mm a")}
                  </p>
                </div>
              </div>

              <Separator />

              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Base pickup</span>
                  <span>$2.99</span>
                </div>
                {pickup.services.printLabel && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Label printing</span>
                    <span>$0.50</span>
                  </div>
                )}
                {pickup.services.box && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Box provided</span>
                    <span>$1.50</span>
                  </div>
                )}
              </div>

              <Separator />

              <div className="flex justify-between items-center">
                <span className="font-semibold">Total</span>
                <span className="text-2xl font-bold text-primary">${pickup.estFee.toFixed(2)}</span>
              </div>
            </CardContent>
          </Card>

          <Button className="w-full" onClick={handleDownload}>
            <Download className="mr-2 h-4 w-4" />
            Download PDF Receipt
          </Button>
        </div>
      </main>
    </div>
  );
}
