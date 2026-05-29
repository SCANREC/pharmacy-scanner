// @vitest-environment jsdom

import { describe, expect, it } from 'vitest';
import { normalizeRawScan, parseGs1Barcode } from '../src/scanner-lib/gs1-parser';

const GS = String.fromCharCode(29);

describe('gs1-parser', () => {
  it('normalizes common GS1 scanner prefixes and human-readable AIs', () => {
    expect(normalizeRawScan(']d2(01)00312345678905(17)271231(10)ABC123(21)SN000001')).toBe(
      '01003123456789051727123110ABC12321SN000001',
    );
  });

  it('parses the image example without splitting serial and lot incorrectly', () => {
    const rawValue = `01003141419999952110000000234${GS}1715012510987654321GFEDCBA`;
    const result = parseGs1Barcode(rawValue);

    expect(result).toEqual({
      status: 'complete',
      rawValue,
      data: {
        gtin: '00314141999995',
        serialNumber: '10000000234',
        expirationDate: '2015-01-25',
        lotNumber: '987654321GFEDCBA',
      },
    });
  });

  it('keeps AI-like digit pairs inside a serial number when it is GS-separated from later fields', () => {
    const rawValue = `01003123456789052110A1727${GS}1727123110LOT9988`;
    const result = parseGs1Barcode(rawValue);

    expect(result).toEqual({
      status: 'complete',
      rawValue,
      data: {
        gtin: '00312345678905',
        serialNumber: '10A1727',
        expirationDate: '2027-12-31',
        lotNumber: 'LOT9988',
      },
    });
  });

  it('keeps AI-like digit pairs inside a final lot number', () => {
    const rawValue = `010087654321098721RX445566${GS}1726113010LOT211001XYZ`;
    const result = parseGs1Barcode(rawValue);

    expect(result).toEqual({
      status: 'complete',
      rawValue,
      data: {
        gtin: '00876543210987',
        expirationDate: '2026-11-30',
        lotNumber: 'LOT211001XYZ',
        serialNumber: 'RX445566',
      },
    });
  });

  it('returns incomplete when required GS1 fields are missing', () => {
    const rawValue = '01003123456789051727123110ABC123';
    const result = parseGs1Barcode(rawValue);

    expect(result).toEqual({
      status: 'incomplete',
      rawValue,
      missingFields: ['serialNumber'],
    });
  });
});
