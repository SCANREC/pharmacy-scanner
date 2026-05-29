import { XCircle, ScanLine } from 'lucide-react';
import ProductCard from './ProductCard';

interface MismatchScreenProps {
  // This older generic red-result screen is kept as a simple reusable fallback.
  barcodeText: string;
  onScanNext: () => void;
}

export default function MismatchScreen({ barcodeText, onScanNext }: MismatchScreenProps) {
  return (
    <div
      className="min-h-screen flex flex-col items-center px-5 py-10 gap-6 overflow-y-auto"
      style={{ backgroundColor: '#ef4444' }}
    >
      {/* Alert hero section for scans that should not continue through the workflow. */}
      <div className="flex flex-col items-center gap-4 text-center pt-4">
        <div className="relative">
          <div className="w-28 h-28 rounded-full bg-white/20 flex items-center justify-center">
            <XCircle className="w-20 h-20 text-white" strokeWidth={1.5} />
          </div>
          <div className="absolute inset-0 rounded-full bg-white/10 scale-125 animate-ping-once" />
        </div>

        <div className="flex flex-col gap-1">
          <h2 className="text-4xl font-black text-white tracking-widest uppercase">
            Invalid Product
          </h2>
          <p className="text-red-100 text-sm font-medium">
            Do not dispense. This item does not match.
          </p>
        </div>

        <div className="flex items-center gap-2 bg-white/20 rounded-full px-4 py-1.5">
          <div className="w-2 h-2 bg-white rounded-full animate-pulse" />
          <span className="text-white text-xs font-semibold uppercase tracking-wide">Alert</span>
        </div>
      </div>

      <div className="w-full max-w-sm">
        {/* Shows the raw scanned value that led to the red result. */}
        <ProductCard barcodeText={barcodeText} theme="red" />
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
