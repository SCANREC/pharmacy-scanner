import { ShieldX, ScanLine } from 'lucide-react';
import ProductCard from './ProductCard';
import type { ScanResult } from '../scanner-lib/scanner';

interface BlockedScreenProps {
  // Full scan data lets this screen show the blocked barcode and reason.
  scanResult: ScanResult;
  onScanNext: () => void;
}

export default function BlockedScreen({ scanResult, onScanNext }: BlockedScreenProps) {
  return (
    <div
      className="min-h-screen flex flex-col items-center px-5 py-10 gap-6 overflow-y-auto"
      style={{ backgroundColor: '#b91c1c' }}
    >
      {/* BLOCKED is reserved for hard stops such as license validation failures. */}
      <div className="flex flex-col items-center gap-4 text-center pt-4">
        <div className="relative">
          <div className="w-28 h-28 rounded-full bg-white/20 flex items-center justify-center">
            <ShieldX className="w-20 h-20 text-white" strokeWidth={1.5} />
          </div>
          <div className="absolute inset-0 rounded-full bg-white/10 scale-125 animate-ping-once" />
        </div>

        <div className="flex flex-col gap-1">
          <h2 className="text-4xl font-black text-white tracking-widest uppercase">
            Access Blocked
          </h2>
          <p className="text-red-100 text-sm font-medium">
            The scan cannot continue until the compliance issue is resolved.
          </p>
        </div>

        <div className="flex items-center gap-2 bg-white/20 rounded-full px-4 py-1.5">
          <div className="w-2 h-2 bg-white rounded-full animate-pulse" />
          <span className="text-white text-xs font-semibold uppercase tracking-wide">Blocked</span>
        </div>
      </div>

      <div className="w-full max-w-sm flex flex-col gap-4">
        {/* The blocked state still shows what was scanned for audit clarity. */}
        <ProductCard barcodeText={scanResult.rawValue} theme="slate" />

        <div className="rounded-2xl border border-slate-200/25 bg-white/15 px-5 py-5">
          {/* BLOCKED is the screen where a hard compliance stop would be
              explained once license validation is fully wired in. */}
          <p className="text-xs font-bold uppercase tracking-widest mb-3 text-slate-100/80">
            Compliance Reason
          </p>
          <p className="text-white text-sm leading-relaxed">
            {scanResult.verificationReason ?? 'A compliance check blocked this scan from moving forward.'}
          </p>
        </div>
      </div>

      <button
        onClick={onScanNext}
        className="w-full max-w-sm bg-white hover:bg-slate-50 active:scale-95 text-slate-700 font-bold text-lg py-5 rounded-2xl transition-all duration-150 shadow-xl shadow-red-950/20 flex items-center justify-center gap-3"
      >
        <ScanLine className="w-5 h-5" />
        Scan Next Box
      </button>
    </div>
  );
}
