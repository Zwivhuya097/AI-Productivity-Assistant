export type Priority = "high" | "medium" | "low";

export interface Task {
  id: string;
  title: string;
  deadline: string | null; // YYYY-MM-DD
  duration: number; // minutes
  priority: Priority;
  category: string;
  completed: boolean;
  source?: "meeting" | "manual";
  owner?: string | null;
}

export interface ScheduleBlock {
  day: string; // YYYY-MM-DD
  start: string; // HH:MM
  end: string; // HH:MM
  task_id: string | null;
  title: string;
  priority: Priority;
  note: string | null;
}

export interface Schedule {
  generatedAt: string;
  view: "daily" | "weekly";
  blocks: ScheduleBlock[];
  urgent: string[];
  reasoning: string[];
  warnings: string[];
}

export interface ActionItem {
  task: string;
  owner: string | null;
  deadline: string | null;
  priority: Priority;
}

export interface MeetingResult {
  title: string;
  summary: string;
  key_points: string[];
  decisions: string[];
  action_items: ActionItem[];
  deadlines: { item: string; date: string }[];
  responsible_people: string[];
  uncertainties: string[];
}

export interface MeetingSummary {
  id: string;
  createdAt: string;
  notes: string;
  result: MeetingResult;
}

export interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

export interface Settings {
  name: string;
  workStart: string;
  workEnd: string;
}

export type AiResult<T> = { ok: true; data: T } | { ok: false; error: string };
