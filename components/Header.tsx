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

  return (
    <header className="bg-black/20 backdrop-blur-lg border-b border-white/10 sticky top-0 z-10">
      <div className="container mx-auto px-4 py-4 flex items-center justify-between">
        {useBackButton ? (
          <button
            onClick={() => router.back()}
            className="text-white/80 hover:text-white text-2xl"
          >
            ←
          </button>
        ) : (
          <Link
            href={backUrl || "/"}
            className="text-white/80 hover:text-white text-2xl"
          >
            ←
          </Link>
        )}
        <Link href="/" className="text-white/80 hover:text-white text-2xl">
          🏠
        </Link>
      </div>
    </header>
  );
}
