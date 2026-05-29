import { useEffect, useRef, useState, useCallback } from 'react';
import { X, ScanLine, AlertCircle } from 'lucide-react';
import { Html5Qrcode } from 'html5-qrcode';
import { normalizeRawScan, parseGs1Barcode } from '../scanner-lib/gs1-parser';
import type { ScanResult } from '../scanner-lib/scanner';
import { verifyParsedScan } from '../services/verification';
import { logComplianceResult } from '../services/complianceLog';

// ScannerScreen owns the live camera experience. This is the densest part of
// the frontend because it has to coordinate browser APIs, scan confirmation,
// GS1 parsing, verification, error handling, and cleanup.

interface ScannerScreenProps {
  // Called exactly once after a scan has been parsed and verified. Database
  // logging happens separately in the background so the UI can respond faster.
  onResult: (result: ScanResult) => void;

  // Lets the parent screen exit the scanner without producing a scan result.
  onCancel: () => void;
}

// The scanner requires several repeated reads of the same barcode before it is
// trusted. This reduces false positives from shaky camera frames.
const REQUIRED_HITS_NATIVE = 5;
const REQUIRED_HITS_HTML5 = 2;

// Width/height of the on-screen scan target box. The native scanner path also
// uses this size to crop the video feed before barcode detection.
const ROI_WIDTH = 280;
const ROI_HEIGHT = 120;

declare global {
  interface Window {
    BarcodeDetector: {
      new(options?: { formats: string[] }): BarcodeDetectorInstance;
      getSupportedFormats(): Promise<string[]>;
    };
  }
  interface BarcodeDetectorInstance {
    detect(image: HTMLVideoElement | ImageBitmap | HTMLCanvasElement): Promise<Array<{ rawValue: string; format: string }>>;
  }
}

function hasBarcodeDetector(): boolean {
  // Browsers with native BarcodeDetector support can use a faster custom scan
  // loop. Older iOS browsers fall back to html5-qrcode instead.
  return 'BarcodeDetector' in window;
}

