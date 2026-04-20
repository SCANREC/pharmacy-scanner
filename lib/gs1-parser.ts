import type { ScanStatus, ScanRecord } from "@/context/ScanContext";

// Mock GS1-128 barcode data generator
// In a real application, this would parse actual GS1-128 barcode strings

const MOCK_PRODUCTS = [
  { gtin: "00312345678901", lot: "LOT2024A", name: "Amoxicillin 500mg" },
  { gtin: "00398765432109", lot: "LOT2024B", name: "Lisinopril 10mg" },
  { gtin: "00356789012345", lot: "LOT2024C", name: "Metformin 850mg" },
  { gtin: "00323456789012", lot: "LOT2024D", name: "Atorvastatin 20mg" },
  { gtin: "00387654321098", lot: "LOT2024E", name: "Omeprazole 20mg" },
];

function generateSerial(): string {
  // Randomly generate different serial prefixes to demonstrate verification states
  const random = Math.random();
  if (random < 0.15) {
    // 15% chance of mismatch (serial starts with "00")
    return "00" + Math.random().toString(36).substring(2, 10).toUpperCase();
  } else if (random < 0.25) {
    // 10% chance of unresolved (serial starts with "99")
    return "99" + Math.random().toString(36).substring(2, 10).toUpperCase();
  } else {
    // 75% chance of match
    return Math.random().toString(36).substring(2, 12).toUpperCase();
  }
}

function generateExpiry(): string {
  // Generate a random expiry date 6-24 months from now
  const months = Math.floor(Math.random() * 18) + 6;
  const date = new Date();
  date.setMonth(date.getMonth() + months);
  return date.toISOString().split("T")[0];
}

function determineStatus(serial: string): ScanStatus {
  if (serial.startsWith("00")) {
    return "mismatch";
  } else if (serial.startsWith("99")) {
    return "unresolved";
  }
  return "match";
}

export function mockParseGS1(barcodeString?: string): ScanRecord {
  // Select a random product
  const product = MOCK_PRODUCTS[Math.floor(Math.random() * MOCK_PRODUCTS.length)];
  const serial = generateSerial();
  const status = determineStatus(serial);

  return {
    gtin: product.gtin,
    serial: serial,
    lot: product.lot,
    expiry: generateExpiry(),
    status: status,
    timestamp: new Date().toISOString(),
  };
}

export function formatGTIN(gtin: string): string {
  // Format GTIN for display: XXXX-XXXXX-XXXXX
  if (gtin.length === 14) {
    return `${gtin.slice(0, 4)}-${gtin.slice(4, 9)}-${gtin.slice(9)}`;
  }
  return gtin;
}

export function formatDate(isoDate: string): string {
  return new Date(isoDate).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

export function formatTimestamp(isoTimestamp: string): string {
  return new Date(isoTimestamp).toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
}
