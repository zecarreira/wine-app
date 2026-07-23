"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";

interface HeaderProps {
  backUrl?: string;
  useBackButton?: boolean;
}

export default function Header({
  backUrl,
  useBackButton = true, // Changed default to true - always go back to previous page
}: HeaderProps) {
  const router = useRouter();

  const handleBack = () => {
    // Check if there's history to go back to
    if (window.history.length > 1) {
      router.back();
    } else {
      // If no history, go to home
      router.push("/");
    }
  };

  return (
    <header className="bg-black/20 backdrop-blur-lg border-b border-white/10 sticky top-0 z-10">
      <div className="container mx-auto px-4 py-4 flex items-center justify-between">
        {useBackButton ? (
          <button type="button"
            onClick={handleBack}
            aria-label="Voltar"
            className="text-white/80 hover:text-white text-2xl rounded focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/50"
          >
            ←
          </button>
        ) : (
          <Link
            href={backUrl || "/"}
            aria-label="Voltar"
            className="text-white/80 hover:text-white text-2xl rounded focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/50"
          >
            ←
          </Link>
        )}
        <Link href="/" aria-label="Início" className="text-white/80 hover:text-white text-2xl rounded focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/50">
          🏠
        </Link>
      </div>
    </header>
  );
}
