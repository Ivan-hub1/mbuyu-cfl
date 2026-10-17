interface LoadingOverlayProps {
  message?: string;
  visible: boolean;
}

export default function LoadingOverlay({
  message = 'Please wait…',
  visible,
}: LoadingOverlayProps) {
  if (!visible) return null;

  return (
    <div className="fixed inset-0 z-[9998] flex items-center justify-center bg-brand-black/95 backdrop-blur-sm">
      <div
        className="absolute inset-0 opacity-20"
        style={{
          backgroundImage:
            'radial-gradient(circle at 50% 50%, #E85D04 0%, transparent 60%)',
        }}
      />

      <div className="relative flex flex-col items-center gap-6 px-6 text-center">
        <img
          src="/mbuyu-logo.png"
          alt="Mbuyu CFL"
          className="h-20 md:h-24 w-auto object-contain loading-logo"
        />

        <p className="text-white text-lg font-semibold loading-text">{message}</p>

        <div className="w-56 h-1 rounded-full bg-white/10 overflow-hidden">
          <div className="h-full bg-brand-orange loading-bar" />
        </div>
      </div>
    </div>
  );
}