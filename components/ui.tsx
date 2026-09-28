"use client";

/**
 * Small presentational primitives shared across the playground.
 * Design rules: label ABOVE input, helper under the label, error BELOW the
 * input; one radius scale (lg controls, xl cards); no hand-rolled icons.
 */

import { type ReactNode } from "react";
import { cn } from "@/lib/utils";

export function Panel({
  title,
  hint,
  action,
  children,
  className,
  id,
}: {
  title: string;
  hint?: string;
  action?: ReactNode;
  children: ReactNode;
  className?: string;
  id?: string;
}) {
  return (
    <section
      id={id}
      className={cn(
        "rounded-xl border border-border/70 bg-card text-card-foreground shadow-sm",
        className,
      )}
    >
      <header className="flex flex-wrap items-center justify-between gap-2 border-b border-border/60 px-4 py-3">
        <div className="min-w-0">
          <h2 className="text-sm font-semibold tracking-tight">{title}</h2>
          {hint ? <p className="mt-0.5 text-xs text-muted-foreground">{hint}</p> : null}
        </div>
        {action ? <div className="flex shrink-0 items-center gap-2">{action}</div> : null}
      </header>
      <div className="px-4 py-3">{children}</div>
    </section>
  );
}

export function Field({
  label,
  helper,
  error,
  htmlFor,
  children,
  className,
}: {
  label: string;
  helper?: string;
  error?: string;
  htmlFor?: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("flex flex-col gap-2", className)}>
      <div className="flex flex-col gap-1">
        <label htmlFor={htmlFor} className="text-xs font-medium text-foreground/90">
          {label}
        </label>
        {helper ? <p className="text-xs text-muted-foreground">{helper}</p> : null}
      </div>
      {children}
      {error ? <p className="text-xs font-medium text-destructive">{error}</p> : null}
    </div>
  );
}

const controlSurface =
  "w-full rounded-lg border border-input bg-background px-3 py-2 text-sm text-foreground " +
  "placeholder:text-muted-foreground outline-none transition-colors " +
  "focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/40";

export function TextInput({
  value,
  onChange,
  placeholder,
  id,
  type = "text",
  mono,
  className,
  ...rest
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  id?: string;
  type?: string;
  mono?: boolean;
  className?: string;
} & Omit<React.InputHTMLAttributes<HTMLInputElement>, "value" | "onChange" | "type">) {
  return (
    <input
      id={id}
      type={type}
      value={value}
      placeholder={placeholder}
      onChange={(e) => onChange(e.target.value)}
      className={cn(controlSurface, mono && "font-mono text-xs", className)}
      {...rest}
    />
  );
}

export function TextArea({
  value,
  onChange,
  placeholder,
  id,
  rows = 4,
  mono,
  className,
  ariaLabel,
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  id?: string;
  rows?: number;
  mono?: boolean;
  className?: string;
  ariaLabel?: string;
}) {
  return (
    <textarea
      id={id}
      rows={rows}
      value={value}
      placeholder={placeholder}
      aria-label={ariaLabel}
      onChange={(e) => onChange(e.target.value)}
      className={cn(controlSurface, "resize-y leading-relaxed", mono && "font-mono text-xs", className)}
    />
  );
}

export function GhostButton({
  children,
  onClick,
  className,
  title,
  disabled,
  type = "button",
}: {
  children: ReactNode;
  onClick?: () => void;
  className?: string;
  title?: string;
  disabled?: boolean;
  type?: "button" | "submit";
}) {
  return (
    <button
      type={type}
      title={title}
      disabled={disabled}
      onClick={onClick}
      className={cn(
        "inline-flex min-h-[36px] items-center gap-1.5 rounded-lg border border-border/70 bg-secondary px-2.5 py-1.5 text-xs font-medium text-secondary-foreground",
        "transition-transform active:scale-[0.98] hover:border-border hover:bg-accent",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50",
        "disabled:pointer-events-none disabled:opacity-50",
        className,
      )}
    >
      {children}
    </button>
  );
}

export function StatTile({ label, value, mono = true }: { label: string; value: string; mono?: boolean }) {
  return (
    <div className="rounded-lg border border-border/60 bg-background/60 px-3 py-2">
      <div className="text-[11px] uppercase tracking-wide text-muted-foreground">{label}</div>
      <div className={cn("mt-0.5 text-sm font-semibold tabular-nums", mono && "font-mono")}>{value}</div>
    </div>
  );
}

export function EmptyState({ title, body }: { title: string; body: string }) {
  return (
    <div className="flex flex-col items-center justify-center gap-2 rounded-lg border border-dashed border-border/70 px-6 py-10 text-center">
      <p className="text-sm font-medium">{title}</p>
      <p className="max-w-[42ch] text-xs text-muted-foreground">{body}</p>
    </div>
  );
}

export function IssueDot({ level }: { level: "error" | "warning" | "tip" }) {
  // Semantic status dot: it encodes severity, which is real state, not decoration.
  const tone =
    level === "error"
      ? "bg-band-abstain"
      : level === "warning"
        ? "bg-band-hitl"
        : "bg-primary";
  return <span aria-hidden className={cn("mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full", tone)} />;
}