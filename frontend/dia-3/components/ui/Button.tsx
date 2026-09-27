"use client";

import {
  forwardRef,
  type ButtonHTMLAttributes,
  type ReactNode,
} from "react";

export type ButtonVariant = "primary" | "secondary" | "ghost" | "danger";

export type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: ButtonVariant;
  loading?: boolean;
  children: ReactNode;
};

const variantClasses: Record<ButtonVariant, string> = {
  primary:
    "bg-brand-cyan text-[#0F0F0F] hover:bg-white active:opacity-80 disabled:hover:bg-brand-cyan disabled:active:opacity-40",
  secondary:
    "border border-white/35 bg-transparent text-white hover:border-brand-cyan hover:text-brand-cyan active:opacity-80 disabled:hover:border-white/35 disabled:hover:text-white",
  ghost:
    "bg-transparent text-text-secondary hover:text-white active:opacity-80 disabled:hover:text-text-secondary",
  danger:
    "bg-semantic-danger text-[#0F0F0F] hover:bg-white active:opacity-80 disabled:hover:bg-semantic-danger",
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  function Button(
    {
      variant = "primary",
      loading = false,
      disabled,
      className = "",
      children,
      type = "button",
      ...rest
    },
    ref,
  ) {
    const isDisabled = disabled || loading;

    return (
      <button
        ref={ref}
        type={type}
        disabled={isDisabled}
        aria-busy={loading || undefined}
        className={[
          "inline-flex min-h-[44px] select-none items-center justify-center gap-2 rounded-none px-4 font-mono text-label font-medium uppercase tracking-[0.16em] transition duration-fast ease-out",
          "focus-visible:outline focus-visible:outline-1 focus-visible:outline-offset-[3px] focus-visible:outline-white",
          loading
            ? "cursor-progress"
            : "cursor-pointer disabled:cursor-not-allowed disabled:opacity-40",
          variantClasses[variant],
          className,
        ].join(" ")}
        {...rest}
      >
        {loading ? (
          <>
            <span
              className="h-4 w-4 animate-spin rounded-full border-2 border-current border-r-transparent motion-reduce:animate-none"
              aria-hidden
            />
            <span>{children}</span>
          </>
        ) : (
          children
        )}
      </button>
    );
  },
);
