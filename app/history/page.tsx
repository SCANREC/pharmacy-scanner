"use client";

import { useScan } from "@/context/ScanContext";
import { formatGTIN, formatDate, formatTimestamp } from "@/lib/gs1-parser";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import Link from "next/link";

const statusStyles = {
  match: {
    variant: "default" as const,
    className: "bg-status-match text-white hover:bg-status-match/90",
    label: "Match",
  },
  mismatch: {
    variant: "destructive" as const,
    className: "bg-status-mismatch text-white hover:bg-status-mismatch/90",
    label: "Mismatch",
  },
  unresolved: {
    variant: "secondary" as const,
    className: "bg-status-unresolved text-navy hover:bg-status-unresolved/90",
    label: "Unresolved",
  },
};

export default function HistoryPage() {
  const { scanHistory, clearHistory } = useScan();

  return (
    <div className="flex min-h-screen flex-col">
      {/* Header */}
      <header className="border-b border-border bg-card px-4 py-4 md:px-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-lg font-semibold text-foreground">Scan History</h1>
            <p className="text-sm text-muted-foreground">
              {scanHistory.length} {scanHistory.length === 1 ? "record" : "records"}
            </p>
          </div>
          {scanHistory.length > 0 && (
            <Button
              onClick={clearHistory}
              variant="outline"
              size="sm"
              className="rounded-none border-destructive text-destructive hover:bg-destructive hover:text-white"
            >
              Clear History
            </Button>
          )}
        </div>
      </header>

      {/* Content */}
      <div className="flex-1 bg-muted p-4 md:p-6">
        {scanHistory.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16">
            <div className="mb-4 flex h-16 w-16 items-center justify-center bg-border">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="h-8 w-8 text-muted-foreground"
                aria-hidden="true"
              >
                <path d="M3 3v5h5" />
                <path d="M3.05 13A9 9 0 1 0 6 5.3L3 8" />
              </svg>
            </div>
            <h2 className="mb-2 text-lg font-semibold text-foreground">No Scan History</h2>
            <p className="mb-6 text-center text-sm text-muted-foreground">
              Scanned items will appear here for review
            </p>
            <Link href="/scan">
              <Button className="rounded-none bg-teal text-white hover:bg-teal/90">
                Start Scanning
              </Button>
            </Link>
          </div>
        ) : (
          <div className="mx-auto max-w-6xl">
            {/* Desktop Table */}
            <div className="hidden overflow-hidden border border-border bg-card md:block">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/50 hover:bg-muted/50">
                    <TableHead className="font-semibold text-foreground">Status</TableHead>
                    <TableHead className="font-semibold text-foreground">GTIN</TableHead>
                    <TableHead className="font-semibold text-foreground">Serial</TableHead>
                    <TableHead className="font-semibold text-foreground">Lot</TableHead>
                    <TableHead className="font-semibold text-foreground">Expiry</TableHead>
                    <TableHead className="font-semibold text-foreground">Scanned</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {scanHistory.map((scan, index) => {
                    const style = statusStyles[scan.status];
                    return (
                      <TableRow key={`${scan.timestamp}-${index}`}>
                        <TableCell>
                          <Badge className={cn("rounded-none", style.className)}>
                            {style.label}
                          </Badge>
                        </TableCell>
                        <TableCell className="font-mono text-sm">
                          {formatGTIN(scan.gtin)}
                        </TableCell>
                        <TableCell className="font-mono text-sm">{scan.serial}</TableCell>
                        <TableCell className="font-mono text-sm">{scan.lot}</TableCell>
                        <TableCell className="font-mono text-sm">
                          {formatDate(scan.expiry)}
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {formatTimestamp(scan.timestamp)}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>

            {/* Mobile Cards */}
            <div className="flex flex-col gap-3 md:hidden">
              {scanHistory.map((scan, index) => {
                const style = statusStyles[scan.status];
                return (
                  <div
                    key={`${scan.timestamp}-${index}`}
                    className={cn(
                      "border-l-4 bg-card p-4",
                      scan.status === "match" && "border-status-match",
                      scan.status === "mismatch" && "border-status-mismatch",
                      scan.status === "unresolved" && "border-status-unresolved"
                    )}
                  >
                    <div className="mb-3 flex items-center justify-between">
                      <Badge className={cn("rounded-none", style.className)}>
                        {style.label}
                      </Badge>
                      <span className="text-xs text-muted-foreground">
                        {formatTimestamp(scan.timestamp)}
                      </span>
                    </div>
                    <dl className="grid grid-cols-2 gap-2 text-sm">
                      <div>
                        <dt className="text-xs text-muted-foreground">GTIN</dt>
                        <dd className="font-mono font-medium">{formatGTIN(scan.gtin)}</dd>
                      </div>
                      <div>
                        <dt className="text-xs text-muted-foreground">Serial</dt>
                        <dd className="font-mono font-medium">{scan.serial}</dd>
                      </div>
                      <div>
                        <dt className="text-xs text-muted-foreground">Lot</dt>
                        <dd className="font-mono font-medium">{scan.lot}</dd>
                      </div>
                      <div>
                        <dt className="text-xs text-muted-foreground">Expiry</dt>
                        <dd className="font-mono font-medium">{formatDate(scan.expiry)}</dd>
                      </div>
                    </dl>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
