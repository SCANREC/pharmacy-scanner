"use client";

import { useRouter } from "next/navigation";
import { useScan } from "@/context/ScanContext";
import { formatGTIN, formatDate, formatTimestamp } from "@/lib/gs1-parser";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const statusConfig = {
  match: {
    label: "VERIFIED",
    description: "Product verified successfully",
    bgColor: "bg-status-match",
    borderColor: "border-status-match",
    textColor: "text-status-match",
    icon: (
      <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="3"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="h-12 w-12"
        aria-hidden="true"
      >
        <path d="M20 6 9 17l-5-5" />
      </svg>
    ),
  },
  mismatch: {
    label: "MISMATCH",
    description: "Serial number verification failed",
    bgColor: "bg-status-mismatch",
    borderColor: "border-status-mismatch",
    textColor: "text-status-mismatch",
    icon: (
      <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="3"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="h-12 w-12"
        aria-hidden="true"
      >
        <path d="M18 6 6 18" />
        <path d="m6 6 12 12" />
      </svg>
    ),
  },
  unresolved: {
    label: "UNRESOLVED",
    description: "Unable to verify - manual review required",
    bgColor: "bg-status-unresolved",
    borderColor: "border-status-unresolved",
    textColor: "text-status-unresolved",
    icon: (
      <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="3"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="h-12 w-12"
        aria-hidden="true"
      >
        <circle cx="12" cy="12" r="10" />
        <path d="M12 16v-4" />
        <path d="M12 8h.01" />
      </svg>
    ),
  },
};

export default function ResultPage() {
  const router = useRouter();
  const { lastScan } = useScan();

  // If no scan data, redirect to scan page
  if (!lastScan) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center p-4">
        <p className="mb-4 text-muted-foreground">No scan data available</p>
        <Button
          onClick={() => router.push("/scan")}
          className="rounded-none bg-teal text-white hover:bg-teal/90"
        >
          Go to Scanner
        </Button>
      </div>
    );
  }

  const status = statusConfig[lastScan.status];

  const handleScanNext = () => {
    router.push("/scan");
  };

  const handleFlagForReview = () => {
    // In production, this would submit to an API
    alert("Item flagged for manual review");
    router.push("/scan");
  };

  return (
    <div className="flex min-h-screen flex-col">
      {/* Status Banner */}
      <div
        className={cn("px-4 py-6 text-white md:px-6", status.bgColor)}
        role="status"
        aria-live="polite"
      >
        <div className="mx-auto flex max-w-2xl items-center gap-4">
          <div className="flex h-16 w-16 flex-shrink-0 items-center justify-center bg-white/20">
            {status.icon}
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">{status.label}</h1>
            <p className="text-sm text-white/80">{status.description}</p>
          </div>
        </div>
      </div>

      {/* Scan Details */}
      <div className="flex-1 bg-background p-4 md:p-6">
        <div className="mx-auto max-w-2xl">
          <div className={cn("border-l-4 bg-card p-4 md:p-6", status.borderColor)}>
            <h2 className="mb-4 text-sm font-semibold uppercase tracking-wider text-muted-foreground">
              Scan Details
            </h2>

            <dl className="space-y-4">
              <div className="flex flex-col gap-1 border-b border-border pb-4 md:flex-row md:justify-between">
                <dt className="text-sm font-medium text-muted-foreground">GTIN</dt>
                <dd className="font-mono text-base font-semibold text-foreground">
                  {formatGTIN(lastScan.gtin)}
                </dd>
              </div>

              <div className="flex flex-col gap-1 border-b border-border pb-4 md:flex-row md:justify-between">
                <dt className="text-sm font-medium text-muted-foreground">Serial Number</dt>
                <dd className="font-mono text-base font-semibold text-foreground">
                  {lastScan.serial}
                </dd>
              </div>

              <div className="flex flex-col gap-1 border-b border-border pb-4 md:flex-row md:justify-between">
                <dt className="text-sm font-medium text-muted-foreground">Lot Number</dt>
                <dd className="font-mono text-base font-semibold text-foreground">
                  {lastScan.lot}
                </dd>
              </div>

              <div className="flex flex-col gap-1 border-b border-border pb-4 md:flex-row md:justify-between">
                <dt className="text-sm font-medium text-muted-foreground">Expiry Date</dt>
                <dd className="font-mono text-base font-semibold text-foreground">
                  {formatDate(lastScan.expiry)}
                </dd>
              </div>

              <div className="flex flex-col gap-1 md:flex-row md:justify-between">
                <dt className="text-sm font-medium text-muted-foreground">Scan Time</dt>
                <dd className="font-mono text-sm text-muted-foreground">
                  {formatTimestamp(lastScan.timestamp)}
                </dd>
              </div>
            </dl>
          </div>

          {/* Action Buttons */}
          <div className="mt-6 flex flex-col gap-3">
            {lastScan.status === "unresolved" && (
              <Button
                onClick={handleFlagForReview}
                variant="outline"
                size="lg"
                className="h-14 w-full rounded-none border-2 border-status-unresolved text-status-unresolved hover:bg-status-unresolved hover:text-white"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="mr-2 h-5 w-5"
                  aria-hidden="true"
                >
                  <path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z" />
                  <line x1="4" x2="4" y1="22" y2="15" />
                </svg>
                FLAG FOR REVIEW
              </Button>
            )}

            <Button
              onClick={handleScanNext}
              size="lg"
              className="h-14 w-full rounded-none bg-teal text-lg font-semibold text-white hover:bg-teal/90"
            >
              SCAN NEXT ITEM
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
