import { CheckCircle2, ScanLine } from 'lucide-react';
import ProductCard from './ProductCard';

interface MatchScreenProps {
  // MatchScreen only needs the human-visible barcode text plus a reset action.
  barcodeText: string;
  onScanNext: () => void;
}

export default function MatchScreen({ barcodeText, onScanNext }: MatchScreenProps) {
  return (
    <div
      className="min-h-screen flex flex-col items-center px-5 py-10 gap-6 overflow-y-auto"
      style={{ backgroundColor: '#22c55e' }}
    >
      {/* Success hero section that gives immediate visual confirmation to the user. */}
      <div className="flex flex-col items-center gap-4 text-center pt-4">
        <div className="relative">
          <div className="w-28 h-28 rounded-full bg-white/20 flex items-center justify-center animate-pulse-once">
            <CheckCircle2 className="w-20 h-20 text-white" strokeWidth={1.5} />
          </div>
          <div className="absolute inset-0 rounded-full bg-white/10 scale-125 animate-ping-once" />
        </div>

        <div className="flex flex-col gap-1">
          <h2 className="text-4xl font-black text-white tracking-widest uppercase">
            Product Matched
          </h2>
          <p className="text-green-100 text-sm font-medium">
            Safe to dispense. Verification successful.
          </p>
        </div>

        <div className="flex items-center gap-2 bg-white/20 rounded-full px-4 py-1.5">
          <div className="w-2 h-2 bg-white rounded-full" />
          <span className="text-white text-xs font-semibold uppercase tracking-wide">Verified</span>
        </div>
      </div>

      <div className="w-full max-w-sm">
        {/* Reuses the shared barcode card so both result screens display the same scan detail. */}
        <ProductCard barcodeText={barcodeText} theme="green" />
      </div>

      <button
        onClick={onScanNext}
        className="w-full max-w-sm bg-white hover:bg-green-50 active:scale-95 text-green-600 font-bold text-lg py-5 rounded-2xl transition-all duration-150 shadow-xl shadow-green-900/20 flex items-center justify-center gap-3"
      >
        <ScanLine className="w-5 h-5" />
        Scan Next Box
      </button>
    </div>
  );
}
