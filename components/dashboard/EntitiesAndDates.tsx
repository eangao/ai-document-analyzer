"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Info } from "lucide-react";
import type { Entity, KeyDate, RiskSeverity } from "@/types";

interface EntitiesAndDatesProps {
  readonly entities: Entity[];
  readonly dates: KeyDate[];
}

const importanceBadgeColors: Record<RiskSeverity, string> = {
  high: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200",
  medium: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200",
  low: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200",
};

export function EntitiesAndDates({
  entities,
  dates,
}: EntitiesAndDatesProps) {
  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Entities</CardTitle>
        </CardHeader>
        <CardContent>
          {entities.length === 0 ? (
            <p className="text-sm text-muted-foreground">No entities found</p>
          ) : (
            <ul className="space-y-3">
              {entities.map((entity) => (
                <li
                  key={entity.name}
                  className="border-l-2 border-muted pl-4"
                >
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex-1">
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <div className="flex items-center gap-2">
                            <p className="font-semibold text-foreground">
                              {entity.name}
                            </p>
                            <Info className="h-3 w-3 text-muted-foreground" />
                          </div>
                        </TooltipTrigger>
                        <TooltipContent>{entity.context}</TooltipContent>
                      </Tooltip>
                      <p className="mt-1 text-xs text-muted-foreground">
                        {entity.type}
                      </p>
                    </div>
                    <Badge variant="outline" className="text-xs">
                      {Math.round(entity.confidence * 100)}%
                    </Badge>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Key Dates</CardTitle>
        </CardHeader>
        <CardContent>
          {dates.length === 0 ? (
            <p className="text-sm text-muted-foreground">No key dates found</p>
          ) : (
            <ul className="space-y-3">
              {dates.map((date) => (
                <li
                  key={date.date}
                  className="border-l-2 border-muted pl-4"
                >
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex-1">
                      <p className="font-semibold text-foreground">
                        {date.date}
                      </p>
                      <p className="mt-1 text-sm text-muted-foreground">
                        {date.description}
                      </p>
                    </div>
                    <Badge
                      className={importanceBadgeColors[date.importance]}
                    >
                      {date.importance}
                    </Badge>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
