import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Checkbox } from "@/components/ui/checkbox";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { EstimateBox } from "@/components/EstimateBox";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { calculateEstimate } from "@/lib/pickupService";
import { toast } from "sonner";
import { ArrowLeft, Calendar as CalendarIcon, Upload, AlertCircle } from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";

type DropCarrier = "ups" | "fedex" | "usps" | "best_option";

export default function SchedulePickup() {
  const navigate = useNavigate();
  
  const [formData, setFormData] = useState({
    address: "",
    dropCarrier: "best_option" as DropCarrier,
    file: null as File | null,
    qrCode: "",
    needBox: false,
    needPrinting: false,
    returnDeadline: undefined as Date | undefined,
    pickupWindow: "tonight",
    customWindowStart: "",
    customWindowEnd: "",
    notes: "",
  });

  const [estimate, setEstimate] = useState({
    total: 2.99,
    breakdown: { base: 299, printLabel: 0, box: 0 },
  });

  useEffect(() => {
    updateEstimate();
  }, [formData.needBox, formData.needPrinting]);

  const updateEstimate = () => {
    const result = calculateEstimate(formData.needBox, formData.needPrinting);
    setEstimate({
      total: result.total / 100,
      breakdown: {
        base: result.breakdown.base / 100,
        printLabel: result.breakdown.printLabel / 100,
        box: result.breakdown.box / 100,
      },
    });
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Validate file type
      const allowedTypes = ["application/pdf", "image/png", "image/jpeg"];
      if (!allowedTypes.includes(file.type)) {
        toast.error("Only PDF, PNG, and JPG files are allowed");
        return;
      }
      if (file.size > 5 * 1024 * 1024) {
        toast.error("File size must be less than 5MB");
        return;
      }
      setFormData({ ...formData, file, qrCode: "" });
      toast.success("Label uploaded successfully");
    }
  };

  const isValid = () => {
    return (
      formData.address.trim().length > 0 &&
      formData.address.trim().length <= 255 &&
      (formData.file || formData.qrCode.trim()) &&
      formData.returnDeadline &&
      (formData.pickupWindow !== "custom" || (formData.customWindowStart && formData.customWindowEnd))
    );
  };

  const handleSubmit = () => {
    if (!isValid()) {
      toast.error("Please fill in all required fields");
      return;
    }
    
    // Store form data in sessionStorage for review page
    sessionStorage.setItem("pickupFormData", JSON.stringify({ 
      ...formData, 
      estimate,
      estimatedFeeCents: Math.round(estimate.total * 100)
    }));
    navigate("/schedule/review");
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

      <main className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Schedule a Pickup</h1>
          <p className="text-muted-foreground">
            Fill in the details below for your return pickup
          </p>
        </div>

        <div className="grid lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Pickup Location</CardTitle>
              </CardHeader>
              <CardContent>
                <Label htmlFor="address">Address *</Label>
                <Input
                  id="address"
                  placeholder="123 Main St, New York, NY 10001"
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  className="mt-2"
                  maxLength={255}
                />
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Drop Location</CardTitle>
              </CardHeader>
              <CardContent>
                <RadioGroup
                  value={formData.dropCarrier}
                  onValueChange={(value) => setFormData({ ...formData, dropCarrier: value as DropCarrier })}
                  className="grid grid-cols-2 gap-4"
                >
                  <Label
                    htmlFor="ups"
                    className={cn(
                      "flex items-center justify-center rounded-lg border-2 p-4 cursor-pointer transition-all",
                      formData.dropCarrier === "ups" && "border-primary bg-primary/5"
                    )}
                  >
                    <RadioGroupItem value="ups" id="ups" className="sr-only" />
                    <span className="font-medium">UPS Store</span>
                  </Label>
                  <Label
                    htmlFor="fedex"
                    className={cn(
                      "flex items-center justify-center rounded-lg border-2 p-4 cursor-pointer transition-all",
                      formData.dropCarrier === "fedex" && "border-primary bg-primary/5"
                    )}
                  >
                    <RadioGroupItem value="fedex" id="fedex" className="sr-only" />
                    <span className="font-medium">FedEx</span>
                  </Label>
                  <Label
                    htmlFor="usps"
                    className={cn(
                      "flex items-center justify-center rounded-lg border-2 p-4 cursor-pointer transition-all",
                      formData.dropCarrier === "usps" && "border-primary bg-primary/5"
                    )}
                  >
                    <RadioGroupItem value="usps" id="usps" className="sr-only" />
                    <span className="font-medium">USPS</span>
                  </Label>
                  <Label
                    htmlFor="best_option"
                    className={cn(
                      "flex items-center justify-center rounded-lg border-2 p-4 cursor-pointer transition-all",
                      formData.dropCarrier === "best_option" && "border-primary bg-primary/5"
                    )}
                  >
                    <RadioGroupItem value="best_option" id="best_option" className="sr-only" />
                    <span className="font-medium">Best option for me</span>
                  </Label>
                </RadioGroup>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Return Label / QR Code</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="file">Upload label (PDF, PNG, JPG) *</Label>
                  <div className="mt-2">
                    <label
                      htmlFor="file"
                      className="flex items-center justify-center w-full h-32 border-2 border-dashed rounded-lg cursor-pointer hover:border-primary transition-colors"
                    >
                      <div className="text-center">
                        <Upload className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
                        <p className="text-sm text-muted-foreground">
                          {formData.file ? formData.file.name : "Click to upload or drag and drop"}
                        </p>
                        <p className="text-xs text-muted-foreground mt-1">Max 5MB</p>
                      </div>
                      <input
                        id="file"
                        type="file"
                        className="sr-only"
                        accept=".pdf,.png,.jpg,.jpeg"
                        onChange={handleFileUpload}
                      />
                    </label>
                  </div>
                </div>

                <div className="relative">
                  <div className="absolute inset-0 flex items-center">
                    <span className="w-full border-t" />
                  </div>
                  <div className="relative flex justify-center text-xs uppercase">
                    <span className="bg-card px-2 text-muted-foreground">Or</span>
                  </div>
                </div>

                <div>
                  <Label htmlFor="qrCode">Paste QR / Return Code</Label>
                  <Input
                    id="qrCode"
                    placeholder="e.g., Amazon/Narvar return code"
                    value={formData.qrCode}
                    onChange={(e) => setFormData({ ...formData, qrCode: e.target.value, file: null })}
                    className="mt-2"
                    maxLength={500}
                  />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Services</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="rounded-lg border-2 p-4 bg-muted/20">
                  <div className="space-y-1">
                    <p className="font-medium">I have a box & label</p>
                    <p className="text-sm text-muted-foreground">Cheapest option - no additional fees</p>
                  </div>
                </div>

                <div className="space-y-3">
                  <Label
                    htmlFor="needBox"
                    className={cn(
                      "flex items-start space-x-3 rounded-lg border-2 p-4 cursor-pointer transition-all",
                      formData.needBox && "border-primary bg-primary/5"
                    )}
                  >
                    <Checkbox
                      id="needBox"
                      checked={formData.needBox}
                      onCheckedChange={(checked) => setFormData({ ...formData, needBox: checked as boolean })}
                      className="mt-0.5"
                    />
                    <div className="space-y-1">
                      <p className="font-medium">I need a box</p>
                      <p className="text-sm text-muted-foreground">+$1.50</p>
                    </div>
                  </Label>

                  <Label
                    htmlFor="needPrinting"
                    className={cn(
                      "flex items-start space-x-3 rounded-lg border-2 p-4 cursor-pointer transition-all",
                      formData.needPrinting && "border-primary bg-primary/5"
                    )}
                  >
                    <Checkbox
                      id="needPrinting"
                      checked={formData.needPrinting}
                      onCheckedChange={(checked) => setFormData({ ...formData, needPrinting: checked as boolean })}
                      className="mt-0.5"
                    />
                    <div className="space-y-1">
                      <p className="font-medium">Label printed</p>
                      <p className="text-sm text-muted-foreground">+$0.50</p>
                    </div>
                  </Label>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Timing</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label>Last day to return (from retailer) *</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className={cn(
                          "w-full justify-start text-left font-normal mt-2",
                          !formData.returnDeadline && "text-muted-foreground"
                        )}
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {formData.returnDeadline ? (
                          format(formData.returnDeadline, "PPP")
                        ) : (
                          <span>Pick a date</span>
                        )}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={formData.returnDeadline}
                        onSelect={(date) => setFormData({ ...formData, returnDeadline: date })}
                        disabled={(date) => date < new Date() || date > new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)}
                        initialFocus
                        className="pointer-events-auto"
                      />
                    </PopoverContent>
                  </Popover>
                </div>

                <div>
                  <Label>Pickup window *</Label>
                  <RadioGroup
                    value={formData.pickupWindow}
                    onValueChange={(value) => setFormData({ ...formData, pickupWindow: value })}
                    className="mt-2 space-y-2"
                  >
                    <Label htmlFor="tonight" className="flex items-center space-x-3 cursor-pointer">
                      <RadioGroupItem value="tonight" id="tonight" />
                      <span>Tonight 7–9 PM</span>
                    </Label>
                    <Label htmlFor="tomorrow" className="flex items-center space-x-3 cursor-pointer">
                      <RadioGroupItem value="tomorrow" id="tomorrow" />
                      <span>Tomorrow 7–9 PM</span>
                    </Label>
                    <Label htmlFor="custom" className="flex items-center space-x-3 cursor-pointer">
                      <RadioGroupItem value="custom" id="custom" />
                      <span>Pick a time</span>
                    </Label>
                  </RadioGroup>
                </div>

                <div>
                  <Label htmlFor="notes">Notes for driver (optional)</Label>
                  <Textarea
                    id="notes"
                    placeholder="e.g., Leave with doorman, Ring bell twice"
                    value={formData.notes}
                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                    className="mt-2"
                    rows={3}
                    maxLength={500}
                  />
                </div>

                <div className="flex items-start gap-2 p-3 rounded-lg bg-info/10 border border-info/20">
                  <AlertCircle className="h-4 w-4 text-info mt-0.5 flex-shrink-0" />
                  <p className="text-sm text-info">
                    Lobby or door-to-doorman pickup. High-value items not accepted at launch.
                  </p>
                </div>
              </CardContent>
            </Card>

            <div className="flex gap-3">
              <Button variant="outline" className="flex-1" onClick={() => navigate("/dashboard")}>
                Cancel
              </Button>
              <Button className="flex-1" onClick={handleSubmit} disabled={!isValid()}>
                Review details
              </Button>
            </div>
          </div>

          <div className="lg:col-span-1">
            <EstimateBox
              breakdown={estimate.breakdown}
              total={estimate.total}
              loading={false}
            />
          </div>
        </div>
      </main>
    </div>
  );
}
