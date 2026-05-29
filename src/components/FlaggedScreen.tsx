import { AlertTriangle, ScanLine } from 'lucide-react';
import ProductCard from './ProductCard';
import type { ScanResult } from '../scanner-lib/scanner';

interface FlaggedScreenProps {
  // Full scan data lets this screen explain why the shipment was flagged.
  scanResult: ScanResult;
  onScanNext: () => void;
}

export default function FlaggedScreen({ scanResult, onScanNext }: FlaggedScreenProps) {
  return (
    <div
      className="min-h-screen flex flex-col items-center px-5 py-10 gap-6 overflow-y-auto"
      style={{ backgroundColor: '#ef4444' }}
    >
      {/* Product verification mismatches stay accessible but clearly warn the user not to proceed. */}
      <div className="flex flex-col items-center gap-4 text-center pt-4">
        <div className="relative">
          <div className="w-28 h-28 rounded-full bg-white/20 flex items-center justify-center">
            <AlertTriangle className="w-20 h-20 text-white" strokeWidth={1.5} />
          </div>
          <div className="absolute inset-0 rounded-full bg-white/10 scale-125 animate-ping-once" />
        </div>

        <div className="flex flex-col gap-1">
          <h2 className="text-4xl font-black text-white tracking-widest uppercase">
            Shipment Flagged
          </h2>
          <p className="text-red-100 text-sm font-medium">
            Do not dispense. The shipment data does not match the expected record.
          </p>
        </div>

        <div className="flex items-center gap-2 bg-white/20 rounded-full px-4 py-1.5">
          <div className="w-2 h-2 bg-white rounded-full animate-pulse" />
          <span className="text-white text-xs font-semibold uppercase tracking-wide">Flagged</span>
        </div>
      </div>

      <div className="w-full max-w-sm flex flex-col gap-4">
        {/* Always show the raw scan so the user can compare what was read. */}
        <ProductCard barcodeText={scanResult.rawValue} theme="red" />

        <div className="rounded-2xl border border-red-200/25 bg-white/15 px-5 py-5">
          {/* verificationReason comes from the verification service and explains
              exactly why this scan did not satisfy the expected shipment data. */}
          <p className="text-xs font-bold uppercase tracking-widest mb-3 text-red-100/70">
            Verification Result
          </p>
          <p className="text-white text-sm leading-relaxed">
            {scanResult.verificationReason ?? 'The scanned shipment did not match the expected shipment data.'}
          </p>
        </div>
      </div>

      <button
        onClick={onScanNext}
        className="w-full max-w-sm bg-white hover:bg-red-50 active:scale-95 text-red-600 font-bold text-lg py-5 rounded-2xl transition-all duration-150 shadow-xl shadow-red-900/20 flex items-center justify-center gap-3"
      >
        <ScanLine className="w-5 h-5" />
        Scan Next Box
      </button>
    </div>
  );
}
