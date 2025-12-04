import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useAuth } from "@/hooks/useAuth";
import { getAllPickups } from "@/lib/pickupService";
import { toast } from "sonner";
import { Shield, Package, Users, Clock, MapPin, User } from "lucide-react";
import { format } from "date-fns";

type Pickup = Awaited<ReturnType<typeof getAllPickups>>[number];

export default function AdminDashboard() {
  const { signOut } = useAuth();
  const navigate = useNavigate();
  const [pickups, setPickups] = useState<Pickup[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("all");

  useEffect(() => {
    loadPickups();
  }, [statusFilter]);

  const loadPickups = async () => {
    setLoading(true);
    try {
      const data = await getAllPickups(statusFilter);
      setPickups(data);
    } catch (error) {
      console.error("Failed to load pickups:", error);
      toast.error("Failed to load pickups");
    } finally {
      setLoading(false);
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
      case "best_option": return "Best";
      default: return carrier;
    }
  };

  const stats = {
    total: pickups.length,
    active: pickups.filter(p => ["scheduled", "driver_assigned", "picked_up"].includes(p.status)).length,
    completed: pickups.filter(p => p.status === "completed").length,
    canceled: pickups.filter(p => p.status === "canceled").length,
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
              <h1 className="text-xl font-bold">RETURNEE Admin</h1>
              <p className="text-xs text-muted-foreground">Management Portal</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Link to="/dashboard">
              <Button variant="outline" size="sm">Customer View</Button>
            </Link>
            <Link to="/driver">
              <Button variant="outline" size="sm">Driver View</Button>
            </Link>
            <Button variant="outline" onClick={handleSignOut}>
              Sign out
            </Button>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h2 className="text-3xl font-bold mb-2">Admin Dashboard</h2>
          <p className="text-muted-foreground">
            Manage all pickups and monitor system activity
          </p>
        </div>

        {/* Stats */}
        <div className="grid gap-4 md:grid-cols-4 mb-8">
          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Total Pickups</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold">{stats.total}</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Active</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold text-primary">{stats.active}</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Completed</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold text-success">{stats.completed}</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Canceled</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold text-destructive">{stats.canceled}</p>
            </CardContent>
          </Card>
        </div>

        {/* Filter */}
        <div className="flex items-center gap-4 mb-6">
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[200px]">
              <SelectValue placeholder="Filter by status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Statuses</SelectItem>
              <SelectItem value="scheduled">Scheduled</SelectItem>
              <SelectItem value="driver_assigned">Driver Assigned</SelectItem>
              <SelectItem value="picked_up">Picked Up</SelectItem>
              <SelectItem value="dropped_at_carrier">Dropped at Carrier</SelectItem>
              <SelectItem value="completed">Completed</SelectItem>
              <SelectItem value="canceled">Canceled</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline" onClick={loadPickups}>
            Refresh
          </Button>
        </div>

        {/* Pickups Table */}
        {loading ? (
          <div className="text-center py-12">
            <p className="text-muted-foreground">Loading pickups...</p>
          </div>
        ) : (
          <Card>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-border">
                      <th className="text-left p-4 font-medium text-muted-foreground">Customer</th>
                      <th className="text-left p-4 font-medium text-muted-foreground">Address</th>
                      <th className="text-left p-4 font-medium text-muted-foreground">Carrier</th>
                      <th className="text-left p-4 font-medium text-muted-foreground">Window</th>
                      <th className="text-left p-4 font-medium text-muted-foreground">Driver</th>
                      <th className="text-left p-4 font-medium text-muted-foreground">Status</th>
                      <th className="text-left p-4 font-medium text-muted-foreground">Fee</th>
                    </tr>
                  </thead>
                  <tbody>
                    {pickups.map((pickup) => (
                      <tr key={pickup.id} className="border-b border-border hover:bg-muted/50">
                        <td className="p-4">
                          <div className="flex items-center gap-2">
                            <User className="h-4 w-4 text-muted-foreground" />
                            <span className="font-medium">{pickup.profiles?.name || "—"}</span>
                          </div>
                        </td>
                        <td className="p-4">
                          <span className="text-sm line-clamp-1 max-w-[200px]">
                            {pickup.pickup_address}
                          </span>
                        </td>
                        <td className="p-4">
                          <Badge variant="outline">
                            {getCarrierLabel(pickup.drop_carrier)}
                          </Badge>
                        </td>
                        <td className="p-4">
                          <span className="text-sm">
                            {format(new Date(pickup.window_start), "MMM d, h:mm a")}
                          </span>
                        </td>
                        <td className="p-4">
                          <span className="text-sm">{pickup.driver?.name || "—"}</span>
                        </td>
                        <td className="p-4">
                          <Badge className={getStatusColor(pickup.status)}>
                            {pickup.status.replace(/_/g, " ")}
                          </Badge>
                        </td>
                        <td className="p-4">
                          <span className="font-medium">
                            ${(pickup.estimated_fee_cents / 100).toFixed(2)}
                          </span>
                        </td>
                      </tr>
                    ))}
                    {pickups.length === 0 && (
                      <tr>
                        <td colSpan={7} className="p-8 text-center text-muted-foreground">
                          No pickups found
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        )}
      </main>
    </div>
  );
}
