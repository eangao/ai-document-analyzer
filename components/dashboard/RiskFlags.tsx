import { AlertTriangle } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { RiskFlag, RiskSeverity } from "@/types";

interface RiskFlagsProps {
  readonly risks: RiskFlag[];
}

const severityStyles: Record<RiskSeverity, string> = {
  high: "border-red-500 bg-red-50 dark:bg-red-950",
  medium: "border-yellow-500 bg-yellow-50 dark:bg-yellow-950",
  low: "border-blue-500 bg-blue-50 dark:bg-blue-950",
};

const severityIconColors: Record<RiskSeverity, string> = {
  high: "text-red-600 dark:text-red-400",
  medium: "text-yellow-600 dark:text-yellow-400",
  low: "text-blue-600 dark:text-blue-400",
};

export function RiskFlags({ risks }: RiskFlagsProps) {
  return (
    <Card className="col-span-1">
      <CardHeader>
        <CardTitle className="text-base">Risk Flags</CardTitle>
      </CardHeader>
      <CardContent>
        {risks.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            No risk flags identified
          </p>
        ) : (
          <div className="space-y-3">
            {risks.map((risk) => (
              <Alert key={`${risk.title}-${risk.severity}`} className={severityStyles[risk.severity]}>
                <AlertTriangle className={`h-4 w-4 ${severityIconColors[risk.severity]}`} />
                <AlertTitle className="font-semibold">{risk.title}</AlertTitle>
                <AlertDescription className="mt-1 text-sm">
                  {risk.description}
                </AlertDescription>
              </Alert>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
