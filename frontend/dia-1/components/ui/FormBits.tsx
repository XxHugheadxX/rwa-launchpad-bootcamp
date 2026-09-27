"use client";

import type { ReactNode } from "react";
import { stellarExpertTxUrl } from "@/lib/config";

export function TxSuccess({
  hash,
  children,
}: {
  hash: string;
  children?: ReactNode;
}) {
  return (
    <div className="motion-pop border border-brand-cyan px-3 py-3 font-mono text-label uppercase tracking-[0.12em] text-brand-cyan">
      {children ?? "Transaction confirmed."}{" "}
      <a
        href={stellarExpertTxUrl(hash)}
        target="_blank"
        rel="noopener noreferrer"
        className="inline-hit normal-case tracking-normal text-text-primary underline underline-offset-2 transition duration-fast ease-out hover:text-brand-cyan focus-visible:outline focus-visible:outline-1 focus-visible:outline-offset-2 focus-visible:outline-brand-cyan"
      >
        View on Stellar Expert
      </a>
    </div>
  );
}

export function FormError({ message }: { message: string }) {
  return (
    <div className="motion-pop border-l border-semantic-danger pl-4 text-body-sm text-semantic-danger">
      {message}
    </div>
  );
}

export function Field({
  label,
  children,
  hint,
}: {
  label: string;
  children: ReactNode;
  hint?: string;
}) {
  return (
    <label className="flex flex-col gap-2">
      <span className="font-mono text-label uppercase tracking-[0.18em] text-text-muted">
        {label}
      </span>
      {children}
      {hint ? (
        <span className="font-mono text-label tracking-normal text-text-muted">
          {hint}
        </span>
      ) : null}
    </label>
  );
}

export const inputClassName =
  "min-h-[44px] w-full rounded-none border border-white/30 bg-transparent px-3 font-mono text-body-sm text-text-primary placeholder:text-text-muted transition duration-fast ease-out hover:border-white/60 focus:border-brand-cyan focus:outline-none disabled:cursor-not-allowed disabled:border-white/20 disabled:opacity-40";
