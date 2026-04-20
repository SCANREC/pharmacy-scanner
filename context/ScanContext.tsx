"use client";

import { createContext, useContext, useState, ReactNode } from "react";

export type ScanStatus = "match" | "mismatch" | "unresolved";

export interface ScanRecord {
  gtin: string;
  serial: string;
  lot: string;
  expiry: string;
  status: ScanStatus;
  timestamp: string;
}

interface ScanContextType {
  lastScan: ScanRecord | null;
  scanHistory: ScanRecord[];
  addScan: (scan: ScanRecord) => void;
  clearHistory: () => void;
}

const ScanContext = createContext<ScanContextType | undefined>(undefined);

export function ScanProvider({ children }: { children: ReactNode }) {
  const [lastScan, setLastScan] = useState<ScanRecord | null>(null);
  const [scanHistory, setScanHistory] = useState<ScanRecord[]>([]);

  const addScan = (scan: ScanRecord) => {
    setLastScan(scan);
    setScanHistory((prev) => [scan, ...prev]);
  };

  const clearHistory = () => {
    setScanHistory([]);
    setLastScan(null);
  };

  return (
    <ScanContext.Provider value={{ lastScan, scanHistory, addScan, clearHistory }}>
      {children}
    </ScanContext.Provider>
  );
}

export function useScan() {
  const context = useContext(ScanContext);
  if (context === undefined) {
    throw new Error("useScan must be used within a ScanProvider");
  }
  return context;
}
