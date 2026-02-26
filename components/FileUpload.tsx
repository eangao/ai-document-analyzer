"use client";

import { useCallback, useRef, useState } from "react";
import { Upload } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import type { DocumentAnalysis } from "@/types";

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
const ACCEPTED_TYPE = "application/pdf";

interface FileUploadProps {
  readonly onUploadStart: () => void;
  readonly onExtractComplete: () => void;
  readonly onAnalysisComplete: (data: DocumentAnalysis) => void;
  readonly onError: (message: string) => void;
  readonly disabled?: boolean;
}

export function FileUpload({
  onUploadStart,
  onExtractComplete,
  onAnalysisComplete,
  onError,
  disabled = false,
}: FileUploadProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [isDragOver, setIsDragOver] = useState(false);

  const processFile = useCallback(
    async (file: File) => {
      if (file.type !== ACCEPTED_TYPE) {
        onError("Invalid file type. Only PDF files are accepted.");
        return;
      }

      if (file.size > MAX_FILE_SIZE) {
        onError("File size exceeds the 10MB limit.");
        return;
      }

      onUploadStart();

      try {
        // Step 1: Extract text
        const formData = new FormData();
        formData.append("file", file);

        const extractRes = await fetch("/api/extract", {
          method: "POST",
          body: formData,
        });

        if (!extractRes.ok) {
          try {
            const extractErr = await extractRes.json();
            onError(extractErr.error ?? "Failed to extract text from PDF.");
          } catch {
            onError("Failed to extract text from PDF.");
          }
          return;
        }

        const extractData = await extractRes.json();
        onExtractComplete();

        // Step 2: Analyze text
        const analyzeRes = await fetch("/api/analyze", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ text: extractData.text }),
        });

        if (!analyzeRes.ok) {
          try {
            const analyzeErr = await analyzeRes.json();
            onError(analyzeErr.error ?? "Failed to analyze document.");
          } catch {
            onError("Failed to analyze document.");
          }
          return;
        }

        const analysisData: DocumentAnalysis = await analyzeRes.json();
        onAnalysisComplete(analysisData);
      } catch {
        onError(
          "Network error. Please check your connection and try again."
        );
      }
    },
    [onUploadStart, onExtractComplete, onAnalysisComplete, onError]
  );

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) {
      processFile(file);
    }
    // Reset input so the same file can be re-selected
    if (inputRef.current) {
      inputRef.current.value = "";
    }
  }

  function handleDragOver(e: React.DragEvent) {
    e.preventDefault();
    if (!disabled) {
      setIsDragOver(true);
    }
  }

  function handleDragLeave(e: React.DragEvent) {
    e.preventDefault();
    setIsDragOver(false);
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    setIsDragOver(false);
    if (disabled) return;

    const file = e.dataTransfer.files[0];
    if (file) {
      processFile(file);
    }
  }

  return (
    <Card
      role="button"
      aria-label="Upload PDF file"
      className={`flex flex-col items-center justify-center gap-4 border-2 border-dashed p-8 transition-colors ${
        isDragOver
          ? "border-blue-500 bg-blue-50 dark:bg-blue-950/20"
          : "border-border"
      } ${disabled ? "pointer-events-none opacity-50" : "cursor-pointer"}`}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      onClick={() => !disabled && inputRef.current?.click()}
    >
      <Upload className="h-10 w-10 text-muted-foreground" aria-hidden="true" />
      <div className="text-center">
        <p className="text-sm text-muted-foreground">
          Drag and drop a PDF file here, or
        </p>
        <Button
          variant="link"
          className="px-1"
          disabled={disabled}
          onClick={(e) => {
            e.stopPropagation();
            inputRef.current?.click();
          }}
        >
          Browse
        </Button>
      </div>
      <p className="text-xs text-muted-foreground">PDF only, up to 10MB</p>
      <input
        ref={inputRef}
        data-testid="file-input"
        type="file"
        accept={ACCEPTED_TYPE}
        aria-label="Select PDF file to upload"
        className="hidden"
        onChange={handleFileChange}
        disabled={disabled}
      />
    </Card>
  );
}
