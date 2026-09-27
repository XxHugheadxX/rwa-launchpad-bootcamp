import type { ReactNode } from "react";

export type CardState = "default" | "empty" | "loading" | "error";

export type CardProps = {
  title?: string;
  metadata?: ReactNode;
  children?: ReactNode;
  footer?: ReactNode;
  state?: CardState;
  emptyMessage?: string;
  errorMessage?: string;
  radius?: "md" | "lg";
  className?: string;
};

export function Card({
  title,
  metadata,
  children,
  footer,
  state = "default",
  emptyMessage = "Nothing to show yet.",
  errorMessage = "Something went wrong.",
  radius = "md",
  className = "",
}: CardProps) {
  void radius;
  return (
    <section
      className={[
        "border border-border-default bg-transparent p-6 md:p-8",
        className,
      ].join(" ")}
    >
      {(title || metadata) && (
        <header className="mb-6 flex flex-wrap items-start justify-between gap-3 border-b border-border-subtle pb-4">
          {title ? (
            <h2 className="font-mono text-label uppercase tracking-[0.22em] text-text-muted">
              {title}
            </h2>
          ) : (
            <span />
          )}
          {metadata ? (
            <div className="font-mono text-label uppercase tracking-[0.18em] text-text-muted">
              {metadata}
            </div>
          ) : null}
        </header>
      )}

      {state === "loading" ? (
        <div className="flex min-h-[44px] items-center gap-3 font-mono text-label uppercase tracking-[0.16em] text-text-secondary">
          <span
            className="h-4 w-4 animate-spin rounded-full border-2 border-brand-cyan border-r-transparent motion-reduce:animate-none"
            aria-hidden
          />
          Loading…
        </div>
      ) : state === "empty" ? (
        <p className="max-w-prose text-body-sm text-text-muted">{emptyMessage}</p>
      ) : state === "error" ? (
        <p className="border-l border-semantic-danger pl-4 text-body-sm text-semantic-danger">
          {errorMessage}
        </p>
      ) : (
        <div className="text-body text-text-secondary">{children}</div>
      )}

      {footer ? (
        <footer className="mt-6 border-t border-border-subtle pt-4 text-body-sm text-text-muted">
          {footer}
        </footer>
      ) : null}
    </section>
  );
}
