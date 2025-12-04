import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { mockApi } from "@/lib/mockApi";
import { toast } from "sonner";
import { ArrowLeft, MapPin, Package, Calendar, FileText, Box, Printer } from "lucide-react";
import { format } from "date-fns";

type DropCarrierOption = "ups" | "fedex" | "usps" | "best_option";
type PickupWindow = "tonight" | "tomorrow" | "custom";

type EstimateBreakdown = {
  base: number;
  printLabel: number;
  box: number;
};

type ReviewFormData = {
  address: string;
  dropCarrier: DropCarrierOption;
  file: File | null;
  qrCode: string;
  needBox: boolean;
  needPrinting: boolean;
  returnDeadline: Date;
  pickupWindow: PickupWindow;
  customWindowStart: string;
  customWindowEnd: string;
  notes: string;
  estimate: {
    total: number;
    breakdown: EstimateBreakdown;
  };
  estimatedFeeCents: number;
};

const rehydrateFile = (storedFile: unknown): File | null => {
  if (!storedFile || typeof storedFile !== "object") return null;
  const fileData = storedFile as Partial<File> & { lastModified?: number };
  if (!fileData.name) return null;

  const byteLength = typeof fileData.size === "number" && fileData.size > 0 ? fileData.size : 0;
  const placeholderBytes = byteLength > 0 ? new Uint8Array(byteLength) : [];

  return new File([placeholderBytes], fileData.name, {
    type: typeof fileData.type === "string" ? fileData.type : "application/octet-stream",
    lastModified: typeof fileData.lastModified === "number" ? fileData.lastModified : Date.now(),
  });
};

const parseStoredData = (raw: string): ReviewFormData | null => {
  try {
    const parsed = JSON.parse(raw) as Partial<ReviewFormData> & { returnDeadline?: string };
    const deadline = parsed.returnDeadline ? new Date(parsed.returnDeadline) : null;

    if (!deadline || Number.isNaN(deadline.getTime())) {
      return null;
    }

    const breakdown = parsed.estimate?.breakdown ?? { base: 0, printLabel: 0, box: 0 };
    const estimate = {
      total: parsed.estimate?.total ?? 0,
      breakdown: {
        base: breakdown.base ?? 0,
        printLabel: breakdown.printLabel ?? 0,
        box: breakdown.box ?? 0,
      },
    };

    return {
      address: parsed.address ?? "",
      dropCarrier: (parsed.dropCarrier as DropCarrierOption) ?? "best_option",
      file: parsed.file ? rehydrateFile(parsed.file) : null,
      qrCode: parsed.qrCode ?? "",
      needBox: Boolean(parsed.needBox),
      needPrinting: Boolean(parsed.needPrinting),
      returnDeadline: deadline,
      pickupWindow: (parsed.pickupWindow as PickupWindow) ?? "tonight",
      customWindowStart: parsed.customWindowStart ?? "",
      customWindowEnd: parsed.customWindowEnd ?? "",
      notes: parsed.notes ?? "",
      estimate,
      estimatedFeeCents: parsed.estimatedFeeCents ?? Math.round(estimate.total * 100),
    };
  } catch (error) {
    console.error("Failed to parse pickup form data", error);
    return null;
  }
};

