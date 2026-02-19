import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Jantar - Jantar do Vinho",
};

export default function DinnerLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
