// components/TaskOverlay.tsx
"use client";

import { Task } from "@/types/kanban";

export default function TaskOverlay({ task }: { task: Task | null }) {
  if (!task) return null;
  return (
    <div className="w-[18rem] select-none">
      <div className="rounded-lg border bg-white dark:bg-neutral-900 shadow-xl ring-1 ring-black/5 dark:ring-white/10 px-4 py-3 scale-[1.02]">
        <div className="text-sm font-medium">{task.title}</div>
      </div>
    </div>
  );
}
