"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { useWallet } from "@/lib/wallet-context";
import { truncateAddress } from "@/lib/stellar/wallet";
import { config } from "@/lib/config";

const NAV = [
  { href: "/", label: "Overview" },
  { href: "/initialize", label: "Initialize" },
];

export function Header() {
  const pathname = usePathname();
  const {
    address,
    connecting,
    connect,
    disconnect,
    networkOk,
    expectedNetwork,
  } = useWallet();

  return (
    <header className="border-b border-border-default bg-bg-canvas">
      <div className="mx-auto flex max-w-layout items-center justify-between gap-4 px-4 py-3 md:px-6">
        <div className="flex items-center gap-6">
          <Link
            href="/"
            className="flex min-h-[44px] items-center gap-2.5 focus-visible:outline focus-visible:outline-1 focus-visible:outline-offset-[3px] focus-visible:outline-brand-cyan"
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/brand/oppia-mark-white.svg"
              alt="Oppia"
              width={28}
              height={28}
            />
            <span className="font-display text-body-sm font-semibold uppercase tracking-[-0.03em] text-text-primary">
              RWA Launchpad
            </span>
          </Link>

          <nav className="hidden items-center gap-1 sm:flex">
            {NAV.map((item) => {
              const active =
                item.href === "/"
                  ? pathname === "/"
                  : pathname.startsWith(item.href);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={[
                    "inline-flex min-h-[44px] items-center px-3 font-mono text-label uppercase tracking-[0.16em] transition duration-fast ease-out focus-visible:outline focus-visible:outline-1 focus-visible:outline-offset-[3px] focus-visible:outline-brand-cyan",
                    active
                      ? "text-brand-cyan"
                      : "text-text-secondary hover:text-text-primary",
                  ].join(" ")}
                >
                  {item.label}
                </Link>
              );
            })}
          </nav>
        </div>

        <div className="flex items-center gap-2">
          {!networkOk && address ? (
            <span className="hidden text-label text-semantic-warning md:inline">
              Switch Freighter to {expectedNetwork}
            </span>
          ) : (
            <span className="hidden text-label text-text-muted md:inline">
              {config.network}
            </span>
          )}

          {address ? (
            <div className="flex items-center gap-2">
              <code className="inline-flex min-h-[44px] items-center border border-border-default bg-transparent px-2.5 font-mono text-mono text-text-primary">
                {truncateAddress(address, 5)}
              </code>
              <Button variant="ghost" onClick={disconnect}>
                Disconnect
              </Button>
            </div>
          ) : (
            <Button
              variant="secondary"
              loading={connecting}
              onClick={() => void connect()}
            >
              Connect Freighter
            </Button>
          )}
        </div>
      </div>

      <nav className="flex gap-1 border-t border-border-subtle px-4 py-2 sm:hidden">
        {NAV.map((item) => {
          const active =
            item.href === "/"
              ? pathname === "/"
              : pathname.startsWith(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={[
                "inline-flex min-h-[44px] flex-1 items-center justify-center px-2 text-center font-mono text-label uppercase tracking-[0.14em] transition duration-fast ease-out focus-visible:outline focus-visible:outline-1 focus-visible:outline-offset-[3px] focus-visible:outline-brand-cyan",
                active
                  ? "text-brand-cyan"
                  : "text-text-secondary hover:text-text-primary",
              ].join(" ")}
            >
              {item.label}
            </Link>
          );
        })}
      </nav>
    </header>
  );
}
