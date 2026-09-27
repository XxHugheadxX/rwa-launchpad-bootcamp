import type { Metadata } from "next";
import { Barlow_Condensed, IBM_Plex_Mono, Inter } from "next/font/google";
import { Header } from "@/components/layout/Header";
import { Main } from "@/components/layout/Main";
import { WalletProvider } from "@/lib/wallet-context";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

const plex = IBM_Plex_Mono({
  subsets: ["latin"],
  weight: ["400", "500"],
  variable: "--font-plex",
  display: "swap",
});

const display = Barlow_Condensed({
  subsets: ["latin"],
  weight: ["600", "700"],
  variable: "--font-display",
  display: "swap",
});

export const metadata: Metadata = {
  title: "RWA Launchpad | Oppia × Stellar Bolivia Bootcamp",
  description:
    "Demo frontend for the Día 2 RWA Launchpad Soroban contract: initialize, mint, whitelist, balance, and transfer on Stellar testnet.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body className={`${inter.variable} ${plex.variable} ${display.variable} font-sans`}>
        <WalletProvider>
          <div className="flex min-h-screen flex-col">
            <Header />
            <Main>{children}</Main>
          </div>
        </WalletProvider>
      </body>
    </html>
  );
}
