import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { ListChecks, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAppState } from "@/lib/store";
import type { Task } from "@/lib/types";
import { EmptyState, PageHeader } from "@/components/app/bits";
import { TaskDialog } from "@/components/app/TaskDialog";
import { TaskItem } from "@/components/app/TaskItem";

export const Route = createFileRoute("/tasks")({
  head: () => ({
    meta: [
      { title: "My Tasks — WorkMate AI" },
      { name: "description", content: "Add, edit, complete and organise all your tasks in one place." },
      { property: "og:title", content: "My Tasks — WorkMate AI" },
      { property: "og:description", content: "Add, edit, complete and organise all your tasks in one place." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: TasksPage,
});

const RANK = { high: 0, medium: 1, low: 2 };

function TasksPage() {
  const { tasks } = useAppState();
  const [filter, setFilter] = useState("open");
  const [dialog, setDialog] = useState<{ open: boolean; task: Task | null }>({ open: false, task: null });
  const list = tasks
    .filter((t) => (filter === "open" ? !t.completed : filter === "done" ? t.completed : true))
    .sort((a, b) => Number(a.completed) - Number(b.completed) || RANK[a.priority] - RANK[b.priority] || (a.deadline ?? "9").localeCompare(b.deadline ?? "9"));

  return (
    <div>
      <PageHeader
        title="My Tasks"
        description="Everything on your plate, including action items converted from meetings."
        actions={<Button onClick={() => setDialog({ open: true, task: null })}><Plus />Add task</Button>}
      />
      <Tabs value={filter} onValueChange={setFilter} className="mb-4">
        <TabsList>
          <TabsTrigger value="open">Open ({tasks.filter((t) => !t.completed).length})</TabsTrigger>
          <TabsTrigger value="done">Completed ({tasks.filter((t) => t.completed).length})</TabsTrigger>
          <TabsTrigger value="all">All</TabsTrigger>
        </TabsList>
      </Tabs>
      {list.length ? (
        <ul className="space-y-2">{list.map((t) => <TaskItem key={t.id} task={t} onEdit={(task) => setDialog({ open: true, task })} />)}</ul>
      ) : (
        <EmptyState
          icon={ListChecks}
          title={filter === "done" ? "No completed tasks yet" : "No tasks here"}
          description={filter === "done" ? "Tick off a task and it'll show up here." : "Add a task to get started."}
          action={filter !== "done" && <Button size="sm" onClick={() => setDialog({ open: true, task: null })}><Plus />Add task</Button>}
        />
      )}
      <TaskDialog open={dialog.open} task={dialog.task} onOpenChange={(o) => setDialog((d) => ({ ...d, open: o }))} />
    </div>
  );
}
