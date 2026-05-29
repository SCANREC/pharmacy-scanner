import { ScanLine } from 'lucide-react';

interface HomeScreenProps {
  // The home screen only needs one action: start the live scanner.
  onStartScan: () => void;
}

export default function HomeScreen({ onStartScan }: HomeScreenProps) {
  return (
    <div className="min-h-screen bg-gray-950 flex flex-col items-center justify-between px-6 py-12">
      {/* Product branding and one-line explanation of the app's purpose. */}
      <div className="flex flex-col items-center gap-3 pt-8">
        <div className="bg-blue-500/10 border border-blue-500/20 rounded-2xl p-4">
          <ScanLine className="w-10 h-10 text-blue-400" strokeWidth={1.5} />
        </div>
        <h1 className="text-3xl font-bold text-white tracking-tight">Pharmacy Scanner</h1>
        <p className="text-gray-400 text-sm text-center max-w-xs leading-relaxed">
          Scan product barcodes to instantly verify medication shipments.
        </p>
      </div>

      <div className="w-full max-w-sm flex flex-col items-center gap-6">
        {/* Static placeholder card that hints at the scan experience before the camera opens. */}
        <div className="w-full aspect-square max-w-[260px] rounded-2xl border-2 border-dashed border-gray-700 flex items-center justify-center bg-gray-900/50">
          <div className="flex flex-col items-center gap-3 text-center px-6">
            <div className="grid grid-cols-3 gap-1 opacity-30">
              {/* This fake barcode grid is purely visual and is not connected
                  to the real scanner. It just makes the landing screen feel
                  related to the scanning workflow. */}
              {Array.from({ length: 9 }).map((_, i) => (
                <div
                  key={i}
                  className="h-6 bg-gray-400 rounded-sm"
                  style={{ width: `${20 + Math.random() * 20}px` }}
                />
              ))}
            </div>
            <p className="text-gray-500 text-xs">Barcode preview area</p>
          </div>
        </div>

        {/* Primary CTA that moves the app from the home screen into camera scanning. */}
        <button
          onClick={onStartScan}
          className="w-full bg-blue-500 hover:bg-blue-400 active:scale-95 text-white font-semibold text-lg py-5 rounded-2xl transition-all duration-150 shadow-lg shadow-blue-500/25 flex items-center justify-center gap-3"
        >
          <ScanLine className="w-5 h-5" />
          Start Scan
        </button>

        <p className="text-gray-600 text-xs text-center">
          Camera access required for barcode scanning
        </p>
      </div>

      <div className="text-gray-700 text-xs">v1.0 &middot; Pharmacy Verification System</div>
    </div>
  );
}
