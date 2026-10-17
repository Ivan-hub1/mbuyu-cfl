interface SectionHeadingProps {
  icon?: string;
  title: string;
  subtitle?: string;
}

export default function SectionHeading({
  icon,
  title,
  subtitle,
}: SectionHeadingProps) {
  return (
    <div className="mb-6 pb-4 border-b border-brand-black-muted">
      <h3 className="text-lg font-semibold flex items-center gap-2">
        {icon && <span className="text-brand-orange">{icon}</span>}
        <span>{title}</span>
      </h3>
      {subtitle && (
        <p className="text-sm text-gray-500 mt-1">{subtitle}</p>
      )}
    </div>
  );
}