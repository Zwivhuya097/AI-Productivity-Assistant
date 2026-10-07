// Server-only helper for the Lovable AI Gateway (OpenAI Responses API, streamed).
const MODEL = "openai/gpt-6-astra";

export class AiError extends Error {
  constructor(public friendly: string) {
    super(friendly);
  }
}

type InputMessage = { role: "system" | "user" | "assistant"; content: string };

export async function callResponses(opts: {
  instructions: string;
  input: InputMessage[];
  schema?: { name: string; schema: Record<string, unknown> };
}): Promise<string> {
  const apiKey = process.env["LOVABLE_API_KEY"];
  if (!apiKey) throw new AiError("The AI service isn't configured yet. Please contact the administrator.");

  let res: Response;
  try {
    res = await fetch("https://ai.gateway.lovable.dev/v1/responses", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Lovable-API-Key": apiKey,
        "X-Lovable-AIG-SDK": "fetch",
      },
      body: JSON.stringify({
        model: MODEL,
        instructions: opts.instructions,
        input: opts.input,
        stream: true,
        store: false,
        reasoning: { effort: "low", summary: "auto" },
        include: ["reasoning.encrypted_content"],
        ...(opts.schema
          ? { text: { format: { type: "json_schema", name: opts.schema.name, strict: true, schema: opts.schema.schema } } }
          : {}),
      }),
    });
  } catch {
    throw new AiError("Couldn't reach the AI service. Check your connection and try again.");
  }

  if (!res.ok || !res.body) {
    const body = await res.text().catch(() => "");
    console.error("AI gateway error", res.status, body.slice(0, 500));
    if (res.status === 429) throw new AiError("The AI is busy right now. Please wait a moment and try again.");
    if (res.status === 402) throw new AiError("AI credits have run out for this workspace. Please add credits to continue.");
    if (res.status === 403) throw new AiError("AI access is currently not available for this workspace.");
    throw new AiError("Something went wrong while talking to the AI. Please try again.");
  }

  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";
  let text = "";
  let failed = false;
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split("\n");
    buffer = lines.pop() ?? "";
    for (const line of lines) {
      if (!line.startsWith("data:")) continue;
      const payload = line.slice(5).trim();
      if (!payload || payload === "[DONE]") continue;
      try {
        const evt = JSON.parse(payload);
        if (evt.type === "response.output_text.delta") text += evt.delta ?? "";
        if (evt.type === "response.failed" || evt.type === "error") failed = true;
      } catch {
        /* ignore partial */
      }
    }
  }
  if (failed && !text) throw new AiError("The AI couldn't complete this request. Please try again.");
  if (!text.trim()) throw new AiError("The AI returned an empty response. Please try again.");
  return text;
}

export function friendly(e: unknown, fallback: string) {
  if (e instanceof AiError) return e.friendly;
  console.error(e);
  return fallback;
}
