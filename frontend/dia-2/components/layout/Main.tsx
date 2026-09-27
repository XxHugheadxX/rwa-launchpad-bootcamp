"use client";

import { usePathname } from "next/navigation";
import type { ReactNode } from "react";

export function Main({ children }: { children: ReactNode }) {
  const pathname = usePathname();

  return (
    <main
      key={pathname}
      className="motion-enter mx-auto w-full max-w-layout flex-1 px-5 py-12 md:px-10 md:py-16"
    >
      {children}
    </main>
  );
}
