"use client";

import { Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { DocumentAnalysis } from "@/types";

interface ExportButtonProps {
  readonly data: DocumentAnalysis | null;
}

export function ExportButton({ data }: ExportButtonProps) {
  function handleExport() {
    if (!data) return;

    try {
      const json = JSON.stringify(data, null, 2);
      const blob = new Blob([json], { type: "application/json" });
      const url = URL.createObjectURL(blob);

      const timestamp = new Date()
        .toISOString()
        .slice(0, 19)
        .replace(/:/g, "-");
      const anchor = document.createElement("a");
      anchor.href = url;
      anchor.download = `analysis-${timestamp}.json`;
      anchor.click();

      URL.revokeObjectURL(url);
    } catch {
      // Silently fail — export is a non-critical action
    }
  }

  return (
    <Button
      variant="outline"
      onClick={handleExport}
      disabled={data === null}
    >
      <Download className="mr-2 h-4 w-4" />
      Export JSON
    </Button>
  );
}
