import { CircleCheck } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface ActionItemsProps {
  readonly items: string[];
}

export function ActionItems({ items }: ActionItemsProps) {
  return (
    <Card className="col-span-1">
      <CardHeader>
        <CardTitle className="text-base">Action Items</CardTitle>
      </CardHeader>
      <CardContent>
        {items.length === 0 ? (
          <p className="text-sm text-muted-foreground">No action items</p>
        ) : (
          <ul className="space-y-2">
            {items.map((item) => (
              <li key={item} className="flex items-start gap-3">
                <CircleCheck className="mt-0.5 h-4 w-4 flex-shrink-0 text-green-600 dark:text-green-400" />
                <span className="text-sm text-foreground">{item}</span>
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}
