import { cn } from "@/lib/utils";
import { PickupStatus } from "@/types/pickup";

const statusConfig: Record<PickupStatus, { label: string; className: string }> = {
  scheduled: {
    label: "Scheduled",
    className: "bg-info/10 text-info border-info/20",
  },
  assigned: {
    label: "Driver on the way",
    className: "bg-warning/10 text-warning border-warning/20",
  },
  pickedUp: {
    label: "Picked up",
    className: "bg-primary/10 text-primary border-primary/20",
  },
  dropped: {
    label: "Dropped at carrier",
    className: "bg-accent/10 text-accent border-accent/20",
  },
  completed: {
    label: "Completed",
    className: "bg-success/10 text-success border-success/20",
  },
  cancelled: {
    label: "Cancelled",
    className: "bg-muted text-muted-foreground border-border",
  },
};

interface StatusChipProps {
  status: PickupStatus;
  className?: string;
}

export const StatusChip = ({ status, className }: StatusChipProps) => {
  const config = statusConfig[status];
  
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full border px-3 py-1 text-xs font-medium",
        config.className,
        className
      )}
    >
      {config.label}
    </span>
  );
};
