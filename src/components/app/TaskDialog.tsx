import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { actions } from "@/lib/store";
import type { Priority, Task } from "@/lib/types";

export function TaskDialog({ open, onOpenChange, task }: { open: boolean; onOpenChange: (o: boolean) => void; task?: Task | null }) {
  const [title, setTitle] = useState("");
  const [deadline, setDeadline] = useState("");
  const [duration, setDuration] = useState("60");
  const [priority, setPriority] = useState<Priority>("medium");
  const [category, setCategory] = useState("General");
  const [err, setErr] = useState("");

  useEffect(() => {
    if (open) {
      setTitle(task?.title ?? "");
      setDeadline(task?.deadline && /^\d{4}-\d{2}-\d{2}$/.test(task.deadline) ? task.deadline : "");
      setDuration(String(task?.duration ?? 60));
      setPriority(task?.priority ?? "medium");
      setCategory(task?.category ?? "General");
      setErr("");
    }
  }, [open, task]);

  function save(e: React.FormEvent) {
    e.preventDefault();
    const d = Number(duration);
    if (!title.trim()) return setErr("Please give the task a title.");
    if (!Number.isFinite(d) || d < 5 || d > 600) return setErr("Duration should be between 5 and 600 minutes.");
    const data = { title: title.trim(), deadline: deadline || null, duration: d, priority, category: category.trim() || "General" };
    if (task) {
      actions.updateTask(task.id, data);
      toast.success("Task updated");
    } else {
      actions.addTask({ ...data, source: "manual" });
      toast.success("Task added");
    }
    onOpenChange(false);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{task ? "Edit task" : "Add task"}</DialogTitle>
        </DialogHeader>
        <form onSubmit={save} className="grid gap-4">
          <div className="grid gap-1.5">
            <Label htmlFor="t-title">Title</Label>
            <Input id="t-title" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. Prepare presentation" autoFocus />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="grid gap-1.5">
              <Label htmlFor="t-deadline">Deadline</Label>
              <Input id="t-deadline" type="date" value={deadline} onChange={(e) => setDeadline(e.target.value)} />
            </div>
            <div className="grid gap-1.5">
              <Label htmlFor="t-dur">Duration (min)</Label>
              <Input id="t-dur" type="number" min={5} max={600} step={5} value={duration} onChange={(e) => setDuration(e.target.value)} />
            </div>
            <div className="grid gap-1.5">
              <Label>Priority</Label>
              <Select value={priority} onValueChange={(v) => setPriority(v as Priority)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="high">High</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="low">Low</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-1.5">
              <Label htmlFor="t-cat">Category</Label>
              <Input id="t-cat" value={category} onChange={(e) => setCategory(e.target.value)} />
            </div>
          </div>
          {err && <p className="text-sm text-destructive">{err}</p>}
          <DialogFooter>
            <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>Cancel</Button>
            <Button type="submit">{task ? "Save changes" : "Add task"}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
