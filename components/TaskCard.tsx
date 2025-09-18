// components/TaskCard.tsx
"use client";

import { CSS } from "@dnd-kit/utilities";
import { useSortable, AnimateLayoutChanges } from "@dnd-kit/sortable";
import { Task } from "@/types/kanban";
import { Skeleton } from "@/components/ui/skeleton";
import { memo } from "react";

const animateLayoutChanges: AnimateLayoutChanges = (args) => {
  // Prevent layout animation for the active dragging item to avoid flicker
  if (args.isDragging) return false;
  return true;
};

function TaskCardBase({ task }: { task: Task }) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
    isSorting,
  } = useSortable({
    id: task.id,
    data: { type: "task", task },
    animateLayoutChanges,
    transition: {
      duration: 180,
      easing: "cubic-bezier(0.25, 1, 0.5, 1)",
    },
  });

  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  // While dragging this card, keep its spot with a skeleton placeholder.
  if (isDragging) {
    return (
      <div className="w-full">
        <Skeleton className="h-16 w-full" />
      </div>
    );
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className={[
        "bg-white dark:bg-neutral-900 border rounded-lg px-4 py-3 shadow-sm",
        "hover:shadow-md transition",
        isSorting ? "opacity-95" : "opacity-100",
        "cursor-grab active:cursor-grabbing",
      ].join(" ")}
      aria-label={task.title}
    >
      <div className="text-sm font-medium leading-5">{task.title}</div>
    </div>
  );
}

export default memo(TaskCardBase);