export default function ReviewPickup() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [agreed, setAgreed] = useState(false);
  const [formData, setFormData] = useState<ReviewFormData | null>(null);

  useEffect(() => {
    const data = sessionStorage.getItem("pickupFormData");
    if (!data) {
      navigate("/schedule");
      return;
    }

    const parsed = parseStoredData(data);
    if (!parsed) {
      navigate("/schedule");
      return;
    }

    setFormData(parsed);
  }, [navigate]);

  const formatCarrierLabel = (carrier: DropCarrierOption) => {
    switch (carrier) {
      case "ups":
        return "UPS";
      case "fedex":
        return "FedEx";
      case "usps":
        return "USPS";
      case "best_option":
        return "Best option for me";
      default:
        return carrier;
    }
  };

  const handleSchedule = async () => {
    if (!formData) return;
    if (!agreed) {
      toast.error("Please agree to the pickup terms");
      return;
    }

    setLoading(true);
    try {
      const carrierLabel = formatCarrierLabel(formData.dropCarrier);
      const windowStart = formData.pickupWindow === "tonight"
        ? new Date(new Date().setHours(19, 0, 0, 0))
        : new Date(new Date(Date.now() + 24 * 60 * 60 * 1000).setHours(19, 0, 0, 0));
      
      const windowEnd = new Date(windowStart);
      windowEnd.setHours(windowEnd.getHours() + 2);

      const pickup = await mockApi.pickups.create({
        pickupAddress: formData.address,
        dropCarrier: formData.dropCarrier,
        dropOption: carrierLabel,
        returnArtifact: formData.file
          ? {
              type: "file",
              urlOrText: URL.createObjectURL(formData.file),
              fileName: formData.file.name,
              fileSize: formData.file.size,
            }
          : {
              type: "qr",
              urlOrText: formData.qrCode,
            },
        services: {
          box: formData.needBox,
          printLabel: formData.needPrinting,
        },
        returnDeadline: formData.returnDeadline.toISOString(),
        windowStart: windowStart.toISOString(),
        windowEnd: windowEnd.toISOString(),
        estFee: formData.estimate.total,
        notes: formData.notes,
      });

      sessionStorage.removeItem("pickupFormData");
      navigate(`/pickup/${pickup.id}/confirmation`);
    } catch (error) {
      toast.error("Failed to schedule pickup. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  if (!formData) {
    return null;
  }

  const carrierLabel = formatCarrierLabel(formData.dropCarrier);

  return (
    <div className="min-h-screen">
      <header className="border-b border-border">
        <div className="container mx-auto px-4 py-4">
          <Button variant="ghost" onClick={() => navigate("/schedule")}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Form
          </Button>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 max-w-3xl">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Review & Confirm</h1>
          <p className="text-muted-foreground">
            Please review your pickup details before confirming
          </p>
        </div>

        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MapPin className="h-5 w-5 text-primary" />
                Pickup Details
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div>
                <p className="text-sm text-muted-foreground">Address</p>
                <p className="font-medium">{formData.address}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Pickup window</p>
                <p className="font-medium">
                  {formData.pickupWindow === "tonight" && "Tonight 7–9 PM"}
                  {formData.pickupWindow === "tomorrow" && "Tomorrow 7–9 PM"}
                  {formData.pickupWindow === "custom" && "Custom time"}
                </p>
              </div>
              {formData.notes && (
                <div>
                  <p className="text-sm text-muted-foreground">Notes</p>
                  <p className="font-medium">{formData.notes}</p>
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Package className="h-5 w-5 text-primary" />
                Drop Location
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="font-medium">{carrierLabel}</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5 text-primary" />
                Return Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div>
                <p className="text-sm text-muted-foreground">Return artifact</p>
                <p className="font-medium">
                  {formData.file
                    ? `File: ${formData.file.name} (${Math.round(formData.file.size / 1024)} KB)`
                    : `QR Code: ${formData.qrCode}`}
                </p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Return deadline</p>
                <p className="font-medium">{format(new Date(formData.returnDeadline), "MMMM d, yyyy")}</p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Box className="h-5 w-5 text-primary" />
                Services
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="flex items-center gap-2">
                <Printer className="h-4 w-4 text-muted-foreground" />
                <span>Label printing: {formData.needPrinting ? "Yes" : "No"}</span>
              </div>
              <div className="flex items-center gap-2">
                <Box className="h-4 w-4 text-muted-foreground" />
                <span>Box provided: {formData.needBox ? "Yes" : "No"}</span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Pricing Breakdown</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Base pickup</span>
                  <span>${formData.estimate.breakdown.base.toFixed(2)}</span>
                </div>
                {formData.estimate.breakdown.printLabel > 0 && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Label printing</span>
                    <span>${formData.estimate.breakdown.printLabel.toFixed(2)}</span>
                  </div>
                )}
                {formData.estimate.breakdown.box > 0 && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Box provided</span>
                    <span>${formData.estimate.breakdown.box.toFixed(2)}</span>
                  </div>
                )}
              </div>
              <Separator />
              <div className="flex justify-between items-center">
                <span className="font-semibold">Estimated total</span>
                <span className="text-2xl font-bold text-primary">
                  ${formData.estimate.total.toFixed(2)}
                </span>
              </div>
              <p className="text-xs text-muted-foreground">
                You'll see exact price on driver acceptance
              </p>
            </CardContent>
          </Card>

          <Card className="border-primary/20 bg-primary/5">
            <CardContent className="pt-6">
              <div className="flex items-start space-x-3">
                <Checkbox
                  id="agree"
                  checked={agreed}
                  onCheckedChange={(checked) => setAgreed(checked as boolean)}
                />
                <Label htmlFor="agree" className="text-sm leading-relaxed cursor-pointer">
                  I agree to lobby/door-to-doorman handoff and tamper-bag use. I understand
                  photos and QR scans will be taken as proof of pickup and delivery.
                </Label>
              </div>
            </CardContent>
          </Card>

          <div className="flex gap-3">
            <Button variant="outline" className="flex-1" onClick={() => navigate("/schedule")}>
              Back
            </Button>
            <Button
              className="flex-1"
              onClick={handleSchedule}
              disabled={!agreed || loading}
            >
              {loading ? "Scheduling..." : "Schedule pickup"}
            </Button>
          </div>
        </div>
      </main>
    </div>
  );
}
