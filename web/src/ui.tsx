import type { ButtonHTMLAttributes, PropsWithChildren } from "react";
import { AlertCircle, CheckCircle2, Loader2 } from "lucide-react";

export const cx = (...parts: Array<string | false | null | undefined>) =>
  parts.filter(Boolean).join(" ");
export function Button({
  className,
  children,
  ...props
}: PropsWithChildren<ButtonHTMLAttributes<HTMLButtonElement>>) {
  return (
    <button
      className={cx(
        "inline-flex items-center justify-center gap-2 rounded-md bg-cyan-400 px-3 py-2 text-sm font-semibold text-slate-950 transition hover:bg-cyan-300 disabled:cursor-not-allowed disabled:opacity-50",
        className,
      )}
      {...props}
    >
      {children}
    </button>
  );
}
export function Card({
  children,
  className = "",
}: PropsWithChildren<{ className?: string }>) {
  return (
    <section
      className={`rounded-lg border border-slate-800 bg-slate-900/70 ${className}`}
    >
      {children}
    </section>
  );
}
export function Badge({
  children,
  tone = "slate",
}: PropsWithChildren<{
  tone?: "slate" | "green" | "yellow" | "red" | "blue";
}>) {
  const colors = {
    slate: "border-slate-700 bg-slate-800 text-slate-300",
    green: "border-emerald-800 bg-emerald-950 text-emerald-300",
    yellow: "border-amber-800 bg-amber-950 text-amber-300",
    red: "border-red-800 bg-red-950 text-red-300",
    blue: "border-cyan-800 bg-cyan-950 text-cyan-300",
  };
  return (
    <span
      className={`inline-flex rounded border px-2 py-0.5 text-xs font-medium ${colors[tone]}`}
    >
      {children}
    </span>
  );
}
export function EmptyState({ title, body }: { title: string; body: string }) {
  return (
    <Card className="p-8 text-center">
      <p className="font-semibold text-slate-100">{title}</p>
      <p className="mt-2 text-sm text-slate-400">{body}</p>
    </Card>
  );
}
export function ErrorState({ error }: { error: unknown }) {
  return (
    <div
      role="alert"
      className="flex gap-2 rounded-md border border-red-900 bg-red-950/50 p-3 text-sm text-red-200"
    >
      <AlertCircle size={18} />
      {error instanceof Error
        ? error.message
        : "Something went wrong. Please retry."}
    </div>
  );
}
export function LoadingState() {
  return (
    <div className="flex items-center gap-2 py-8 text-sm text-slate-400">
      <Loader2 className="animate-spin" size={18} />
      Loading…
    </div>
  );
}
export function Success({ children }: PropsWithChildren) {
  return (
    <div className="flex items-center gap-2 rounded border border-emerald-900 bg-emerald-950/40 p-3 text-sm text-emerald-200">
      <CheckCircle2 size={18} />
      {children}
    </div>
  );
}
export function TagList({
  items,
  empty = "None",
}: {
  items: string[];
  empty?: string;
}) {
  return (
    <div className="flex flex-wrap gap-1.5">
      {items.length ? (
        items.map((item) => <Badge key={item}>{item}</Badge>)
      ) : (
        <span className="text-sm text-slate-500">{empty}</span>
      )}
    </div>
  );
}
