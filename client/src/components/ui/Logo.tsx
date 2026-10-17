interface LogoProps {
  size?: 'sm' | 'md' | 'lg';
  showTagline?: boolean;
}

export default function Logo({ size = 'md', showTagline = false }: LogoProps) {
  const heights = { sm: 'h-8', md: 'h-16', lg: 'h-16' };
  const textSizes = { sm: 'text-lg', md: 'text-xl', lg: 'text-2xl' };

  return (
    <div className="flex items-center gap-3">
      <img
        src="/mbuyu-logo.png"
        alt="Mbuyu CFL"
        className={`${heights[size]} w-auto object-contain`}
      />
      <div className="leading-tight">
        <div className={`font-extrabold ${textSizes[size]}`}>
          <span className="text-white"></span>{' '}
          <span className="text-brand-orange"></span>
        </div>
        {showTagline && (
          <div className="text-[10px] text-gray-500 italic">
            ...Built to Carry Africa
          </div>
        )}
      </div>
    </div>
  );
}