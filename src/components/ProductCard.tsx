interface ProductCardProps {
  // The same card component is reused on multiple result screens, so the only
  // pieces that change are the scanned text and the screen-specific color theme.
  barcodeText: string;
  theme: 'green' | 'red' | 'yellow' | 'slate';
}

export default function ProductCard({ barcodeText, theme }: ProductCardProps) {
  // Theme colors let the same component match either the success or alert screen.
  const border =
    theme === 'green'
      ? 'border-green-300/30'
      : theme === 'yellow'
        ? 'border-yellow-300/30'
        : theme === 'slate'
          ? 'border-slate-300/30'
          : 'border-red-300/30';
  const labelColor =
    theme === 'green'
      ? 'text-green-100/70'
      : theme === 'yellow'
        ? 'text-yellow-100/80'
        : theme === 'slate'
          ? 'text-slate-100/80'
          : 'text-red-100/70';
  // The color mapping stays local to this component so result screens can stay
  // simple and only choose the semantic theme they want to show.

  return (
    <div className={`w-full rounded-2xl border ${border} bg-white/15 px-5 py-5`}>
      <p className={`text-xs font-bold uppercase tracking-widest mb-3 ${labelColor}`}>
        Scanned Barcode
      </p>
      <p className="text-white font-mono text-2xl font-bold tracking-widest break-all">
        {barcodeText || '—'}
      </p>
    </div>
  );
}
