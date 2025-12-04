import { Link } from "react-router-dom";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { StatusChip } from "./StatusChip";
import { Pickup } from "@/types/pickup";
import { format } from "date-fns";
import { MapPin, Calendar, DollarSign } from "lucide-react";

interface PickupCardProps {
  pickup: Pickup;
}

export const PickupCard = ({ pickup }: PickupCardProps) => {
  const isActive = ["scheduled", "assigned", "pickedUp", "dropped"].includes(pickup.status);
  
  return (
    <Link to={isActive ? `/pickup/${pickup.id}` : `/pickup/${pickup.id}/receipt`}>
      <Card className="hover:border-primary/50 transition-all cursor-pointer">
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Pickup #{pickup.id}</p>
              <p className="text-xs text-muted-foreground mt-1">
                {format(new Date(pickup.createdAt), "MMM d, yyyy")}
              </p>
            </div>
            <StatusChip status={pickup.status} />
          </div>
        </CardHeader>
        <CardContent className="space-y-2">
          <div className="flex items-start gap-2">
            <MapPin className="h-4 w-4 text-muted-foreground mt-0.5" />
            <p className="text-sm">{pickup.pickupAddress}</p>
          </div>
          <div className="flex items-center gap-2">
            <Calendar className="h-4 w-4 text-muted-foreground" />
            <p className="text-sm text-muted-foreground">
              {format(new Date(pickup.windowStart), "MMM d, h:mm a")} -{" "}
              {format(new Date(pickup.windowEnd), "h:mm a")}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <DollarSign className="h-4 w-4 text-muted-foreground" />
            <p className="text-sm text-muted-foreground">${pickup.estFee.toFixed(2)}</p>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
};
