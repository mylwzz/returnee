import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { DollarSign } from "lucide-react";

interface EstimateBoxProps {
  breakdown: {
    base: number;
    printLabel: number;
    box: number;
  };
  total: number;
  loading?: boolean;
}

export const EstimateBox = ({ breakdown, total, loading }: EstimateBoxProps) => {
  return (
    <Card className="sticky top-6 shadow-elegant">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <DollarSign className="h-5 w-5 text-primary" />
          Estimated Fee
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {loading ? (
          <div className="space-y-2">
            <div className="h-4 bg-muted animate-pulse rounded" />
            <div className="h-4 bg-muted animate-pulse rounded w-3/4" />
          </div>
        ) : (
          <>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Base pickup</span>
                <span>${breakdown.base.toFixed(2)}</span>
              </div>
              {breakdown.printLabel > 0 && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Label printing</span>
                  <span>${breakdown.printLabel.toFixed(2)}</span>
                </div>
              )}
              {breakdown.box > 0 && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Box provided</span>
                  <span>${breakdown.box.toFixed(2)}</span>
                </div>
              )}
            </div>
            <Separator />
            <div className="flex justify-between items-center">
              <span className="font-semibold">Total</span>
              <span className="text-2xl font-bold text-primary">${total.toFixed(2)}</span>
            </div>
            <p className="text-xs text-muted-foreground">
              Final price confirmed when driver accepts
            </p>
          </>
        )}
      </CardContent>
    </Card>
  );
};
