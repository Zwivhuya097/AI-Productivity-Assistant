import { useSyncExternalStore } from "react";
import { addDays, isoDate } from "./dates";
import type { ChatMessage, MeetingSummary, Schedule, Settings, Task } from "./types";

export interface AppState {
  tasks: Task[];
  schedule: Schedule | null;
  meetings: MeetingSummary[];
  chat: ChatMessage[];
  settings: Settings;
}

const KEY = "workmate-state-v1";

export const DEMO_NOTES = `Product sync – Q4 launch planning
Attendees: Sarah (PM), David (Engineering), Priya (Design), Tom (Marketing)

Sarah opened by reviewing the Q4 launch timeline. The beta is currently two days behind due to the payments integration.
David said the payments API issue should be fixed by Thursday; he'll pair with the vendor tomorrow morning.
Priya shared the new onboarding flow. Team agreed to go with version B (the 3-step flow) because it tested better with users.
Tom raised that the launch announcement blog post needs product screenshots by next Monday.
Discussion about pricing: some debate on whether to offer an annual discount. No final decision — Sarah will gather data from finance.
DECISION: Public launch date stays on the 15th of next month.
DECISION: Beta invite list capped at 500 users.
Action items:
- David to fix payments API bug by Thursday.
- Priya to deliver final onboarding screens to engineering by Friday.
- Tom to draft launch blog post by next Monday.
- Sarah to collect pricing data from finance before next sync.
- Someone needs to update the help center articles (owner not decided).
Next sync: next Wednesday at 10:00.`;

function seed(): AppState {
  const today = new Date();
  return {
    tasks: [
      { id: "t1", title: "Complete quarterly report", deadline: addDays(1, today), duration: 120, priority: "high", category: "Reporting", completed: false, source: "manual" },
      { id: "t2", title: "Prepare client presentation", deadline: addDays(2, today), duration: 90, priority: "high", category: "Client", completed: false, source: "manual" },
      { id: "t3", title: "Review project proposal", deadline: addDays(4, today), duration: 60, priority: "medium", category: "Projects", completed: false, source: "manual" },
      { id: "t4", title: "Team stand-up", deadline: isoDate(today), duration: 30, priority: "medium", category: "Meetings", completed: false, source: "manual" },
      { id: "t5", title: "Send project update", deadline: isoDate(today), duration: 30, priority: "low", category: "Communication", completed: false, source: "manual" },
      { id: "t6", title: "Reply to vendor emails", deadline: null, duration: 30, priority: "low", category: "Communication", completed: true, source: "manual" },
    ],
    schedule: null,
    meetings: [],
    chat: [],
    settings: { name: "Alex", workStart: "08:00", workEnd: "17:00" },
  };
}

let serverSnapshot: AppState | null = null;
let state: AppState | null = null;
const listeners = new Set<() => void>();

function load(): AppState {
  if (state) return state;
  try {
    const raw = window.localStorage.getItem(KEY);
    state = raw ? { ...seed(), ...JSON.parse(raw) } : seed();
  } catch {
    state = seed();
  }
  return state!;
}

function getServer() {
  return (serverSnapshot ??= seed());
}

export function setState(fn: (s: AppState) => AppState) {
  state = fn(load());
  try {
    window.localStorage.setItem(KEY, JSON.stringify(state));
  } catch {
    /* storage full */
  }
  listeners.forEach((l) => l());
}

function subscribe(l: () => void) {
  listeners.add(l);
  return () => listeners.delete(l);
}

export function useAppState(): AppState {
  return useSyncExternalStore(subscribe, load, getServer);
}

export function getState() {
  return load();
}

export function newId() {
  return crypto.randomUUID();
}

// Actions
export const actions = {
  addTask(t: Omit<Task, "id" | "completed">) {
    setState((s) => ({ ...s, tasks: [{ ...t, id: newId(), completed: false }, ...s.tasks] }));
  },
  addTasks(ts: Omit<Task, "id" | "completed">[]) {
    setState((s) => ({ ...s, tasks: [...ts.map((t) => ({ ...t, id: newId(), completed: false })), ...s.tasks] }));
  },
  updateTask(id: string, patch: Partial<Task>) {
    setState((s) => ({ ...s, tasks: s.tasks.map((t) => (t.id === id ? { ...t, ...patch } : t)) }));
  },
  toggleTask(id: string) {
    setState((s) => ({ ...s, tasks: s.tasks.map((t) => (t.id === id ? { ...t, completed: !t.completed } : t)) }));
  },
  deleteTask(id: string) {
    setState((s) => ({ ...s, tasks: s.tasks.filter((t) => t.id !== id) }));
  },
  setSchedule(schedule: Schedule | null) {
    setState((s) => ({ ...s, schedule }));
  },
  saveMeeting(m: MeetingSummary) {
    setState((s) => ({ ...s, meetings: [m, ...s.meetings] }));
  },
  deleteMeeting(id: string) {
    setState((s) => ({ ...s, meetings: s.meetings.filter((m) => m.id !== id) }));
  },
  setChat(chat: ChatMessage[]) {
    setState((s) => ({ ...s, chat }));
  },
  updateSettings(p: Partial<Settings>) {
    setState((s) => ({ ...s, settings: { ...s.settings, ...p } }));
  },
  reset() {
    setState(() => seed());
  },
};

export function buildChatContext(s: AppState) {
  const open = s.tasks.filter((t) => !t.completed);
  const lines = [
    `Today: ${isoDate()} | Working hours: ${s.settings.workStart}-${s.settings.workEnd} | User: ${s.settings.name}`,
    `Open tasks (${open.length}):`,
    ...open.map((t) => `- [${t.priority}] ${t.title} | deadline: ${t.deadline ?? "none"} | ${t.duration}min | ${t.category}${t.owner ? ` | owner: ${t.owner}` : ""}`),
    `Completed tasks: ${s.tasks.filter((t) => t.completed).map((t) => t.title).join("; ") || "none"}`,
  ];
  if (s.schedule) {
    lines.push(`Current ${s.schedule.view} schedule:`);
    s.schedule.blocks.forEach((b) => lines.push(`- ${b.day} ${b.start}-${b.end} ${b.title}`));
  } else lines.push("No schedule generated yet.");
  s.meetings.slice(0, 3).forEach((m) => {
    lines.push(`Recent meeting "${m.result.title}": ${m.result.summary}`);
    if (m.result.decisions.length) lines.push(`  Decisions: ${m.result.decisions.join("; ")}`);
  });
  return lines.join("\n");
}
