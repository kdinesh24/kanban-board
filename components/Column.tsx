// components/Column.tsx
"use client";

import { useDroppable } from "@dnd-kit/core";
import { SortableContext, verticalListSortingStrategy } from "@dnd-kit/sortable";
import TaskCard from "./TaskCard";
import type { Task } from "@/types/kanban";

export default function Column({
  id,
  title,
  tasks,
  headerRight,
}: {
  id: string;
  title: string;
  tasks: Task[];
  headerRight?: React.ReactNode;
}) {
  const { isOver, setNodeRef } = useDroppable({
    id,
    data: { type: "column", columnId: id },
  });

  return (
    <div
      className={[
        "w-80 shrink-0 rounded-xl",
        "bg-neutral-50 dark:bg-neutral-900/40",
        "border border-neutral-200/60 dark:border-neutral-800/60",
      ].join(" ")}
    >
      <div className="flex items-center justify-between px-3 py-2">
        <h2 className="text-sm font-semibold capitalize text-neutral-900 dark:text-neutral-100">
          {title}
        </h2>
        <div className="flex items-center gap-1">{headerRight}</div>
      </div>

      <div
        ref={setNodeRef}
        className={[
          "rounded-b-xl p-2 space-y-3 min-h-[2.5rem]",
          isOver
            ? "bg-neutral-100/70 dark:bg-neutral-800/60 transition-colors"
            : "bg-transparent",
        ].join(" ")}
      >
        <SortableContext items={tasks.map((t) => t.id)} strategy={verticalListSortingStrategy}>
          {tasks.map((task) => (
            <TaskCard key={task.id} task={task} />
          ))}
        </SortableContext>
      </div>
    </div>
  );
}
