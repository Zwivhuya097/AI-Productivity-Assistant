import { ShieldCheck } from "lucide-react";
import { cn } from "@/lib/utils";

export const DISCLAIMER =
  "AI-generated content may contain errors. Review important information, deadlines, decisions, and recommendations before acting on them.";

export function Disclaimer({ className, compact }: { className?: string; compact?: boolean }) {
  return (
    <p className={cn("flex items-start gap-2 text-xs text-muted-foreground", compact ? "" : "justify-center text-center", className)}>
      <ShieldCheck className="mt-0.5 size-3.5 shrink-0" />
      <span>{DISCLAIMER}</span>
    </p>
  );
}
