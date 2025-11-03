import Link from "next/link";

interface HeaderProps {
  backUrl: string;
  backText?: string;
  icon?: string;
}

export default function Header({
  backUrl,
  backText = "Back",
  icon = "🍷",
}: HeaderProps) {
  return (
    <header className="bg-black/20 backdrop-blur-lg border-b border-white/10 sticky top-0 z-10">
      <div className="container mx-auto px-4 py-4 flex items-center justify-between">
        <Link
          href={backUrl}
          className="text-white/80 hover:text-white flex items-center gap-2 text-lg"
        >
          <span>←</span>
          <span className="font-semibold">{backText}</span>
        </Link>
        <div className="text-white text-2xl">{icon}</div>
      </div>
    </header>
  );
}
