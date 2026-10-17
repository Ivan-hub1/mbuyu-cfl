import { useEffect, useRef, useState } from 'react';

interface CameraCaptureProps {
  title: string;
  subtitle?: string;
  onCapture: (dataUrl: string) => void;
  onCancel: () => void;
}

/**
 * Real-device camera capture modal.
 * Uses navigator.mediaDevices.getUserMedia — nothing can be uploaded.
 * The user MUST capture a live frame from the camera.
 *
 * Enforces:
 *   - Camera permission
 *   - Front or back camera (defaults to environment/rear)
 *   - Photo compression to ~1200px wide, ~75% JPEG
 */
export default function CameraCapture({
  title,
  subtitle,
  onCapture,
  onCancel,
}: CameraCaptureProps) {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const [state, setState] = useState<
    'idle' | 'starting' | 'ready' | 'capturing' | 'error'
  >('starting');
  const [errorMsg, setErrorMsg] = useState('');
  const [facing, setFacing] = useState<'environment' | 'user'>('environment');
  const [preview, setPreview] = useState<string | null>(null);

  // ─── Start camera ───────────────────────────────────────
  const startCamera = async (facingMode: 'environment' | 'user') => {
    setState('starting');
    setErrorMsg('');
    try {
      // Stop any existing stream
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((t) => t.stop());
        streamRef.current = null;
      }

      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: { ideal: facingMode },
          width: { ideal: 1280 },
          height: { ideal: 720 },
        },
        audio: false,
      });

      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }
      setState('ready');
    } catch (err: any) {
      console.error('[camera]', err);
      let msg = 'Could not access camera.';
      if (err?.name === 'NotAllowedError') {
        msg =
          'Camera permission denied. Please allow camera access in your browser settings and try again.';
      } else if (err?.name === 'NotFoundError') {
        msg = 'No camera found on this device.';
      } else if (err?.name === 'NotReadableError') {
        msg = 'Camera is already in use by another app.';
      } else if (err?.message) {
        msg = err.message;
      }
      setErrorMsg(msg);
      setState('error');
    }
  };

  // ─── Stop camera on unmount ─────────────────────────────
  useEffect(() => {
    startCamera(facing);
    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((t) => t.stop());
        streamRef.current = null;
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const switchCamera = async () => {
    const next = facing === 'environment' ? 'user' : 'environment';
    setFacing(next);
    await startCamera(next);
  };

  // ─── Capture photo ──────────────────────────────────────
  const capture = () => {
    if (!videoRef.current || !canvasRef.current) return;
    setState('capturing');

    const video = videoRef.current;
    const canvas = canvasRef.current;

    // Resize to max 1200px wide
    const MAX_W = 1200;
    const ratio = video.videoWidth / video.videoHeight;
    const w = Math.min(MAX_W, video.videoWidth);
    const h = w / ratio;

    canvas.width = w;
    canvas.height = h;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.drawImage(video, 0, 0, w, h);

    // JPEG quality ~75%
    const dataUrl = canvas.toDataURL('image/jpeg', 0.75);
    setPreview(dataUrl);
  };

  const confirm = () => {
    if (!preview) return;
    // Stop the camera
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }
    onCapture(preview);
  };

  const retake = () => {
    setPreview(null);
    setState('ready');
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/95 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="w-full max-w-2xl">
        <div className="bg-brand-black-soft border border-brand-black-muted rounded-xl overflow-hidden">
          {/* Header */}
          <div className="px-5 py-4 border-b border-brand-black-muted flex items-center justify-between">
            <div>
              <h3 className="font-bold text-lg">{title}</h3>
              {subtitle && (
                <p className="text-xs text-gray-500 mt-0.5">{subtitle}</p>
              )}
            </div>
            <button
              onClick={onCancel}
              className="text-gray-400 hover:text-white text-2xl leading-none"
            >
              ×
            </button>
          </div>

          {/* Camera preview area */}
          <div className="relative bg-black" style={{ aspectRatio: '16/10' }}>
            {state === 'starting' && (
              <div className="absolute inset-0 flex items-center justify-center text-gray-400">
                <div className="text-center">
                  <div className="w-10 h-10 border-2 border-brand-orange border-t-transparent rounded-full animate-spin mx-auto mb-3" />
                  Starting camera…
                </div>
              </div>
            )}

            {state === 'error' && (
              <div className="absolute inset-0 flex items-center justify-center p-6 text-center">
                <div>
                  <div className="text-5xl mb-3">📷</div>
                  <p className="text-red-400 mb-4">{errorMsg}</p>
                  <button
                    onClick={() => startCamera(facing)}
                    className="btn-primary text-sm"
                  >
                    ↻ Try Again
                  </button>
                </div>
              </div>
            )}

            {preview ? (
              <img
                src={preview}
                alt="Captured"
                className="w-full h-full object-contain"
              />
            ) : (
              <video
                ref={videoRef}
                playsInline
                muted
                autoPlay
                className="w-full h-full object-cover"
                style={{
                  display: state === 'ready' || state === 'capturing' ? 'block' : 'none',
                }}
              />
            )}

            {/* Grid overlay to look like a real camera */}
            {state === 'ready' && !preview && (
              <div className="absolute inset-0 pointer-events-none">
                <div className="absolute inset-0 border-2 border-white/10" />
                <div className="absolute top-1/3 left-0 right-0 h-px bg-white/10" />
                <div className="absolute top-2/3 left-0 right-0 h-px bg-white/10" />
                <div className="absolute left-1/3 top-0 bottom-0 w-px bg-white/10" />
                <div className="absolute left-2/3 top-0 bottom-0 w-px bg-white/10" />
              </div>
            )}
          </div>

          {/* Hidden canvas for capture */}
          <canvas ref={canvasRef} className="hidden" />

          {/* Controls */}
          <div className="px-5 py-4 border-t border-brand-black-muted flex items-center justify-between gap-3 flex-wrap">
            {preview ? (
              <>
                <button
                  onClick={retake}
                  className="btn-outline text-sm flex-1 sm:flex-none"
                >
                  ↻ Retake
                </button>
                <button
                  onClick={confirm}
                  className="btn-primary text-sm flex-1 sm:flex-none"
                >
                  ✓ Use This Photo
                </button>
              </>
            ) : (
              <>
                <button
                  onClick={switchCamera}
                  disabled={state !== 'ready'}
                  className="btn-outline text-sm"
                >
                  🔄 {facing === 'environment' ? 'Front' : 'Rear'}
                </button>

                <button
                  onClick={capture}
                  disabled={state !== 'ready'}
                  className="w-16 h-16 rounded-full bg-white border-4 border-brand-orange shadow-lg hover:bg-gray-200 transition disabled:opacity-50"
                  aria-label="Take photo"
                >
                  <span className="sr-only">Take photo</span>
                </button>

                <button
                  onClick={onCancel}
                  className="text-sm text-gray-400 hover:text-white px-3 py-2"
                >
                  Cancel
                </button>
              </>
            )}
          </div>
        </div>

        <p className="text-xs text-gray-500 text-center mt-3">
          📸 This photo is captured live from your device camera. Uploading is
          disabled to prevent fraud.
        </p>
      </div>
    </div>
  );
}