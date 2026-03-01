import { DollarSign } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { FinancialCategory, FinancialItem } from "@/types";

interface FinancialItemsProps {
  readonly items: FinancialItem[];
}

const categoryColors: Record<FinancialCategory, { container: string; amount: string }> = {
  payment: {
    container: "text-green-700 dark:text-green-400",
    amount: "text-green-700 dark:text-green-400",
  },
  penalty: {
    container: "text-red-700 dark:text-red-400",
    amount: "text-red-700 dark:text-red-400",
  },
  total: {
    container: "text-foreground",
    amount: "font-bold text-foreground",
  },
  discount: {
    container: "text-purple-700 dark:text-purple-400",
    amount: "text-purple-700 dark:text-purple-400",
  },
};

const currencySymbols: Record<string, string> = {
  USD: "$",
  EUR: "€",
  GBP: "£",
  JPY: "¥",
  CAD: "$",
  AUD: "$",
};

function formatCurrency(amount: number, currency: string): string {
  const symbol = currencySymbols[currency] || currency;
  const formatted = new Intl.NumberFormat("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
  return `${symbol}${formatted}`;
}

export function FinancialItems({ items }: FinancialItemsProps) {
  return (
    <Card className="col-span-1">
      <CardHeader>
        <CardTitle className="text-base">Financial Items</CardTitle>
      </CardHeader>
      <CardContent>
        {items.length === 0 ? (
          <p className="text-sm text-muted-foreground">No financial items</p>
        ) : (
          <div className="space-y-2">
            {items.map((item) => (
              <div
                key={`${item.description}-${item.amount}-${item.currency}`}
                className={`flex items-center justify-between rounded-md border border-border px-3 py-2 ${categoryColors[item.category].container}`}
              >
                <div className="flex items-center gap-2">
                  <DollarSign className="h-4 w-4" />
                  <span className="text-sm font-medium">{item.description}</span>
                </div>
                <span className={`text-sm ${categoryColors[item.category].amount}`}>
                  {formatCurrency(item.amount, item.currency)}
                </span>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
