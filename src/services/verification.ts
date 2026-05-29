import type {
  ExpectedShipmentRecord,
  FinalStatus,
  ParsedScan,
  VerificationResult,
  VerificationStatus,
} from '../scanner-lib/scanner';

// verification.ts is the DSCSA product-verification layer.
// Today it uses temporary local shipment records, but its interface is shaped
// so a later EPCIS/Supabase-backed lookup can replace the demo data without
// changing the scanner UI flow.

// Temporary local data so the verification flow behaves like a real service
// before the app is connected to Supabase/expected_shipments.
const DEMO_EXPECTED_SHIPMENTS: ExpectedShipmentRecord[] = [
  {
    gtin: '00312345678905',
    lot_number: 'ABC123',
    expiration_date: '2027-12-31',
    serial_number: 'SN000001',
  },
  {
    gtin: '00876543210987',
    lot_number: 'LOT9988',
    expiration_date: '2026-11-30',
    serial_number: 'RX445566',
  },
];

// This is the higher-level verification shape returned to the scanner flow.
// It already includes the final status the UI should show.
export interface FinalizedVerificationResult {
  finalStatus: FinalStatus;
  productVerificationStatus: VerificationStatus;
  verificationReason: string;
  matchedShipment?: ExpectedShipmentRecord;
}

function buildVerificationResult(parsedScan: ParsedScan): VerificationResult {
  // This function stays intentionally low-level. It answers the narrower
  // question "did the shipment data match?" before the UI-friendly status is
  // chosen in a later mapping step.

  // First find the shipment record by the strongest identity fields: GTIN and
  // serial number. If those do not match, the scan is immediately flagged.
  const matchedShipment = DEMO_EXPECTED_SHIPMENTS.find(
    (shipment) =>
      shipment.gtin === parsedScan.gtin &&
      shipment.serial_number === parsedScan.serialNumber,
  );

  if (!matchedShipment) {
    return {
      status: 'MISMATCH',
      reason: 'No expected shipment matched the scanned GTIN and serial number.',
    };
  }

  // Even if GTIN + serial matched, lot and expiration still need to line up
  // with the expected shipment before the product can be considered valid.
  if (
    matchedShipment.lot_number !== parsedScan.lotNumber ||
    matchedShipment.expiration_date !== parsedScan.expirationDate
  ) {
    return {
      status: 'MISMATCH',
      reason: 'Shipment record found, but the lot number or expiration date does not match.',
      shipment: matchedShipment,
    };
  }

  return {
    status: 'MATCH',
    reason: 'Scanned GTIN, serial, lot number, and expiration date matched the expected shipment.',
    shipment: matchedShipment,
  };
}

function mapVerificationStatusToFinalStatus(status: VerificationStatus): FinalStatus {
  // This translation step keeps the verification layer separate from the UI
  // layer, which uses APPROVED / FLAGGED / BLOCKED / UNRESOLVED.
  if (status === 'MATCH') {
    return 'APPROVED';
  }

  if (status === 'UNRESOLVED') {
    return 'UNRESOLVED';
  }

  return 'FLAGGED';
}

export async function verifyParsedScan(parsedScan: ParsedScan): Promise<FinalizedVerificationResult> {
  // Keep the interface async so a later Supabase/EPCIS query can drop in without
  // forcing the scanner flow to change shape again.
  const verificationResult = buildVerificationResult(parsedScan);

  // The scanner UI and database logger work with final SCANREC statuses, so
  // this is where we translate lower-level verification output into the
  // app-facing result object.
  return {
    finalStatus: mapVerificationStatusToFinalStatus(verificationResult.status),
    productVerificationStatus: verificationResult.status,
    verificationReason: verificationResult.reason,
    matchedShipment: verificationResult.shipment,
  };
}
