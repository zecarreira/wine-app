import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Garrafas - Jantar do Vinho",
};

export default function BottlesLayout({ children }: { children: React.ReactNode }) {
  return children;
}
