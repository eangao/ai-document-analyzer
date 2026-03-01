import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableHeader,
  TableBody,
  TableHead,
  TableRow,
  TableCell,
} from "@/components/ui/table";
import type { Obligation, ObligationStatus } from "@/types";

interface ObligationsTableProps {
  readonly obligations: Obligation[];
}

const statusColors: Record<ObligationStatus, string> = {
  active: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200",
  pending: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200",
  completed: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
  overdue: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200",
};

export function ObligationsTable({ obligations }: ObligationsTableProps) {
  if (obligations.length === 0) {
    return (
      <Card className="col-span-1 md:col-span-2">
        <CardHeader>
          <CardTitle className="text-base">Obligations</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">No obligations</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="col-span-1 md:col-span-2">
      <CardHeader>
        <CardTitle className="text-base">Obligations</CardTitle>
      </CardHeader>
      <CardContent>
        {/* Desktop table view */}
        <div className="hidden overflow-x-auto md:block">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Party</TableHead>
                <TableHead>Description</TableHead>
                <TableHead>Deadline</TableHead>
                <TableHead className="text-right">Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {obligations.map((obligation) => (
                <TableRow key={`${obligation.party}-${obligation.deadline}-${obligation.description}`}>
                  <TableCell className="font-medium">
                    {obligation.party}
                  </TableCell>
                  <TableCell className="text-sm">
                    {obligation.description}
                  </TableCell>
                  <TableCell className="text-sm">
                    {obligation.deadline}
                  </TableCell>
                  <TableCell className="text-right">
                    <Badge className={statusColors[obligation.status]}>
                      {obligation.status}
                    </Badge>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>

        {/* Mobile card view */}
        <div className="space-y-3 md:hidden">
          {obligations.map((obligation) => (
            <div
              key={`${obligation.party}-${obligation.deadline}-${obligation.description}`}
              className="border border-border rounded-md p-3"
            >
              <div className="flex items-start justify-between gap-2 mb-2">
                <p className="font-semibold text-foreground">
                  {obligation.party}
                </p>
                <Badge className={statusColors[obligation.status]}>
                  {obligation.status}
                </Badge>
              </div>
              <p className="text-sm text-muted-foreground mb-2">
                {obligation.description}
              </p>
              <p className="text-xs text-muted-foreground">
                Due: {obligation.deadline}
              </p>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
