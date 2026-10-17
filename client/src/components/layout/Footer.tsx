import Logo from '../ui/Logo';

export default function Footer() {
  return (
    <footer className="border-t border-brand-black-muted bg-brand-black-soft mt-24">
      <div className="max-w-7xl mx-auto px-6 py-10 flex flex-col items-center justify-center gap-4">
        <Logo />
        <p className="text-xs text-gray-500 text-center">
          © {new Date().getFullYear()} Mbuyu CFL. All rights reserved.
        </p>
      </div>
    </footer>
  );
}