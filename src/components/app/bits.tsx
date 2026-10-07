import type { ReactNode } from "react";
import type { LucideIcon } from "lucide-react";
import { AlertCircle, CalendarDays } from "lucide-react";
import { cn } from "@/lib/utils";
import type { Priority } from "@/lib/types";
import { daysUntil, deadlineLabel } from "@/lib/dates";

export function PageHeader({ title, description, actions }: { title: string; description?: string; actions?: ReactNode }) {
  return (
    <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
      <div>
        <h1 className="text-2xl font-semibold text-foreground sm:text-3xl">{title}</h1>
        {description && <p className="mt-1.5 max-w-2xl text-sm text-muted-foreground">{description}</p>}
      </div>
      {actions && <div className="flex flex-wrap gap-2">{actions}</div>}
    </div>
  );
}

const PRIORITY_STYLE: Record<Priority, string> = {
  high: "bg-danger-soft text-destructive",
  medium: "bg-warning-soft text-warning",
  low: "bg-success-soft text-success",
};
const DOT: Record<Priority, string> = { high: "bg-destructive", medium: "bg-warning", low: "bg-success" };

export function PriorityDot({ priority }: { priority: Priority }) {
  return <span className={cn("inline-block size-2 rounded-full", DOT[priority])} aria-hidden />;
}

export function PriorityBadge({ priority }: { priority: Priority }) {
  return (
    <span className={cn("inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-xs font-semibold capitalize", PRIORITY_STYLE[priority])}>
      <PriorityDot priority={priority} />
      {priority}
    </span>
  );
}

export function DeadlineBadge({ deadline }: { deadline: string | null }) {
  if (!deadline) return null;
  const n = daysUntil(deadline);
  const urgent = n !== null && n <= 1;
  return (
    <span className={cn("inline-flex items-center gap-1 text-xs", urgent ? "font-semibold text-destructive" : "text-muted-foreground")}>
      <CalendarDays className="size-3.5" />
      {deadlineLabel(deadline)}
    </span>
  );
}

export function EmptyState({ icon: Icon, title, description, action }: { icon: LucideIcon; title: string; description: string; action?: ReactNode }) {
  return (
    <div className="flex flex-col items-center justify-center rounded-xl border border-dashed px-6 py-12 text-center">
      <div className="mb-3 grid size-11 place-items-center rounded-full bg-accent text-accent-foreground">
        <Icon className="size-5" />
      </div>
      <h3 className="font-display text-base font-semibold">{title}</h3>
      <p className="mt-1 max-w-sm text-sm text-muted-foreground">{description}</p>
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}

export function ErrorNote({ message, onRetry }: { message: string; onRetry?: (() => void) | undefined }) {
  return (
    <div role="alert" className="flex items-start gap-3 rounded-xl border border-destructive/30 bg-danger-soft p-4 text-sm text-destructive">
      <AlertCircle className="mt-0.5 size-4 shrink-0" />
      <div className="flex-1">{message}</div>
      {onRetry && (
        <button onClick={onRetry} className="font-semibold underline underline-offset-2">
          Try again
        </button>
      )}
    </div>
  );
}

export function Card({ className, children }: { className?: string; children: ReactNode }) {
  return <section className={cn("surface p-5", className)}>{children}</section>;
}

export function CardTitle({ icon: Icon, children, action }: { icon?: LucideIcon; children: ReactNode; action?: ReactNode }) {
  return (
    <div className="mb-4 flex items-center justify-between gap-2">
      <h2 className="flex items-center gap-2 text-sm font-semibold text-foreground">
        {Icon && <Icon className="size-4 text-primary" />}
        {children}
      </h2>
      {action}
    </div>
  );
}
