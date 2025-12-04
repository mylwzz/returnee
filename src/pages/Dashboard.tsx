import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/hooks/useAuth";
import { getCustomerPickups } from "@/lib/pickupService";
import { Plus, Package, Clock, CheckCircle2, MapPin } from "lucide-react";
import { format } from "date-fns";

type Pickup = Awaited<ReturnType<typeof getCustomerPickups>>[number];

export default function Dashboard() {
  const { user, role, signOut } = useAuth();
  const navigate = useNavigate();
  const [pickups, setPickups] = useState<Pickup[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      loadPickups();
    }
  }, [user]);

  const loadPickups = async () => {
    if (!user) return;
    try {
      const data = await getCustomerPickups(user.id);
      setPickups(data);
    } catch (error) {
      console.error("Failed to load pickups:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSignOut = async () => {
    await signOut();
    navigate("/");
  };

  const activePickups = pickups.filter((p) =>
    ["scheduled", "driver_assigned", "picked_up", "dropped_at_carrier"].includes(p.status)
  );
  const pastPickups = pickups.filter((p) => ["completed", "canceled"].includes(p.status));

  const getStatusColor = (status: string) => {
    switch (status) {
      case "scheduled":
        return "bg-info/20 text-info";
      case "driver_assigned":
        return "bg-warning/20 text-warning";
      case "picked_up":
        return "bg-primary/20 text-primary";
      case "dropped_at_carrier":
      case "completed":
        return "bg-success/20 text-success";
      case "canceled":
        return "bg-destructive/20 text-destructive";
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
              <Package className="h-5 w-5 text-primary-foreground" />
            </div>
            <h1 className="text-2xl font-bold">RETURNEE</h1>
          </div>
          <div className="flex items-center gap-2">
            {role === "admin" && (
              <Link to="/admin">
                <Button variant="outline" size="sm">Admin</Button>
              </Link>
            )}
            <Button variant="outline" onClick={handleSignOut}>
              Sign out
            </Button>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h2 className="text-3xl font-bold mb-2">My Returns</h2>
          <p className="text-muted-foreground">
            Manage your pickups and track your returns
          </p>
        </div>

        <div className="grid gap-6 md:grid-cols-3 mb-8">
          <Link to="/schedule">
            <Card className="hover:border-primary transition-all cursor-pointer h-full shadow-glow">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Plus className="h-5 w-5 text-primary" />
                  Book a pickup
                </CardTitle>
                <CardDescription>Schedule a new return pickup</CardDescription>
              </CardHeader>
              <CardContent>
                <Button className="w-full">Get started</Button>
              </CardContent>
            </Card>
          </Link>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="h-5 w-5 text-warning" />
                Active pickups
              </CardTitle>
              <CardDescription>Currently in progress</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold">{activePickups.length}</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CheckCircle2 className="h-5 w-5 text-success" />
                Past pickups
              </CardTitle>
              <CardDescription>Completed returns</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold">{pastPickups.length}</p>
            </CardContent>
          </Card>
        </div>

        {loading ? (
          <div className="text-center py-12">
            <p className="text-muted-foreground">Loading your pickups...</p>
          </div>
        ) : (
          <>
            {activePickups.length > 0 && (
              <div className="mb-8">
                <h3 className="text-xl font-semibold mb-4">Active Pickups</h3>
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                  {activePickups.map((pickup) => (
                    <Link key={pickup.id} to={`/pickup/${pickup.id}`}>
                      <Card className="hover:border-primary/50 transition-colors h-full">
                        <CardContent className="pt-6">
                          <div className="flex items-start justify-between mb-4">
                            <Badge className={getStatusColor(pickup.status)}>
                              {pickup.status.replace(/_/g, " ")}
                            </Badge>
                            <span className="text-sm text-muted-foreground">
                              ${(pickup.estimated_fee_cents / 100).toFixed(2)}
                            </span>
                          </div>
                          <div className="space-y-2">
                            <div className="flex items-start gap-2">
                              <MapPin className="h-4 w-4 text-muted-foreground mt-0.5" />
                              <span className="text-sm line-clamp-2">{pickup.pickup_address}</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <Clock className="h-4 w-4 text-muted-foreground" />
                              <span className="text-sm">
                                {format(new Date(pickup.window_start), "MMM d, h:mm a")}
                              </span>
                            </div>
                            <div className="flex items-center gap-2">
                              <Package className="h-4 w-4 text-muted-foreground" />
                              <span className="text-sm">{getCarrierLabel(pickup.drop_carrier)}</span>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    </Link>
                  ))}
                </div>
              </div>
            )}

            {pastPickups.length > 0 && (
              <div>
                <h3 className="text-xl font-semibold mb-4">Past Pickups</h3>
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                  {pastPickups.map((pickup) => (
                    <Link key={pickup.id} to={`/pickup/${pickup.id}/receipt`}>
                      <Card className="hover:border-primary/50 transition-colors h-full opacity-75">
                        <CardContent className="pt-6">
                          <div className="flex items-start justify-between mb-4">
                            <Badge className={getStatusColor(pickup.status)}>
                              {pickup.status.replace(/_/g, " ")}
                            </Badge>
                            <span className="text-sm text-muted-foreground">
                              ${(pickup.estimated_fee_cents / 100).toFixed(2)}
                            </span>
                          </div>
                          <div className="space-y-2">
                            <div className="flex items-start gap-2">
                              <MapPin className="h-4 w-4 text-muted-foreground mt-0.5" />
                              <span className="text-sm line-clamp-2">{pickup.pickup_address}</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <Clock className="h-4 w-4 text-muted-foreground" />
                              <span className="text-sm">
                                {format(new Date(pickup.window_start), "MMM d, h:mm a")}
                              </span>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    </Link>
                  ))}
                </div>
              </div>
            )}

            {pickups.length === 0 && (
              <Card className="text-center py-12">
                <CardContent>
                  <Package className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                  <h3 className="text-xl font-semibold mb-2">No pickups yet</h3>
                  <p className="text-muted-foreground mb-4">
                    Schedule your first pickup to get started
                  </p>
                  <Link to="/schedule">
                    <Button>Book your first pickup</Button>
                  </Link>
                </CardContent>
              </Card>
            )}
          </>
        )}
      </main>
    </div>
  );
}
