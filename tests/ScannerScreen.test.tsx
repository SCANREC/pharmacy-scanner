// @vitest-environment jsdom

import { act, cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import ScannerScreen from '../src/components/ScannerScreen';

const {
  startMock,
  stopMock,
  clearMock,
  parseGs1BarcodeMock,
  verifyParsedScanMock,
  logComplianceResultMock,
} = vi.hoisted(() => ({
  startMock: vi.fn(),
  stopMock: vi.fn(),
  clearMock: vi.fn(),
  parseGs1BarcodeMock: vi.fn(),
  verifyParsedScanMock: vi.fn(),
  logComplianceResultMock: vi.fn(),
}));

let successCallback: ((decodedText: string) => void) | undefined;

vi.mock('html5-qrcode', () => ({
  Html5Qrcode: vi.fn(function Html5QrcodeMock(this: {
    start: typeof startMock;
    stop: typeof stopMock;
    clear: typeof clearMock;
  }) {
    this.start = startMock;
    this.stop = stopMock;
    this.clear = clearMock;
  }),
}));

vi.mock('../src/scanner-lib/gs1-parser', () => ({
  parseGs1Barcode: parseGs1BarcodeMock,
  normalizeRawScan: (value: string) => value,
}));

vi.mock('../src/services/verification', () => ({
  verifyParsedScan: verifyParsedScanMock,
}));

vi.mock('../src/services/complianceLog', () => ({
  logComplianceResult: logComplianceResultMock,
}));

describe('ScannerScreen', () => {
  beforeEach(() => {
    successCallback = undefined;

    startMock.mockReset();
    stopMock.mockReset();
    clearMock.mockReset();
    parseGs1BarcodeMock.mockReset();
    verifyParsedScanMock.mockReset();
    logComplianceResultMock.mockReset();

    startMock.mockImplementation(
      async (
        _cameraConfig: unknown,
        _scanConfig: unknown,
        onSuccess: (decodedText: string) => void,
      ) => {
        successCallback = onSuccess;
        return null;
      },
    );

    stopMock.mockResolvedValue(undefined);
    clearMock.mockResolvedValue(undefined);
    logComplianceResultMock.mockResolvedValue(undefined);

    Object.defineProperty(globalThis.navigator, 'mediaDevices', {
      configurable: true,
      value: {
        getUserMedia: vi.fn().mockResolvedValue({
          getTracks: () => [{ stop: vi.fn() }],
        }),
      },
    });

    Object.defineProperty(globalThis, 'ResizeObserver', {
      configurable: true,
      value: class {
        observe() {}
        disconnect() {}
      },
    });

    // Force the component down the html5-qrcode path. The component checks
    // `'BarcodeDetector' in window`, so the property must be absent entirely,
    // not just set to `undefined`.
    delete (window as Window & { BarcodeDetector?: unknown }).BarcodeDetector;

    Object.defineProperty(HTMLMediaElement.prototype, 'play', {
      configurable: true,
      value: vi.fn().mockResolvedValue(undefined),
    });
  });

  afterEach(() => {
    cleanup();
    vi.clearAllMocks();
  });

  it('returns an UNRESOLVED result when the parsed barcode is incomplete', async () => {
    parseGs1BarcodeMock.mockReturnValue({
      status: 'incomplete',
      missingFields: ['gtin', 'serialNumber'],
      rawValue: 'raw-scan',
    });

    const onResult = vi.fn();

    render(<ScannerScreen onResult={onResult} onCancel={vi.fn()} />);

    await waitFor(() => expect(startMock).toHaveBeenCalled());

    await act(async () => {
      for (let i = 0; i < 2; i += 1) {
        successCallback?.('raw-scan');
      }
    });

    await waitFor(() =>
      expect(onResult).toHaveBeenCalledWith(
        expect.objectContaining({
          rawValue: 'raw-scan',
          finalStatus: 'UNRESOLVED',
          parsingResult: 'incomplete',
          missingFields: ['gtin', 'serialNumber'],
        }),
      ),
    );

    expect(verifyParsedScanMock).not.toHaveBeenCalled();
    expect(logComplianceResultMock).toHaveBeenCalledTimes(1);
  });

  it('returns the verified result when parsing succeeds', async () => {
    const parsedData = {
      gtin: '00312345678905',
      expirationDate: '2027-12-31',
      lotNumber: 'ABC123',
      serialNumber: 'SN000001',
    };

    parseGs1BarcodeMock.mockReturnValue({
      status: 'complete',
      data: parsedData,
      rawValue: 'gs1-scan',
    });

    verifyParsedScanMock.mockResolvedValue({
      finalStatus: 'APPROVED',
      productVerificationStatus: 'MATCH',
      verificationReason: 'Matched expected shipment.',
      matchedShipment: {
        gtin: '00312345678905',
        lot_number: 'ABC123',
        expiration_date: '2027-12-31',
        serial_number: 'SN000001',
      },
    });

    const onResult = vi.fn();

    render(<ScannerScreen onResult={onResult} onCancel={vi.fn()} />);

    await waitFor(() => expect(startMock).toHaveBeenCalled());

    await act(async () => {
      for (let i = 0; i < 2; i += 1) {
        successCallback?.('gs1-scan');
      }
    });

    await waitFor(() =>
      expect(onResult).toHaveBeenCalledWith(
        expect.objectContaining({
          rawValue: 'gs1-scan',
          finalStatus: 'APPROVED',
          parsingResult: 'complete',
          parsedData,
          productVerificationStatus: 'MATCH',
          verificationReason: 'Matched expected shipment.',
        }),
      ),
    );

    expect(verifyParsedScanMock).toHaveBeenCalledWith(parsedData);
    expect(logComplianceResultMock).toHaveBeenCalledTimes(1);
  });

  it('shows the camera error state when camera access fails', async () => {
    Object.defineProperty(globalThis.navigator, 'mediaDevices', {
      configurable: true,
      value: {
        getUserMedia: vi.fn().mockRejectedValue(new Error('Permission denied')),
      },
    });

    render(<ScannerScreen onResult={vi.fn()} onCancel={vi.fn()} />);

    expect(await screen.findByText('Camera Unavailable')).toBeTruthy();
    expect(screen.getByText('Permission denied')).toBeTruthy();
  });

  it('calls onCancel when the cancel button is pressed', async () => {
    const onCancel = vi.fn();

    render(<ScannerScreen onResult={vi.fn()} onCancel={onCancel} />);

    await waitFor(() => expect(startMock).toHaveBeenCalled());

    fireEvent.click(screen.getByLabelText('Cancel scan'));

    await waitFor(() => expect(onCancel).toHaveBeenCalledTimes(1));
    expect(stopMock).toHaveBeenCalledTimes(1);
  });
});
