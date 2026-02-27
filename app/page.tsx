"use client";

import { useState, useCallback } from "react";
import { FileText } from "lucide-react";
import { FileUpload } from "@/components/FileUpload";
import { AnalysisLoader } from "@/components/AnalysisLoader";
import type { LoaderStep } from "@/components/AnalysisLoader";
import { ExportButton } from "@/components/ExportButton";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AnalysisDashboard } from "@/components/dashboard/AnalysisDashboard";
import type { DocumentAnalysis } from "@/types";

type AppState = "idle" | "processing" | "complete" | "error";

export default function Home() {
  const [appState, setAppState] = useState<AppState>("idle");
  const [loaderStep, setLoaderStep] = useState<LoaderStep>("uploading");
  const [analysis, setAnalysis] = useState<DocumentAnalysis | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleUploadStart = useCallback(() => {
    setAppState("processing");
    setLoaderStep("uploading");
    setAnalysis(null);
    setError(null);
  }, []);

  const handleExtractComplete = useCallback(() => {
    setLoaderStep("analyzing");
  }, []);

  const handleAnalysisComplete = useCallback((data: DocumentAnalysis) => {
    setAnalysis(data);
    setAppState("complete");
  }, []);

  const handleError = useCallback((message: string) => {
    setError(message);
    setAppState("error");
  }, []);

  const handleReset = useCallback(() => {
    setAppState("idle");
    setLoaderStep("uploading");
    setAnalysis(null);
    setError(null);
  }, []);

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border">
        <div className="mx-auto flex max-w-5xl items-center gap-3 px-4 py-4">
          <FileText className="h-6 w-6 text-primary" />
          <h1 className="text-xl font-semibold">AI Document Analyzer</h1>
        </div>
      </header>

      <main
        className={`mx-auto px-4 py-8 ${
          appState === "complete" ? "max-w-7xl" : "max-w-5xl"
        }`}
      >
        {appState === "idle" && (
          <div className="mx-auto max-w-xl">
            <div className="mb-6 text-center">
              <h2 className="text-2xl font-semibold tracking-tight">
                Analyze your documents
              </h2>
              <p className="mt-2 text-muted-foreground">
                Upload a PDF to extract structured data — summaries, entities,
                dates, financials, and more.
              </p>
            </div>
            <FileUpload
              onUploadStart={handleUploadStart}
              onExtractComplete={handleExtractComplete}
              onAnalysisComplete={handleAnalysisComplete}
              onError={handleError}
            />
          </div>
        )}

        {appState === "processing" && (
          <div className="mx-auto max-w-md">
            <AnalysisLoader step={loaderStep} />
          </div>
        )}

        {appState === "error" && (
          <div className="mx-auto max-w-xl space-y-4">
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
            <FileUpload
              onUploadStart={handleUploadStart}
              onExtractComplete={handleExtractComplete}
              onAnalysisComplete={handleAnalysisComplete}
              onError={handleError}
            />
          </div>
        )}

        {appState === "complete" && analysis && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-semibold tracking-tight">
                Analysis Results
              </h2>
              <div className="flex gap-2">
                <ExportButton data={analysis} />
                <Button variant="outline" onClick={handleReset}>
                  Analyze Another
                </Button>
              </div>
            </div>

            <AnalysisDashboard data={analysis} />
          </div>
        )}
      </main>
    </div>
  );
}
