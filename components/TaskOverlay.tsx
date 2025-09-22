"use client";

import type { Task } from "@/types/kanban";

export default function TaskOverlay({ task }: { task: Task | null }) {
  if (!task) return null;

  return (
    <div className="w-[18rem] select-none pointer-events-none">
      <div
        className={[
          "rounded-lg border border-neutral-300 dark:border-neutral-600",
          "bg-white/70 dark:bg-neutral-900/70 backdrop-blur-sm",
          "shadow-2xl ring-1 ring-black/10 dark:ring-white/10",
          "px-4 py-3 opacity-80 scale-100",
          "transition-all duration-200",
        ].join(" ")}
        style={{ cursor: "grabbing" }}
      >
        <div className="text-sm font-medium text-neutral-900 dark:text-neutral-100">
          {task.title}
        </div>
        {task.description && (
          <div className="text-xs text-neutral-500 dark:text-neutral-400 mt-1 line-clamp-2">
            {task.description}
          </div>
        )}
        <div className="flex items-center mt-2">
          <span
            className={[
              "inline-flex items-center px-2 py-1 rounded-full text-xs font-medium",
              task.priority === "High"
                ? "bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-400"
                : task.priority === "Medium"
                  ? "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/40 dark:text-yellow-400"
                  : "bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-400",
            ].join(" ")}
          >
            {task.priority}
          </span>
        </div>
      </div>
    </div>
  );
}
