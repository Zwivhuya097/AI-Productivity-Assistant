import { createFileRoute } from "@tanstack/react-router";
import { toast } from "sonner";
import { RotateCcw, ShieldCheck, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription,
  AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { actions, useAppState } from "@/lib/store";
import { Card, CardTitle, PageHeader } from "@/components/app/bits";
import { DISCLAIMER } from "@/components/app/Disclaimer";

export const Route = createFileRoute("/settings")({
  head: () => ({
    meta: [
      { title: "Settings — WorkMate AI" },
      { name: "description", content: "Set your name and working hours used by the AI planner." },
      { property: "og:title", content: "Settings — WorkMate AI" },
      { property: "og:description", content: "Set your name and working hours used by the AI planner." },
    ],
  }),
  component: SettingsPage,
});

function SettingsPage() {
  const { settings } = useAppState();
  return (
    <div className="max-w-2xl">
      <PageHeader title="Settings" description="Personalise WorkMate. Changes save automatically on this device." />
      <div className="space-y-6">
        <Card>
          <CardTitle icon={User}>Profile & working hours</CardTitle>
          <div className="grid gap-4 sm:grid-cols-3">
            <div className="grid gap-1.5 sm:col-span-3">
              <Label htmlFor="name">Your name</Label>
              <Input id="name" value={settings.name} onChange={(e) => actions.updateSettings({ name: e.target.value })} />
            </div>
            <div className="grid gap-1.5">
              <Label htmlFor="s">Workday starts</Label>
              <Input id="s" type="time" value={settings.workStart} onChange={(e) => actions.updateSettings({ workStart: e.target.value })} />
            </div>
            <div className="grid gap-1.5">
              <Label htmlFor="e">Workday ends</Label>
              <Input id="e" type="time" value={settings.workEnd} onChange={(e) => actions.updateSettings({ workEnd: e.target.value })} />
            </div>
          </div>
        </Card>
        <Card>
          <CardTitle icon={ShieldCheck}>Responsible AI</CardTitle>
          <p className="text-sm text-muted-foreground">{DISCLAIMER}</p>
          <ul className="mt-3 list-disc space-y-1 pl-5 text-sm text-muted-foreground">
            <li>The AI is instructed to use only what's in your input and to mark unknown owners or dates as "Not specified".</li>
            <li>Unclear items are flagged under "Needs your review" rather than guessed.</li>
            <li>Your data stays in this browser; it's only sent to the AI when you request a result.</li>
          </ul>
        </Card>
        <Card>
          <CardTitle icon={RotateCcw}>Demo data</CardTitle>
          <p className="mb-4 text-sm text-muted-foreground">Restore the sample tasks and clear summaries, schedule and chat.</p>
          <AlertDialog>
            <AlertDialogTrigger asChild><Button variant="outline">Reset to demo data</Button></AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Reset everything?</AlertDialogTitle>
                <AlertDialogDescription>This removes your tasks, summaries, schedule and chat history on this device.</AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction onClick={() => { actions.reset(); toast.success("Demo data restored"); }}>Reset</AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </Card>
      </div>
    </div>
  );
}
