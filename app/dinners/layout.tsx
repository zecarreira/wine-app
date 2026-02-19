import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Jantares - Jantar do Vinho",
};

export default function DinnersLayout({ children }: { children: React.ReactNode }) {
  return children;
}
