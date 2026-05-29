import { HelpCircle, ScanLine } from 'lucide-react';
import ProductCard from './ProductCard';
import type { ScanResult } from '../scanner-lib/scanner';

interface UnresolvedScreenProps {
  // Full scan data is useful here because unresolved scans often need rescan or
  // manual correction based on what was partially captured.
  scanResult: ScanResult;
  onScanNext: () => void;
}

function formatMissingFields(missingFields: ScanResult['missingFields']): string {
  // Converts internal field names into user-facing labels for the recovery UI.
  if (!missingFields || missingFields.length === 0) {
    return 'Required GS1 fields were missing from the scan.';
  }

  return missingFields
    .map((field) => {
      switch (field) {
        case 'gtin':
          return 'GTIN';
        case 'expirationDate':
          return 'Expiration date';
        case 'lotNumber':
          return 'Lot number';
        case 'serialNumber':
          return 'Serial number';
      }
    })
    .join(', ');
}

export default function UnresolvedScreen({ scanResult, onScanNext }: UnresolvedScreenProps) {
  return (
    <div
      className="min-h-screen flex flex-col items-center px-5 py-10 gap-6 overflow-y-auto"
      style={{ backgroundColor: '#f59e0b' }}
    >
      {/* UNRESOLVED helps the user recover from incomplete or invalid scan data. */}
      <div className="flex flex-col items-center gap-4 text-center pt-4">
        <div className="relative">
          <div className="w-28 h-28 rounded-full bg-white/20 flex items-center justify-center">
            <HelpCircle className="w-20 h-20 text-white" strokeWidth={1.5} />
          </div>
          <div className="absolute inset-0 rounded-full bg-white/10 scale-125 animate-ping-once" />
        </div>

        <div className="flex flex-col gap-1">
          <h2 className="text-4xl font-black text-white tracking-widest uppercase">
            Scan Unresolved
          </h2>
          <p className="text-yellow-50 text-sm font-medium">
            Rescan the barcode or enter the missing fields manually.
          </p>
        </div>

        <div className="flex items-center gap-2 bg-white/20 rounded-full px-4 py-1.5">
          <div className="w-2 h-2 bg-white rounded-full animate-pulse" />
          <span className="text-white text-xs font-semibold uppercase tracking-wide">Unresolved</span>
        </div>
      </div>

      <div className="w-full max-w-sm flex flex-col gap-4">
        {/* The unresolved screen still shows the raw captured value because it
            helps the user decide whether to rescan or manually key in data. */}
        <ProductCard barcodeText={scanResult.rawValue} theme="yellow" />

        <div className="rounded-2xl border border-yellow-100/30 bg-white/15 px-5 py-5">
          <p className="text-xs font-bold uppercase tracking-widest mb-3 text-yellow-50/80">
            Missing Fields
          </p>
          <p className="text-white text-sm leading-relaxed">
            {formatMissingFields(scanResult.missingFields)}
          </p>
        </div>
      </div>

      <button
        onClick={onScanNext}
        className="w-full max-w-sm bg-white hover:bg-yellow-50 active:scale-95 text-amber-700 font-bold text-lg py-5 rounded-2xl transition-all duration-150 shadow-xl shadow-amber-900/20 flex items-center justify-center gap-3"
      >
        <ScanLine className="w-5 h-5" />
        Scan Next Box
      </button>
    </div>
  );
}
