// scanner.ts holds the shared TypeScript contracts used across the scan flow.
// Keeping these types in one file makes the parser, verifier, UI screens, and
// database logger all agree on the shape of the data being passed around.

export type VerificationStatus = "MATCH" | "MISMATCH" | "NOT_FOUND" | "UNRESOLVED";
// Final status is what the UI and compliance logging layer should eventually display/store.
export type FinalStatus = "APPROVED" | "FLAGGED" | "BLOCKED" | "UNRESOLVED";

// Normalized GS1 fields the rest of the app can rely on after parsing succeeds.
export interface ParsedScan {
  gtin: string;
  expirationDate: string;
  lotNumber: string;
  serialNumber: string;
}

export interface ParseFailure {
  // "incomplete" means the scan was readable enough to inspect, but it did not
  // contain all four GS1 fields required by the SCANREC rules.
  status: "incomplete";
  missingFields: Array<keyof ParsedScan>;
  rawValue: string;
}

export interface ParseSuccess {
  // "complete" means the parser found every required GS1 field and converted
  // them into the normalized ParsedScan shape.
  status: "complete";
  data: ParsedScan;
  rawValue: string;
}

export type ParseResult = ParseSuccess | ParseFailure;

// Shared handoff from scanner capture to the app-level status UI. This object
// is the "single source of truth" for what happened during one completed scan.
export interface ScanResult {
  // This is always the exact raw value returned by the barcode scanner before
  // any UI-level formatting. It is what we display and log for auditability.
  rawValue: string;
  finalStatus: FinalStatus;
  parsingResult: ParseResult["status"];
  parsedData?: ParsedScan;
  missingFields?: Array<keyof ParsedScan>;
  productVerificationStatus?: VerificationStatus;
  verificationReason?: string;
  matchedShipment?: ExpectedShipmentRecord;
}

export interface AiRecoveryResult {
  // Reserved for the later AI fallback path when regex parsing is incomplete.
  status: "recovered" | "unresolved";
  confidence: number | null;
  data?: ParsedScan;
  reason?: string;
}

// This mirrors the normalized shipment shape the verifier expects from EPCIS or
// any temporary demo/local data source.
export interface ExpectedShipmentRecord {
  gtin: string;
  lot_number: string;
  expiration_date: string;
  serial_number: string;
  shipment_id?: string | null;
}

// Low-level verification response before it is mapped into the UI-facing final
// status values such as APPROVED or FLAGGED.
export interface VerificationResult {
  status: VerificationStatus;
  reason: string;
  shipment?: ExpectedShipmentRecord;
}
