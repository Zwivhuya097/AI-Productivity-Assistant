import { createFileRoute, Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { toast } from "sonner";
import { CalendarClock, Loader2, Plus, RefreshCw, Sparkles, Lightbulb, AlertTriangle, ListChecks } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { planSchedule } from "@/lib/ai.functions";
import { actions, useAppState } from "@/lib/store";
import { isoDate } from "@/lib/dates";
import type { Task } from "@/lib/types";
import { Card, CardTitle, EmptyState, ErrorNote, PageHeader } from "@/components/app/bits";
import { ScheduleTimeline } from "@/components/app/ScheduleTimeline";
import { TaskDialog } from "@/components/app/TaskDialog";
import { TaskItem } from "@/components/app/TaskItem";
import { Disclaimer } from "@/components/app/Disclaimer";

export const Route = createFileRoute("/planner")({
  head: () => ({
    meta: [
      { title: "AI Task Planner — WorkMate AI" },
      { name: "description", content: "Let AI prioritise your tasks and generate a realistic, non-overlapping daily or weekly schedule." },
      { property: "og:title", content: "AI Task Planner — WorkMate AI" },
      { property: "og:description", content: "Let AI prioritise your tasks and generate a realistic, non-overlapping daily or weekly schedule." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: PlannerPage,
});

function PlannerPage() {
  const { tasks, schedule, settings } = useAppState();
  const plan = useServerFn(planSchedule);
  const [view, setView] = useState<"daily" | "weekly">(schedule?.view ?? "daily");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [dialog, setDialog] = useState<{ open: boolean; task: Task | null }>({ open: false, task: null });
  const open = tasks.filter((t) => !t.completed);

  async function generate() {
    setError(null);
    if (!open.length) return setError("Add at least one open task before generating a schedule.");
    if (settings.workStart >= settings.workEnd) return setError("Your working hours look invalid — the start time must be before the end time.");
    setLoading(true);
    try {
      const res = await plan({
        data: {
          tasks: open.map(({ id, title, deadline, duration, priority, category }) => ({ id, title, deadline, duration, priority, category })),
          view,
          startDate: isoDate(),
          workStart: settings.workStart,
          workEnd: settings.workEnd,
        },
      });
      if (!res.ok) return setError(res.error);
      actions.setSchedule({ ...res.data, view, generatedAt: new Date().toISOString() });
      toast.success("Schedule generated — it's also on your dashboard");
    } catch {
      setError("Something went wrong while generating your schedule. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div>
      <PageHeader
        title="Task Planner"
        description="AI weighs urgency, importance, deadlines and durations to build a realistic plan inside your working hours."
        actions={<Button variant="outline" onClick={() => setDialog({ open: true, task: null })}><Plus />Add task</Button>}
      />

      <div className="grid gap-6 lg:grid-cols-5">
        <div className="space-y-6 lg:col-span-2">
          <Card>
            <CardTitle icon={CalendarClock}>Planning options</CardTitle>
            <div className="space-y-4">
              <div className="grid gap-1.5">
                <Label>View</Label>
                <ToggleGroup type="single" variant="outline" value={view} onValueChange={(v) => v && setView(v as "daily" | "weekly")} className="justify-start">
                  <ToggleGroupItem value="daily" className="px-4">Daily</ToggleGroupItem>
                  <ToggleGroupItem value="weekly" className="px-4">Weekly</ToggleGroupItem>
                </ToggleGroup>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="grid gap-1.5">
                  <Label htmlFor="ws">Start work</Label>
                  <Input id="ws" type="time" value={settings.workStart} onChange={(e) => actions.updateSettings({ workStart: e.target.value })} />
                </div>
                <div className="grid gap-1.5">
                  <Label htmlFor="we">End work</Label>
                  <Input id="we" type="time" value={settings.workEnd} onChange={(e) => actions.updateSettings({ workEnd: e.target.value })} />
                </div>
              </div>
              <Button className="w-full" onClick={generate} disabled={loading}>
                {loading ? <Loader2 className="animate-spin" /> : schedule ? <RefreshCw /> : <Sparkles />}
                {loading ? "Planning…" : schedule ? "Regenerate schedule" : "Generate schedule"}
              </Button>
              {error && <ErrorNote message={error} onRetry={open.length ? generate : undefined} />}
            </div>
          </Card>

          <Card>
            <CardTitle icon={ListChecks} action={<Link to="/tasks" className="text-xs font-medium text-primary hover:underline">Manage</Link>}>
              Open tasks ({open.length})
            </CardTitle>
            {open.length ? (
              <ul className="space-y-2">{open.map((t) => <TaskItem key={t.id} task={t} onEdit={(task) => setDialog({ open: true, task })} />)}</ul>
            ) : (
              <EmptyState icon={ListChecks} title="No open tasks" description="Add tasks or convert meeting action items to start planning." action={<Button size="sm" onClick={() => setDialog({ open: true, task: null })}><Plus />Add task</Button>} />
            )}
          </Card>
        </div>

        <div className="space-y-6 lg:col-span-3">
          <Card>
            <CardTitle icon={Sparkles} action={schedule && <span className="text-xs text-muted-foreground">Generated {new Date(schedule.generatedAt).toLocaleString(undefined, { dateStyle: "medium", timeStyle: "short" })}</span>}>
              {schedule?.view === "weekly" ? "This week's schedule" : "Today's schedule"}
            </CardTitle>
            {loading ? (
              <div className="space-y-2">{Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-12 w-full" />)}</div>
            ) : schedule && schedule.blocks.length ? (
              <ScheduleTimeline blocks={schedule.blocks} groupByDay={schedule.view === "weekly"} />
            ) : (
              <EmptyState icon={CalendarClock} title="No schedule yet" description="Choose daily or weekly and generate a plan from your open tasks." />
            )}
          </Card>

          {schedule && !loading && (
            <>
              {schedule.urgent.length > 0 && (
                <Card className="border-destructive/30 bg-danger-soft">
                  <CardTitle icon={AlertTriangle}>Urgent</CardTitle>
                  <ul className="list-disc space-y-1 pl-5 text-sm">{schedule.urgent.map((u, i) => <li key={i}>{u}</li>)}</ul>
                </Card>
              )}
              <Card>
                <CardTitle icon={Lightbulb}>Why this order</CardTitle>
                <ul className="list-disc space-y-1.5 pl-5 text-sm">{schedule.reasoning.map((r, i) => <li key={i}>{r}</li>)}</ul>
                {schedule.warnings.length > 0 && (
                  <div className="mt-4 rounded-lg bg-warning-soft p-3 text-sm">
                    <p className="mb-1 font-semibold">Heads up</p>
                    <ul className="list-disc space-y-1 pl-5">{schedule.warnings.map((w, i) => <li key={i}>{w}</li>)}</ul>
                  </div>
                )}
              </Card>
              <Disclaimer compact />
            </>
          )}
        </div>
      </div>

      <TaskDialog open={dialog.open} task={dialog.task} onOpenChange={(o) => setDialog((d) => ({ ...d, open: o }))} />
    </div>
  );
}
