import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/hooks/useAuth";
import { getDriverPickups, getAvailablePickups, claimPickup } from "@/lib/pickupService";
import { toast } from "sonner";
import { Truck, Package, MapPin, Clock, User } from "lucide-react";
import { format } from "date-fns";

type Pickup = Awaited<ReturnType<typeof getDriverPickups>>[number];

export default function DriverDashboard() {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const [myPickups, setMyPickups] = useState<Pickup[]>([]);
  const [availablePickups, setAvailablePickups] = useState<Pickup[]>([]);
  const [loading, setLoading] = useState(true);
  const [claiming, setClaiming] = useState<string | null>(null);

  useEffect(() => {
    loadPickups();
  }, [user]);

  const loadPickups = async () => {
    if (!user) return;
    try {
      const [mine, available] = await Promise.all([
        getDriverPickups(user.id),
        getAvailablePickups(),
      ]);
      setMyPickups(mine);
      setAvailablePickups(available);
    } catch (error) {
      console.error("Failed to load pickups:", error);
      toast.error("Failed to load pickups");
    } finally {
      setLoading(false);
    }
  };

  const handleClaim = async (pickupId: string) => {
    if (!user) return;
    setClaiming(pickupId);
    try {
      await claimPickup(pickupId, user.id);
      toast.success("Pickup claimed successfully");
      loadPickups();
    } catch (error) {
      console.error("Failed to claim pickup:", error);
      toast.error("Failed to claim pickup");
    } finally {
      setClaiming(null);
    }
  };

  const handleSignOut = async () => {
    await signOut();
    navigate("/");
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "scheduled":
        return "bg-info/20 text-info";
      case "driver_assigned":
        return "bg-warning/20 text-warning";
      case "picked_up":
        return "bg-primary/20 text-primary";
      default:
        return "bg-muted text-muted-foreground";
    }
  };

  const getCarrierLabel = (carrier: string) => {
    switch (carrier) {
      case "ups": return "UPS";
      case "fedex": return "FedEx";
      case "usps": return "USPS";
      case "best_option": return "Best Option";
      default: return carrier;
    }
  };

  return (
    <div className="min-h-screen">
      <header className="border-b border-border">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-gradient-primary flex items-center justify-center">
              <Truck className="h-5 w-5 text-primary-foreground" />
            </div>
            <div>
              <h1 className="text-xl font-bold">RETURNEE Driver</h1>
              <p className="text-xs text-muted-foreground">Driver Portal</p>
            </div>
          </div>
          <Button variant="outline" onClick={handleSignOut}>
            Sign out
          </Button>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h2 className="text-3xl font-bold mb-2">My Pickups</h2>
          <p className="text-muted-foreground">
            Manage your assigned pickups and claim new ones
          </p>
        </div>

        <div className="grid gap-6 md:grid-cols-2 mb-8">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Package className="h-5 w-5 text-primary" />
                Assigned
              </CardTitle>
              <CardDescription>Your current pickups</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold">{myPickups.length}</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MapPin className="h-5 w-5 text-warning" />
                Available
              </CardTitle>
              <CardDescription>Ready to claim</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold">{availablePickups.length}</p>
            </CardContent>
          </Card>
        </div>

        {loading ? (
          <div className="text-center py-12">
            <p className="text-muted-foreground">Loading pickups...</p>
          </div>
        ) : (
          <>
            {/* My Pickups */}
            {myPickups.length > 0 && (
              <div className="mb-8">
                <h3 className="text-xl font-semibold mb-4">My Assigned Pickups</h3>
                <div className="grid gap-4 md:grid-cols-2">
                  {myPickups.map((pickup) => (
                    <Card key={pickup.id} className="hover:border-primary/50 transition-colors">
                      <CardContent className="pt-6">
                        <div className="flex items-start justify-between mb-4">
                          <div className="flex items-center gap-2">
                            <User className="h-4 w-4 text-muted-foreground" />
                            <span className="font-medium">
                              {(pickup.profiles as any)?.name || "Customer"}
                            </span>
                          </div>
                          <Badge className={getStatusColor(pickup.status)}>
                            {pickup.status.replace("_", " ")}
                          </Badge>
                        </div>
                        
                        <div className="space-y-2 text-sm">
                          <div className="flex items-start gap-2">
                            <MapPin className="h-4 w-4 text-muted-foreground mt-0.5" />
                            <span className="line-clamp-2">{pickup.pickup_address}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Clock className="h-4 w-4 text-muted-foreground" />
                            <span>
                              {format(new Date(pickup.window_start), "MMM d, h:mm a")} - 
                              {format(new Date(pickup.window_end), "h:mm a")}
                            </span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Package className="h-4 w-4 text-muted-foreground" />
                            <span>Drop at: {getCarrierLabel(pickup.drop_carrier)}</span>
                          </div>
                        </div>

                        <div className="mt-4">
                          <Link to={`/driver/pickup/${pickup.id}`}>
                            <Button className="w-full">Open Route</Button>
                          </Link>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            )}

            {/* Available Pickups */}
            {availablePickups.length > 0 && (
              <div className="mb-8">
                <h3 className="text-xl font-semibold mb-4">Available Pickups</h3>
                <div className="grid gap-4 md:grid-cols-2">
                  {availablePickups.map((pickup) => (
                    <Card key={pickup.id} className="border-dashed">
                      <CardContent className="pt-6">
                        <div className="flex items-start justify-between mb-4">
                          <div className="flex items-center gap-2">
                            <User className="h-4 w-4 text-muted-foreground" />
                            <span className="font-medium">
                              {(pickup.profiles as any)?.name || "Customer"}
                            </span>
                          </div>
                          <Badge variant="outline">Available</Badge>
                        </div>
                        
                        <div className="space-y-2 text-sm">
                          <div className="flex items-start gap-2">
                            <MapPin className="h-4 w-4 text-muted-foreground mt-0.5" />
                            <span className="line-clamp-2">{pickup.pickup_address}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Clock className="h-4 w-4 text-muted-foreground" />
                            <span>
                              {format(new Date(pickup.window_start), "MMM d, h:mm a")} - 
                              {format(new Date(pickup.window_end), "h:mm a")}
                            </span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Package className="h-4 w-4 text-muted-foreground" />
                            <span>Drop at: {getCarrierLabel(pickup.drop_carrier)}</span>
                          </div>
                          <div className="text-primary font-medium">
                            ${(pickup.estimated_fee_cents / 100).toFixed(2)} fee
                          </div>
                        </div>

                        <div className="mt-4">
                          <Button 
                            className="w-full" 
                            variant="outline"
                            onClick={() => handleClaim(pickup.id)}
                            disabled={claiming === pickup.id}
                          >
                            {claiming === pickup.id ? "Claiming..." : "Claim Pickup"}
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            )}

            {myPickups.length === 0 && availablePickups.length === 0 && (
              <Card className="text-center py-12">
                <CardContent>
                  <Truck className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                  <h3 className="text-xl font-semibold mb-2">No pickups available</h3>
                  <p className="text-muted-foreground">
                    Check back later for new pickup opportunities
                  </p>
                </CardContent>
              </Card>
            )}
          </>
        )}
      </main>
    </div>
  );
}
