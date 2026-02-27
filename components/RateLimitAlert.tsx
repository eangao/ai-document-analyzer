"use client";

import { useEffect, useState } from "react";
import { Clock, Globe } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";

export interface RateLimitAlertProps {
  readonly limitType: "per-ip" | "global";
  readonly retryAfterSeconds: number;
  readonly onRetryReady?: () => void;
}

/**
 * RateLimitAlert - Displays countdown timer for rate limit errors
 * Shows different styling and messaging for per-IP vs global limits
 * Mobile-responsive with countdown in MM:SS format
 */
export function RateLimitAlert({
  limitType,
  retryAfterSeconds,
  onRetryReady,
}: RateLimitAlertProps) {
  const [secondsRemaining, setSecondsRemaining] = useState(retryAfterSeconds);
  const [hasExpired, setHasExpired] = useState(retryAfterSeconds <= 0);

  useEffect(() => {
    // Reset state when retryAfterSeconds changes
    setSecondsRemaining(retryAfterSeconds);
    setHasExpired(retryAfterSeconds <= 0);

    if (retryAfterSeconds <= 0) {
      onRetryReady?.();
      return;
    }

    // Set up countdown interval
    const intervalId = setInterval(() => {
      setSecondsRemaining((prev) => {
        const next = prev - 1;

        if (next <= 0) {
          setHasExpired(true);
          onRetryReady?.();
          clearInterval(intervalId);
          return 0;
        }

        return next;
      });
    }, 1000);

    return () => {
      clearInterval(intervalId);
    };
  }, [retryAfterSeconds, onRetryReady]);

  // Format seconds to MM:SS
  const formatTime = (seconds: number): string => {
    const minutes = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${minutes}:${secs.toString().padStart(2, "0")}`;
  };

  const isPerIp = limitType === "per-ip";
  const bgColor = isPerIp ? "bg-amber-50" : "bg-blue-50";
  const borderColor = isPerIp ? "border-amber-200" : "border-blue-200";
  const textColor = isPerIp ? "text-amber-900" : "text-blue-900";
  const Icon = isPerIp ? Clock : Globe;

  const title = isPerIp
    ? "You've reached your personal request limit"
    : "This demo is experiencing high traffic and has reached its daily limit";

  const description = isPerIp
    ? "Please wait before submitting another document for analysis."
    : "Please come back later when traffic returns to normal.";

  return (
    <Alert
      className={`${bgColor} ${borderColor} ${textColor} border-2 p-4`}
      role="alert"
      aria-live="polite"
    >
      <div className="flex items-start gap-3">
        <Icon className="h-5 w-5 mt-0.5 flex-shrink-0" />
        <div className="flex-1 min-w-0">
          <AlertDescription className="space-y-2">
            <div className="font-semibold">{title}</div>
            {hasExpired ? (
              <div className="text-sm font-medium">Ready to retry!</div>
            ) : (
              <>
                <div className="text-sm">
                  {description}
                </div>
                <div className="text-sm font-mono">
                  Time remaining: {formatTime(secondsRemaining)}
                </div>
              </>
            )}
          </AlertDescription>
        </div>
      </div>
    </Alert>
  );
}