export default function ScannerScreen({ onResult, onCancel }: ScannerScreenProps) {
  // Decide once per render which engine we will use. The rest of the component
  // adapts its thresholds and startup path based on that decision.
  const useHtml5Path = !hasBarcodeDetector();
  const requiredHits = useHtml5Path ? REQUIRED_HITS_HTML5 : REQUIRED_HITS_NATIVE;

  // Refs store live scanner objects and counters without forcing React re-renders.
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const animFrameRef = useRef<number>(0);
  const committedRef = useRef(false);
  const hitCountRef = useRef(0);
  const lastTextRef = useRef('');
  const detectorRef = useRef<BarcodeDetectorInstance | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const html5QrRef = useRef<Html5Qrcode | null>(null);
  const detectingRef = useRef(false);

  const [status, setStatus] = useState<'starting' | 'scanning' | 'locking' | 'processing' | 'error'>('starting');
  const [lockProgress, setLockProgress] = useState(0);
  const [detectedText, setDetectedText] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [containerSize, setContainerSize] = useState({ width: 0, height: 0 });
  // status drives most of the UI state:
  // - starting: camera booting up
  // - scanning: waiting for a candidate barcode
  // - locking: barcode seen, still confirming repeat reads
  // - processing: barcode accepted, parse/verify in progress
  // - error: camera startup failed

  useEffect(() => {
    // Tracks the rendered scanner box so the overlay stays centered as the layout changes.
    if (!containerRef.current) return;
    const ro = new ResizeObserver((entries) => {
      for (const entry of entries) {
        setContainerSize({
          width: entry.contentRect.width,
          height: entry.contentRect.height,
        });
      }
    });
    ro.observe(containerRef.current);
    return () => ro.disconnect();
  }, []);

  const resetDetectionLock = useCallback(() => {
    // Both scanner engines use the same lock state so they can recover cleanly
    // when a partially read barcode disappears before confirmation.
    hitCountRef.current = 0;
    lastTextRef.current = '';
    setLockProgress(0);
    setDetectedText('');
    setStatus('scanning');
  }, []);

  const queueComplianceLog = useCallback((result: ScanResult) => {
    // Logging is intentionally detached from the screen transition so a slow
    // network request does not make a successful scan look broken to the user.
    void logComplianceResult(result).catch((error) => {
      // At the moment we only log the failure to the console. This keeps the
      // main scanning UX responsive while still leaving a trace for debugging.
      console.error('Failed to write compliance log', error);
    });
  }, []);

  const finalizeConfirmedBarcode = useCallback(
    async (text: string) => {
      // This helper runs only after the camera has seen a stable barcode value.
      // From here on, the flow is: parse -> verify -> notify UI -> log in background.
      const parseResult = parseGs1Barcode(text);

      if (parseResult.status === 'incomplete') {
        // Incomplete scans never reach product verification because SCANREC
        // requires all four GS1 fields before verification can be trusted.
        const result: ScanResult = {
          rawValue: text,
          finalStatus: 'UNRESOLVED',
          parsingResult: parseResult.status,
          missingFields: parseResult.missingFields,
        };

        onResult(result);
        queueComplianceLog(result);
        return;
      }

      // Once parsing succeeds, verification decides whether the scan should be
      // approved or flagged based on shipment data.
      const verificationResult = await verifyParsedScan(parseResult.data);

      const result: ScanResult = {
        rawValue: text,
        finalStatus: verificationResult.finalStatus,
        parsingResult: parseResult.status,
        parsedData: parseResult.data,
        productVerificationStatus: verificationResult.productVerificationStatus,
        verificationReason: verificationResult.verificationReason,
        matchedShipment: verificationResult.matchedShipment,
      };

      onResult(result);
      queueComplianceLog(result);
    },
    [onResult, queueComplianceLog]
  );


  const handleDetected = useCallback(
    (text: string) => {
      // Ignore duplicate callbacks once a scan result has already been committed.
      if (committedRef.current) return;

      // Require the same barcode to be seen several times in a row before accepting it.
      // Compare normalized values so scanner-specific GS1 prefixes or framing
      // differences do not prevent the same barcode from locking successfully.
      const normalizedText = normalizeRawScan(text);

      if (normalizedText !== lastTextRef.current) {
        lastTextRef.current = normalizedText;
        hitCountRef.current = 1;
      } else {
        hitCountRef.current += 1;
      }

      const hits = hitCountRef.current;
      setDetectedText(text);
      setLockProgress(hits);

      // "locking" means the scanner is still confirming repeated reads.
      // "processing" means the barcode has been accepted and is being handled.
      setStatus(hits >= requiredHits ? 'processing' : 'locking');

      if (hits >= requiredHits) {
        // committedRef prevents late duplicate callbacks from sending multiple
        // result events after one scan has already been accepted.
        committedRef.current = true;
        void finalizeConfirmedBarcode(text);
      }
    },
    [finalizeConfirmedBarcode, requiredHits]
  );

  const stopStream = useCallback(() => {
    // Stop any active camera tracks when leaving the scanner screen.
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }
  }, []);

  // Html5Qrcode-based path (iOS and browsers without BarcodeDetector)
  useEffect(() => {
    if (hasBarcodeDetector()) return;

    let cancelled = false;
    const qrDivId = 'html5qr-scanner-region';

    const startHtml5Scanner = async () => {
      try {
        // Ask for camera permission first so we can show a clearer error if
        // access is denied before html5-qrcode starts its internal pipeline.
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: 'environment' },
          audio: false,
        });
        if (cancelled) {
          stream.getTracks().forEach((t) => t.stop());
          return;
        }
        // We only need the stream to verify camera permission; html5-qrcode manages its own stream
        stream.getTracks().forEach((t) => t.stop());

        const scanner = new Html5Qrcode(qrDivId, { verbose: false });
        html5QrRef.current = scanner;

        // html5-qrcode handles camera frames internally and calls us with decoded text.
        await scanner.start(
          { facingMode: 'environment' },
          {
            fps: 10,
            qrbox: { width: ROI_WIDTH, height: ROI_HEIGHT },
            aspectRatio: 4 / 3,
          },
          (decodedText) => {
            // We deliberately send every decode through the shared lock logic so
            // the html5 path and native path feel the same to the user.
            if (!cancelled) handleDetected(decodedText);
          },
          () => {
            // "Not found" callbacks are expected on many frames. We only use
            // them to clear a half-complete lock when the barcode disappears.
            if (!cancelled && hitCountRef.current > 0 && !committedRef.current) {
              resetDetectionLock();
            }
          }
        );

        if (!cancelled) setStatus('scanning');
      } catch (err) {
        if (cancelled) return;
        const message = err instanceof Error ? err.message : 'Camera access denied or unavailable.';
        setErrorMsg(message);
        setStatus('error');
      }
    };

    startHtml5Scanner();

    return () => {
      cancelled = true;
      committedRef.current = true;
      if (html5QrRef.current) {
        html5QrRef.current.stop().catch(() => {}).finally(() => {
          html5QrRef.current?.clear();
          html5QrRef.current = null;
        });
      }
    };
  }, [handleDetected, resetDetectionLock]);

  // Native BarcodeDetector path (Android Chrome / desktop)
  useEffect(() => {
    if (!hasBarcodeDetector()) return;

    let cancelled = false;

    const initDetector = async (): Promise<BarcodeDetectorInstance | null> => {
      try {
        // Request only formats that matter for this app when possible, so the
        // native detector does less unnecessary work per frame.
        const formats = await window.BarcodeDetector.getSupportedFormats();
        const barcodeFormats = formats.filter((f) =>
          ['ean_13', 'ean_8', 'upc_a', 'upc_e', 'code_128', 'code_39', 'qr_code', 'data_matrix'].includes(f)
        );
        return new window.BarcodeDetector({ formats: barcodeFormats.length ? barcodeFormats : formats });
      } catch {
        return null;
      }
    };

    const startScanner = async () => {
      try {
        const detector = await initDetector();
        if (cancelled) return;
        detectorRef.current = detector;

        const stream = await navigator.mediaDevices.getUserMedia({
          video: {
            facingMode: { ideal: 'environment' },
            width: { ideal: 1280 },
            height: { ideal: 720 },
          },
          audio: false,
        });
        if (cancelled) {
          stream.getTracks().forEach((t) => t.stop());
          return;
        }

        streamRef.current = stream;

        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          await videoRef.current.play();
        }

        if (!cancelled) setStatus('scanning');
        scanLoop();
      } catch (err) {
        if (cancelled) return;
        const message = err instanceof Error ? err.message : 'Camera access denied or unavailable.';
        setErrorMsg(message);
        setStatus('error');
      }
    };

    const scanLoop = () => {
      // The native path runs a manual animation-frame loop so we can crop the
      // video to the center guide box before barcode detection.
      if (cancelled || committedRef.current) return;

      const video = videoRef.current;
      const canvas = canvasRef.current;
      if (!video || !canvas || video.readyState < 2) {
        animFrameRef.current = requestAnimationFrame(scanLoop);
        return;
      }

      const vw = video.videoWidth;
      const vh = video.videoHeight;
      if (!vw || !vh) {
        animFrameRef.current = requestAnimationFrame(scanLoop);
        return;
      }

      if (detectingRef.current) {
        animFrameRef.current = requestAnimationFrame(scanLoop);
        return;
      }

      const renderedW = video.clientWidth;
      const renderedH = video.clientHeight;

      // Convert the on-screen guide box into source-video coordinates for cropped detection.
      const scaleX = vw / renderedW;
      const scaleY = vh / renderedH;

      const roiX = Math.round(((renderedW - ROI_WIDTH) / 2) * scaleX);
      const roiY = Math.round(((renderedH - ROI_HEIGHT) / 2) * scaleY);
      const roiW = Math.round(ROI_WIDTH * scaleX);
      const roiH = Math.round(ROI_HEIGHT * scaleY);

      canvas.width = roiW;
      canvas.height = roiH;
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        animFrameRef.current = requestAnimationFrame(scanLoop);
        return;
      }

      ctx.drawImage(video, roiX, roiY, roiW, roiH, 0, 0, roiW, roiH);

      detectingRef.current = true;
      const doDetect = async () => {
        if (cancelled || committedRef.current) {
          detectingRef.current = false;
          return;
        }
        try {
          if (detectorRef.current) {
            const barcodes = await detectorRef.current.detect(canvas);
            if (barcodes.length > 0 && barcodes[0].rawValue) {
              // Feed the decoded raw text back into the shared confirmation
              // logic so both scan engines behave the same way.
              handleDetected(barcodes[0].rawValue);
              detectingRef.current = false;
              if (!committedRef.current) {
                animFrameRef.current = requestAnimationFrame(scanLoop);
              }
              return;
            }
          }
        } catch {
          // Detection errors are ignored frame-by-frame because transient
          // decode failures are normal during live video scanning.
        }

        detectingRef.current = false;
        if (!committedRef.current) {
          if (hitCountRef.current > 0) {
            // If the barcode disappears mid-lock, clear the progress dots and
            // make the user reacquire a stable scan from the beginning.
            resetDetectionLock();
          }
          animFrameRef.current = requestAnimationFrame(scanLoop);
        }
      };

      doDetect();
    };

    startScanner();

    return () => {
      cancelled = true;
      cancelAnimationFrame(animFrameRef.current);
      stopStream();
    };
  }, [handleDetected, resetDetectionLock, stopStream]);

  const handleCancel = () => {
    // Cancelling should stop all active work immediately so the camera is fully
    // released before the app returns to the previous screen.
    committedRef.current = true;
    cancelAnimationFrame(animFrameRef.current);
    stopStream();
    if (html5QrRef.current) {
      html5QrRef.current.stop().catch(() => {}).finally(() => {
        html5QrRef.current?.clear();
        html5QrRef.current = null;
        onCancel();
      });
    } else {
      onCancel();
    }
  };

  const isLocking = status === 'locking';
  const isProcessing = status === 'processing';

  // The scan box corners change color while a barcode is being confirmed so
  // users have immediate feedback that the app is locking onto a value.
  const cornerColor = isLocking ? 'border-yellow-400' : 'border-blue-400';

  return (
    <div className="min-h-screen bg-gray-950 flex flex-col">
      <div className="flex items-center justify-between px-5 py-4 border-b border-gray-800">
        <div className="flex items-center gap-2">
          <ScanLine className="w-5 h-5 text-blue-400" />
          <span className="text-white font-semibold">
            {isLocking ? 'Locking on...' : isProcessing ? 'Confirmed!' : 'Pharmacy Scanner'}
          </span>
        </div>
        <button
          onClick={handleCancel}
          className="w-9 h-9 rounded-full bg-gray-800 hover:bg-gray-700 flex items-center justify-center transition-colors"
          aria-label="Cancel scan"
        >
          <X className="w-4 h-4 text-gray-300" />
        </button>
      </div>

      <div className="flex-1 flex flex-col items-center justify-center px-4 gap-6">
        {status === 'error' ? (
          <div className="flex flex-col items-center gap-4 text-center max-w-xs">
            <div className="w-16 h-16 rounded-full bg-red-500/10 flex items-center justify-center">
              <AlertCircle className="w-8 h-8 text-red-400" />
            </div>
            <div>
              <p className="text-white font-semibold text-lg">Camera Unavailable</p>
              <p className="text-gray-400 text-sm mt-1 leading-relaxed">{errorMsg}</p>
              <p className="text-gray-500 text-xs mt-2">
                Make sure camera permissions are granted in your browser.
              </p>
            </div>
            <button
              onClick={handleCancel}
              className="mt-2 bg-gray-800 hover:bg-gray-700 text-white font-medium px-6 py-3 rounded-xl transition-colors"
            >
              Go Back
            </button>
          </div>
        ) : (
          <>
            <div
              ref={containerRef}
              className="relative w-full max-w-sm rounded-2xl overflow-hidden bg-gray-900"
              style={{ aspectRatio: '4/3' }}
            >
              {useHtml5Path ? (
                // html5-qrcode renders its own video into this div
                <div
                  id="html5qr-scanner-region"
                  className="absolute inset-0 w-full h-full [&_video]:w-full [&_video]:h-full [&_video]:object-cover [&_img]:hidden [&_#html5-qrcode-anchor-scan-type-change]:hidden"
                  style={{ background: '#111827' }}
                />
              ) : (
                <>
                  <video
                    ref={videoRef}
                    className="absolute inset-0 w-full h-full object-cover"
                    playsInline
                    muted
                    autoPlay
                  />
                  <canvas ref={canvasRef} className="hidden" />
                </>
              )}

              {status === 'starting' && (
                <div className="absolute inset-0 bg-gray-900 flex flex-col items-center justify-center gap-3 z-10">
                  <div className="w-8 h-8 border-2 border-blue-400 border-t-transparent rounded-full animate-spin" />
                  <p className="text-gray-400 text-sm">Starting camera...</p>
                </div>
              )}

              {isProcessing && (
                <div className="absolute inset-0 bg-gray-900/90 flex flex-col items-center justify-center gap-3 z-10">
                  <div className="w-8 h-8 border-2 border-green-400 border-t-transparent rounded-full animate-spin" />
                  <p className="text-gray-300 text-sm font-medium">Reading barcode...</p>
                </div>
              )}

              {(status === 'scanning' || isLocking) && (
                <div className="absolute inset-0 pointer-events-none z-10">
                  {containerSize.width > 0 && (() => {
                    const cw = containerSize.width;
                    const ch = containerSize.height;
                    const roiLeft = (cw - ROI_WIDTH) / 2;
                    const roiTop = (ch - ROI_HEIGHT) / 2;
                    const roiRight = roiLeft + ROI_WIDTH;
                    const roiBottom = roiTop + ROI_HEIGHT;

                    return (
                      <>
                        <div
                          className="absolute inset-0 bg-black/50"
                          style={{
                            // Darkens everything outside the scan region so the target area stands out.
                            clipPath: `polygon(
                              0 0, ${cw}px 0, ${cw}px ${ch}px, 0 ${ch}px,
                              0 ${roiBottom}px, ${roiLeft}px ${roiBottom}px,
                              ${roiLeft}px ${roiTop}px, ${roiRight}px ${roiTop}px,
                              ${roiRight}px ${roiBottom}px, 0 ${roiBottom}px
                            )`,
                          }}
                        />

                        <div
                          className="absolute"
                          style={{
                            left: roiLeft,
                            top: roiTop,
                            width: ROI_WIDTH,
                            height: ROI_HEIGHT,
                          }}
                        >
                          <div className={`absolute top-0 left-0 w-6 h-6 border-t-2 border-l-2 rounded-tl ${cornerColor} transition-colors duration-300`} />
                          <div className={`absolute top-0 right-0 w-6 h-6 border-t-2 border-r-2 rounded-tr ${cornerColor} transition-colors duration-300`} />
                          <div className={`absolute bottom-0 left-0 w-6 h-6 border-b-2 border-l-2 rounded-bl ${cornerColor} transition-colors duration-300`} />
                          <div className={`absolute bottom-0 right-0 w-6 h-6 border-b-2 border-r-2 rounded-br ${cornerColor} transition-colors duration-300`} />
                          <div className={`animate-scan-line ${isLocking ? 'bg-yellow-400/80' : 'bg-blue-400/60'} transition-colors duration-300`} />
                        </div>
                      </>
                    );
                  })()}
                </div>
              )}
            </div>

            <div className="text-center flex flex-col items-center gap-3 w-full max-w-sm">
              {isLocking ? (
                <>
                  <p className="text-yellow-400 text-sm font-semibold">Barcode detected — hold steady</p>
                  <div className="flex gap-2">
                    {Array.from({ length: requiredHits }).map((_, i) => (
                      <div
                        key={i}
                        className={`w-3 h-3 rounded-full transition-all duration-150 ${
                          i < lockProgress ? 'bg-yellow-400 scale-110' : 'bg-gray-700'
                        }`}
                      />
                    ))}
                  </div>
                  <p className="text-gray-400 text-xs font-mono bg-gray-900 px-3 py-1.5 rounded-lg border border-gray-700 max-w-full truncate">
                    {detectedText}
                  </p>
                </>
              ) : (
                <>
                  <p className="text-gray-300 text-base font-medium">
                    {status === 'starting' ? 'Initializing camera...' : 'Align barcode within the frame'}
                  </p>
                  <p className="text-gray-500 text-sm">Keep all four corners visible and hold steady</p>
                </>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
