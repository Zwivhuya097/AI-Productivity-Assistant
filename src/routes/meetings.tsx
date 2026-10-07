import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useEffect, useState } from "react";
import { z } from "zod";
import { toast } from "sonner";
import { Copy, FileText, Loader2, Sparkles, ListPlus, Trash2, History, HelpCircle, Wand2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import { summarizeMeeting } from "@/lib/ai.functions";
import { actions, DEMO_NOTES, newId, useAppState } from "@/lib/store";
import { isoDate } from "@/lib/dates";
import type { MeetingSummary } from "@/lib/types";
import { Card, CardTitle, EmptyState, ErrorNote, PageHeader, PriorityBadge } from "@/components/app/bits";
import { Disclaimer } from "@/components/app/Disclaimer";

export const Route = createFileRoute("/meetings")({
  validateSearch: z.object({ id: z.string().optional() }),
  head: () => ({
    meta: [
      { title: "Meeting Summarizer — WorkMate AI" },
      { name: "description", content: "Turn long meeting notes into a summary, decisions, action items and deadlines." },
      { property: "og:title", content: "Meeting Summarizer — WorkMate AI" },
      { property: "og:description", content: "Turn long meeting notes into a summary, decisions, action items and deadlines." },
    ],
  }),
  component: MeetingsPage,
});

function toText(m: MeetingSummary) {
  const r = m.result;
  return [
    `# ${r.title}`,
    `\n## Summary\n${r.summary}`,
    `\n## Key Discussion Points\n${r.key_points.map((p) => `- ${p}`).join("\n")}`,
    `\n## Decisions\n${r.decisions.map((p) => `- ${p}`).join("\n") || "- None recorded"}`,
    `\n## Action Items\n${r.action_items.map((a) => `- ${a.task} | ${a.owner ?? "Unassigned"} | ${a.deadline ?? "No deadline"} | ${a.priority}`).join("\n")}`,
    r.deadlines.length ? `\n## Deadlines\n${r.deadlines.map((d) => `- ${d.item}: ${d.date}`).join("\n")}` : "",
  ].join("\n");
}

function MeetingsPage() {
  const { meetings } = useAppState();
  const search = Route.useSearch();
  const navigate = Route.useNavigate();
  const summarize = useServerFn(summarizeMeeting);
  const [notes, setNotes] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedId, setSelectedId] = useState<string | undefined>(search.id);
  useEffect(() => {
    setSelectedId(search.id);
  }, [search.id]);
  const current = meetings.find((m) => m.id === selectedId) ?? null;

  async function run() {
    setError(null);
    const text = notes.trim();
    if (!text) return setError("Please paste some meeting notes first.");
    if (text.length < 40) return setError("These notes look too short to summarise. Add a bit more detail.");
    setLoading(true);
    try {
      const res = await summarize({ data: { notes: text, today: isoDate() } });
      if (!res.ok) return setError(res.error);
      const m: MeetingSummary = { id: newId(), createdAt: new Date().toISOString(), notes: text, result: res.data };
      actions.saveMeeting(m);
      navigate({ search: { id: m.id }, replace: true });
      toast.success("Meeting summarised and saved");
    } catch {
      setError("Network problem — couldn't reach the server. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  function addToTasks(m: MeetingSummary) {
    const items = m.result.action_items;
    if (!items.length) {
      toast.info("No action items to add");
      return;
    }
    actions.addTasks(
      items.map((a) => ({
        title: a.task,
        deadline: a.deadline && /^\d{4}-\d{2}-\d{2}$/.test(a.deadline) ? a.deadline : null,
        duration: 60,
        priority: a.priority,
        category: "Meeting",
        source: "meeting" as const,
        owner: a.owner,
      })),
    );
    toast.success(`${items.length} action item${items.length > 1 ? "s" : ""} added to My Tasks`);
  }

  return (
    <div>
      <PageHeader title="Meeting Summarizer" description="Paste your notes and get a structured summary with decisions, action items and deadlines — only from what's actually in the notes." />

      <div className="grid gap-6 lg:grid-cols-[1fr_280px]">
        <div className="space-y-6">
          <Card>
            <CardTitle icon={FileText} action={<Button variant="ghost" size="sm" onClick={() => setNotes(DEMO_NOTES)}><Wand2 />Load demo notes</Button>}>
              Meeting notes
            </CardTitle>
            <Textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Paste or type your meeting notes here…"
              className="min-h-56 resize-y text-sm leading-relaxed"
              aria-label="Meeting notes"
            />
            <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
              <span className="text-xs text-muted-foreground tabular-nums">{notes.length.toLocaleString()} characters</span>
              <Button onClick={run} disabled={loading}>
                {loading ? <Loader2 className="animate-spin" /> : <Sparkles />}
                {loading ? "Summarising…" : "Summarize"}
              </Button>
            </div>
            {error && <div className="mt-4"><ErrorNote message={error} onRetry={notes.trim().length >= 40 ? run : undefined} /></div>}
          </Card>

          {loading ? (
            <Card><div className="space-y-3"><Skeleton className="h-6 w-1/2" /><Skeleton className="h-4 w-full" /><Skeleton className="h-4 w-5/6" /><Skeleton className="h-24 w-full" /></div></Card>
          ) : current ? (
            <SummaryView m={current} onAdd={() => addToTasks(current)} />
          ) : (
            <EmptyState icon={Sparkles} title="No summary selected" description="Summarise new notes or pick a previous meeting from the history." />
          )}
        </div>

        <Card className="h-fit">
          <CardTitle icon={History}>Previous summaries</CardTitle>
          {meetings.length ? (
            <ul className="space-y-1">
              {meetings.map((m) => (
                <li key={m.id} className="group flex items-center gap-1">
                  <button
                    onClick={() => navigate({ search: { id: m.id } })}
                    className={`min-w-0 flex-1 rounded-md px-2 py-2 text-left hover:bg-muted ${m.id === selectedId ? "bg-accent" : ""}`}
                  >
                    <p className="truncate text-sm font-medium">{m.result.title}</p>
                    <p className="text-xs text-muted-foreground">{new Date(m.createdAt).toLocaleString(undefined, { dateStyle: "medium", timeStyle: "short" })}</p>
                  </button>
                  <button aria-label="Delete summary" onClick={() => { actions.deleteMeeting(m.id); toast("Summary deleted"); }} className="grid size-8 place-items-center rounded-md text-muted-foreground hover:text-destructive">
                    <Trash2 className="size-3.5" />
                  </button>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-muted-foreground">Your saved summaries will appear here.</p>
          )}
        </Card>
      </div>
    </div>
  );
}

function List({ items, empty }: { items: string[]; empty: string }) {
  if (!items.length) return <p className="text-sm text-muted-foreground">{empty}</p>;
  return <ul className="list-disc space-y-1.5 pl-5 text-sm">{items.map((p, i) => <li key={i}>{p}</li>)}</ul>;
}

function SummaryView({ m, onAdd }: { m: MeetingSummary; onAdd: () => void }) {
  const r = m.result;
  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-xl font-semibold">{r.title}</h2>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={() => navigator.clipboard.writeText(toText(m)).then(() => toast.success("Copied to clipboard"), () => toast.error("Couldn't copy"))}>
            <Copy />Copy
          </Button>
          <Button size="sm" onClick={onAdd}><ListPlus />Add action items to tasks</Button>
        </div>
      </div>

      <Card><CardTitle>Summary</CardTitle><p className="text-sm leading-relaxed">{r.summary}</p></Card>
      <div className="grid gap-4 md:grid-cols-2">
        <Card><CardTitle>Key discussion points</CardTitle><List items={r.key_points} empty="None identified." /></Card>
        <Card><CardTitle>Decisions</CardTitle><List items={r.decisions} empty="No explicit decisions were found in the notes." /></Card>
      </div>
      <Card>
        <CardTitle>Action items</CardTitle>
        {r.action_items.length ? (
          <div className="-mx-5 overflow-x-auto px-5">
            <table className="w-full min-w-[520px] text-sm">
              <thead><tr className="border-b text-left text-xs uppercase tracking-wide text-muted-foreground"><th className="py-2 pr-3 font-medium">Task</th><th className="py-2 pr-3 font-medium">Responsible</th><th className="py-2 pr-3 font-medium">Deadline</th><th className="py-2 font-medium">Priority</th></tr></thead>
              <tbody>
                {r.action_items.map((a, i) => (
                  <tr key={i} className="border-b last:border-0">
                    <td className="py-2.5 pr-3">{a.task}</td>
                    <td className="py-2.5 pr-3">{a.owner ?? <span className="italic text-muted-foreground">Not specified</span>}</td>
                    <td className="py-2.5 pr-3">{a.deadline ?? <span className="italic text-muted-foreground">Not specified</span>}</td>
                    <td className="py-2.5"><PriorityBadge priority={a.priority} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : <p className="text-sm text-muted-foreground">No action items found.</p>}
      </Card>
      <div className="grid gap-4 md:grid-cols-2">
        <Card><CardTitle>Deadlines mentioned</CardTitle><List items={r.deadlines.map((d) => `${d.item} — ${d.date}`)} empty="No deadlines mentioned." /></Card>
        <Card><CardTitle>Responsible people</CardTitle><List items={r.responsible_people} empty="No one was explicitly assigned." /></Card>
      </div>
      {r.uncertainties.length > 0 && (
        <Card className="border-warning/40 bg-warning-soft">
          <CardTitle icon={HelpCircle}>Needs your review</CardTitle>
          <List items={r.uncertainties} empty="" />
        </Card>
      )}
      <Disclaimer compact />
    </div>
  );
}
