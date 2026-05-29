import { useState } from 'react';
import HomeScreen from './components/HomeScreen';
import ScannerScreen from './components/ScannerScreen';
import MatchScreen from './components/MatchScreen';
import FlaggedScreen from './components/FlaggedScreen';
import BlockedScreen from './components/BlockedScreen';
import UnresolvedScreen from './components/UnresolvedScreen';
import type { ScanResult } from './scanner-lib/scanner';

// App.tsx is the top-level coordinator for the entire frontend.
// It does not do scanning or parsing itself. Instead, it:
// 1. decides which screen should be visible,
// 2. stores the last completed scan result,
// 3. hands that result to the appropriate outcome screen.

// ResultScreen names mirror the final SCANREC states after the scanner
// finishes parsing and verification. Keeping these as explicit values makes
// the app flow easier to follow than a generic "success/failure" router.
type ResultScreen = 'approved' | 'flagged' | 'blocked' | 'unresolved';
type Screen = 'home' | 'scanner' | ResultScreen;

// Converts a backend/domain-oriented final status into the local screen name
// that this small React app uses to decide what to render.
function getScreenForFinalStatus(finalStatus: ScanResult['finalStatus']): ResultScreen {
  switch (finalStatus) {
    case 'APPROVED':
      return 'approved';
    case 'BLOCKED':
      return 'blocked';
    case 'UNRESOLVED':
      return 'unresolved';
    case 'FLAGGED':
    default:
      return 'flagged';
  }
}

export default function App() {
  // This top-level state acts like a simple screen router for the MVP flow.
  // It replaces the need for React Router while the app is still small.
  const [screen, setScreen] = useState<Screen>('home');

  // Stores the most recent completed scan so result screens can show the
  // barcode text and any explanation returned by parsing/verification.
  const [scanResult, setScanResult] = useState<ScanResult | null>(null);

  const handleResult = (result: ScanResult) => {
    // ScannerScreen calls this once it has finished the full scan pipeline.
    // We save the result first, then choose the matching UI screen from the
    // domain status returned by the scanner flow.
    setScanResult(result);
    setScreen(getScreenForFinalStatus(result.finalStatus));
  };

  const handleScanNext = () => {
    // "Scan next" clears the previous result so the next box starts fresh.
    setScanResult(null);
    setScreen('home');
  };

  if (screen === 'home') {
    // Landing screen before the user opens the live camera scanner.
    return <HomeScreen onStartScan={() => setScreen('scanner')} />;
  }

  if (screen === 'scanner') {
    return (
      <ScannerScreen
        // ScannerScreen owns the camera and barcode logic, then reports back
        // one final structured result object when a scan is finished.
        onResult={handleResult}
        onCancel={() => setScreen('home')}
      />
    );
  }

  if (screen === 'approved') {
    // The success screen reads the raw scanned value from the last result.
    return <MatchScreen barcodeText={scanResult?.rawValue ?? ''} onScanNext={handleScanNext} />;
  }

  if (!scanResult) {
    // Safety fallback: if a result screen is requested without data, return the
    // user to a known-good state instead of rendering a broken result page.
    return <HomeScreen onStartScan={() => setScreen('scanner')} />;
  }

  if (screen === 'flagged') {
    return <FlaggedScreen scanResult={scanResult} onScanNext={handleScanNext} />;
  }

  if (screen === 'blocked') {
    return <BlockedScreen scanResult={scanResult} onScanNext={handleScanNext} />;
  }

  return <UnresolvedScreen scanResult={scanResult} onScanNext={handleScanNext} />;
}
