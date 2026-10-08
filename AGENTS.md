<!-- LOVABLE:BEGIN -->
> [!IMPORTANT]
> This project is connected to [Lovable](https://lovable.dev). Avoid rewriting
> published git history — force pushing, or rebasing/amending/squashing commits
> that are already pushed — as it rewrites history on Lovable's side and the
> user will likely lose their project history.
>
> Commits you push to the connected branch sync back to Lovable and show up in
> the editor, so keep the branch in a working state.
<!-- LOVABLE:END -->

- App data (tasks, schedule, meeting summaries, chat, settings) lives in a localStorage-backed store in src/lib/store.ts — keeps the demo backend-free; move to Lovable Cloud if multi-device sync is needed.
- All AI calls go through server functions in src/lib/ai.functions.ts using the streamed Responses helper in ai-gateway.server.ts; prompts and strict JSON schemas live in src/lib/prompts.ts — keeps keys server-side and outputs UI-ready.
- Keep Vite optimizeDeps.ignoreOutdatedRequests false — rejecting stale dependency URLs prevents mixed React/React DOM generations and invalid-hook crashes in long-lived previews.
