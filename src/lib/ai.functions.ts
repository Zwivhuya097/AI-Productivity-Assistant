import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { callResponses, friendly } from "./ai-gateway.server";
import {
  CHAT_INSTRUCTIONS,
  MEETING_INSTRUCTIONS,
  MEETING_SCHEMA,
  PLANNER_INSTRUCTIONS,
  PLANNER_SCHEMA,
} from "./prompts";
import type { AiResult, MeetingResult, Schedule } from "./types";

export const summarizeMeeting = createServerFn({ method: "POST" })
  .inputValidator((d) => z.object({ notes: z.string().min(20).max(30000), today: z.string() }).parse(d))
  .handler(async ({ data }): Promise<AiResult<MeetingResult>> => {
    try {
      const text = await callResponses({
        instructions: MEETING_INSTRUCTIONS,
        input: [{ role: "user", content: `Today's date: ${data.today}\n\nMeeting notes:\n"""\n${data.notes}\n"""` }],
        schema: { name: "meeting_summary", schema: MEETING_SCHEMA },
      });
      return { ok: true, data: JSON.parse(text) };
    } catch (e) {
      return { ok: false, error: friendly(e, "Something went wrong while summarising your meeting. Please try again.") };
    }
  });

const taskSchema = z.object({
  id: z.string(),
  title: z.string(),
  deadline: z.string().nullable(),
  duration: z.number(),
  priority: z.enum(["high", "medium", "low"]),
  category: z.string(),
});

export const planSchedule = createServerFn({ method: "POST" })
  .inputValidator((d) =>
    z
      .object({
        tasks: z.array(taskSchema).min(1).max(60),
        view: z.enum(["daily", "weekly"]),
        startDate: z.string(),
        workStart: z.string(),
        workEnd: z.string(),
      })
      .parse(d),
  )
  .handler(async ({ data }): Promise<AiResult<Omit<Schedule, "generatedAt" | "view">>> => {
    try {
      const text = await callResponses({
        instructions: PLANNER_INSTRUCTIONS,
        input: [
          {
            role: "user",
            content: `View: ${data.view}\nStart date: ${data.startDate}\nAvailable working hours: ${data.workStart}–${data.workEnd}\n\nTasks (JSON):\n${JSON.stringify(data.tasks, null, 1)}`,
          },
        ],
        schema: { name: "schedule", schema: PLANNER_SCHEMA },
      });
      const parsed = JSON.parse(text);
      parsed.blocks.sort((a: { day: string; start: string }, b: { day: string; start: string }) =>
        (a.day + a.start).localeCompare(b.day + b.start),
      );
      return { ok: true, data: parsed };
    } catch (e) {
      return { ok: false, error: friendly(e, "Something went wrong while generating your schedule. Please try again.") };
    }
  });

export const chatWithAssistant = createServerFn({ method: "POST" })
  .inputValidator((d) =>
    z
      .object({
        messages: z
          .array(z.object({ role: z.enum(["user", "assistant"]), content: z.string().max(20000) }))
          .min(1)
          .max(40),
        context: z.string().max(20000),
      })
      .parse(d),
  )
  .handler(async ({ data }): Promise<AiResult<string>> => {
    try {
      const text = await callResponses({
        instructions: `${CHAT_INSTRUCTIONS}\n\n--- Workspace context ---\n${data.context}`,
        input: data.messages,
      });
      return { ok: true, data: text };
    } catch (e) {
      return { ok: false, error: friendly(e, "WorkMate couldn't respond right now. Please try again.") };
    }
  });
