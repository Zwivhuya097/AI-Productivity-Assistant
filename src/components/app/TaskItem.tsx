import { Pencil, Trash2, FileText } from "lucide-react";
import { toast } from "sonner";
import { Checkbox } from "@/components/ui/checkbox";
import { actions } from "@/lib/store";
import type { Task } from "@/lib/types";
import { cn } from "@/lib/utils";
import { DeadlineBadge, PriorityBadge } from "./bits";

export function TaskItem({ task, onEdit }: { task: Task; onEdit?: (t: Task) => void }) {
  return (
    <li className="group flex items-start gap-3 rounded-lg border bg-card p-3 transition-shadow hover:shadow-lift">
      <Checkbox
        checked={task.completed}
        onCheckedChange={() => {
          actions.toggleTask(task.id);
          if (!task.completed) toast.success("Nice work — task completed");
        }}
        aria-label={`Mark "${task.title}" ${task.completed ? "incomplete" : "complete"}`}
        className="mt-0.5"
      />
      <div className="min-w-0 flex-1">
        <p className={cn("text-sm font-medium", task.completed && "text-muted-foreground line-through")}>{task.title}</p>
        <div className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1">
          <PriorityBadge priority={task.priority} />
          <DeadlineBadge deadline={task.deadline} />
          <span className="text-xs text-muted-foreground">{task.duration} min · {task.category}</span>
          {task.owner && <span className="text-xs text-muted-foreground">Owner: {task.owner}</span>}
          {task.source === "meeting" && (
            <span className="inline-flex items-center gap-1 text-xs text-primary"><FileText className="size-3" />From meeting</span>
          )}
        </div>
      </div>
      {onEdit && (
        <div className="flex gap-1 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 sm:focus-within:opacity-100">
          <button aria-label="Edit task" onClick={() => onEdit(task)} className="grid size-9 place-items-center rounded-md text-muted-foreground hover:bg-muted hover:text-foreground">
            <Pencil className="size-4" />
          </button>
          <button
            aria-label="Delete task"
            onClick={() => {
              actions.deleteTask(task.id);
              toast("Task deleted");
            }}
            className="grid size-9 place-items-center rounded-md text-muted-foreground hover:bg-danger-soft hover:text-destructive"
          >
            <Trash2 className="size-4" />
          </button>
        </div>
      )}
    </li>
  );
}
