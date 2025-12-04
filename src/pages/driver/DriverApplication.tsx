import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Check, Loader2, Shield, Car, Navigation, Camera, Package, CheckCircle2 } from "lucide-react";

type Stage = "form" | "verifying" | "approved";

const workflow = [
  {
    title: "Claim a pickup",
    icon: Navigation,
    detail: "See nearby requests and tap Claim to lock in a route.",
  },
  {
    title: "Arrive & scan",
    icon: Camera,
    detail: "Take a quick photo at pickup and confirm QR/label.",
  },
  {
    title: "Drop at carrier",
    icon: Package,
    detail: "Hand off at UPS/FedEx/USPS and snap a drop photo.",
  },
  {
    title: "Complete & payout",
    icon: CheckCircle2,
    detail: "Mark complete, customer notified, payout released.",
  },
];

export default function DriverApplication() {
  const navigate = useNavigate();
  const [stage, setStage] = useState<Stage>("form");
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    vehicle: "Car / SUV",
    experience: "",
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setStage("verifying");
    // Mock verification pass-through
    setTimeout(() => {
      setStage("approved");
      setLoading(false);
    }, 800);
  };

  const skipVerification = () => {
    setStage("approved");
    setLoading(false);
  };

  return (
    <div className="min-h-screen">
      <header className="border-b border-border">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-gradient-primary flex items-center justify-center">
              <Shield className="h-5 w-5 text-primary-foreground" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Driver onboarding</p>
              <h1 className="text-xl font-bold">Apply to drive with RETURNEE</h1>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Link to="/">
              <Button variant="outline" size="sm">Back to signup</Button>
            </Link>
            <Button variant="outline" size="sm" onClick={() => navigate("/driver")}>
              Driver dashboard
            </Button>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 space-y-8">
        <div className="grid gap-6 lg:grid-cols-5">
          <div className="lg:col-span-3">
            <Card>
              <CardHeader>
                <CardTitle>Tell us about you</CardTitle>
                <CardDescription>Quick form — we’ll “verify” instantly for demo.</CardDescription>
              </CardHeader>
              <CardContent>
                <form className="space-y-4" onSubmit={handleSubmit}>
                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="name">Full name</Label>
                      <Input
                        id="name"
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="email">Email</Label>
                      <Input
                        id="email"
                        type="email"
                        value={formData.email}
                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="phone">Phone</Label>
                      <Input
                        id="phone"
                        value={formData.phone}
                        onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                        placeholder="(555) 123-4567"
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="vehicle">Vehicle</Label>
                      <Input
                        id="vehicle"
                        value={formData.vehicle}
                        onChange={(e) => setFormData({ ...formData, vehicle: e.target.value })}
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="experience">Delivery experience (optional)</Label>
                    <Textarea
                      id="experience"
                      rows={3}
                      placeholder="e.g., 2 years with last-mile carriers"
                      value={formData.experience}
                      onChange={(e) => setFormData({ ...formData, experience: e.target.value })}
                    />
                  </div>

                  <div className="flex items-center gap-3 flex-wrap">
                    <Badge variant="outline" className="gap-2">
                      <Car className="h-4 w-4" /> License check
                    </Badge>
                    <Badge variant="outline" className="gap-2">
                      <Camera className="h-4 w-4" /> ID scan
                    </Badge>
                    <Badge variant="outline" className="gap-2">
                      <Shield className="h-4 w-4" /> Insurance proof
                    </Badge>
                  </div>

                  <div className="flex gap-3 pt-2">
                    <Button type="submit" className="flex-1" disabled={loading || stage === "verifying"}>
                      {loading || stage === "verifying" ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Verifying...
                        </>
                      ) : (
                        "Submit & verify"
                      )}
                    </Button>
                    <Button type="button" variant="ghost" onClick={skipVerification}>
                      Skip for now
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          </div>

          <div className="lg:col-span-2 space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Verification status</CardTitle>
                <CardDescription>Front-end only for this demo.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {stage === "form" && (
                  <p className="text-sm text-muted-foreground">
                    Submit the form to “run” checks, or skip to jump into the workflow.
                  </p>
                )}
                {stage === "verifying" && (
                  <div className="flex items-center gap-3">
                    <Loader2 className="h-5 w-5 animate-spin text-primary" />
                    <p className="text-sm">Running instant checks...</p>
                  </div>
                )}
                {stage === "approved" && (
                  <div className="space-y-3">
                    <div className="flex items-center gap-2 text-success">
                      <Check className="h-4 w-4" />
                      <p className="font-medium">Approved for demo mode</p>
                    </div>
                    <Button className="w-full" onClick={() => navigate("/driver")}>
                      Open driver dashboard
                    </Button>
                    <Button variant="outline" className="w-full" onClick={() => {
                      const el = document.getElementById("workflow");
                      if (el) el.scrollIntoView({ behavior: "smooth" });
                      else navigate("/driver");
                    }}>
                      View workflow
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Quick links</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <Button variant="outline" className="w-full" onClick={() => navigate("/driver")}>
                  Go to driver portal
                </Button>
                <Button variant="outline" className="w-full" onClick={() => navigate("/driver/pickup/demo")}>
                  Open a sample pickup
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>

        <Card id="workflow">
          <CardHeader>
            <CardTitle>Driver workflow</CardTitle>
            <CardDescription>What it looks like to pick up and drop off a return.</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4 md:grid-cols-4">
            {workflow.map((step) => (
              <div key={step.title} className="p-4 rounded-lg border bg-card/30 space-y-3">
                <step.icon className="h-5 w-5 text-primary" />
                <div className="space-y-1">
                  <p className="font-semibold">{step.title}</p>
                  <p className="text-sm text-muted-foreground">{step.detail}</p>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
