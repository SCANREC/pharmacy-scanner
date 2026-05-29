import type { ScanResult } from '../scanner-lib/scanner';
import { supabase } from './supabase';

// complianceLog.ts is responsible for turning one in-memory ScanResult into
// the row shapes expected by Supabase. It is intentionally separate from the
// scanner UI so database changes do not leak into camera logic.

async function resolveScannedBy(): Promise<string | null> {
  // Prefer the signed-in Supabase user's email when auth is added. If the app
  // is still anonymous, fall back to a configured pharmacy/site label.
  const { data, error } = await supabase.auth.getUser();

  if (!error) {
    const email = data.user?.email?.trim();
    if (email) {
      return email;
    }
  }

  const configuredScannerName = import.meta.env.VITE_SCANNED_BY?.trim();
  if (configuredScannerName) {
    return configuredScannerName;
  }

  const configuredPharmacyName = import.meta.env.VITE_PHARMACY_NAME?.trim();
  if (configuredPharmacyName) {
    return configuredPharmacyName;
  }

  // Keep scans inserts valid even before auth or site configuration exists.
  return 'SCANREC Scanner';
}

function buildComplianceLogPayload(scanResult: ScanResult) {
  // compliance_log is the minimal immutable event record used for compliance
  // auditing, so it stores the raw scan plus the normalized GS1 fields.
  const { parsedData } = scanResult;

  return {
    gtin: parsedData?.gtin ?? null,
    serial: parsedData?.serialNumber ?? null,
    lot: parsedData?.lotNumber ?? null,
    expiry: parsedData?.expirationDate ?? null,
    status: scanResult.finalStatus,
    raw_scan: scanResult.rawValue,
  };
}

function buildScansPayload(scanResult: ScanResult, scannedBy: string | null) {
  const { parsedData, matchedShipment } = scanResult;

  // The scans table expects normalized shipment fields, so unresolved scans
  // stay in compliance_log only until the app has enough data for this table.
  if (!parsedData) {
    return null;
  }

  const missingFieldsSummary = scanResult.missingFields?.length
    ? `Missing fields: ${scanResult.missingFields.join(', ')}.`
    : null;

  // The scans table is a fuller operational record. Some fields remain null
  // until auth and shipment ids are wired into the frontend.
  // This table is useful for product operations/reporting, while
  // compliance_log remains the simpler immutable audit trail.
  return {
    gtin: parsedData?.gtin ?? null,
    serial_number: parsedData?.serialNumber ?? null,
    expiration_date: parsedData?.expirationDate ?? null,
    lot_number: parsedData?.lotNumber ?? null,
    match_status: scanResult.productVerificationStatus ?? scanResult.finalStatus,
    scanned_by: scannedBy,
    scanned_at: new Date().toISOString(),
    shipment_id: matchedShipment?.shipment_id ?? null,
    notes: scanResult.verificationReason ?? missingFieldsSummary,
  };
}

export async function logComplianceResult(scanResult: ScanResult) {
  // Build every derived value up front so the Supabase inserts below are easy
  // to read and so the mapping logic stays out of the scanner component.
  const scannedBy = await resolveScannedBy();
  const complianceLogPayload = buildComplianceLogPayload(scanResult);
  const scansPayload = buildScansPayload(scanResult, scannedBy);

  // compliance_log is append-only in the current design, so every completed
  // scan writes one new row instead of updating an earlier record.
  const { error: complianceLogError } = await supabase
    .from('compliance_log')
    .insert(complianceLogPayload);

  if (complianceLogError) {
    throw complianceLogError;
  }

  // scans stores a richer copy of completed, parseable events. Unresolved
  // scans are still fully captured in compliance_log.
  if (scansPayload) {
    const { error: scansError } = await supabase.from('scans').insert(scansPayload);

    if (scansError) {
      throw scansError;
    }
  }
}
