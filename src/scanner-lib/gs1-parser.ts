import type { ParseResult, ParsedScan } from "./scanner";

// gs1-parser.ts is the "barcode decoding brain" of the app.
// It takes one raw scanner string and tries to turn it into the four DSCSA
// fields SCANREC needs: GTIN, expiry, lot, and serial.

const KNOWN_AIS = ["01", "17", "10", "21"] as const;

const VARIABLE_LENGTH_AI_MAX = {
  "10": 20,
  "21": 20,
} as const;

const GS1_GROUP_SEPARATOR = String.fromCharCode(29);
// GTIN and expiry use fixed field lengths in the GS1 barcode payload.
const FIXED_LENGTH_AI_PATTERNS = {
  "01": 14,
  "17": 6,
} as const;

export function normalizeRawScan(rawValue: string): string {
  // Different scanners may include GS1 prefixes or human-readable parentheses, so normalize first.
  return rawValue
    .replace(/\]d2/g, "")
    .replace(/\(01\)/g, "01")
    .replace(/\(17\)/g, "17")
    .replace(/\(10\)/g, "10")
    .replace(/\(21\)/g, "21")
    .trim();
}

function parseGtin(value: string): string | null {
  // For the MVP we only accept GTINs that are exactly 14 digits after
  // normalization. Invalid GTIN strings are treated as missing.
  return /^\d{14}$/.test(value) ? value : null;
}

function parseExpirationDate(value: string): string | null {
  // The barcode stores expiration dates as YYMMDD, which we expand to an ISO-like string.
  if (!/^\d{6}$/.test(value)) {
    return null;
  }

  const year = `20${value.slice(0, 2)}`;
  const month = value.slice(2, 4);
  const day = value.slice(4, 6);

  return `${year}-${month}-${day}`;
}

function isKnownAi(value: string): boolean {
  return KNOWN_AIS.includes(value as (typeof KNOWN_AIS)[number]);
}

function canParseFromCursor(input: string, startIndex: number): boolean {
  // This helper is used as a "look-ahead validator." When we are inside a
  // variable-length field such as lot or serial, we sometimes need to ask:
  // "If I split the string here, does the rest of the barcode still look like
  // a valid GS1 payload?" That is how the parser avoids splitting a field too
  // early just because its contents happen to contain digits like 10 or 21.
  let cursor = startIndex;

  while (cursor < input.length) {
    if (input[cursor] === GS1_GROUP_SEPARATOR) {
      cursor += 1;
      continue;
    }

    const ai = input.slice(cursor, cursor + 2);

    if (ai === "01") {
      if (!/^\d{14}$/.test(input.slice(cursor + 2, cursor + 16))) return false;
      cursor += 16;
      continue;
    }

    if (ai === "17") {
      if (!/^\d{6}$/.test(input.slice(cursor + 2, cursor + 8))) return false;
      cursor += 8;
      continue;
    }

    if (ai === "10" || ai === "21") {
      // Variable-length AIs are the hardest part because the next field may
      // start immediately after them or may be separated by the GS character.
      const maxLen = VARIABLE_LENGTH_AI_MAX[ai];
      const valueStart = cursor + 2;

      for (let end = valueStart + 1; end <= Math.min(input.length, valueStart + maxLen); end += 1) {
        if (input[end] === GS1_GROUP_SEPARATOR) {
          if (canParseFromCursor(input, end + 1)) return true;
        }

        const nextAi = input.slice(end, end + 2);
        if (isKnownAi(nextAi) && canParseFromCursor(input, end)) return true;
      }

      return true;
    }

    return false;
  }

  return true;
}

