import { Card, CardContent, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type { DocumentType } from "@/types";

interface SummaryCardProps {
  readonly documentType: DocumentType;
  readonly summary: string;
}

const documentTypeColors: Record<DocumentType, string> = {
  contract: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200",
  invoice: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
  report: "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200",
  letter: "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200",
  legal: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200",
  financial: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200",
  other: "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200",
};

export function SummaryCard({ documentType, summary }: SummaryCardProps) {
  const badgeClass = documentTypeColors[documentType];

  return (
    <Card className="col-span-1">
      <CardContent className="pt-6">
        <div className="mb-4 flex items-center justify-between">
          <CardDescription className="text-sm font-semibold">
            Document Type
          </CardDescription>
          <Badge className={badgeClass}>{documentType}</Badge>
        </div>
        <div className="mt-4">
          <h3 className="font-semibold text-foreground">Summary</h3>
          <p className="mt-2 text-sm text-muted-foreground">{summary}</p>
        </div>
      </CardContent>
    </Card>
  );
}
