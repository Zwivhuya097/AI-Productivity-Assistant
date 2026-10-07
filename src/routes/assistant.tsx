import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useEffect, useRef, useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { toast } from "sonner";
import { Send, Sparkles, Trash2, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { chatWithAssistant } from "@/lib/ai.functions";
import { actions, buildChatContext, getState, useAppState } from "@/lib/store";
import type { ChatMessage } from "@/lib/types";
import { ErrorNote, PageHeader } from "@/components/app/bits";
import { Disclaimer } from "@/components/app/Disclaimer";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/assistant")({
  head: () => ({
    meta: [
      { title: "WorkMate AI Assistant — WorkMate AI" },
      { name: "description", content: "Chat with WorkMate AI about your tasks, meetings and schedule." },
      { property: "og:title", content: "WorkMate AI Assistant" },
      { property: "og:description", content: "Chat with WorkMate AI about your tasks, meetings and schedule." },
    ],
  }),
  component: AssistantPage,
});

const SUGGESTIONS = [
  "What should I work on first?",
  "Help me prioritize my tasks.",
  "Create a schedule for tomorrow.",
  "Help me prepare for my next meeting.",
  "Create a checklist for my client presentation.",
];

function AssistantPage() {
  const { chat } = useAppState();
  const send = useServerFn(chatWithAssistant);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chat.length, loading]);

  async function submit(text: string) {
    const content = text.trim();
    if (!content || loading) return;
    setError(null);
    const next: ChatMessage[] = [...chat, { role: "user", content }];
    actions.setChat(next);
    setInput("");
    setLoading(true);
    try {
      const res = await send({ data: { messages: next.slice(-30), context: buildChatContext(getState()) } });
      if (!res.ok) return setError(res.error);
      actions.setChat([...next, { role: "assistant", content: res.data }]);
    } catch {
      setError("Network problem — WorkMate couldn't be reached. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  function retry() {
    const last = chat[chat.length - 1];
    if (last?.role === "user") {
      actions.setChat(chat.slice(0, -1));
      submit(last.content);
    }
  }

  return (
    <div className="flex h-full flex-col">
      <PageHeader
        title="WorkMate AI"
        description="Your workplace assistant. It can see your tasks, schedule and recent meeting summaries."
        actions={
          chat.length > 0 && (
            <Button variant="outline" onClick={() => { actions.setChat([]); setError(null); toast("Conversation cleared"); }}>
              <Trash2 />Clear conversation
            </Button>
          )
        }
      />

      <div className="surface flex min-h-[60vh] flex-1 flex-col overflow-hidden">
        <div className="flex-1 space-y-5 overflow-y-auto p-4 sm:p-6" aria-live="polite">
          {chat.length === 0 && !loading ? (
            <div className="flex h-full flex-col items-center justify-center py-10 text-center">
              <div className="mb-4 grid size-12 place-items-center rounded-2xl bg-primary text-primary-foreground"><Sparkles className="size-6" /></div>
              <h2 className="text-lg font-semibold">How can I help today?</h2>
              <p className="mt-1 max-w-sm text-sm text-muted-foreground">Ask about priorities, planning, meetings or checklists.</p>
              <div className="mt-6 flex max-w-xl flex-wrap justify-center gap-2">
                {SUGGESTIONS.map((s) => (
                  <button key={s} onClick={() => submit(s)} className="rounded-full border bg-card px-3.5 py-2 text-sm transition-colors hover:border-primary hover:text-primary">
                    {s}
                  </button>
                ))}
              </div>
            </div>
          ) : (
            chat.map((m, i) => <Bubble key={i} m={m} />)
          )}
          {loading && (
            <div className="flex items-center gap-3">
              <Avatar role="assistant" />
              <div className="flex gap-1 rounded-2xl bg-muted px-4 py-3" aria-label="WorkMate is typing">
                {[0, 1, 2].map((d) => <span key={d} className="size-1.5 animate-bounce rounded-full bg-muted-foreground" style={{ animationDelay: `${d * 150}ms` }} />)}
              </div>
            </div>
          )}
          {error && <ErrorNote message={error} onRetry={retry} />}
          <div ref={endRef} />
        </div>

        <form
          onSubmit={(e) => { e.preventDefault(); submit(input); }}
          className="flex items-end gap-2 border-t bg-card p-3 sm:p-4"
        >
          <Textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); submit(input); } }}
            placeholder="Ask WorkMate anything… (Shift+Enter for new line)"
            rows={1}
            className="max-h-40 min-h-11 resize-none"
            aria-label="Message"
          />
          <Button type="submit" size="icon" className="size-11 shrink-0" disabled={!input.trim() || loading} aria-label="Send">
            <Send />
          </Button>
        </form>
      </div>
      <Disclaimer compact className="mt-3" />
    </div>
  );
}

function Avatar({ role }: { role: ChatMessage["role"] }) {
  return role === "assistant" ? (
    <div className="grid size-8 shrink-0 place-items-center rounded-full bg-primary text-primary-foreground"><Sparkles className="size-4" /></div>
  ) : (
    <div className="grid size-8 shrink-0 place-items-center rounded-full bg-secondary text-secondary-foreground"><User className="size-4" /></div>
  );
}

function Bubble({ m }: { m: ChatMessage }) {
  const mine = m.role === "user";
  return (
    <div className={cn("flex items-start gap-3", mine && "flex-row-reverse")}>
      <Avatar role={m.role} />
      <div className={cn("max-w-[85%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed", mine ? "bg-primary text-primary-foreground" : "bg-muted text-foreground")}>
        {mine ? <p className="whitespace-pre-wrap">{m.content}</p> : <div className="prose-chat"><ReactMarkdown remarkPlugins={[remarkGfm]}>{m.content}</ReactMarkdown></div>}
      </div>
    </div>
  );
}