function findVariableFieldEnd(
  input: string,
  startIndex: number,
  ai: "10" | "21",
): number {
  // Step 1: if the scanner returned the GS separator, that wins immediately
  // because GS1 uses it to mark the end of variable-length values.
  const maxLen = VARIABLE_LENGTH_AI_MAX[ai];
  const maxEnd = Math.min(input.length, startIndex + maxLen);

  for (let cursor = startIndex; cursor < maxEnd; cursor += 1) {
    if (input[cursor] === GS1_GROUP_SEPARATOR) {
      return cursor;
    }
  }

  let lastValidBoundary: number | null = null;

  for (let end = startIndex + 1; end <= maxEnd; end += 1) {
    const nextAi = input.slice(end, end + 2);

    if (isKnownAi(nextAi) && canParseFromCursor(input, end)) {
      // Prefer the latest valid boundary so AI-like digits inside lot/serial
      // values remain in the current field whenever a later split also works.
      lastValidBoundary = end;
    }
  }

  // If no safe next AI boundary exists, treat the rest of the allowed field
  // length as belonging to the current field.
  return lastValidBoundary ?? maxEnd;
}

function hasParsedValue(value: string | undefined): boolean {
  return typeof value === "string" && value.length > 0;
}

function isFinalVariableField(
  ai: "10" | "21",
  parsed: Partial<ParsedScan>,
): boolean {
  // This heuristic answers: "Based on what we already parsed, is this variable
  // field probably the last remaining one?" If yes, and there is no GS
  // separator ahead, it is safer to consume the remainder than to invent a
  // boundary inside the data.
  if (ai === "10") {
    return (
      hasParsedValue(parsed.gtin)
      && hasParsedValue(parsed.expirationDate)
      && hasParsedValue(parsed.serialNumber)
    );
  }

  return (
    hasParsedValue(parsed.gtin)
    && hasParsedValue(parsed.expirationDate)
    && hasParsedValue(parsed.lotNumber)
  );
}

export function parseGs1Barcode(rawValue: string): ParseResult {
  const normalized = normalizeRawScan(rawValue);
  const parsed: Partial<ParsedScan> = {};
  let cursor = 0;

  // Walk through the barcode payload from left to right, repeatedly looking
  // for one of the AIs this app currently understands.
  while (cursor < normalized.length) {
    const ai = normalized.slice(cursor, cursor + 2);

    if (ai === "01" || ai === "17") {
      // Fixed-length AIs are straightforward: once we know the AI, we know
      // exactly how many characters to consume next.
      const fieldLength = FIXED_LENGTH_AI_PATTERNS[ai];
      const valueStart = cursor + 2;
      const valueEnd = valueStart + fieldLength;
      const rawField = normalized.slice(valueStart, valueEnd);

      if (ai === "01") {
        parsed.gtin = parseGtin(rawField) ?? undefined;
      } else {
        parsed.expirationDate = parseExpirationDate(rawField) ?? undefined;
      }

      cursor = valueEnd;
      continue;
    }

    if (ai === "10" || ai === "21") {
      // Lot and serial are variable-length fields, so we read until
      // the next GS1 separator or the next valid parseable AI boundary.
      const valueStart = cursor + 2;
      const nextSeparatorIndex = normalized.indexOf(GS1_GROUP_SEPARATOR, valueStart);
      const hasSeparatorAhead = nextSeparatorIndex !== -1;
      const valueEnd = !hasSeparatorAhead && isFinalVariableField(ai, parsed)
        ? Math.min(normalized.length, valueStart + VARIABLE_LENGTH_AI_MAX[ai])
        : findVariableFieldEnd(normalized, valueStart, ai);
      const rawField = normalized.slice(valueStart, valueEnd);

      if (ai === "10") {
        parsed.lotNumber = rawField || undefined;
      } else {
        parsed.serialNumber = rawField || undefined;
      }

      cursor = valueEnd;

      if (normalized[cursor] === GS1_GROUP_SEPARATOR) {
        cursor += 1;
      }

      continue;
    }

    // Unknown characters are skipped so the parser can recover from prefixes,
    // extra scanner artifacts, or unsupported AIs without crashing.
    cursor += 1;
  }

  const missingFields = (["gtin", "expirationDate", "lotNumber", "serialNumber"] as const).filter(
    (field) => !parsed[field],
  );

  // SCANREC treats any missing required GS1 field as an incomplete scan.
  if (missingFields.length > 0) {
    return {
      status: "incomplete",
      missingFields: [...missingFields],
      rawValue,
    };
  }

  return {
    status: "complete",
    data: parsed as ParsedScan,
    rawValue,
  };
}
