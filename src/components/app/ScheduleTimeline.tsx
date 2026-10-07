import { Coffee } from "lucide-react";
import type { ScheduleBlock } from "@/lib/types";
import { prettyDay } from "@/lib/dates";
import { cn } from "@/lib/utils";
import { PriorityDot } from "./bits";

const BAR = { high: "border-l-destructive", medium: "border-l-warning", low: "border-l-success" };

export function ScheduleTimeline({ blocks, groupByDay, limit }: { blocks: ScheduleBlock[]; groupByDay?: boolean; limit?: number }) {
  const list = limit ? blocks.slice(0, limit) : blocks;
  const days = groupByDay ? Array.from(new Set(list.map((b) => b.day))) : [null];
  return (
    <div className="space-y-6">
      {days.map((day) => (
        <div key={day ?? "all"}>
          {day && <h3 className="mb-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">{prettyDay(day)}</h3>}
          <ol className="space-y-2">
            {list
              .filter((b) => !day || b.day === day)
              .map((b, i) => {
                const isBreak = !b.task_id;
                return (
                  <li key={i} className="flex gap-3">
                    <div className="w-24 shrink-0 pt-2.5 text-xs font-medium tabular-nums text-muted-foreground">
                      {b.start} – {b.end}
                    </div>
                    <div
                      className={cn(
                        "flex-1 rounded-lg border border-l-4 px-3 py-2",
                        isBreak ? "border-l-border bg-muted/60" : cn("bg-card", BAR[b.priority]),
                      )}
                    >
                      <div className="flex items-center gap-2 text-sm font-medium">
                        {isBreak ? <Coffee className="size-3.5 text-muted-foreground" /> : <PriorityDot priority={b.priority} />}
                        <span className={cn(isBreak && "text-muted-foreground")}>{b.title}</span>
                      </div>
                      {b.note && <p className="mt-0.5 text-xs text-muted-foreground">{b.note}</p>}
                    </div>
                  </li>
                );
              })}
          </ol>
        </div>
      ))}
    </div>
  );
}
