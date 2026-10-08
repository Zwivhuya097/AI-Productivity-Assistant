import { Link } from "@tanstack/react-router";
import { useState, type ReactNode } from "react";
import {
  LayoutDashboard,
  FileText,
  CalendarClock,
  Sparkles,
  ListChecks,
  Settings,
  Menu,
  X,
} from "lucide-react";
import { Disclaimer } from "./Disclaimer";
import { useAppState } from "@/lib/store";
import { Button } from "@/components/ui/button";

const NAV = [
  { to: "/", label: "Dashboard", icon: LayoutDashboard },
  { to: "/meetings", label: "Meeting Summarizer", icon: FileText },
  { to: "/planner", label: "Task Planner", icon: CalendarClock },
  { to: "/assistant", label: "AI Assistant", icon: Sparkles },
  { to: "/tasks", label: "My Tasks", icon: ListChecks },
  { to: "/settings", label: "Settings", icon: Settings },
] as const;

function Brand() {
  return (
    <div className="flex items-center gap-2.5 px-2">
      <div className="grid size-8 place-items-center rounded-lg bg-sidebar-primary text-sidebar-primary-foreground">
        <Sparkles className="size-4" />
      </div>
      <span className="font-display text-base font-semibold text-sidebar-accent-foreground">WorkMate AI</span>
    </div>
  );
}

function NavList({ onNavigate }: { onNavigate?: () => void }) {
  const { tasks } = useAppState();
  const pending = tasks.filter((t) => !t.completed).length;
  return (
    <nav aria-label="Main" className="flex flex-col gap-1">
      {NAV.map(({ to, label, icon: Icon }) => (
        <Link
          key={to}
          to={to}
          onClick={onNavigate}
          activeOptions={{ exact: to === "/" }}
          className="group flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-sidebar-foreground transition-colors hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
          activeProps={{ className: "bg-sidebar-accent text-sidebar-accent-foreground" }}
        >
          <Icon className="size-4 shrink-0 opacity-80" />
          <span className="flex-1">{label}</span>
          {to === "/tasks" && pending > 0 && (
            <span className="rounded-full bg-sidebar-primary/20 px-2 py-0.5 text-xs text-sidebar-primary">{pending}</span>
          )}
        </Link>
      ))}
    </nav>
  );
}

export function AppShell({ children }: { children: ReactNode }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="min-h-screen bg-background">
      {/* Desktop sidebar */}
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-64 flex-col gap-8 border-r border-sidebar-border bg-sidebar p-4 lg:flex">
        <div className="pt-2"><Brand /></div>
        <NavList />
        <div className="mt-auto rounded-lg border border-sidebar-border p-3 text-xs leading-relaxed text-sidebar-foreground/70">
          AI-generated content may contain errors. Always review before acting.
        </div>
      </aside>

      {/* Mobile top bar */}
      <header className="sticky top-0 z-30 flex items-center justify-between border-b bg-sidebar px-4 py-3 lg:hidden">
        <Brand />
        <Button variant="ghost" size="icon"
          aria-label={open ? "Close menu" : "Open menu"}
          onClick={() => setOpen((o) => !o)}
          className="grid size-10 place-items-center rounded-lg text-sidebar-accent-foreground hover:bg-sidebar-accent"
        >
          {open ? <X className="size-5" /> : <Menu className="size-5" />}
        </Button>
      </header>
      {open && (
        <div className="fixed inset-0 top-[61px] z-20 bg-sidebar p-4 lg:hidden">
          <NavList onNavigate={() => setOpen(false)} />
        </div>
      )}

      <main className="lg:pl-64">
        <div className="mx-auto flex min-h-screen max-w-6xl flex-col px-4 py-6 sm:px-6 lg:px-10 lg:py-10">
          <div className="flex-1">{children}</div>
          <Disclaimer className="mt-10" />
        </div>
      </main>
    </div>
  );
}
