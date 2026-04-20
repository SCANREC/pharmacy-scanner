"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useScan } from "@/context/ScanContext";
import { mockParseGS1 } from "@/lib/gs1-parser";
import { Button } from "@/components/ui/button";

export default function ScanPage() {
  const router = useRouter();
  const { addScan } = useScan();
  const [isScanning, setIsScanning] = useState(false);

  const handleSimulateScan = () => {
    setIsScanning(true);

    // Simulate scanning delay
    setTimeout(() => {
      const scanResult = mockParseGS1();
      addScan(scanResult);
      setIsScanning(false);
      router.push("/result");
    }, 1500);
  };

  return (
    <div className="flex min-h-screen flex-col">
      {/* Header */}
      <header className="border-b border-border bg-card px-4 py-4 md:px-6">
        <h1 className="text-lg font-semibold text-foreground">Scan Item</h1>
        <p className="text-sm text-muted-foreground">
          Position barcode within the viewfinder
        </p>
      </header>

      {/* Viewfinder Area */}
      <div className="flex flex-1 flex-col items-center justify-center bg-muted p-4 md:p-8">
        <div className="relative w-full max-w-md">
          {/* Camera Viewfinder Frame */}
          <div
            className="relative aspect-square w-full overflow-hidden border-2 border-primary bg-navy/95"
            role="img"
            aria-label="Camera viewfinder for barcode scanning"
          >
            {/* Corner Brackets */}
            <div className="absolute left-2 top-2 h-8 w-8 border-l-4 border-t-4 border-teal" />
            <div className="absolute right-2 top-2 h-8 w-8 border-r-4 border-t-4 border-teal" />
            <div className="absolute bottom-2 left-2 h-8 w-8 border-b-4 border-l-4 border-teal" />
            <div className="absolute bottom-2 right-2 h-8 w-8 border-b-4 border-r-4 border-teal" />

            {/* Scan Line Animation */}
            {isScanning && (
              <div className="absolute left-4 right-4 top-8">
                <div className="h-0.5 animate-scan-line bg-teal shadow-[0_0_8px_2px_rgba(0,128,128,0.5)]" />
              </div>
            )}

            {/* Center Crosshair */}
            <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2">
              <div className="relative h-16 w-16">
                <div className="absolute left-1/2 top-0 h-full w-0.5 -translate-x-1/2 bg-teal/50" />
                <div className="absolute left-0 top-1/2 h-0.5 w-full -translate-y-1/2 bg-teal/50" />
              </div>
            </div>

            {/* Viewfinder Text */}
            <div className="absolute bottom-8 left-0 right-0 text-center">
              <p className="text-sm font-medium text-white/70">
                {isScanning ? "Scanning..." : "Ready to scan"}
              </p>
            </div>
          </div>

          {/* Status Indicator */}
          <div className="mt-4 flex items-center justify-center gap-2">
            <div
              className={`h-3 w-3 ${isScanning ? "animate-pulse bg-teal" : "bg-status-match"}`}
            />
            <span className="text-sm font-medium text-muted-foreground">
              {isScanning ? "Processing barcode..." : "Scanner active"}
            </span>
          </div>
        </div>

        {/* Scan Button */}
        <div className="relative mt-8">
          {/* Pulse ring effect */}
          {!isScanning && (
            <div className="absolute inset-0 animate-pulse-ring rounded-none bg-teal/30" />
          )}
          <Button
            onClick={handleSimulateScan}
            disabled={isScanning}
            size="lg"
            className="relative h-16 min-w-64 rounded-none bg-teal text-lg font-semibold text-white hover:bg-teal/90 disabled:opacity-50"
            aria-label={isScanning ? "Scanning in progress" : "Simulate barcode scan"}
          >
            {isScanning ? (
              <span className="flex items-center gap-2">
                <svg
                  className="h-5 w-5 animate-spin"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  aria-hidden="true"
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  />
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  />
                </svg>
                Scanning...
              </span>
            ) : (
              "SIMULATE SCAN"
            )}
          </Button>
        </div>

        {/* Instructions */}
        <div className="mt-8 max-w-md text-center">
          <p className="text-sm text-muted-foreground">
            In production, this screen would activate the device camera to scan
            GS1-128 barcodes. Click the button above to simulate a scan.
          </p>
        </div>
      </div>
    </div>
  );
}
