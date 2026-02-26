"use client";

import { Loader2, CheckCircle2, Circle } from "lucide-react";

export type LoaderStep = "uploading" | "extracting" | "analyzing";

interface AnalysisLoaderProps {
  readonly step: LoaderStep;
}

const STEPS: readonly { readonly key: LoaderStep; readonly label: string }[] = [
  { key: "uploading", label: "Uploading PDF..." },
  { key: "extracting", label: "Extracting text..." },
  { key: "analyzing", label: "Analyzing document..." },
];

function getStepStatus(
  currentStep: LoaderStep,
  stepKey: LoaderStep
): "complete" | "active" | "pending" {
  const currentIndex = STEPS.findIndex((s) => s.key === currentStep);
  const stepIndex = STEPS.findIndex((s) => s.key === stepKey);

  if (stepIndex < currentIndex) return "complete";
  if (stepIndex === currentIndex) return "active";
  return "pending";
}

export function AnalysisLoader({ step }: AnalysisLoaderProps) {
  return (
    <div role="status" className="flex flex-col gap-4 py-8">
      {STEPS.map((s) => {
        const status = getStepStatus(step, s.key);

        return (
          <div
            key={s.key}
            data-testid={`step-${status}`}
            className="flex items-center gap-3"
          >
            {status === "complete" && (
              <CheckCircle2 className="h-5 w-5 text-green-500" />
            )}
            {status === "active" && (
              <Loader2 className="h-5 w-5 animate-spin text-blue-500" />
            )}
            {status === "pending" && (
              <Circle className="h-5 w-5 text-muted-foreground" />
            )}
            <span
              className={
                status === "active"
                  ? "font-medium text-foreground"
                  : status === "complete"
                    ? "text-muted-foreground line-through"
                    : "text-muted-foreground"
              }
            >
              {s.label}
            </span>
          </div>
        );
      })}
    </div>
  );
}
