import { useEffect, useState } from 'react';

interface SplashScreenProps {
  duration?: number; // in milliseconds
  onFinish: () => void;
}

export default function SplashScreen({ duration = 5000, onFinish }: SplashScreenProps) {
  const [fading, setFading] = useState(false);

  useEffect(() => {
    // Start fade-out 500ms before duration ends
    const fadeTimer = setTimeout(() => setFading(true), duration - 500);

    // Trigger onFinish when fully done
    const finishTimer = setTimeout(() => {
      onFinish();
    }, duration);

    return () => {
      clearTimeout(fadeTimer);
      clearTimeout(finishTimer);
    };
  }, [duration, onFinish]);

  return (
    <div
      className={`fixed inset-0 z-[9999] flex items-center justify-center bg-brand-black transition-opacity duration-500 ${
        fading ? 'opacity-0 pointer-events-none' : 'opacity-100'
      }`}
    >
      {/* Subtle orange radial glow */}
      <div
        className="absolute inset-0 opacity-30"
        style={{
          backgroundImage:
            'radial-gradient(circle at 50% 50%, #E85D04 0%, transparent 60%)',
        }}
      />

      <div className="relative flex flex-col items-center gap-6 px-6 text-center">
        {/* Logo */}
        <img
          src="/mbuyu-logo.png"
          alt="Mbuyu CFL"
          className="h-32 md:h-40 w-auto object-contain splash-logo"
        />

        {/* Slogan */}
        <h1 className="text-2xl md:text-4xl font-extrabold text-white splash-slogan">
          Built to <span className="text-brand-orange">Carry Africa</span>
        </h1>

        {/* Progress bar */}
        <div className="w-48 h-1 rounded-full bg-white/10 overflow-hidden mt-4">
          <div
            className="h-full bg-brand-orange splash-progress"
            style={{ animationDuration: `${duration}ms` }}
          />
        </div>
      </div>
    </div>
  );
}