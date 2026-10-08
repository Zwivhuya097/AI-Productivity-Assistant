import { createFileRoute, Link } from "@tanstack/react-router";
import { CheckCircle2, Clock, CalendarClock, FileText, Sparkles, AlertTriangle, ArrowRight, ListChecks } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { useAppState } from "@/lib/store";
import { greeting, isoDate, daysUntil } from "@/lib/dates";
import { Card, CardTitle, DeadlineBadge, EmptyState, PriorityDot } from "@/components/app/bits";
import { ScheduleTimeline } from "@/components/app/ScheduleTimeline";
import { useHydrated } from "@tanstack/react-router";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Dashboard — WorkMate AI" },
      { name: "description", content: "Your workday at a glance: tasks, deadlines, AI schedule and recent meeting summaries." },
      { property: "og:title", content: "Dashboard — WorkMate AI" },
      { property: "og:description", content: "Your workday at a glance: tasks, deadlines, AI schedule and recent meeting summaries." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Dashboard,
});

function Stat({ icon: Icon, label, value, tone }: { icon: typeof Clock; label: string; value: string | number; tone: string }) {
  return (
    <div className="surface flex min-h-28 items-center gap-3 p-4 transition-shadow hover:shadow-lift">
      <div className={`grid size-10 shrink-0 place-items-center rounded-lg ${tone}`}><Icon className="size-5" /></div>
      <div className="min-w-0">
        <p className="text-2xl font-semibold tabular-nums font-display">{value}</p>
        <p className="text-xs text-muted-foreground">{label}</p>
      </div>
    </div>
  );
}

function Dashboard() {
  const s = useAppState();
  const hydrated = useHydrated();
  const today = isoDate();
  const done = s.tasks.filter((t) => t.completed).length;
  const pending = s.tasks.length - done;
  const pct = s.tasks.length ? Math.round((done / s.tasks.length) * 100) : 0;
  const upcoming = s.tasks
    .filter((t) => !t.completed && t.deadline && (daysUntil(t.deadline) ?? 99) <= 7)
    .sort((a, b) => (a.deadline ?? "").localeCompare(b.deadline ?? ""));
  const todayBlocks = s.schedule?.blocks.filter((b) => b.day === today) ?? [];

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-sm text-muted-foreground">
            {hydrated ? new Date().toLocaleDateString(undefined, { weekday: "long", month: "long", day: "numeric", year: "numeric" }) : "\u00a0"}
          </p>
          <h1 className="mt-1 text-2xl font-semibold sm:text-3xl">
            {hydrated ? greeting() : "Hello"}, <span className="text-primary">{s.settings.name}</span>
          </h1>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button asChild variant="outline"><Link to="/meetings"><FileText />Summarize Meeting</Link></Button>
          <Button asChild variant="outline"><Link to="/planner"><CalendarClock />Plan My Day</Link></Button>
          <Button asChild><Link to="/assistant"><Sparkles />Ask AI</Link></Button>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Stat icon={CheckCircle2} label="Tasks completed" value={done} tone="bg-secondary text-secondary-foreground" />
        <Stat icon={ListChecks} label="Pending tasks" value={pending} tone="bg-accent text-accent-foreground" />
        <Stat icon={AlertTriangle} label="Due this week" value={upcoming.length} tone="bg-primary text-primary-foreground" />
        <Stat icon={FileText} label="Meeting summaries" value={s.meetings.length} tone="bg-muted text-primary" />
      </div>

      <div className="border-y border-border py-5">
        <div className="mb-2 flex items-center justify-between text-sm">
          <span className="font-medium">Overall progress</span>
          <span className="tabular-nums text-muted-foreground">{pct}%</span>
        </div>
        <Progress value={pct} aria-label="Task completion" />
      </div>

      <div className="grid gap-6 lg:grid-cols-5">
        <Card className="lg:col-span-3 border-0 bg-transparent shadow-none px-0">
          <CardTitle icon={CalendarClock} action={<Link to="/planner" className="text-xs font-medium text-primary hover:underline">Open planner</Link>}>
            Today's schedule
          </CardTitle>
          {todayBlocks.length ? (
            <ScheduleTimeline blocks={todayBlocks} limit={8} />
          ) : (
            <EmptyState
              icon={CalendarClock}
              title="No schedule for today yet"
              description="Let AI prioritise your tasks and build a realistic plan around your working hours."
              action={<Button asChild size="sm"><Link to="/planner">Plan my day</Link></Button>}
            />
          )}
        </Card>

        <div className="space-y-6 lg:col-span-2">
          <Card>
            <CardTitle icon={Clock} action={<Link to="/tasks" className="text-xs font-medium text-primary hover:underline">All tasks</Link>}>
              Upcoming deadlines
            </CardTitle>
            {upcoming.length ? (
              <ul className="space-y-2.5">
                {upcoming.slice(0, 5).map((t) => (
                  <li key={t.id} className="flex items-center gap-3">
                    <PriorityDot priority={t.priority} />
                    <span className="min-w-0 flex-1 truncate text-sm">{t.title}</span>
                    <DeadlineBadge deadline={t.deadline} />
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-muted-foreground">Nothing due in the next 7 days.</p>
            )}
          </Card>

          <Card>
            <CardTitle icon={FileText} action={<Link to="/meetings" className="text-xs font-medium text-primary hover:underline">Summarizer</Link>}>
              Recent meetings
            </CardTitle>
            {s.meetings.length ? (
              <ul className="space-y-3">
                {s.meetings.slice(0, 3).map((m) => (
                  <li key={m.id}>
                    <Link to="/meetings" search={{ id: m.id }} className="block rounded-lg p-2 -m-2 hover:bg-muted">
                      <p className="text-sm font-medium">{m.result.title}</p>
                      <p className="line-clamp-2 text-xs text-muted-foreground">{m.result.summary}</p>
                    </Link>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-muted-foreground">No summaries yet. Try the demo meeting in the summarizer.</p>
            )}
          </Card>

          <Link to="/assistant" className="group flex items-center gap-4 rounded-lg bg-primary p-5 text-primary-foreground transition-shadow hover:shadow-lift">
            <div className="grid size-11 shrink-0 place-items-center rounded-lg bg-primary-foreground/15 text-primary-foreground"><Sparkles className="size-5" /></div>
            <div className="flex-1">
              <p className="text-sm font-semibold">Ask WorkMate AI</p>
              <p className="text-xs text-primary-foreground/85">"What should I work on first?"</p>
            </div>
            <ArrowRight className="size-4 shrink-0 text-primary-foreground transition-transform group-hover:translate-x-0.5" />
          </Link>
        </div>
      </div>
    </div>
  );
}
